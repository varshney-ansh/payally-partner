import { defineFunction } from "@aws-amplify/backend";

export const brandDeployStatus = defineFunction({
    name: "brand-deploy-status",
    entry: "./handler.ts",
    runtime: 22,
    timeoutSeconds: 10,
    memoryMB: 128,
    environment: {
        BRAND_STACK_REGION: "eu-west-1",
        // Base domain used to build the public MCP URL from the subdomain.
        MCP_BASE_DOMAIN: "mcp.payally.world",
    },
});
