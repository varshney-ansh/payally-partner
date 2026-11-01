"use client";

import { Amplify } from "aws-amplify";
import { fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import outputs from "../../amplify_outputs.json";

Amplify.configure(outputs, { ssr: true });

const client = generateClient<Schema>();

export type DeploymentStatus = NonNullable<Schema["BrandDeployment"]["type"]["status"]>;

export interface BrandDeployment {
    paypalMerchantId: string;
    subdomain: string;
    serviceId: string;
    serviceUrl: string;
    listenerRulePriority: number | null;
    brandName: string;
    brandStoreNoun: string;
    brandVoice: string;
    brandProductNouns: string;
    brandCategoryHints: string;
    stackName: string;
    status: DeploymentStatus | null;
    lastEventMessage: string;
    failureReason: string;
    cfnOutputs: Record<string, string> | null;
}

export interface BrandConfigInput {
    subdomain: string;
    brandName: string;
    brandStoreNoun: string;
    brandVoice: string;
    brandProductNouns: string;
    brandCategoryHints: string;
}

export async function getPaypalMerchantId(): Promise<string> {
    const attributes = await fetchUserAttributes();
    const merchantId = attributes["custom:custom:paypalMerchId"];
    if (!merchantId) {
        throw new Error("Your account is missing its PayPal merchant ID.");
    }
    return merchantId;
}

/** Random 4-char lowercase alphanumeric service id (e.g. "bf85"). */
function generateServiceId(): string {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let id = "";
    for (let i = 0; i < 4; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
}

/**
 * Deterministic ALB listener-rule priority derived from the service id, in the
 * 100–40000 range (avoids 44990, which the template notes is taken).
 */
function priorityFromServiceId(serviceId: string): number {
    let hash = 0;
    for (let i = 0; i < serviceId.length; i++) {
        hash = (hash * 31 + serviceId.charCodeAt(i)) % 39900;
    }
    return 100 + hash;
}

export async function loadBrandDeployment(): Promise<BrandDeployment | null> {
    const merchantId = await getPaypalMerchantId();
    const { data, errors } = await client.models.BrandDeployment.get(
        { paypalMerchantId: merchantId },
        {
            authMode: "userPool",
            selectionSet: [
                "paypalMerchantId",
                "subdomain",
                "serviceId",
                "serviceUrl",
                "listenerRulePriority",
                "brandName",
                "brandStoreNoun",
                "brandVoice",
                "brandProductNouns",
                "brandCategoryHints",
                "stackName",
                "status",
                "lastEventMessage",
                "failureReason",
                "cfnOutputs",
            ],
        },
    );
    if (errors?.length) {
        throw new Error("Unable to load your MCP deployment.");
    }
    if (!data) return null;

    return {
        paypalMerchantId: data.paypalMerchantId ?? merchantId,
        subdomain: data.subdomain ?? "",
        serviceId: data.serviceId ?? "",
        serviceUrl: data.serviceUrl ?? "",
        listenerRulePriority: data.listenerRulePriority ?? null,
        brandName: data.brandName ?? "",
        brandStoreNoun: data.brandStoreNoun ?? "",
        brandVoice: data.brandVoice ?? "",
        brandProductNouns: data.brandProductNouns ?? "",
        brandCategoryHints: data.brandCategoryHints ?? "",
        stackName: data.stackName ?? "",
        status: data.status ?? null,
        lastEventMessage: data.lastEventMessage ?? "",
        failureReason: data.failureReason ?? "",
        cfnOutputs: (data.cfnOutputs as Record<string, string> | null) ?? null,
    };
}

/**
 * Build the MCP client config a merchant can share with their customers so
 * shoppers can add this store to AI client apps (Claude Desktop, Kiro, etc.).
 *
 * The server key is "<subdomain>-payally" and the remote URL is the store's
 * MCP endpoint. The merchant's PayPal merchant ID is passed through as an
 * authorize param so the store attributes payments to this merchant.
 */
export function buildMcpClientConfig(deployment: BrandDeployment): {
    serverKey: string;
    mcpUrl: string;
    config: Record<string, unknown>;
    configJson: string;
} {
    const base = (deployment.serviceUrl || `https://${deployment.subdomain}.mcp.payally.world`).replace(
        /\/+$/,
        "",
    );
    const mcpUrl = `${base}/mcp`;
    const serverKey = `${deployment.subdomain || "store"}-payally`;

    const serverEntry = {
        command: "npx",
        args: [
            "-y",
            "mcp-remote@latest",
            mcpUrl,
            "--allow-http",
            "--authorize-param",
            `ext-paypal_merchant_id=${deployment.paypalMerchantId}`,
        ],
        disabled: false,
    };

    const config = { mcpServers: { [serverKey]: serverEntry } };

    return {
        serverKey,
        mcpUrl,
        config,
        configJson: JSON.stringify(config, null, 2),
    };
}

// Map the deploy mutation's immediate result to a model enum status.
function initialStatusFor(mutationStatus: string): DeploymentStatus {
    switch (mutationStatus) {
        case "CREATING":
            return "CREATE_IN_PROGRESS";
        case "UPDATING":
        case "NO_CHANGES":
            return "UPDATE_IN_PROGRESS";
        default:
            return "QUEUED";
    }
}

/**
 * Save the brand configuration and trigger a CloudFormation deployment.
 * Reuses an existing serviceId/priority on redeploy so resource names stay
 * stable; generates them on first deploy.
 */
export async function saveAndDeployBrand(config: BrandConfigInput): Promise<BrandDeployment> {
    const merchantId = await getPaypalMerchantId();

    const [attributes, existing] = await Promise.all([
        fetchUserAttributes(),
        loadBrandDeployment(),
    ]);
    const deployedBy = attributes.email ?? attributes.sub ?? merchantId;

    const serviceId = existing?.serviceId || generateServiceId();
    const listenerRulePriority =
        existing?.listenerRulePriority ?? priorityFromServiceId(serviceId);

    // Trigger the deployment via the GraphQL mutation.
    const deployResult = await client.mutations.deployBrand(
        {
            subdomain: config.subdomain,
            serviceId,
            listenerRulePriority,
            brandName: config.brandName,
            brandStoreNoun: config.brandStoreNoun,
            brandVoice: config.brandVoice,
            brandProductNouns: config.brandProductNouns,
            brandCategoryHints: config.brandCategoryHints,
            paypalMerchantId: merchantId,
        },
        { authMode: "userPool" },
    );

    if (deployResult.errors?.length) {
        throw new Error(deployResult.errors.map((e) => e.message).join(", "));
    }

    const mutationStatus = deployResult.data?.status ?? "UNKNOWN";
    if (mutationStatus === "ERROR") {
        throw new Error(deployResult.data?.message ?? "Deployment failed to start.");
    }

    const stackName = deployResult.data?.stackName ?? `BrandMcp-${serviceId}`;
    const serviceUrl = `https://${config.subdomain}.mcp.payally.world`;

    const record = {
        paypalMerchantId: merchantId,
        subdomain: config.subdomain,
        serviceId,
        serviceUrl,
        listenerRulePriority,
        brandName: config.brandName,
        brandStoreNoun: config.brandStoreNoun,
        brandVoice: config.brandVoice,
        brandProductNouns: config.brandProductNouns,
        brandCategoryHints: config.brandCategoryHints,
        stackName,
        status: initialStatusFor(mutationStatus),
        lastUpdatedAt: new Date().toISOString(),
        deployedBy,
    };

    const saved = existing
        ? await client.models.BrandDeployment.update(record, { authMode: "userPool" })
        : await client.models.BrandDeployment.create(record, { authMode: "userPool" });

    if (saved.errors?.length) {
        throw new Error("Deployment started, but saving the record failed.");
    }

    return (await loadBrandDeployment())!;
}

export interface BrandDeployStatus {
    stackName: string;
    status: string;
    done: boolean;
    failed: boolean;
    events: {
        resource: string | null;
        type: string | null;
        status: string | null;
        reason: string | null;
        timestamp: string | null;
    }[];
    mcpUrl: string | null;
    outputs: Record<string, string> | null;
    failureReason: string | null;
}

/** Poll live CloudFormation status for the merchant's stack. */
export async function fetchBrandDeployStatus(serviceId: string): Promise<BrandDeployStatus> {
    const result = await client.queries.brandDeployStatus(
        { serviceId },
        { authMode: "userPool" },
    );
    if (result.errors?.length) {
        throw new Error(result.errors.map((e) => e.message).join(", "));
    }
    const data = result.data;
    return {
        stackName: data?.stackName ?? `BrandMcp-${serviceId}`,
        status: data?.status ?? "UNKNOWN",
        done: data?.done ?? false,
        failed: data?.failed ?? false,
        events: (data?.events ?? [])
        .filter((e): e is NonNullable<typeof e> => e != null)
        .map((e) => ({
            resource: e.resource ?? null,
            type: e.type ?? null,
            status: e.status ?? null,
            reason: e.reason ?? null,
            timestamp: e.timestamp ?? null,
        })),
        mcpUrl: data?.mcpUrl ?? null,
        outputs: (data?.outputs as Record<string, string> | null) ?? null,
        failureReason: data?.failureReason ?? null,
    };
}

const MODEL_STATUSES = new Set<DeploymentStatus>([
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
]);

/** Persist the latest known status (and outputs) after polling. */
export async function persistDeploymentStatus(status: BrandDeployStatus): Promise<void> {
    const merchantId = await getPaypalMerchantId();

    // Only persist a status the model enum recognizes; unknown/transient CFN
    // states (e.g. UPDATE_ROLLBACK_IN_PROGRESS) are left as-is.
    const modelStatus = MODEL_STATUSES.has(status.status as DeploymentStatus)
        ? (status.status as DeploymentStatus)
        : undefined;

    const latestEvent = status.events[0];

    await client.models.BrandDeployment.update(
        {
            paypalMerchantId: merchantId,
            ...(modelStatus ? { status: modelStatus } : {}),
            ...(status.mcpUrl ? { serviceUrl: status.mcpUrl } : {}),
            ...(status.outputs ? { cfnOutputs: status.outputs } : {}),
            ...(latestEvent?.reason ? { lastEventMessage: latestEvent.reason } : {}),
            ...(status.failed && (status.failureReason || latestEvent?.reason)
                ? { failureReason: status.failureReason ?? latestEvent?.reason ?? "" }
                : {}),
            ...(status.status === "CREATE_COMPLETE" ? { deployedAt: new Date().toISOString() } : {}),
            lastUpdatedAt: new Date().toISOString(),
        },
        { authMode: "userPool" },
    );
}
