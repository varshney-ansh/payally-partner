import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { PayPalPlatformAccessTokenFunction } from '../functions/paypal-platform-access-token/resource';
import { PayPalMerchantAccessTokenFunction } from '../functions/paypal-merchant-onboard-token/resource';
import { PayPalRetrieveRestCredentialsFunction } from '../functions/paypal-retrieve-rest-credentials/resource';
import { getPayPalAuthJWT } from '../functions/generate-paypal-auth-jwt/resource'
import { ExploreProductApiFunction } from '../functions/api-explore-product/resource';
import { GetProductByIdApiFunction } from '../functions/api-get-product-by-id/resource';
import { CheckoutApiFunction } from '../functions/api-checkout/resource';
import { ShowOrdersApiFunction } from '../functions/api-show-orders/resource';
import { ShowOrderByIdApiFunction } from '../functions/api-show-order-by-id/resource';
import { deployBrandFunction } from '../functions/deploy-brand/resource';
import { brandDeployStatus } from '../functions/brand-deploy-status/resource';

const schema = a.schema({
  CustomerUserData: a.model({
    id: a.id().required(),
    paypalMerchantId: a.string().required(),
    paypalCustomerId: a.string(),
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
  .identifier(['paypalMerchantId', 'id'])
  .authorization(allow => [allow.guest()]),

  OrderItem: a.customType({
    name: a.string(),
    quantity: a.string(),
    unitAmount: a.string(),
    sku: a.string(),
    category: a.string(),
  }),

  Order: a.model({
    id: a.id().required(),
    paypalMerchantId: a.string().required(),
    userEmail: a.string(),
    status: a.string(),
    currencyCode: a.string(),
    itemTotal: a.string(),
    platformFee: a.string(),
    grandTotal: a.string(),
    captureId: a.string(),
    captureStatus: a.string(),
    payerEmail: a.string(),
    payerName: a.string(),
    items: a.ref('OrderItem').array(),
  })
    .identifier(['paypalMerchantId', 'id'])
    .authorization(allow => [allow.guest()]),

  // One record per brand deployment (one MCP server per merchant,
  // keyed by paypalMerchantId).
  BrandDeployment: a
    .model({
      // Identity
      paypalMerchantId: a.string().required(), // partition key — one server per merchant
      serviceId: a.string().required(),        // "a1b2" — matches CFN stack suffix
      subdomain: a.string().required(),        // "adidas-store"
      stackName: a.string().required(),        // "BrandMcp-a1b2"
      serviceUrl: a.string(),                  // "https://adidas-store.mcp.payally.world"

      // Brand config (what was deployed)
      brandName: a.string().required(),
      brandStoreNoun: a.string(),
      brandVoice: a.string(),
      brandProductNouns: a.string(),
      brandCategoryHints: a.string(),
      auth0ClientId: a.string(),
      imageUri: a.string(),
      listenerRulePriority: a.integer(),

      // Deployment status
      status: a.enum([
        "QUEUED",
        "CREATE_IN_PROGRESS",
        "CREATE_COMPLETE",
        "CREATE_FAILED",
        "UPDATE_IN_PROGRESS",
        "UPDATE_COMPLETE",
        "UPDATE_FAILED",
        "ROLLBACK_IN_PROGRESS",
        "ROLLBACK_COMPLETE",
        "DELETE_IN_PROGRESS",
        "DELETE_COMPLETE",
      ]),
      lastEventMessage: a.string(), // latest CFN event reason
      failureReason: a.string(),    // populated on failure
      deployedAt: a.datetime(),     // when CREATE_COMPLETE first hit
      lastUpdatedAt: a.datetime(),  // last status poll timestamp

      // CloudFormation stack outputs (ids/arns) captured once complete
      cfnOutputs: a.json(),

      // Who deployed it
      deployedBy: a.string(), // Amplify user sub / email
    })
    .identifier(['paypalMerchantId'])
    .authorization((allow) => [
      allow.owner(), // deployer can read/write their own
      allow.group("admins").to(["read", "update", "delete"]), // admins see all
    ]),

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

  DeployBrandResponse: a.customType({
    status: a.string(),
    stackName: a.string(),
    serviceId: a.string(),
    message: a.string(),
  }),

  BrandDeployStatusEvent: a.customType({
    resource: a.string(),
    type: a.string(),
    status: a.string(),
    reason: a.string(),
    timestamp: a.string(),
  }),

  BrandDeployStatusResponse: a.customType({
    stackName: a.string(),
    status: a.string(),
    done: a.boolean(),
    failed: a.boolean(),
    events: a.ref('BrandDeployStatusEvent').array(),
    mcpUrl: a.string(),
    outputs: a.json(),
    failureReason: a.string(),
  }),

  deployBrand: a
    .mutation()
    .arguments({
      subdomain: a.string().required(),
      serviceId: a.string().required(),
      listenerRulePriority: a.integer().required(),
      brandName: a.string().required(),
      brandStoreNoun: a.string().required(),
      brandVoice: a.string().required(),
      brandProductNouns: a.string().required(),
      brandCategoryHints: a.string().required(),
      paypalMerchantId: a.string().required(),
    })
    .returns(a.ref('DeployBrandResponse'))
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(deployBrandFunction)),

  brandDeployStatus: a
    .query()
    .arguments({ serviceId: a.string().required() })
    .returns(a.ref('BrandDeployStatusResponse'))
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(brandDeployStatus)),
})
.authorization(allow => [allow.resource(ExploreProductApiFunction), allow.resource(GetProductByIdApiFunction), allow.resource(CheckoutApiFunction), allow.resource(ShowOrdersApiFunction), allow.resource(ShowOrderByIdApiFunction)]);

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
