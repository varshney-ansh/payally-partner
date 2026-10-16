import { Schema } from "../../data/resource";
import { env } from "$amplify/env/paypal-retrieve-rest-credentials";

export const handler: Schema["PayPalRetrieveRestCredentialsFunction"]["functionHandler"] = async (event) => {
  const RestRequest = await fetch(`${env.PAYPAL_BASE_URL}/v1/customer/partners/${env.PARTNER_MERCHANT_ID}/merchant-integrations/credentials/`, {
    method: "GET",
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${event.arguments.accessToken}`,
        "PayPal-Partner-Attribution-Id": `${env.BN_CODE}` || (() => { throw new Error("BN_CODE is required") })(),
    },
    });

    if (!RestRequest.ok) {
        const errorResponse = await RestRequest.json();
        console.error("Error fetching PayPal REST API credentials:", errorResponse);
        throw new Error(`Failed to fetch PayPal REST API credentials: ${errorResponse.error_description || errorResponse.error}`);
    }

    const responseData = await RestRequest.json();

    return {
        clientId: responseData.client_id,
        clientSecret: responseData.client_secret,
        payer_id: responseData.payer_id,
    };

}