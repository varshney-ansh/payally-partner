import { type NextRequest } from 'next/server'
import type { Schema } from "../../../../amplify/data/resource"
import { Amplify } from "aws-amplify"
import { generateClient } from "aws-amplify/api"
import outputs from "../../../../amplify_outputs.json"

Amplify.configure(outputs)

const client = generateClient<Schema>()

export async function GET(request: NextRequest) {
    const merchantIdInPayPal = request.nextUrl.searchParams.get('merchantIdInPayPal');
     const merchantId = request.nextUrl.searchParams.get('merchantId');
    if (!merchantIdInPayPal || !merchantId) {
        return new Response(JSON.stringify({ error: "Missing required query parameters" }), { status: 400 });
    }
    const permissionsGranted = request.nextUrl.searchParams.get('permissionsGranted');
    const accountStatus = request.nextUrl.searchParams.get('accountStatus');
    const consentStatus = request.nextUrl.searchParams.get('consentStatus');
    const isEmailConfirmed = request.nextUrl.searchParams.get('isEmailConfirmed');
    
    const merchantInfo = {
        merchantId,
        merchantIdInPayPal,
        permissionsGranted: permissionsGranted == 'true',
        accountStatus,
        consentStatus,
        isEmailConfirmed: isEmailConfirmed == 'true',
    };
    const existing = await client.models.StoreMerchantInfo.get({ id: merchantIdInPayPal });
    if (existing.errors?.length) {
        throw new Error(`Failed to look up merchant info: ${existing.errors.map(({ message }) => message).join(", ")}`);
    }
    const saved = existing.data
        ? await client.models.StoreMerchantInfo.update({ id: merchantIdInPayPal, ...merchantInfo })
        : await client.models.StoreMerchantInfo.create({ id: merchantIdInPayPal, ...merchantInfo });
    if (saved.errors?.length) {
        throw new Error(`Failed to save merchant info: ${saved.errors.map(({ message }) => message).join(", ")}`);
    }

    // redirect user to /authorize-payments/[payeeId] page with the query parameters
    return Response.redirect(`${process.env.PAYALLY_PLATFORM_BASE_URL}/authorize-payments/${merchantIdInPayPal}`);
}

