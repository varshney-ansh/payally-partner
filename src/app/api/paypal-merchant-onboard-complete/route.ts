import { type NextRequest } from "next/server";
import type { Schema } from "../../../../amplify/data/resource"
import { Amplify } from "aws-amplify"
import { generateClient } from "aws-amplify/api"
import outputs from "../../../../amplify_outputs.json"

Amplify.configure(outputs)

const client = generateClient<Schema>()

export async function GET(request: NextRequest) {
    return new Response(JSON.stringify({ status: "Healthy" }), { status: 200 });
}

export async function POST(request: NextRequest) {
    const { authCode, sharedId, sellerToken } = await request.json();
    if (!authCode || !sharedId || !sellerToken) {
        return new Response(JSON.stringify({ error: "Missing required parameters" }), { status: 400 });
    }
    const getMerchantAccessToken = await client.queries.PayPalMerchantAccessTokenFunction({ authCode, sharedId, sellerToken });
    if(getMerchantAccessToken.errors || !getMerchantAccessToken.data || !getMerchantAccessToken.data.accessToken) {
        return new Response(JSON.stringify({ error: "Failed to fetch merchant access token" }), { status: 500 });
    }
    const getMerchantRestCredentials = await client.queries.PayPalRetrieveRestCredentialsFunction({ accessToken: getMerchantAccessToken.data.accessToken });
    if(getMerchantRestCredentials.errors || !getMerchantRestCredentials.data) {
        return new Response(JSON.stringify({ error: "Failed to fetch merchant REST credentials" }), { status: 500 });
    }
    return new Response(JSON.stringify(getMerchantRestCredentials), { status: 200 });
}