"use client";

import { useEffect, useRef, useState } from "react";
import { fetchUserAttributes } from "aws-amplify/auth";
import {
    Alert,
    Box,
    Button,
    Container,
    FormField,
    Header,
    Input,
    Select,
    SpaceBetween,
    Spinner,
    StatusIndicator,
    Tiles,
} from "@cloudscape-design/components";
import type { SelectProps } from "@cloudscape-design/components";
import {
    loadStoreSettings,
    saveChannel3Connection,
    saveShopifyConnection,
} from "@/lib/store-connect-settings";
import type { StoreSettings } from "@/lib/store-connect-settings";
import { searchChannel3Brands } from "@/serverActions/channel3";

type PageView = "select" | "configure-channel3" | "configure-shopify";

type Brand = {
    id: string;
    name: string;
    description: string;
};

export default function StoreConnectPage() {
    const [settings, setSettings] = useState<StoreSettings | null>(null);
    const [loadError, setLoadError] = useState("");
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<PageView>("select");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [selectedBrand, setSelectedBrand] = useState<SelectProps.Option | null>(null);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedTile, setSelectedTile] = useState<"channel3" | "shopify" | null>(null);
    const [shopSubdomain, setShopSubdomain] = useState("");
    const merchantIdRef = useRef<string>("");

    useEffect(() => {
        let active = true;
        Promise.all([
            loadStoreSettings(),
            fetchUserAttributes().then(
                (attrs) => (attrs["custom:custom:paypalMerchId"] as string) ?? "",
            ),
        ])
            .then(([storeSettings, merchantId]) => {
                if (!active) return;
                setSettings(storeSettings);
                setSelectedTile(storeSettings.storeProvider);
                merchantIdRef.current = merchantId;
            })
            .catch((err: unknown) => {
                if (active)
                    setLoadError(
                        err instanceof Error ? err.message : "Unable to load store settings.",
                    );
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    // â”€â”€ Brand search â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const loadBrands = async (query: string) => {
        if (query.trim().length < 2) {
            setBrands([]);
            setSearching(false);
            return;
        }
        setSearching(true);
        try {
            const results = await searchChannel3Brands(query);
            setBrands(results);
        } catch {
            setBrands([]);
        } finally {
            setSearching(false);
        }
    };

    // â”€â”€ Save handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const handleSaveChannel3 = async () => {
        if (!selectedBrand?.value) return;
        setSaving(true);
        setSaveError("");
        try {
            await saveChannel3Connection(selectedBrand.value);
            const updated = await loadStoreSettings();
            setSettings(updated);
            setSelectedTile("channel3");
            setView("select");
        } catch (err) {
            setSaveError(
                err instanceof Error ? err.message : "Unable to save Channel3 connection.",
            );
        } finally {
            setSaving(false);
        }
    };

    const handleConnectShopify = async () => {
        setSaving(true);
        setSaveError("");
        try {
            // Fetch a short-lived connect session token from our backend
            const sessionRes = await fetch("/api/nango/session", { method: "POST" });
            if (!sessionRes.ok) {
                const body = (await sessionRes.json()) as { error?: string };
                throw new Error(body.error ?? "Failed to create Nango session.");
            }
            const { token } = (await sessionRes.json()) as { token: string };

            const Nango = (await import("@nangohq/frontend")).default;
            const nango = new Nango({ connectSessionToken: token });
            if (!shopSubdomain.trim()) throw new Error("Enter your Shopify store subdomain.");
            const result = await nango.auth("shopify", { params: { subdomain: shopSubdomain.trim() } });
            // Nango returns the connectionId it generated
            const connectionId = result.connectionId;
            await saveShopifyConnection(connectionId, `${shopSubdomain.trim()}.myshopify.com`);
            const updated = await loadStoreSettings();
            setSettings(updated);
            setSelectedTile("shopify");
            setView("select");
        } catch (err) {
            setSaveError(
                err instanceof Error ? err.message : "Shopify connection failed or was cancelled.",
            );
        } finally {
            setSaving(false);
        }
    };

    // â”€â”€ Derived values â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const brandOptions: SelectProps.Option[] = brands.map((b) => ({
        label: b.name,
        value: b.id,
        description: b.description || undefined,
    }));

    // â”€â”€ Loading / error guards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
                <Header variant="h1">Store Connect</Header>
                <Alert type="error">{loadError}</Alert>
            </SpaceBetween>
        );
    }

    // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const activeProvider = settings?.storeProvider ?? null;
    const otherProvider: "channel3" | "shopify" =
        activeProvider === "channel3" ? "shopify" : "channel3";

    return (
        <SpaceBetween size="l">
            <Header variant="h1">Store Connect</Header>

            {/* â”€â”€ View: select â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {view === "select" && (
                <Container>
                    <SpaceBetween size="m">
                        <Tiles
                            value={selectedTile}
                            onChange={({ detail }) => {
                                setSelectedTile(detail.value as "channel3" | "shopify");
                            }}
                            items={[
                                {
                                    value: "channel3",
                                    label: "Channel3",
                                    description:
                                        settings?.storeProvider === "channel3" ? (
                                            <StatusIndicator type="success">
                                                Connected
                                            </StatusIndicator>
                                        ) : (
                                            "Connect your Channel3 product catalog"
                                        ),
                                },
                                {
                                    value: "shopify",
                                    label: "Shopify",
                                    description:
                                        settings?.storeProvider === "shopify" ? (
                                            <StatusIndicator type="success">
                                                Connected
                                            </StatusIndicator>
                                        ) : (
                                            "Connect your Shopify store via OAuth"
                                        ),
                                },
                            ]}
                        />

                        <SpaceBetween direction="horizontal" size="xs">
                            {!activeProvider ? (
                                <Button
                                    variant="primary"
                                    disabled={!selectedTile}
                                    onClick={() => {
                                        if (selectedTile) setView(`configure-${selectedTile}`);
                                    }}
                                >
                                    Connect
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        onClick={() =>
                                            setView(`configure-${activeProvider}`)
                                        }
                                    >
                                        Reconnect
                                    </Button>
                                    <Button
                                        onClick={() =>
                                            setView(`configure-${otherProvider}`)
                                        }
                                    >
                                        Switch to{" "}
                                        {otherProvider === "channel3" ? "Channel3" : "Shopify"}
                                    </Button>
                                </>
                            )}
                        </SpaceBetween>
                    </SpaceBetween>
                </Container>
            )}

            {/* â”€â”€ View: configure-channel3 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {view === "configure-channel3" && (
                <Container header={<Header variant="h2">Connect Channel3</Header>}>
                    <SpaceBetween size="m">
                        <FormField label="Select your Channel3 brand">
                            <Select
                                selectedOption={selectedBrand}
                                options={brandOptions}
                                filteringType="manual"
                                filteringPlaceholder="Search brands"
                                filteringAriaLabel="Search Channel3 brands"
                                placeholder="Search and select a brand"
                                statusType={searching ? "loading" : "finished"}
                                loadingText="Searching brands"
                                empty="Type at least two characters to search."
                                onLoadItems={({ detail }) =>
                                    void loadBrands(detail.filteringText)
                                }
                                onChange={({ detail }) =>
                                    setSelectedBrand(detail.selectedOption)
                                }
                            />
                        </FormField>

                        {saveError && (
                            <Alert
                                type="error"
                                dismissible
                                onDismiss={() => setSaveError("")}
                            >
                                {saveError}
                            </Alert>
                        )}

                        <SpaceBetween direction="horizontal" size="xs">
                            <Button
                                onClick={() => {
                                    setSaveError("");
                                    setView("select");
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                loading={saving}
                                disabled={!selectedBrand?.value}
                                onClick={() => void handleSaveChannel3()}
                            >
                                Save
                            </Button>
                        </SpaceBetween>
                    </SpaceBetween>
                </Container>
            )}

            {/* ── View: configure-shopify ──────────────────────────────────────────── */}
            {view === "configure-shopify" && (
                <Container header={<Header variant="h2">Connect Shopify</Header>}>
                    <SpaceBetween size="m">
                        <FormField
                            label="Shopify store subdomain"
                            description={
                                <>
                                    Enter the subdomain of your Shopify store. For example, if your
                                    store URL is <b>my-store.myshopify.com</b>, enter{" "}
                                    <b>my-store</b>.
                                </>
                            }
                        >
                            <Input
                                value={shopSubdomain}
                                onChange={({ detail }) => setShopSubdomain(detail.value)}
                                placeholder="my-store"
                                inputMode="text"
                            />
                        </FormField>

                        {saveError && (
                            <Alert
                                type="error"
                                dismissible
                                onDismiss={() => setSaveError("")}
                            >
                                {saveError}
                            </Alert>
                        )}

                        <SpaceBetween direction="horizontal" size="xs">
                            <Button
                                onClick={() => {
                                    setSaveError("");
                                    setShopSubdomain("");
                                    setView("select");
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                loading={saving}
                                disabled={!shopSubdomain.trim()}
                                onClick={() => void handleConnectShopify()}
                            >
                                Connect Shopify
                            </Button>
                        </SpaceBetween>
                    </SpaceBetween>
                </Container>
            )}
        </SpaceBetween>
    );
}



