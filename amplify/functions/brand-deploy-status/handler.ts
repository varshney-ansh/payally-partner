import {
    CloudFormationClient,
    DescribeStacksCommand,
    DescribeStackEventsCommand,
} from "@aws-sdk/client-cloudformation";
import type { Schema } from "../../data/resource";
import { env } from "$amplify/env/brand-deploy-status";

const cf = new CloudFormationClient({ region: env.BRAND_STACK_REGION });

const TERMINAL = new Set([
    "CREATE_COMPLETE",
    "UPDATE_COMPLETE",
    "ROLLBACK_COMPLETE",
    "CREATE_FAILED",
    "UPDATE_FAILED",
    "DELETE_COMPLETE",
    "UPDATE_ROLLBACK_COMPLETE",
]);

const FAILED = new Set([
    "ROLLBACK_COMPLETE",
    "CREATE_FAILED",
    "UPDATE_FAILED",
    "ROLLBACK_FAILED",
    "UPDATE_ROLLBACK_COMPLETE",
    "UPDATE_ROLLBACK_FAILED",
]);

const SUCCESS = new Set(["CREATE_COMPLETE", "UPDATE_COMPLETE"]);

export const handler: Schema["brandDeployStatus"]["functionHandler"] = async (event) => {
    const { serviceId } = event.arguments;
    const stackName = `BrandMcp-${serviceId}`;

    try {
        const [stackRes, eventsRes] = await Promise.all([
            cf.send(new DescribeStacksCommand({ StackName: stackName })),
            cf.send(new DescribeStackEventsCommand({ StackName: stackName })),
        ]);

        const stack = stackRes.Stacks?.[0];
        const status = stack?.StackStatus ?? "UNKNOWN";

        const allEvents = eventsRes.StackEvents ?? [];

        // The root failure is the earliest resource-level *_FAILED event whose
        // reason isn't the generic "cancelled" rollback noise. Events come back
        // newest-first, so scan from the oldest.
        const rootFailure = [...allEvents]
            .reverse()
            .find(
                (e) =>
                    e.ResourceStatus?.endsWith("_FAILED") &&
                    e.LogicalResourceId !== stack?.StackName &&
                    e.ResourceStatusReason &&
                    !/cancelled/i.test(e.ResourceStatusReason),
            );

        // Show the root failure first (when present), then the latest events.
        const latest = allEvents.slice(0, 5);
        const eventSource = rootFailure
            ? [rootFailure, ...latest.filter((e) => e !== rootFailure)].slice(0, 6)
            : latest;

        const events = eventSource.map((e) => ({
            resource: e.LogicalResourceId ?? null,
            type: e.ResourceType ?? null,
            status: e.ResourceStatus ?? null,
            reason: e.ResourceStatusReason ?? null,
            timestamp: e.Timestamp ? e.Timestamp.toISOString() : null,
        }));

        const failureReason = rootFailure?.ResourceStatusReason ?? null;

        // Collect outputs once the stack has settled successfully.
        const outputs: Record<string, string> = {};
        if (SUCCESS.has(status)) {
            for (const o of stack?.Outputs ?? []) {
                if (o.OutputKey && o.OutputValue) {
                    outputs[o.OutputKey] = o.OutputValue;
                }
            }
        }

        // Derive the public MCP URL from the Subdomain parameter.
        const subdomain = (stack?.Parameters ?? []).find(
            (p) => p.ParameterKey === "Subdomain",
        )?.ParameterValue;
        const mcpUrl = subdomain ? `https://${subdomain}.${env.MCP_BASE_DOMAIN}` : null;

        return {
            stackName,
            status,
            done: TERMINAL.has(status),
            failed: FAILED.has(status),
            events,
            mcpUrl,
            outputs,
            failureReason,
        };
    } catch (err) {
        const error = err as { name?: string };
        // Stack not created yet.
        if (error.name === "ValidationError") {
            return {
                stackName,
                status: "NOT_FOUND",
                done: false,
                failed: false,
                events: [],
                mcpUrl: null,
                outputs: {},
                failureReason: null,
            };
        }
        throw err;
    }
};
