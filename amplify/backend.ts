import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { PayPalPlatformAccessTokenFunction } from './functions/paypal-platform-access-token/resource';
import { PayPalMerchantAccessTokenFunction } from './functions/paypal-merchant-onboard-token/resource';
import { PayPalRetrieveRestCredentialsFunction } from './functions/paypal-retrieve-rest-credentials/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
defineBackend({
  auth,
  data,
  PayPalPlatformAccessTokenFunction,
  PayPalMerchantAccessTokenFunction,
  PayPalRetrieveRestCredentialsFunction,
});
