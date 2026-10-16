import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { PayPalPlatformAccessTokenFunction } from '../functions/paypal-platform-access-token/resource';
import { PayPalMerchantAccessTokenFunction } from '../functions/paypal-merchant-onboard-token/resource';
import { PayPalRetrieveRestCredentialsFunction } from '../functions/paypal-retrieve-rest-credentials/resource';
const schema = a.schema({

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

  PayPalPlatformAccessTokenFunction: a
    .query()
    .returns(a.ref('PayPalPlatformAccessTokenResponse'))
    .authorization(allow => [allow.guest()])
    .handler(a.handler.function(PayPalPlatformAccessTokenFunction)),

  PayPalMerchantAccessTokenFunction: a
    .query()
    .arguments({authCode: a.string(), sharedId: a.string(), sellerToken: a.string()})
    .returns(a.ref('PayPalPlatformAccessTokenResponse'))
    .authorization(allow => [allow.guest()])
    .handler(a.handler.function(PayPalMerchantAccessTokenFunction)),

  PayPalRetrieveRestCredentialsFunction: a
    .query()
    .arguments({accessToken: a.string()})
    .returns(a.ref('PayPalSellerRestApiCredentialsResponse'))
    .authorization(allow => [allow.guest()])
    .handler(a.handler.function(PayPalRetrieveRestCredentialsFunction)),
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
