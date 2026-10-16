import { Schema } from '../../data/resource';
import { env } from "$amplify/env/paypal-merchant-access-token";

export const handler: Schema["PayPalMerchantAccessTokenFunction"]["functionHandler"] = async (event) => {
    const credentials = Buffer.from(`${event.arguments.sharedId}:`, "utf8").toString("base64");

    const RestRequest = await fetch(`${env.PAYPAL_BASE_URL}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${credentials}`,
        },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            code: `${event.arguments.authCode}`,
            code_verifier: `${event.arguments.sellerToken}`
        }),
    });

    if (!RestRequest.ok) {
        const errorResponse = await RestRequest.json();
        console.error("Error fetching PayPal access token:", errorResponse);
        throw new Error(`Failed to fetch PayPal access token: ${errorResponse.error_description || errorResponse.error}`);
    }

    const responseData = await RestRequest.json();

    return {
        scope: responseData.scope,
        accessToken: responseData.access_token,
        tokenType: responseData.token_type,
        appId: responseData.app_id,
        expiresIn: responseData.expires_in,
        nonce: responseData.nonce,
    };
};