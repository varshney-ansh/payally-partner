import type { APIGatewayProxyHandler } from "aws-lambda";
import { Schema } from '../../data/resource';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/api-show-orders';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
};

function jsonResponse(statusCode: number, body: unknown) {
    return {
        statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify(body),
    };
}

export const handler: APIGatewayProxyHandler = async (event) => {
    let payload: { merchantId?: string; email?: string };
    try {
        payload = JSON.parse(event.body ?? "{}");
    } catch {
        return jsonResponse(400, { error: "Invalid JSON body" });
    }

    const { merchantId, email } = payload;

    if (!merchantId || !email) {
        return jsonResponse(400, {
            error: "Missing required fields: merchantId and email are required",
        });
    }

    const ordersResult = await client.models.Order.list({
        filter: {
            paypalMerchantId: { eq: merchantId },
            userEmail: { eq: email },
        },
    });

    if (ordersResult.errors?.length) {
        console.error("Order list errors:", ordersResult.errors);
        return jsonResponse(502, { error: "Failed to fetch orders" });
    }

    return jsonResponse(200, { orders: ordersResult.data ?? [] });
};
