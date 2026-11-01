"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Alert,
    Box,
    Button,
    Container,
    CopyToClipboard,
    Header,
    KeyValuePairs,
    Link,
    SpaceBetween,
    Spinner,
    StatusIndicator,
    Table,
} from "@cloudscape-design/components";
import type { StatusIndicatorProps } from "@cloudscape-design/components";
import {
    fetchBrandDeployStatus,
    loadBrandDeployment,
    persistDeploymentStatus,
} from "@/lib/mcp-deployment";
import type { BrandDeployment, BrandDeployStatus } from "@/lib/mcp-deployment";

const POLL_INTERVAL_MS = 5000;

const STATUS_LABELS: Record<string, string> = {
    NOT_FOUND: "Queued",
    QUEUED: "Queued",
    CREATE_IN_PROGRESS: "Creating your store…",
    CREATE_COMPLETE: "Live",
    UPDATE_IN_PROGRESS: "Updating…",
    UPDATE_COMPLETE: "Live",
    ROLLBACK_IN_PROGRESS: "Rolling back…",
    ROLLBACK_COMPLETE: "Deployment failed — rolled back",
    CREATE_FAILED: "Deployment failed",
    UPDATE_FAILED: "Update failed",
    UPDATE_ROLLBACK_COMPLETE: "Update failed — rolled back",
    DELETE_IN_PROGRESS: "Removing…",
    DELETE_COMPLETE: "Removed",
};

function indicatorType(status: string, done: boolean, failed: boolean): StatusIndicatorProps.Type {
    if (failed) return "error";
    if (status === "CREATE_COMPLETE" || status === "UPDATE_COMPLETE") return "success";
    if (!done) return "in-progress";
    return "info";
}

export default function McpPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [deployment, setDeployment] = useState<BrandDeployment | null>(null);
    const [live, setLive] = useState<BrandDeployStatus | null>(null);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const persistedTerminal = useRef(false);

    const stopPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const poll = useCallback(
        async (serviceId: string) => {
            try {
                const status = await fetchBrandDeployStatus(serviceId);
                setLive(status);

                if (status.done) {
                    stopPolling();
                    // Persist the final status/outputs once.
                    if (!persistedTerminal.current) {
                        persistedTerminal.current = true;
                        void persistDeploymentStatus(status).catch(() => undefined);
                    }
                }
            } catch {
                // Transient poll error — keep the last known state and retry.
            }
        },
        [stopPolling],
    );

    useEffect(() => {
        let active = true;
        loadBrandDeployment()
            .then((d) => {
                if (!active) return;
                setDeployment(d);
                if (d?.serviceId) {
                    void poll(d.serviceId);
                    intervalRef.current = setInterval(() => void poll(d.serviceId), POLL_INTERVAL_MS);
                }
            })
            .catch((err: unknown) => {
                if (active) setLoadError(err instanceof Error ? err.message : "Unable to load.");
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
            stopPolling();
        };
    }, [poll, stopPolling]);

    if (loading) {
        return (
            <Box textAlign="center" padding="xl">
                <Spinner size="large" />
            </Box>
        );
    }

    if (loadError) {
        return (
            <SpaceBetween size="l">
                <Header variant="h1">AI store</Header>
                <Alert type="error">{loadError}</Alert>
            </SpaceBetween>
        );
    }

    // ── Empty state: no deployment yet ────────────────────────────────────
    if (!deployment) {
        return (
            <SpaceBetween size="l">
                <Header
                    variant="h1"
                    description="Your AI-powered storefront, where shoppers chat with an assistant that knows your brand."
                >
                    AI store
                </Header>
                <Container>
                    <Box textAlign="center" padding="xxl">
                        <SpaceBetween size="m">
                            <Box variant="h2">Set up your AI store</Box>
                            <Box variant="p" color="text-body-secondary">
                                Give shoppers an AI assistant that knows your brand and sells your
                                products. It only takes a few minutes.
                            </Box>
                            <Box>
                                <Button
                                    variant="primary"
                                    onClick={() => router.push("/dashboard/mcp/get-started")}
                                >
                                    Get started
                                </Button>
                            </Box>
                        </SpaceBetween>
                    </Box>
                </Container>
            </SpaceBetween>
        );
    }

    // ── Status view: deployment exists ────────────────────────────────────
    const status = live?.status ?? deployment.status ?? "QUEUED";
    const done = live?.done ?? false;
    const failed = live?.failed ?? false;
    const url = live?.mcpUrl ?? deployment.serviceUrl;
    const isLive = status === "CREATE_COMPLETE" || status === "UPDATE_COMPLETE";

    return (
        <SpaceBetween size="l">
            <Header
                variant="h1"
                description="Your AI-powered storefront, where shoppers chat with an assistant that knows your brand."
                actions={
                    <Button onClick={() => router.push("/dashboard/mcp/get-started")}>
                        Edit and redeploy
                    </Button>
                }
            >
                AI store
            </Header>

            <Container header={<Header variant="h2">Deployment status</Header>}>
                <SpaceBetween size="l">
                    <KeyValuePairs
                        columns={2}
                        items={[
                            {
                                label: "Status",
                                value: (
                                    <StatusIndicator type={indicatorType(status, done, failed)}>
                                        {STATUS_LABELS[status] ?? status}
                                    </StatusIndicator>
                                ),
                            },
                            { label: "Brand", value: deployment.brandName || "—" },
                            {
                                label: "Store address",
                                value:
                                    isLive && url ? (
                                        <SpaceBetween direction="horizontal" size="xs">
                                            <Link href={url} external>
                                                {url}
                                            </Link>
                                            <CopyToClipboard
                                                copyButtonText="Copy"
                                                copyErrorText="Failed to copy"
                                                copySuccessText="Copied"
                                                textToCopy={url}
                                                variant="icon"
                                            />
                                        </SpaceBetween>
                                    ) : url ? (
                                        <Box color="text-body-secondary">{url} (pending)</Box>
                                    ) : (
                                        "—"
                                    ),
                            },
                            { label: "Service ID", value: deployment.serviceId || "—" },
                        ]}
                    />

                    {!done && !isLive && (
                        <Box color="text-body-secondary">
                            <SpaceBetween direction="horizontal" size="xs">
                                <Spinner />
                                <span>
                                    This usually takes a few minutes. You can leave this page — we&apos;ll
                                    keep the status up to date.
                                </span>
                            </SpaceBetween>
                        </Box>
                    )}

                    {failed && (
                        <Alert type="error" header="Deployment failed">
                            {live?.failureReason ||
                                deployment.failureReason ||
                                live?.events.find((e) => e.status?.includes("FAILED"))?.reason ||
                                "Something went wrong during deployment. Try editing your details and redeploying."}
                        </Alert>
                    )}
                </SpaceBetween>
            </Container>

            {live && live.events.length > 0 && (
                <Container header={<Header variant="h2">Recent activity</Header>}>
                    <Table
                        variant="embedded"
                        columnDefinitions={[
                            {
                                id: "resource",
                                header: "Resource",
                                cell: (e) => e.resource ?? "—",
                            },
                            {
                                id: "status",
                                header: "Status",
                                cell: (e) =>
                                    e.status?.includes("FAILED") ? (
                                        <StatusIndicator type="error">{e.status}</StatusIndicator>
                                    ) : e.status?.includes("COMPLETE") ? (
                                        <StatusIndicator type="success">{e.status}</StatusIndicator>
                                    ) : (
                                        <StatusIndicator type="in-progress">
                                            {e.status ?? "—"}
                                        </StatusIndicator>
                                    ),
                            },
                            {
                                id: "reason",
                                header: "Detail",
                                cell: (e) => e.reason ?? "",
                            },
                        ]}
                        items={live.events}
                        empty="No recent events."
                    />
                </Container>
            )}
        </SpaceBetween>
    );
}
