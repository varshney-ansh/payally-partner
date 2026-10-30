import type { APIGatewayProxyHandler } from "aws-lambda";
import { Schema } from '../../data/resource';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/api-checkout';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
};

interface Money {
    currency_code: string;
    value: string;
}

interface CartLineItem {
    name: string;
    quantity: string;
    unit_amount: Money;
    sku?: string;
    image_url?: string;
    category?: "DIGITAL_GOODS" | "PHYSICAL_GOODS" | "DONATION";
    description?: string;
}

interface Cart {
    cartId?: string;
    userEmail: string;
    merchantId: string;
    items: CartLineItem[];
}

function jsonResponse(statusCode: number, body: unknown) {
    return {
        statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify(body),
    };
}

// Platform fee charged by Payally on each checkout, as a fraction of the cart total.
const PLATFORM_FEE_RATE = 0.02;

/**
 * Sum the line items into total cents.
 * cents = round(unit_amount.value * 100) * quantity, summed across items.
 */
function computeItemTotalCents(items: CartLineItem[]): number {
    return items.reduce((acc, item) => {
        const unit = Math.round(Number(item.unit_amount.value) * 100);
        const qty = Number(item.quantity);
        return acc + unit * qty;
    }, 0);
}

/** Convert an integer cents amount into a 2-decimal currency string. */
function centsToValue(cents: number): string {
    return (cents / 100).toFixed(2);
}

export const handler: APIGatewayProxyHandler = async (event) => {
    // 1. Parse and validate the request body (the cart).
    let cart: Cart;
    try {
        cart = JSON.parse(event.body ?? "{}");
    } catch {
        return jsonResponse(400, { error: "Invalid JSON body" });
    }

    const { userEmail, merchantId, items } = cart;

    if (!userEmail || !merchantId || !Array.isArray(items) || items.length === 0) {
        return jsonResponse(400, {
            error: "Missing required fields: userEmail, merchantId and a non-empty items array are required",
        });
    }

    const currencyCode = items[0]?.unit_amount?.currency_code ?? "USD";

    // 1. Look up the buyer's vaulted PayPal details by email + merchant id.
    const customerLookup = await client.models.CustomerUserData.list({
        filter: {
            email: { eq: userEmail },
            paypalMerchantId: { eq: merchantId },
        },
    });

    if (customerLookup.errors?.length) {
        console.error("CustomerUserData lookup errors:", customerLookup.errors);
        return jsonResponse(502, { error: "Failed to look up customer information" });
    }

    const customer = customerLookup.data?.[0];

    if (!customer) {
        return jsonResponse(404, {
            error: "No vaulted PayPal customer found for this email and merchant",
        });
    }

    const paymentTokenId = customer.paymentTokenId;
    if (!paymentTokenId) {
        return jsonResponse(409, {
            error: "Customer has no saved PayPal payment token",
        });
    }

    // 2 & 3. Generate the auth-assertion JWT and fetch the platform access
    // token in parallel — they are independent of each other.
    const [jwtResult, tokenResult] = await Promise.all([
        client.queries.getPayPalAuthJWT({ sellerId: merchantId }),
        client.queries.PayPalPlatformAccessTokenFunction(),
    ]);

    const authAssertion = jwtResult.data?.jwt;
    if (jwtResult.errors?.length || !authAssertion) {
        console.error("getPayPalAuthJWT errors:", jwtResult.errors);
        return jsonResponse(502, { error: "Failed to generate PayPal auth assertion" });
    }

    const accessToken = tokenResult.data?.accessToken;
    if (tokenResult.errors?.length || !accessToken) {
        console.error("PayPalPlatformAccessTokenFunction errors:", tokenResult.errors);
        return jsonResponse(502, { error: "Failed to fetch PayPal access token" });
    }

    // 4. Build and submit the order to PayPal.
    const itemTotalCents = computeItemTotalCents(items);
    const itemTotal = centsToValue(itemTotalCents);

    // Platform fee: 2% of the cart total, rounded to the nearest cent.
    const platformFeeCents = Math.round(itemTotalCents * PLATFORM_FEE_RATE);
    const platformFee = centsToValue(platformFeeCents);

    const orderPayload = {
        intent: "CAPTURE",
        payment_source: {
            token: {
                id: paymentTokenId,
                type: "PAYMENT_METHOD_TOKEN",
            },
        },
        application_context: {
            shipping_preference: "GET_FROM_FILE",
        },
        purchase_units: [
            {
                amount: {
                    currency_code: currencyCode,
                    value: itemTotal,
                    breakdown: {
                        item_total: {
                            currency_code: currencyCode,
                            value: itemTotal,
                        },
                    },
                },
                payment_instruction: {
                    disbursement_mode: "INSTANT",
                    platform_fees: [
                        {
                            amount: {
                                currency_code: currencyCode,
                                value: platformFee,
                            },
                        },
                    ],
                },
                items: items.map((item) => ({
                    name: item.name,
                    quantity: item.quantity,
                    unit_amount: {
                        currency_code: item.unit_amount.currency_code,
                        value: item.unit_amount.value,
                    },
                    ...(item.sku ? { sku: item.sku } : {}),
                    ...(item.category ? { category: item.category } : {}),
                    ...(item.description ? { description: item.description } : {}),
                })),
            },
        ],
    };

    const orderResponse = await fetch(`${env.PAYPAL_BASE_URL}/v2/checkout/orders`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
            "PayPal-Request-Id": `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
            "PayPal-Auth-Assertion": authAssertion,
            "PayPal-Partner-Attribution-Id": env.PAYALLY_PARTNER_ATTRIBUTION_ID,
        },
        body: JSON.stringify(orderPayload),
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
        console.error("PayPal order API error:", orderData);
        return jsonResponse(orderResponse.status, {
            error: "Failed to create PayPal order",
            details: orderData,
        });
    }

    // 5. Store the main order info in the database.
    const purchaseUnit = orderData?.purchase_units?.[0];
    const breakdown = purchaseUnit?.amount?.breakdown;
    const capture = purchaseUnit?.payments?.captures?.[0];
    const payer = orderData?.payer;
    const payerName = payer?.name
        ? [payer.name.given_name, payer.name.surname].filter(Boolean).join(" ")
        : undefined;

    const orderRecord = {
        id: orderData.id as string,
        paypalMerchantId: merchantId,
        userEmail,
        status: orderData.status,
        currencyCode: purchaseUnit?.amount?.currency_code ?? currencyCode,
        itemTotal: breakdown?.item_total?.value ?? itemTotal,
        platformFee: purchaseUnit?.payment_instruction?.platform_fees?.[0]?.amount?.value ?? platformFee,
        grandTotal: purchaseUnit?.amount?.value ?? itemTotal,
        captureId: capture?.id,
        captureStatus: capture?.status,
        payerEmail: payer?.email_address,
        payerName,
        items: items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitAmount: item.unit_amount.value,
            sku: item.sku,
            category: item.category,
        })),
    };

    const savedOrder = await client.models.Order.create(orderRecord);
    if (savedOrder.errors?.length) {
        // The payment already succeeded; log but don't fail the response.
        console.error("Failed to store order:", savedOrder.errors);
    }

    return jsonResponse(200, savedOrder.data ?? orderRecord);
};
