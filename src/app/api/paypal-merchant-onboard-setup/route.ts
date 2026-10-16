import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const merchantIdInPayPal = request.nextUrl.searchParams.get('merchantIdInPayPal');
    if (!merchantIdInPayPal) {
        return new Response(JSON.stringify({ error: "Missing required query parameters" }), { status: 400 });
    }

    const permissionsGranted = request.nextUrl.searchParams.get('permissionsGranted');
    const accountStatus = request.nextUrl.searchParams.get('accountStatus');
    const consentStatus = request.nextUrl.searchParams.get('consentStatus');
    const productIntentID = request.nextUrl.searchParams.get('productIntentID');
    const isEmailConfirmed = request.nextUrl.searchParams.get('isEmailConfirmed');
    const returnMessage = request.nextUrl.searchParams.get('returnMessage');

    // redirect user to /authorize-payments/[payeeId] page with the query parameters
    const redirectUrl = new URL(`/authorize-payments/${merchantIdInPayPal}`, request.url);
    return Response.redirect(redirectUrl);
}


