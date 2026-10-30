import type { Schema } from "../../amplify/data/resource"
import { Amplify } from "aws-amplify"
import { generateClient } from "aws-amplify/api"
import outputs from "../../amplify_outputs.json";
import { unstable_cache } from 'next/cache';
import crypto from "crypto";

Amplify.configure(outputs)

const client = generateClient<Schema>()

export const fetchPayPalAccessToken = unstable_cache(async () => {
    try {
        const response = await client.queries.PayPalPlatformAccessTokenFunction();
        if (response.errors?.length) {
            throw new Error("PayPal access-token query returned errors.");
        }

        const accessToken = response.data?.accessToken;
        if (!accessToken) {
            throw new Error("PayPal access-token query returned no access token.");
        }

        return accessToken;
    } catch (error) {
        throw new Error(`Failed to fetch PayPal access token: ${error}`);
    }
}, [],
    { revalidate: 28800 }
);

type PayPalActionLink = {
    rel: "action_url";
    href: string;
};

function isPayPalActionLink(value: unknown): value is PayPalActionLink {
    return (
        typeof value === "object" &&
        value !== null &&
        "rel" in value &&
        value.rel === "action_url" &&
        "href" in value &&
        typeof value.href === "string"
    );
}

export const fetchPaypalReferalLink = async ({ accessToken }: { accessToken: string }) => {
    try {
        const sellerNonce = crypto.randomBytes(96).toString('base64url').slice(0, Math.floor(Math.random() * 86) + 43);
        const response = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/customer/partner-referrals`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
                "PayPal-Partner-Attribution-Id": `${process.env.PAYALLY_PARTNER_ATTRIBUTION_ID}` || (() => { throw new Error("PAYALLY_PARTNER_ATTRIBUTION_ID is required") })(),
            },
            body: JSON.stringify({
                "operations": [
                    {
                        "operation": "API_INTEGRATION",
                        "api_integration_preference": {
                            "rest_api_integration": {
                                "integration_method": "PAYPAL",
                                "integration_type": "THIRD_PARTY",
                                "third_party_details": {
                                    "features": [
                                        "PAYMENT",
                                        "REFUND",
                                        "PARTNER_FEE",
                                        "DELAY_FUNDS_DISBURSEMENT",
                                        "VAULT",
                                        "BILLING_AGREEMENT"
                                    ]
                                }
                            }
                        }
                    }
                ],
                "capabilities": [
                    "PAYPAL_WALLET_VAULTING_ADVANCED"
                ],
                partner_config_override: {
                    return_url: `https://payally.world/api/paypal-merchant-onboard-setup`,
                },
                products: ["EXPRESS_CHECKOUT", "ADVANCED_VAULTING"],
                legal_consents: [
                    {
                        type: "SHARE_DATA_CONSENT",
                        granted: true,
                    },
                ],
            })
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            throw new Error(`PayPal API Error (${response.status}): ${errorDetails}`);
        }

        const data: unknown = await response.json();
        if (typeof data !== "object" || data === null || !("links" in data) || !Array.isArray(data.links)) {
            throw new Error("PayPal referral response did not contain any links.");
        }

        const actionLink = data.links.find(isPayPalActionLink);
        if (!actionLink) {
            throw new Error("PayPal referral response did not contain an onboarding URL.");
        }

        return { referralUrl: actionLink.href, sellerNonce };

    } catch (error) {
        throw new Error(`Failed to fetch PayPal referral link: ${error}`);
    }
}

type oauth = {
    partner_client_id: string,
    merchant_client_id: string,
    scopes: Array<string>
}

type OAuthIntergation = {
    integration_type: string,
    integration_method: string,
    oauth_third_party: Array<oauth>
}

type PayPalCapability = {
    name: string;
    status?: string;
};

type PayPalProduct = {
    name: string;
    status?: string;
    vetting_status?: string;
    capabilities?: unknown[];
};

function normalizePayPalCapability(value: unknown): PayPalCapability | undefined {
    if (typeof value === "string" && value.length > 0) {
        return { name: value };
    }
    if (typeof value === "object" && value !== null && "name" in value &&
        typeof value.name === "string" && value.name.length > 0) {
        return {
            name: value.name,
            status: "status" in value && typeof value.status === "string" ? value.status : undefined,
        };
    }
    return undefined;
}

function isPayPalProduct(value: unknown): value is PayPalProduct {
    return (
        typeof value === "object" &&
        value !== null &&
        "name" in value &&
        typeof value.name === "string" &&
        value.name.length > 0
    );
}

function normalizePayPalCapabilities(value: unknown): PayPalCapability[] | undefined {
    if (!Array.isArray(value)) {
        return undefined;
    }

    const capabilities = value
        .map(normalizePayPalCapability)
        .filter((capability): capability is PayPalCapability => capability !== undefined);
    if (capabilities.length !== value.length) {
        console.warn("Ignored PayPal capabilities with an invalid shape.");
    }
    return capabilities;
}

function validPayPalProducts(value: unknown): PayPalProduct[] | undefined {
    if (!Array.isArray(value)) {
        return undefined;
    }

    const validProducts = value.filter(isPayPalProduct);
    if (validProducts.length !== value.length) {
        console.warn("Ignored PayPal products without a valid name.");
    }
    return validProducts;
}

export const merchantOnboardingStatus = async ({ merchantId }: { merchantId: string }) => {
    try {
        const jwtToken = (await client.queries.getPayPalAuthJWT({ sellerId: `${process.env.PAYALLY_PARTNER_MERCHANT_ID}` })).data?.jwt;

        if (!jwtToken) {
            throw new Error(`JWT Token Failed : ${jwtToken}`);
        }
        const accessToken = await fetchPayPalAccessToken();
        const response = await fetch(`${process.env.PAYPAL_BASE_URL}/v1/customer/partners/${process.env.PAYALLY_PARTNER_MERCHANT_ID}/merchant-integrations/${merchantId}`, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
                "PayPal-Partner-Attribution-Id": `${process.env.PAYALLY_PARTNER_ATTRIBUTION_ID}` || (() => { throw new Error("PAYALLY_PARTNER_ATTRIBUTION_ID is required") })(),
                "PayPal-Auth-Assertion": `${jwtToken}`
            }
        });
        if (!response.ok) {
            const errorDetails = await response.text();
            throw new Error(`PayPal Merchant Status Error (${response.status}): ${errorDetails}`);
        }
        const data = await response.json();
        const merchantRecord = {
            trackingId: data.tracking_id,
            products: validPayPalProducts(data.products)?.map((product: PayPalProduct) => ({
                name: product.name,
                status: product.status,
                vettingStatus: product.vetting_status,
                capabilities: normalizePayPalCapabilities(product.capabilities),
            })),
            capabilities: normalizePayPalCapabilities(data.capabilities),
            paymentsReceivable: data.payments_receivable,
            legalName: data.legal_name,
            primaryEmailConfirmed: data.primary_email_confirmed,
            OAuth: data.oauth_integrations?.map((integration: OAuthIntergation) => ({
                integrationType: integration.integration_type,
                integrationMethod: integration.integration_method,
                oauthThirdParty: integration.oauth_third_party?.map((entry) => ({
                    partnerClientId: entry.partner_client_id,
                    merchantClientId: entry.merchant_client_id,
                    scopes: entry.scopes,
                })),
            })),
        };

        const existing = await client.models.MerchantPaypalOAuth.get({ id: merchantId });
        if (existing.errors?.length) {
            throw new Error(`Failed to look up saved merchant status: ${existing.errors.map(({ message }) => message).join(", ")}`);
        }

        const dataStore = existing.data
            ? await client.models.MerchantPaypalOAuth.update({ id: merchantId, ...merchantRecord })
            : await client.models.MerchantPaypalOAuth.create({ id: merchantId, ...merchantRecord });

        if (dataStore.errors?.length) {
            throw new Error(`Failed to save merchant status: ${dataStore.errors.map(({ message }) => message).join(", ")}`);
        }

        return data;
    } catch (error) {
        throw new Error(`Failed to merchant onboarding status: ${error}`);
    }
}

export const getMerchantSignupDetails = async ({ paypalMerchantId }: { paypalMerchantId: string }) => {
    try {
        const result = await client.models.StoreMerchantInfo.get({ id: paypalMerchantId });
        if (result.errors?.length) {
            throw new Error(`Failed to look up signup details: ${result.errors.map(({ message }) => message).join(", ")}`);
        }

        const merchantInfo = result.data;
        if (!merchantInfo?.merchantId) {
            return null;
        }

        return {
            email: merchantInfo.merchantId,
            paypalMerchantId: merchantInfo.merchantIdInPayPal ?? paypalMerchantId,
        };
    } catch (error) {
        throw new Error(`Failed to load merchant signup details: ${error}`);
    }
}

export const getUserPaymentAuthorizeLink = async ({ email, state, paypalMerchantId }: { email: string, state: string, paypalMerchantId: string }) => {
    const platformAccessToken = await fetchPayPalAccessToken();
    const jwtAuth = (await client.queries.getPayPalAuthJWT({sellerId: paypalMerchantId})).data?.jwt
    const paypalReq = await fetch(`${process.env.PAYPAL_BASE_URL}/v3/vault/setup-tokens`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${platformAccessToken}`,
            "PayPal-Request-Id": `${Date.now().toString(36) + Math.random().toString(36).slice(2, 5)}`,
            "PayPal-Auth-Assertion" : `${jwtAuth}`,
            "PayPal-Partner-Attribution-Id": `${process.env.PAYALLY_PARTNER_ATTRIBUTION_ID}`,
        },
        body: JSON.stringify({
            "payment_source": {
                "paypal": {
                    "description": "Authorize Payally to pay automatically on AI Apps.",
                    "usage_pattern": "IMMEDIATE",
                    "usage_type": "MERCHANT",
                    "permit_multiple_payment_tokens": true,
                    "customer_type": "CONSUMER",
                    "experience_context": {
                        "shipping_preference": "GET_FROM_FILE",
                        "return_url": `${process.env.PAYALLY_PLATFORM_BASE_URL}/authorize/users/paypal?state=${encodeURIComponent(state)}&ext_paypal_merchant_id=${paypalMerchantId}`,
                        "cancel_url": `${process.env.PAYALLY_PLATFORM_BASE_URL}/authorize/users/paypal/cancel`,
                        "user_action": "SETUP_NOW",
                        "brand_name": "Payally",
                        "locale": "en-US"
                    }
                }
            },
            "customer": {
                "merchant_customer_id": String(email)
            }
        })

    });

    const response = await paypalReq.json();
    return response;
}

export const createPaypalPaymentToken = async ({ 
    paypalSetupToken, 
    paypalMerchantId 
}: { 
    paypalSetupToken: string;
    paypalMerchantId: string;
}) => {
    const platformAccessToken = await fetchPayPalAccessToken();
    const jwtAuth = (await client.queries.getPayPalAuthJWT({sellerId: "DZWR8V78BHZ6G"})).data?.jwt

    const paypalReq = await fetch(`${process.env.PAYPAL_BASE_URL}/v3/vault/payment-tokens`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${platformAccessToken}`,
            "PayPal-Request-Id": `${Date.now().toString(36) + Math.random().toString(36).slice(2, 5)}`,
            "PayPal-Auth-Assertion" : `${jwtAuth}`,
            "PayPal-Partner-Attribution-Id": `${process.env.PAYALLY_PARTNER_ATTRIBUTION_ID}`
        },
        body: JSON.stringify({
            "payment_source": {
                "token": {
                    "type": "SETUP_TOKEN",
                    "id": `${paypalSetupToken}`
                }
            }
        })
    });

    if (!paypalReq.ok) {
        const errorDetails = await paypalReq.text();
        throw new Error(`PayPal payment-token API Error (${paypalReq.status}): ${errorDetails}`);
    }

    const response: unknown = await paypalReq.json();
    if (typeof response !== "object" || response === null || !("id" in response) ||
        typeof response.id !== "string" || !("customer" in response) ||
        typeof response.customer !== "object" || response.customer === null ||
        !("id" in response.customer) || typeof response.customer.id !== "string" ||
        !("merchant_customer_id" in response.customer) ||
        typeof response.customer.merchant_customer_id !== "string" ||
        !("payment_source" in response) || typeof response.payment_source !== "object" ||
        response.payment_source === null || !("paypal" in response.payment_source) ||
        typeof response.payment_source.paypal !== "object" ||
        response.payment_source.paypal === null) {
        throw new Error("PayPal payment-token response did not contain the required customer and PayPal details.");
    }

    const customer = response.customer;
    const paypal = response.payment_source.paypal;
    const shipping = "shipping" in paypal && typeof paypal.shipping === "object" && paypal.shipping !== null
        ? paypal.shipping
        : undefined;
    const shippingName = shipping && "name" in shipping && typeof shipping.name === "object" && shipping.name !== null
        ? shipping.name
        : undefined;
    const shippingDetails = shipping && "address" in shipping && typeof shipping.address === "object" && shipping.address !== null
        ? shipping.address
        : undefined;
    const payerName = "name" in paypal && typeof paypal.name === "object" && paypal.name !== null
        ? paypal.name
        : undefined;

    const customerEmail = customer.merchant_customer_id as string;

    // Look up any existing record for this buyer (email) at this merchant, so a
    // re-authorization overwrites the same row instead of creating a duplicate
    // keyed by the newly issued payment-token id.
    const existingForUser = await client.models.CustomerUserData.list({
        filter: {
            email: { eq: customerEmail },
            paypalMerchantId: { eq: paypalMerchantId },
        },
    });
    if (existingForUser.errors?.length) {
        throw new Error(`Failed to look up saved PayPal customer data: ${existingForUser.errors.map(({ message }) => message).join(", ")}`);
    }

    const existingRecord = existingForUser.data?.[0];

    // Reuse the existing row's id when present; otherwise key the new row by the
    // payment-token id.
    const recordId = existingRecord?.id ?? response.id;

    const customerRecord = {
        id: recordId,
        paypalMerchantId: paypalMerchantId,
        paypalCustomerId: customer.id as string,
        email: customer.merchant_customer_id as string,
        paymentTokenId: response.id,
        payerId: "payer_id" in paypal && typeof paypal.payer_id === "string" ? paypal.payer_id : undefined,
        name: payerName && "full_name" in payerName && typeof payerName.full_name === "string"
            ? payerName.full_name
            : undefined,
        consumerType: "customer_type" in paypal && typeof paypal.customer_type === "string"
            ? paypal.customer_type
            : undefined,
        shippingAddress: shipping
            ? {
                name: shippingName && "full_name" in shippingName && typeof shippingName.full_name === "string"
                    ? shippingName.full_name
                    : undefined,
                address: {
                    addressLineOne: shippingDetails && "address_line_1" in shippingDetails && typeof shippingDetails.address_line_1 === "string"
                        ? shippingDetails.address_line_1
                        : undefined,
                    city: shippingDetails && "admin_area_2" in shippingDetails && typeof shippingDetails.admin_area_2 === "string"
                        ? shippingDetails.admin_area_2
                        : undefined,
                    state: shippingDetails && "admin_area_1" in shippingDetails && typeof shippingDetails.admin_area_1 === "string"
                        ? shippingDetails.admin_area_1
                        : undefined,
                    zip: shippingDetails && "postal_code" in shippingDetails && typeof shippingDetails.postal_code === "string"
                        ? shippingDetails.postal_code
                        : undefined,
                    country: shippingDetails && "country_code" in shippingDetails && typeof shippingDetails.country_code === "string"
                        ? shippingDetails.country_code
                        : undefined,
                },
            }
            : undefined,
    };

    const savedCustomer = existingRecord
        ? await client.models.CustomerUserData.update(customerRecord)
        : await client.models.CustomerUserData.create(customerRecord);
    if (savedCustomer.errors?.length) {
        throw new Error(`Failed to save PayPal customer data: ${savedCustomer.errors.map(({ message }) => message).join(", ")}`);
    }

    // Clean up any pre-existing duplicate rows for this buyer/merchant (rows
    // created before the overwrite-by-email fix), keeping only the record we
    // just saved.
    const duplicates = (existingForUser.data ?? []).filter((record) => record.id !== recordId);
    for (const duplicate of duplicates) {
        const deleted = await client.models.CustomerUserData.delete({
            paypalMerchantId: duplicate.paypalMerchantId,
            id: duplicate.id,
        });
        if (deleted.errors?.length) {
            console.error(`Failed to delete duplicate CustomerUserData row ${duplicate.id}: ${deleted.errors.map(({ message }) => message).join(", ")}`);
        }
    }

    return { status: 200, msg: 'success' };
}
