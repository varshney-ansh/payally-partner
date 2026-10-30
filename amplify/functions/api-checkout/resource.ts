import { defineFunction, secret } from "@aws-amplify/backend";

export const CheckoutApiFunction = defineFunction({
    name: "api-checkout",
    entry: './handler.ts',
    environment: {
        PAYPAL_BASE_URL: process.env.PAYPAL_BASE_URL || (() => { throw new Error("PAYPAL_BASE_URL is required") })(),
        PAYPAL_CLIENT_ID: secret('PAYPAL_CLIENT_ID') || (() => { throw new Error("PAYPAL_CLIENT_ID is required") })(),
        PAYPAL_CLIENT_SECRET: secret('PAYPAL_CLIENT_SECRET') || (() => { throw new Error("PAYPAL_CLIENT_SECRET is required") })(),
        PAYALLY_PARTNER_ATTRIBUTION_ID: secret('BN_CODE') || (() => { throw new Error("BN_CODE is required") })(),
    }
});
