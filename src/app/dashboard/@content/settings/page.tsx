"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Alert,
    Box,
    Button,
    Container,
    Header,
    KeyValuePairs,
    SpaceBetween,
    Spinner,
    StatusIndicator,
    Table,
} from "@cloudscape-design/components";
import type { StatusIndicatorProps } from "@cloudscape-design/components";
import {
    getMerchantProfile,
    loadMerchantSignupInfo,
    loadPayPalAccount,
} from "@/lib/merchant-account";
import type {
    MerchantProfile,
    MerchantSignupInfo,
    PayPalAccount,
    PayPalCapability,
} from "@/lib/merchant-account";
import { loadBrandDeployment } from "@/lib/mcp-deployment";
import type { BrandDeployment } from "@/lib/mcp-deployment";

function boolIndicator(value: boolean | null, yes: string, no: string) {
    if (value === null) {
        return <StatusIndicator type="pending">Unknown</StatusIndicator>;
    }
    return value ? (
        <StatusIndicator type="success">{yes}</StatusIndicator>
    ) : (
        <StatusIndicator type="warning">{no}</StatusIndicator>
    );
}

function capabilityType(status: string): StatusIndicatorProps.Type {
    const s = status.toUpperCase();
    if (s === "ACTIVE") return "success";
    if (s === "INACTIVE" || s === "DENIED" || s === "REVOKED") return "error";
    if (s === "IN_REVIEW" || s === "PENDING") return "in-progress";
    if (!s) return "pending";
    return "info";
}

export default function SettingsPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [profile, setProfile] = useState<MerchantProfile | null>(null);
    const [paypal, setPaypal] = useState<PayPalAccount | null>(null);
    const [signup, setSignup] = useState<MerchantSignupInfo | null>(null);
    const [brand, setBrand] = useState<BrandDeployment | null>(null);

    useEffect(() => {
        let active = true;
        Promise.all([
            getMerchantProfile(),
            loadPayPalAccount().catch(() => null),
            loadMerchantSignupInfo().catch(() => null),
            loadBrandDeployment().catch(() => null),
        ])
            .then(([p, pp, su, b]) => {
                if (!active) return;
                setProfile(p);
                setPaypal(pp);
                setSignup(su);
                setBrand(b);
            })
            .catch((err: unknown) => {
                if (active)
                    setLoadError(err instanceof Error ? err.message : "Unable to load settings.");
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

    // Flatten product capabilities + top-level capabilities for one table.
    const allCapabilities: PayPalCapability[] = [
        ...(paypal?.capabilities ?? []),
        ...(paypal?.products ?? []).flatMap((p) => p.capabilities),
    ].filter(
        (cap, i, arr) => cap.name && arr.findIndex((c) => c.name === cap.name) === i,
    );

    return (
        <SpaceBetween size="l">
            <Header
                variant="h1"
                description="Manage your PayPal connection, store branding, and account details."
            >
                Settings
            </Header>

            {loadError && (
                <Alert type="error" header="Some settings couldn't load">
                    {loadError}
                </Alert>
            )}

            {/* ── PayPal account ──────────────────────────────────────────── */}
            <Container
                header={
                    <Header
                        variant="h2"
                        description="Your PayPal onboarding status and the capabilities enabled for your account."
                    >
                        PayPal account
                    </Header>
                }
            >
                {paypal || signup ? (
                    <SpaceBetween size="l">
                        <KeyValuePairs
                            columns={3}
                            items={[
                                { label: "Legal name", value: paypal?.legalName || "—" },
                                {
                                    label: "Payments receivable",
                                    value: boolIndicator(
                                        paypal?.paymentsReceivable ?? null,
                                        "Enabled",
                                        "Not yet",
                                    ),
                                },
                                {
                                    label: "Email confirmed",
                                    value: boolIndicator(
                                        paypal?.primaryEmailConfirmed ??
                                            signup?.isEmailConfirmed ??
                                            null,
                                        "Confirmed",
                                        "Unconfirmed",
                                    ),
                                },
                                {
                                    label: "Permissions granted",
                                    value: boolIndicator(
                                        signup?.permissionsGranted ?? null,
                                        "Granted",
                                        "Pending",
                                    ),
                                },
                                {
                                    label: "Account status",
                                    value: signup?.accountStatus || "—",
                                },
                                {
                                    label: "Merchant ID",
                                    value:
                                        signup?.merchantIdInPayPal ||
                                        profile?.paypalMerchantId ||
                                        "—",
                                },
                            ]}
                        />

                        {allCapabilities.length > 0 && (
                            <Table<PayPalCapability>
                                variant="embedded"
                                header={<Header variant="h3">Capabilities</Header>}
                                items={allCapabilities}
                                trackBy="name"
                                columnDefinitions={[
                                    {
                                        id: "name",
                                        header: "Capability",
                                        cell: (c) => c.name,
                                        isRowHeader: true,
                                    },
                                    {
                                        id: "status",
                                        header: "Status",
                                        cell: (c) => (
                                            <StatusIndicator type={capabilityType(c.status)}>
                                                {c.status || "Unknown"}
                                            </StatusIndicator>
                                        ),
                                    },
                                ]}
                                empty="No capabilities reported."
                            />
                        )}
                    </SpaceBetween>
                ) : (
                    <Box color="text-body-secondary">
                        We don&apos;t have your PayPal account details yet. They appear here once
                        your PayPal onboarding finishes.
                    </Box>
                )}
            </Container>

            {/* ── Branding ────────────────────────────────────────────────── */}
            <div id="branding">
                <Container
                    header={
                        <Header
                            variant="h2"
                            description="The name, voice, and product details your AI assistant uses to represent your brand."
                            actions={
                                <Button
                                    onClick={() => router.push("/dashboard/mcp/get-started")}
                                >
                                    Edit branding
                                </Button>
                            }
                        >
                            Branding
                        </Header>
                    }
                >
                    {brand ? (
                        <KeyValuePairs
                            columns={2}
                            items={[
                                { label: "Brand name", value: brand.brandName || "—" },
                                { label: "Store address", value: brand.serviceUrl || "—" },
                                {
                                    label: "What you call your store",
                                    value: brand.brandStoreNoun || "—",
                                },
                                { label: "Brand voice", value: brand.brandVoice || "—" },
                                { label: "Products", value: brand.brandProductNouns || "—" },
                                {
                                    label: "Category hints",
                                    value: brand.brandCategoryHints || "—",
                                },
                            ]}
                        />
                    ) : (
                        <Box color="text-body-secondary">
                            You haven&apos;t set up your AI store branding yet. Deploy your AI store
                            to configure how your assistant represents your brand.
                        </Box>
                    )}
                </Container>
            </div>

            {/* ── Profile ─────────────────────────────────────────────────── */}
            <Container
                header={
                    <Header
                        variant="h2"
                        description="Your account email and PayPal merchant ID."
                    >
                        Profile
                    </Header>
                }
            >
                <SpaceBetween size="l">
                    <KeyValuePairs
                        columns={2}
                        items={[
                            { label: "Email", value: profile?.email || "—" },
                            {
                                label: "PayPal merchant ID",
                                value: profile?.paypalMerchantId || "—",
                            },
                        ]}
                    />
                    <Box>
                        <Button onClick={() => router.push("/signout")}>Sign out</Button>
                    </Box>
                </SpaceBetween>
            </Container>
        </SpaceBetween>
    );
}
