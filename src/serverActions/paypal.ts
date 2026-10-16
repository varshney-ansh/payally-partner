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
        return JSON.stringify(response);
    } catch (error) {
        throw new Error(`Failed to fetch PayPal access token: ${error}`);
    }
}, [],
    { revalidate: 28800 }
);

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
                                "integration_type": "FIRST_PARTY",
                                "first_party_details": {
                                    "features": [
                                        "PAYMENT",
                                        "REFUND"
                                    ],
                                    "seller_nonce": sellerNonce
                                }
                            }
                        }
                    }
                ],
                partner_config_override: {
                    return_url: `https://payally.world/api/paypal-merchant-onboard-setup`,
                },
                products: ["EXPRESS_CHECKOUT"],
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

        const data = await response.json();
        return {data, sellerNonce};

    } catch (error) {
        throw new Error(`Failed to fetch PayPal referral link: ${error}`);
    }
}
