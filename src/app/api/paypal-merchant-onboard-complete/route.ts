import { type NextRequest } from "next/server";
import type { Schema } from "../../../../amplify/data/resource"
import { Amplify } from "aws-amplify"
import { generateClient } from "aws-amplify/api"
import outputs from "../../../../amplify_outputs.json"

Amplify.configure(outputs)

const client = generateClient<Schema>()

export async function GET() {
    return new Response(JSON.stringify({ status: "Healthy" }), { status: 200 });
}

export async function POST(request: NextRequest) {
    const { authCode, sharedId, sellerToken, referralToken } = await request.json();
    if (!authCode || !sharedId || !sellerToken || !referralToken) {
        return new Response(JSON.stringify({ error: "Missing required parameters" }), { status: 400 });
    }
    const getMerchantAccessToken = await client.queries.PayPalMerchantAccessTokenFunction({ authCode, sharedId, sellerToken });
    if (getMerchantAccessToken.errors || !getMerchantAccessToken.data || !getMerchantAccessToken.data.accessToken) {
        return new Response(JSON.stringify({ error: "Failed to fetch merchant access token" }), { status: 500 });
    }

    const getMerchantRestCredentials = await client.queries.PayPalRetrieveRestCredentialsFunction({ accessToken: getMerchantAccessToken.data.accessToken });
    if (getMerchantRestCredentials.errors || !getMerchantRestCredentials.data) {
        return new Response(JSON.stringify({ error: "Failed to fetch merchant REST credentials" }), { status: 500 });
    }

    const credentials = {
        clientId: getMerchantRestCredentials.data.clientId,
        clientSecret: getMerchantRestCredentials.data.clientSecret,
        payer_id: getMerchantRestCredentials.data.payer_id,
    };
    if (!credentials.payer_id) {
        return new Response(JSON.stringify({ error: "PayPal did not return a merchant payer ID" }), { status: 502 });
    }

    const existing = await client.models.StoreMerchantPaypalCredentials.get({ id: credentials.payer_id });
    if (existing.errors?.length) {
        return new Response(JSON.stringify({ error: "Failed to check existing merchant credentials" }), { status: 500 });
    }
    const saved = existing.data
        ? await client.models.StoreMerchantPaypalCredentials.update({ id: credentials.payer_id, ...credentials })
        : await client.models.StoreMerchantPaypalCredentials.create({ id: credentials.payer_id, ...credentials });
    if (saved.errors?.length) {
        return new Response(JSON.stringify({ error: "Failed to save merchant credentials" }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
}