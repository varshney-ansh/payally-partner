import {
    Capability,
    CloudFormationClient,
    CreateStackCommand,
    UpdateStackCommand,
    type Parameter,
} from "@aws-sdk/client-cloudformation";
import type { Schema } from "../../data/resource";
import { env } from "$amplify/env/deploy-brand";

// The Lambda execution role is assumed automatically — no static credentials.
const cf = new CloudFormationClient({ region: env.BRAND_STACK_REGION });

export const handler: Schema["deployBrand"]["functionHandler"] = async (event) => {
    const {
        subdomain,
        serviceId,
        listenerRulePriority,
        brandName,
        brandStoreNoun,
        brandVoice,
        brandProductNouns,
        brandCategoryHints,
        paypalMerchantId,
    } = event.arguments;

    const stackName = `BrandMcp-${serviceId}`;

    // Route 53 hosted zone for payally.world. Hardcoded (stable, known value)
    // rather than passed from the event or a secret that resolves empty at runtime.
    const HOSTED_ZONE_ID = "Z0712421J62HNVYUMM0N";

    // Shared Auth0 credentials come from secrets. Guard against empty/unresolved
    // values so we fail with a clear message instead of a cryptic CFN error.
    const auth0ClientId = (env.AUTH0_CLIENT_ID ?? "").trim();
    const auth0ClientSecret = (env.AUTH0_CLIENT_SECRET ?? "").trim();
    if (!auth0ClientId || !auth0ClientSecret) {
        console.error("Auth0 credentials missing from environment", {
            hasClientId: Boolean(auth0ClientId),
            hasClientSecret: Boolean(auth0ClientSecret),
        });
        return {
            status: "ERROR",
            stackName,
            serviceId,
            message:
                "Auth0 credentials are not configured for the deploy function. Set the AUTH0_CLIENT_ID and AUTH0_CLIENT_SECRET secrets and redeploy.",
        };
    }

    // Per-brand parameters come from the arguments; shared parameters
    // (Auth0 credentials) come from secrets via env.
    const parameters: Parameter[] = [
        { ParameterKey: "Subdomain", ParameterValue: subdomain },
        { ParameterKey: "ServiceId", ParameterValue: serviceId },
        { ParameterKey: "ListenerRulePriority", ParameterValue: String(listenerRulePriority) },
        { ParameterKey: "BrandName", ParameterValue: brandName },
        { ParameterKey: "BrandStoreNoun", ParameterValue: brandStoreNoun },
        { ParameterKey: "BrandVoice", ParameterValue: brandVoice },
        { ParameterKey: "BrandProductNouns", ParameterValue: brandProductNouns },
        { ParameterKey: "BrandCategoryHints", ParameterValue: brandCategoryHints },
        { ParameterKey: "PaypalMerchantId", ParameterValue: paypalMerchantId },
        { ParameterKey: "Auth0ClientId", ParameterValue: auth0ClientId },
        { ParameterKey: "Auth0ClientSecret", ParameterValue: auth0ClientSecret },
        { ParameterKey: "HostedZoneId", ParameterValue: HOSTED_ZONE_ID },
    ];

    const commandInput = {
        StackName: stackName,
        TemplateURL: env.BRAND_TEMPLATE_URL,
        Capabilities: [Capability.CAPABILITY_NAMED_IAM],
        Parameters: parameters,
    };

    try {
        // Try to create the stack first.
        await cf.send(new CreateStackCommand(commandInput));
        return { status: "CREATING", stackName, serviceId, message: null };
    } catch (err) {
        const error = err as { name?: string };

        // Stack already exists — update it instead.
        if (error.name === "AlreadyExistsException") {
            try {
                await cf.send(new UpdateStackCommand(commandInput));
                return { status: "UPDATING", stackName, serviceId, message: null };
            } catch (updateErr) {
                const updateError = updateErr as { name?: string; message?: string };
                // CloudFormation throws when the template/params are identical.
                if (
                    updateError.name === "ValidationError" &&
                    updateError.message?.includes("No updates are to be performed")
                ) {
                    return { status: "NO_CHANGES", stackName, serviceId, message: null };
                }
                return {
                    status: "ERROR",
                    stackName,
                    serviceId,
                    message: updateError.message ?? "Failed to update stack",
                };
            }
        }

        return {
            status: "ERROR",
            stackName,
            serviceId,
            message: (error as { message?: string }).message ?? "Failed to create stack",
        };
    }
};
