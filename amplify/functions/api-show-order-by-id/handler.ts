import type { APIGatewayProxyHandler } from "aws-lambda";
import { Schema } from '../../data/resource';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/api-show-order-by-id';

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
    let payload: { merchantId?: string; email?: string; orderId?: string };
    try {
        payload = JSON.parse(event.body ?? "{}");
    } catch {
        return jsonResponse(400, { error: "Invalid JSON body" });
    }

    const { merchantId, email, orderId } = payload;

    if (!merchantId || !email || !orderId) {
        return jsonResponse(400, {
            error: "Missing required fields: merchantId, email and orderId are required",
        });
    }

    const orderResult = await client.models.Order.get({
        paypalMerchantId: merchantId,
        id: orderId,
    });

    if (orderResult.errors?.length) {
        console.error("Order get errors:", orderResult.errors);
        return jsonResponse(502, { error: "Failed to fetch order" });
    }

    const order = orderResult.data;

    // Ensure the order belongs to the requesting buyer.
    if (!order || order.userEmail !== email) {
        return jsonResponse(404, { error: "Order not found" });
    }

    return jsonResponse(200, { order });
};
