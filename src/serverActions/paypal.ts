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
                                        "DELAY_FUNDS_DISBURSEMENT"
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
