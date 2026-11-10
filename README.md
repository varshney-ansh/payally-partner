# payally-partner — Partner Portal

> The merchant dashboard for PayAlly. Brands sign up, connect their store, configure their AI storefront identity, and one-click deploy their own branded MCP server — all without writing a line of code.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Part of [payally](https://github.com/varshney-ansh/payally)** — see the umbrella repo for the full architecture.

---

## What This App Does

The Partner Portal is the merchant-facing control plane for PayAlly. It handles:

| Feature | Description |
|---|---|
| **Merchant Onboarding** | PayPal Partner Referrals flow — merchants connect their PayPal account as a third-party partner, enabling `EXPRESS_CHECKOUT` + `ADVANCED_VAULTING` |
| **Store Connection** | Connects the merchant's Shopify store or Channel3 catalog via OAuth (Nango) |
| **Brand Configuration** | Merchant sets brand name, store noun, voice/tone, product nouns, and category hints — these are injected into the MCP server at deploy time |
| **One-Click Deploy** | Triggers an AWS Lambda that provisions a per-brand CloudFormation stack (ECS Fargate container, ALB rule, ElastiCache, ACM, Route 53) |
| **Deploy Status** | Polls CloudFormation stack events and surfaces live deployment progress |
| **Order Management** | Lists and details orders placed through the brand's AI storefront |
| **Customer Vault** | Initiates the PayPal vault setup token flow so customers can authorize one-click repeat checkout |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| Backend | AWS Amplify Gen2 (TypeScript code-first) |
| UI | Cloudscape Design System + custom theme |
| Styling | Tailwind CSS 4 |
| Auth | Amazon Cognito (via Amplify Auth) |
| Data | AWS AppSync + DynamoDB (via Amplify Data) |
| Storage | Amazon S3 (via Amplify Storage) |
| Store integration | Channel3 SDK v4, Shopify OAuth via Nango |
| Payments | PayPal Partner Referrals v2, Vault API v3 |
| Deployment | AWS Amplify Hosting + CloudFormation (per-brand MCP infra) |

---

## Project Structure

```
payally-partner/
├── amplify/
│   ├── backend.ts            # Amplify Gen2 backend definition + CDK customizations
│   ├── auth/                 # Cognito user pool config
│   ├── data/
│   │   └── resource.ts       # AppSync schema: StoreMerchantInfo, CustomerUserData, orders, etc.
│   └── functions/            # Lambda functions
│       ├── api-checkout/              # POST /checkout — creates PayPal order from vaulted token
│       ├── api-explore-product/       # GET /explore-products — catalog search proxy
│       ├── api-get-product-by-id/     # GET /get-product-by-id — product detail proxy
│       ├── api-show-orders/           # POST /show-orders — list buyer orders
│       ├── api-show-order-by-id/      # POST /show-order-by-id — order detail
│       ├── deploy-brand/              # Provisions per-brand CloudFormation stack
│       ├── brand-deploy-status/       # Polls CloudFormation stack events for deploy status
│       ├── generate-paypal-auth-jwt/  # Generates PayPal-Auth-Assertion JWT for partner API calls
│       ├── paypal-platform-access-token/    # Fetches PayPal platform-level OAuth token (cached 8h)
│       ├── paypal-merchant-onboard-token/   # Exchanges merchant auth code for access token
│       └── paypal-retrieve-rest-credentials/ # Retrieves merchant REST API credentials
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── api/
│   │   │   └── paypal-merchant-onboard-setup/  # OAuth callback — saves onboarding status
│   │   │   └── authorize/users/paypal/         # Customer vault authorization callback
│   │   └── (dashboard)/      # Authenticated merchant dashboard pages
│   ├── components/           # React UI components (Cloudscape-based)
│   │   ├── landing/          # Public landing page
│   │   └── dashboard/        # Merchant dashboard panels
│   ├── lib/
│   │   └── merchant-account.ts  # Helpers to load merchant onboarding + PayPal account state
│   ├── serverActions/
│   │   └── paypal.ts         # Server Actions: partner referral link, vault tokens, onboarding status
│   ├── utils/                # Shared utilities
│   └── middleware.ts         # Route protection (Cognito session check)
├── public/                   # Static assets
├── cloudscape-custom-theme-build.ts  # Builds custom Cloudscape color theme
├── next.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

---

## Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **AWS account** with Amplify Gen2 CLI
- **PayPal Developer account** — create a free sandbox at [developer.paypal.com](https://developer.paypal.com/)
- **Nango** account — for Shopify OAuth integration
- **Channel3** API key — for demo store integration

---

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in all values:

```env
# PayPal
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com   # sandbox; use api-m.paypal.com for production

# PayAlly platform
PAYALLY_PLATFORM_BASE_URL=https://payally.world    # base URL for OAuth callbacks
PAYALLY_PARTNER_ATTRIBUTION_ID=your_bn_code        # PayPal Partner Attribution (BN code)
PAYALLY_PARTNER_MERCHANT_ID=your_platform_merchant_id

# Integrations
PLATFORM_CHANNEL3_APIKEY=your_channel3_api_key
NANGO_APIKEY=your_nango_api_key
```

### 3. Connect to Amplify backend

```bash
# Pull the latest Amplify outputs (requires AWS credentials)
npx ampx generate outputs --branch main
```

This writes `amplify_outputs.json` which the Next.js app reads at runtime.

### 4. Build the custom Cloudscape theme

```bash
npx tsx cloudscape-custom-theme-build.ts
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Production build

```bash
npm run build
npm start
```

---

## Amplify Gen2 Backend

The backend is defined in `amplify/backend.ts` and deployed via Amplify Hosting's CI/CD pipeline. It provisions:

- **Cognito** user pool (auth)
- **AppSync + DynamoDB** (data — merchant info, customer vault records, orders)
- **API Gateway** with Lambda integrations for all storefront API routes
- **Lambda functions** for PayPal operations, brand deploy, and deploy status polling

Key Lambda functions:

| Function | Trigger | Purpose |
|---|---|---|
| `PayPalPlatformAccessTokenFunction` | AppSync query | Returns cached platform-level PayPal OAuth token |
| `PayPalMerchantAccessTokenFunction` | AppSync query | Exchanges merchant auth code for access token |
| `getPayPalAuthJWT` | AppSync query | Generates `PayPal-Auth-Assertion` JWT |
| `deployBrandFunction` | AppSync mutation | Provisions per-brand CloudFormation stack |
| `brandDeployStatus` | AppSync query | Polls CloudFormation for live stack status |
| `CheckoutApiFunction` | API Gateway POST | Creates PayPal order from customer's vaulted payment token |

---

## PayPal Integration Modules

### Module 1: Merchant Onboarding (Partner Referrals)
1. Portal calls `fetchPaypalReferalLink()` → `POST /v2/customer/partner-referrals`
2. Merchant completes PayPal signup via the referral URL
3. PayPal redirects to `/api/paypal-merchant-onboard-setup` with `merchant_id`
4. Portal calls `merchantOnboardingStatus()` and saves the result

### Module 2: Customer Vault (Advanced Vaulting)
1. Portal calls `getUserPaymentAuthorizeLink()` → `POST /v3/vault/setup-tokens`
2. Customer authorizes PayAlly to vault their PayPal account
3. PayPal redirects to `/api/authorize/users/paypal`
4. Portal calls `createPaypalPaymentToken()` → `POST /v3/vault/payment-tokens`
5. Vaulted token stored in DynamoDB, linked to `customerEmail + merchantId`

### Module 3: Checkout
- `api-checkout` Lambda looks up the vaulted payment token by `email + merchantId`
- Creates a PayPal order using the vaulted token — no customer redirect required
- Order confirmed and stored in DynamoDB

---

## Testing Instructions for Judges

Log in, navigate to the dashboard, and you'll see the fully configured demo store with connected Channel3 integration, deployed MCP endpoint, and order history.

To test the customer-facing checkout flow, connect the merchant's MCP endpoint to Claude, ChatGPT, or Gemini and use a PayPal sandbox buyer account.

---

## License

MIT — see [LICENSE](../LICENSE)
