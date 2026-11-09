"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchUserAttributes } from "aws-amplify/auth";
import {
    Box,
    Button,
    ColumnLayout,
    Container,
    Header,
    KeyValuePairs,
    Link,
    SpaceBetween,
    Spinner,
    StatusIndicator,
} from "@cloudscape-design/components";
import type { StatusIndicatorProps } from "@cloudscape-design/components";
import { loadStoreSettings } from "@/lib/store-connect-settings";
import { loadBrandDeployment } from "@/lib/mcp-deployment";

type StepState = "done" | "current" | "todo";

interface SetupState {
    storeConnected: boolean;
    storeProvider: string | null;
    aiStoreDeployed: boolean;
    aiStoreLive: boolean;
    aiStoreUrl: string;
    merchantId: string;
    merchantEmail: string;
}

const STEP_INDICATOR: Record<StepState, StatusIndicatorProps.Type> = {
    done: "success",
    current: "in-progress",
    todo: "pending",
};

const STEP_LABEL: Record<StepState, string> = {
    done: "Complete",
    current: "Action needed",
    todo: "Not started",
};

export default function OverviewPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [setup, setSetup] = useState<SetupState | null>(null);

    useEffect(() => {
        let active = true;
        Promise.all([
            loadStoreSettings().catch(() => null),
            loadBrandDeployment().catch(() => null),
            fetchUserAttributes().catch(() => ({}) as Record<string, string | undefined>),
        ])
            .then(([store, deployment, rawAttrs]) => {
                if (!active) return;
                const attrs = rawAttrs as Record<string, string | undefined>;
                const status = deployment?.status ?? null;
                const aiStoreLive =
                    status === "CREATE_COMPLETE" || status === "UPDATE_COMPLETE";
                setSetup({
                    storeConnected: Boolean(store?.storeProvider),
                    storeProvider: store?.storeProvider ?? null,
                    aiStoreDeployed: Boolean(deployment),
                    aiStoreLive,
                    aiStoreUrl: deployment?.serviceUrl ?? "",
                    merchantId: attrs["custom:custom:paypalmerchid"] ?? "—",
                    merchantEmail: attrs.email ?? "—",
                });
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    if (loading) {
        return (
            <Box textAlign="center" padding="xl">
                <Spinner size="large" />
            </Box>
        );
    }

    const s = setup!;

    // Determine step states for the guided setup flow.
    const connectState: StepState = s.storeConnected ? "done" : "current";
    const productsState: StepState = !s.storeConnected
        ? "todo"
        : "done";
    const aiStoreState: StepState = !s.storeConnected
        ? "todo"
        : s.aiStoreLive
          ? "done"
          : s.aiStoreDeployed
            ? "current"
            : "current";

    const allDone = connectState === "done" && aiStoreState === "done";

    return (
        <SpaceBetween size="l">
            <Header
                variant="h1"
                description="Connect your store, review your products, and launch an AI shopping assistant for your brand."
            >
                Get started with Payally Partner
            </Header>

            {/* ── Guided setup steps ──────────────────────────────────────────── */}
            <Container
                header={
                    <Header
                        variant="h2"
                        description={
                            allDone
                                ? "Your merchant store is fully configured."
                                : "Complete these steps to configure your merchant store."
                        }
                    >
                        Set up your merchant store
                    </Header>
                }
            >
                <SpaceBetween size="l">
                    <SetupStep
                        index={1}
                        state={connectState}
                        title="Connect a store"
                        description="Link your Channel3 or Shopify catalog so Payally can sync your products."
                        detail={
                            s.storeConnected
                                ? `Connected to ${s.storeProvider}.`
                                : undefined
                        }
                        action={
                            <Button
                                variant={connectState === "current" ? "primary" : "normal"}
                                onClick={() => router.push("/dashboard/store-connect")}
                            >
                                {s.storeConnected ? "Manage connection" : "Connect a store"}
                            </Button>
                        }
                    />

                    <SetupStep
                        index={2}
                        state={productsState}
                        title="Review your products"
                        description="Confirm the products pulled from your connected store look right."
                        action={
                            <Button
                                disabled={!s.storeConnected}
                                onClick={() => router.push("/dashboard/products")}
                            >
                                View products
                            </Button>
                        }
                    />

                    <SetupStep
                        index={3}
                        state={aiStoreState}
                        title="Deploy your AI store"
                        description="Launch an AI shopping assistant that knows your brand and sells your products."
                        detail={
                            s.aiStoreLive && s.aiStoreUrl ? (
                                <Link href={s.aiStoreUrl} external>
                                    {s.aiStoreUrl}
                                </Link>
                            ) : s.aiStoreDeployed ? (
                                "Deployment in progress."
                            ) : undefined
                        }
                        action={
                            <Button
                                variant={aiStoreState === "current" ? "primary" : "normal"}
                                disabled={!s.storeConnected}
                                onClick={() => router.push("/dashboard/mcp")}
                            >
                                {s.aiStoreDeployed ? "View AI store" : "Deploy AI store"}
                            </Button>
                        }
                    />
                </SpaceBetween>
            </Container>

            {/* ── Account + quick links ───────────────────────────────────────── */}
            <ColumnLayout columns={2}>
                <Container header={<Header variant="h2">Merchant account</Header>}>
                    <KeyValuePairs
                        columns={1}
                        items={[
                            { label: "Email", value: s.merchantEmail },
                            { label: "PayPal merchant ID", value: s.merchantId },
                            {
                                label: "Store connection",
                                value: s.storeConnected ? (
                                    <StatusIndicator type="success">
                                        Connected ({s.storeProvider})
                                    </StatusIndicator>
                                ) : (
                                    <StatusIndicator type="pending">
                                        Not connected
                                    </StatusIndicator>
                                ),
                            },
                            {
                                label: "AI store",
                                value: s.aiStoreLive ? (
                                    <StatusIndicator type="success">Live</StatusIndicator>
                                ) : s.aiStoreDeployed ? (
                                    <StatusIndicator type="in-progress">
                                        Deploying
                                    </StatusIndicator>
                                ) : (
                                    <StatusIndicator type="pending">
                                        Not deployed
                                    </StatusIndicator>
                                ),
                            },
                        ]}
                    />
                </Container>

                <Container header={<Header variant="h2">Quick links</Header>}>
                    <SpaceBetween size="s">
                        <Link onFollow={() => router.push("/dashboard/products")}>
                            Products
                        </Link>
                        <Link onFollow={() => router.push("/dashboard/store-connect")}>
                            Store connections
                        </Link>
                        <Link onFollow={() => router.push("/dashboard/transactions")}>
                            Transactions
                        </Link>
                        <Link onFollow={() => router.push("/dashboard/mcp")}>AI store</Link>
                    </SpaceBetween>
                </Container>
            </ColumnLayout>
        </SpaceBetween>
    );
}

// ── Single guided-setup step row ──────────────────────────────────────────
function SetupStep({
    index,
    state,
    title,
    description,
    detail,
    action,
}: {
    index: number;
    state: StepState;
    title: string;
    description: string;
    detail?: React.ReactNode;
    action: React.ReactNode;
}) {
    return (
        <ColumnLayout columns={1} borders="horizontal">
            <Box>
                <SpaceBetween direction="horizontal" size="m">
                    <Box
                        variant="span"
                        fontWeight="bold"
                        color="text-body-secondary"
                        fontSize="heading-m"
                    >
                        {index}
                    </Box>
                    <div style={{ flex: 1 }}>
                        <SpaceBetween size="xxs">
                            <SpaceBetween direction="horizontal" size="s">
                                <Box variant="h3" padding="n">
                                    {title}
                                </Box>
                                <StatusIndicator type={STEP_INDICATOR[state]}>
                                    {STEP_LABEL[state]}
                                </StatusIndicator>
                            </SpaceBetween>
                            <Box variant="p" color="text-body-secondary">
                                {description}
                            </Box>
                            {detail && <Box variant="small">{detail}</Box>}
                            <Box padding={{ top: "xs" }}>{action}</Box>
                        </SpaceBetween>
                    </div>
                </SpaceBetween>
            </Box>
        </ColumnLayout>
    );
}
