import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { PayPalPlatformAccessTokenFunction } from '../functions/paypal-platform-access-token/resource';
import { PayPalMerchantAccessTokenFunction } from '../functions/paypal-merchant-onboard-token/resource';
import { PayPalRetrieveRestCredentialsFunction } from '../functions/paypal-retrieve-rest-credentials/resource';
import { getPayPalAuthJWT } from '../functions/generate-paypal-auth-jwt/resource'

const schema = a.schema({
  CustomerUserData: a.model({
    id: a.id(),
    email: a.email(),
    paymentTokenId: a.string(),
    payerId: a.string(),
    name: a.string(),
    consumerType: a.string(),
    shippingAddress: a.customType({
      name: a.string(),
      address: a.customType({
        addressLineOne: a.string(),
        city: a.string(),
        state: a.string(),
        zip: a.string(),
        country: a.string(),
      })
    })
  })
  .authorization(allow => [allow.guest()]),

  StoreMerchantPaypalCredentials: a.model({
    id: a.id(),
    clientId: a.string(),
    clientSecret: a.string(),
    payer_id: a.string(),
  })
    .authorization(allow => [allow.guest()]),

  StoreMerchantSettings: a.model({
    id: a.id(),
    paypalMerchantId: a.string(),
    channel3brand: a.string(),
    channel3ApiKey: a.string(),
    storeProvider: a.string(),
    shopifyConnectionId: a.string(),
    shopifyShop: a.string(),
  })
    .authorization(allow => [
      allow.guest().to(["read"]),
      allow.owner().to(["create", "update", "delete", "read"]),
    ]),

  PayPalCapability: a.customType({
    name: a.string().required(),
    status: a.string(),
  }),

  PayPalProduct: a.customType({
    name: a.string().required(),
    status: a.string(),
    vettingStatus: a.string(),
    capabilities: a.ref('PayPalCapability').array(),
  }),


  PayPalOAuthThirdParty: a.customType({
    partnerClientId: a.string(),
    merchantClientId: a.string(),
    scopes: a.string().array(),
  }),

  PayPalOAuthIntegration: a.customType({
    integrationType: a.string(),
    integrationMethod: a.string(),
    oauthThirdParty: a.ref('PayPalOAuthThirdParty').array(),
  }),

  MerchantPaypalOAuth: a.model({
    id: a.id(),
    trackingId: a.string(),
    products: a.ref('PayPalProduct').array(),
    capabilities: a.ref('PayPalCapability').array(),
    paymentsReceivable: a.boolean(),
    legalName: a.string(),
    primaryEmailConfirmed: a.boolean(),
    OAuth: a.ref('PayPalOAuthIntegration').array(),
  })
    .authorization(allow => [allow.guest()]),

  StoreMerchantInfo: a.model({
    id: a.id(),
    merchantId: a.email(),
    merchantIdInPayPal: a.string(),
    permissionsGranted: a.boolean(),
    accountStatus: a.string(),
    consentStatus: a.string(),
    isEmailConfirmed: a.boolean(),
  })
    .authorization(allow => [allow.guest()]),

  PayPalPlatformAccessTokenResponse: a.customType({
    scope: a.string(),
    accessToken: a.string(),
    tokenType: a.string(),
    appId: a.string(),
    expiresIn: a.integer(),
    nonce: a.string(),
  }),

  PayPalSellerRestApiCredentialsResponse: a.customType({
    clientId: a.string(),
    clientSecret: a.string(),
    payer_id: a.string(),
  }),

  PayPalAuthJWTResponse: a.customType({
    jwt: a.string(),
  }),

  PayPalPlatformAccessTokenFunction: a
    .query()
    .returns(a.ref('PayPalPlatformAccessTokenResponse'))
    .authorization(allow => [allow.guest()])
    .handler(a.handler.function(PayPalPlatformAccessTokenFunction)),

  PayPalMerchantAccessTokenFunction: a
    .query()
    .arguments({ authCode: a.string(), sharedId: a.string(), sellerToken: a.string() })
    .returns(a.ref('PayPalPlatformAccessTokenResponse'))
    .authorization(allow => [allow.guest()])
    .handler(a.handler.function(PayPalMerchantAccessTokenFunction)),

  PayPalRetrieveRestCredentialsFunction: a
    .query()
    .arguments({ accessToken: a.string() })
    .returns(a.ref('PayPalSellerRestApiCredentialsResponse'))
    .authorization(allow => [allow.guest()])
    .handler(a.handler.function(PayPalRetrieveRestCredentialsFunction)),

  getPayPalAuthJWT: a
    .query()
    .arguments({ sellerId: a.string() })
    .returns(a.ref('PayPalAuthJWTResponse'))
    .authorization(allow => [allow.guest()])
    .handler(a.handler.function(getPayPalAuthJWT)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'identityPool',
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
