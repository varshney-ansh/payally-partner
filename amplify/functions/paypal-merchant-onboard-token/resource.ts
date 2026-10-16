import { defineFunction, secret } from '@aws-amplify/backend';

export const PayPalMerchantAccessTokenFunction = defineFunction({
  // optionally specify a name for the Function (defaults to directory name)
  name: 'paypal-merchant-access-token',
  // optionally specify a path to your handler (defaults to "./handler.ts")
  entry: './handler.ts',
  environment: {
    PAYPAL_BASE_URL: process.env.PAYPAL_BASE_URL || (() => { throw new Error("PAYPAL_BASE_URL is required") })(),
    PAYPAL_CLIENT_ID: secret('PAYPAL_CLIENT_ID') || (() => { throw new Error("PAYPAL_CLIENT_ID is required") })(),
    PAYPAL_CLIENT_SECRET: secret('PAYPAL_CLIENT_SECRET') || (() => { throw new Error("PAYPAL_CLIENT_SECRET is required") })(),
  }
});