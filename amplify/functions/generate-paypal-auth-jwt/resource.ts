import { defineFunction, secret } from '@aws-amplify/backend';

export const getPayPalAuthJWT = defineFunction({
  // optionally specify a name for the Function (defaults to directory name)
  name: 'generate-paypal-auth-jwt',
  // optionally specify a path to your handler (defaults to "./handler.ts")
  entry: './handler.ts',
  environment: {
    PAYPAL_CLIENT_ID: secret('PAYPAL_CLIENT_ID') || (() => { throw new Error("PAYPAL_CLIENT_ID is required") })(),
  }
});