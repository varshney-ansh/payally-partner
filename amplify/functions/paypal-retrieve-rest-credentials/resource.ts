import { defineFunction, secret } from '@aws-amplify/backend';

export const PayPalRetrieveRestCredentialsFunction = defineFunction({
  // optionally specify a name for the Function (defaults to directory name)
  name: 'paypal-retrieve-rest-credentials',
  // optionally specify a path to your handler (defaults to "./handler.ts")
  entry: './handler.ts',
  environment: {
    PARTNER_MERCHANT_ID: secret('PARTNER_MERCHANT_ID') || (() => { throw new Error("PARTNER_MERCHANT_ID is required") })(),
    BN_CODE: secret('BN_CODE') || (() => { throw new Error("BN_CODE is required") })(),
    PAYPAL_BASE_URL: process.env.PAYPAL_BASE_URL || (() => { throw new Error("PAYPAL_BASE_URL is required") })(),
 }
});