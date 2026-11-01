"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Alert,
    Box,
    ColumnLayout,
    Container,
    FormField,
    Header,
    Input,
    KeyValuePairs,
    Link,
    SpaceBetween,
    Spinner,
    StatusIndicator,
    Textarea,
    Wizard,
} from "@cloudscape-design/components";
import { loadStoreSettings } from "@/lib/store-connect-settings";
import type { StoreSettings } from "@/lib/store-connect-settings";
import { loadBrandDeployment, saveAndDeployBrand } from "@/lib/mcp-deployment";

const MCP_BASE_DOMAIN = "mcp.payally.world";

// Suggest a subdomain from the brand name: lowercased, alphanumeric + hyphens.
function suggestSubdomain(brandName: string): string {
    const slug = brandName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return slug ? `${slug}-store` : "";
}

const SUBDOMAIN_PATTERN = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/;

export default function McpGetStartedPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [store, setStore] = useState<StoreSettings | null>(null);

    const [activeStep, setActiveStep] = useState(0);
    const [deploying, setDeploying] = useState(false);
    const [deployError, setDeployError] = useState("");

    // Form fields
    const [brandName, setBrandName] = useState("");
    const [subdomain, setSubdomain] = useState("");
    const [subdomainTouched, setSubdomainTouched] = useState(false);
    const [storeNoun, setStoreNoun] = useState("store");
    const [brandVoice, setBrandVoice] = useState("");
    const [productNouns, setProductNouns] = useState("");
    const [categoryHints, setCategoryHints] = useState("");

    useEffect(() => {
        let active = true;
        Promise.all([loadStoreSettings(), loadBrandDeployment()])
            .then(([storeSettings, deployment]) => {
                if (!active) return;
                setStore(storeSettings);
                // Pre-fill from an existing deployment when editing/redeploying.
                if (deployment) {
                    setBrandName(deployment.brandName);
                    setSubdomain(deployment.subdomain);
                    setSubdomainTouched(true);
                    setStoreNoun(deployment.brandStoreNoun || "store");
                    setBrandVoice(deployment.brandVoice);
                    setProductNouns(deployment.brandProductNouns);
                    setCategoryHints(deployment.brandCategoryHints);
                }
            })
            .catch((err: unknown) => {
                if (active) setLoadError(err instanceof Error ? err.message : "Unable to load setup.");
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    // Keep subdomain in sync with brand name until the merchant edits it.
    const handleBrandNameChange = (value: string) => {
        setBrandName(value);
        if (!subdomainTouched) {
            setSubdomain(suggestSubdomain(value));
        }
    };

    const storeConnected = Boolean(store?.storeProvider);
    const subdomainValid = SUBDOMAIN_PATTERN.test(subdomain);

    const detailsValid =
        brandName.trim().length > 0 &&
        subdomainValid &&
        storeNoun.trim().length > 0 &&
        brandVoice.trim().length > 0 &&
        productNouns.trim().length > 0 &&
        categoryHints.trim().length > 0;

    const handleDeploy = async () => {
        setDeploying(true);
        setDeployError("");
        try {
            await saveAndDeployBrand({
                subdomain: subdomain.trim(),
                brandName: brandName.trim(),
                brandStoreNoun: storeNoun.trim(),
                brandVoice: brandVoice.trim(),
                brandProductNouns: productNouns.trim(),
                brandCategoryHints: categoryHints.trim(),
            });
            router.push("/dashboard/mcp");
        } catch (err) {
            setDeployError(err instanceof Error ? err.message : "Deployment failed to start.");
            setDeploying(false);
        }
    };

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
                <Header variant="h1">Set up your AI store</Header>
                <Alert type="error">{loadError}</Alert>
            </SpaceBetween>
        );
    }

    return (
        <Wizard
            activeStepIndex={activeStep}
            onNavigate={({ detail }) => {
                // Block advancing past the brand-details step until it's valid.
                if (detail.requestedStepIndex > 1 && !detailsValid) return;
                setActiveStep(detail.requestedStepIndex);
            }}
            onCancel={() => router.push("/dashboard/mcp")}
            onSubmit={() => void handleDeploy()}
            isLoadingNextStep={deploying}
            i18nStrings={{
                stepNumberLabel: (n) => `Step ${n}`,
                collapsedStepsLabel: (n, total) => `Step ${n} of ${total}`,
                cancelButton: "Cancel",
                previousButton: "Previous",
                nextButton: "Next",
                submitButton: "Deploy AI store",
                optional: "optional",
            }}
            steps={[
                {
                    title: "Before you begin",
                    description:
                        "Your AI store needs a connected product catalog so shoppers can browse and buy.",
                    content: (
                        <Container header={<Header variant="h2">Prerequisites</Header>}>
                            <SpaceBetween size="m">
                                <KeyValuePairs
                                    columns={1}
                                    items={[
                                        {
                                            label: "Connected store",
                                            value: storeConnected ? (
                                                <StatusIndicator type="success">
                                                    Connected ({store?.storeProvider})
                                                </StatusIndicator>
                                            ) : (
                                                <StatusIndicator type="warning">
                                                    Not connected
                                                </StatusIndicator>
                                            ),
                                        },
                                    ]}
                                />
                                {!storeConnected && (
                                    <Alert type="warning" header="Connect a store first">
                                        You haven&apos;t connected a product source yet. Head to{" "}
                                        <Link href="/dashboard/store-connect">Store connections</Link>{" "}
                                        to link Channel3 or Shopify, then come back here.
                                    </Alert>
                                )}
                                <Box variant="p" color="text-body-secondary">
                                    In the next step you&apos;ll describe your brand. We use these
                                    details to give your AI shopping assistant the right personality
                                    and product knowledge.
                                </Box>
                            </SpaceBetween>
                        </Container>
                    ),
                },
                {
                    title: "Describe your brand",
                    description: "Tell us about your brand so your AI assistant sounds like you.",
                    content: (
                        <Container header={<Header variant="h2">Brand details</Header>}>
                            <SpaceBetween size="l">
                                <FormField
                                    label="Brand name"
                                    description="The display name shoppers will see."
                                >
                                    <Input
                                        value={brandName}
                                        onChange={({ detail }) => handleBrandNameChange(detail.value)}
                                        placeholder="Nike"
                                    />
                                </FormField>

                                <FormField
                                    label="Store address"
                                    description="Pick the web address for your AI store. Letters, numbers and hyphens only."
                                    errorText={
                                        subdomain && !subdomainValid
                                            ? "Use lowercase letters, numbers and hyphens (3–63 characters)."
                                            : undefined
                                    }
                                    constraintText={
                                        subdomainValid
                                            ? `Your store will be live at ${subdomain}.${MCP_BASE_DOMAIN}`
                                            : undefined
                                    }
                                >
                                    <Input
                                        value={subdomain}
                                        onChange={({ detail }) => {
                                            setSubdomainTouched(true);
                                            setSubdomain(detail.value.toLowerCase());
                                        }}
                                        placeholder="nike-store"
                                    />
                                </FormField>

                                <FormField
                                    label="What do you call your store?"
                                    description="A single word used in conversation, e.g. store, boutique, shop."
                                >
                                    <Input
                                        value={storeNoun}
                                        onChange={({ detail }) => setStoreNoun(detail.value)}
                                        placeholder="store"
                                    />
                                </FormField>

                                <FormField
                                    label="Brand voice"
                                    description="Describe the tone your assistant should use, in a sentence or two."
                                >
                                    <Textarea
                                        value={brandVoice}
                                        onChange={({ detail }) => setBrandVoice(detail.value)}
                                        placeholder="Athletic, performance-driven, premium. Confident but friendly."
                                        rows={3}
                                    />
                                </FormField>

                                <FormField
                                    label="What do you sell?"
                                    description="Comma-separated product types. This helps the assistant talk about your range."
                                >
                                    <Input
                                        value={productNouns}
                                        onChange={({ detail }) => setProductNouns(detail.value)}
                                        placeholder="sneakers, running shoes, training gear"
                                    />
                                </FormField>

                                <FormField
                                    label="Category hints"
                                    description="Comma-separated categories shoppers might ask for."
                                >
                                    <Input
                                        value={categoryHints}
                                        onChange={({ detail }) => setCategoryHints(detail.value)}
                                        placeholder="Athletic Shoes, Running, Training"
                                    />
                                </FormField>
                            </SpaceBetween>
                        </Container>
                    ),
                },
                {
                    title: "Review and deploy",
                    description: "Check everything looks right, then launch your AI store.",
                    content: (
                        <SpaceBetween size="l">
                            {deployError && (
                                <Alert type="error" header="Deployment couldn't start">
                                    {deployError}
                                </Alert>
                            )}
                            <Container header={<Header variant="h2">Review</Header>}>
                                <ColumnLayout columns={2} variant="text-grid">
                                    <KeyValuePairs
                                        columns={1}
                                        items={[
                                            { label: "Brand name", value: brandName || "—" },
                                            {
                                                label: "Store address",
                                                value: subdomainValid
                                                    ? `${subdomain}.${MCP_BASE_DOMAIN}`
                                                    : "—",
                                            },
                                            { label: "Store noun", value: storeNoun || "—" },
                                        ]}
                                    />
                                    <KeyValuePairs
                                        columns={1}
                                        items={[
                                            { label: "Brand voice", value: brandVoice || "—" },
                                            { label: "Products", value: productNouns || "—" },
                                            { label: "Categories", value: categoryHints || "—" },
                                        ]}
                                    />
                                </ColumnLayout>
                            </Container>
                            <Box variant="p" color="text-body-secondary">
                                Deploying takes a few minutes. You&apos;ll see live progress on the
                                next screen, and we&apos;ll show your store&apos;s web address once
                                it&apos;s ready.
                            </Box>
                        </SpaceBetween>
                    ),
                },
            ]}
            allowSkipTo={false}
        />
    );
}
