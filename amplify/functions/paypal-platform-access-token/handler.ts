import { Schema } from '../../data/resource';
import { env } from "$amplify/env/paypal-platform-access-token";

export const handler: Schema["PayPalPlatformAccessTokenFunction"]["functionHandler"] = async (event, context) => {
  const RestRequest = await fetch(`${env.PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
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