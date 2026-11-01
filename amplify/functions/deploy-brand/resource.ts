import { defineFunction, secret } from "@aws-amplify/backend";

export const deployBrandFunction = defineFunction({
    name: "deploy-brand",
    entry: "./handler.ts",
    runtime: 22, // Node.js 22
    timeoutSeconds: 30, // CloudFormation create/update calls return quickly (async stack ops)
    memoryMB: 256,
    environment: {
        // Region the brand stacks are deployed into (ECR image, ElastiCache,
        // and the template bucket all live in eu-west-1).
        BRAND_STACK_REGION: "eu-west-1",
        // Region of the Payally API + usage plan (API Gateway is in eu-north-1).
        PAYALLY_API_REGION: "eu-north-1",
        // Existing usage plan the per-brand API keys are attached to.
        PAYALLY_USAGE_PLAN_ID: "uuepjj",
        // Public S3 URL of the uploaded CloudFormation template.
        BRAND_TEMPLATE_URL: "https://payally-partner-personal-bucket.s3.eu-west-1.amazonaws.com/brandmcptemplate.json",
        // Shared across all brands. Pass secret() references directly — the
        // previous `secret(...) || throw` form coerced the BackendSecret
        // reference and left the value undefined at runtime.
        AUTH0_CLIENT_ID: secret("AUTH0_CLIENT_ID"),
        AUTH0_CLIENT_SECRET: secret("AUTH0_CLIENT_SECRET"),
    },
});
