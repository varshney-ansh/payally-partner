import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { PayPalPlatformAccessTokenFunction } from './functions/paypal-platform-access-token/resource';
import { PayPalMerchantAccessTokenFunction } from './functions/paypal-merchant-onboard-token/resource';
import { PayPalRetrieveRestCredentialsFunction } from './functions/paypal-retrieve-rest-credentials/resource';
import { getPayPalAuthJWT } from './functions/generate-paypal-auth-jwt/resource'
import { ExploreProductApiFunction } from './functions/api-explore-product/resource'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import {GetProductByIdApiFunction} from './functions/api-get-product-by-id/resource'
import { CheckoutApiFunction } from './functions/api-checkout/resource'
/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  PayPalPlatformAccessTokenFunction,
  PayPalMerchantAccessTokenFunction,
  PayPalRetrieveRestCredentialsFunction,
  getPayPalAuthJWT,
  ExploreProductApiFunction,
  GetProductByIdApiFunction,
  CheckoutApiFunction
});

// Create a custom CDK stack within your Amplify deployment context
const customStack = backend.createStack('PayallyAPIStack');

const api = new apigateway.RestApi(customStack, 'PayallyAPI', {
  restApiName: 'payally-api',
  deployOptions: {
    stageName: 'v1',
  },
  defaultCorsPreflightOptions: {
    allowOrigins: apigateway.Cors.ALL_ORIGINS,
    allowMethods: apigateway.Cors.ALL_METHODS,
    allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
  },
});

const productsResource = api.root.addResource('explore-products');
const getProductbyIdResource = api.root.addResource('get-product-by-id');
const checkoutResource = api.root.addResource('checkout');

checkoutResource.addMethod(
  'POST',
  new apigateway.LambdaIntegration(backend.CheckoutApiFunction.resources.lambda)
)

getProductbyIdResource.addMethod(
  'GET',
  new apigateway.LambdaIntegration(backend.GetProductByIdApiFunction.resources.lambda)
)

productsResource.addMethod(
  'GET',
  new apigateway.LambdaIntegration(backend.ExploreProductApiFunction.resources.lambda)
);

