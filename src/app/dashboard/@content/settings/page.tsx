"use client";

import { useEffect, useRef, useState } from "react";
import {
    Alert,
    Button,
    Container,
    Form,
    FormField,
    Header,
    Input,
    Select,
    SpaceBetween,
} from "@cloudscape-design/components";
import type { SelectProps } from "@cloudscape-design/components";
import {
    searchChannel3Brands,
} from "@/serverActions/channel3";
import {
    loadChannel3Settings,
    storeMerchantChannel3ApiKey,
    storeMerchantChannel3Brand,
} from "@/lib/channel3-settings";

type Brand = { id: string; name: string; description: string };

export default function SettingsPage() {
    const [apiKey, setApiKey] = useState("");
    const [brandId, setBrandId] = useState("");
    const [brands, setBrands] = useState<Brand[]>([]);
    const [selectedBrand, setSelectedBrand] = useState<SelectProps.Option | null>(null);
    const [loading, setLoading] = useState(true);
    const [savingKey, setSavingKey] = useState(false);
    const [savingBrand, setSavingBrand] = useState(false);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const searchRequestId = useRef(0);

    useEffect(() => {
        let active = true;
        loadChannel3Settings()
            .then((settings) => {
                if (!active) return;
                setBrandId(settings.brandId);
                if (settings.brandId) {
                    setSelectedBrand({
                        label: `Selected brand (${settings.brandId})`,
                        value: settings.brandId,
                    });
                }
            })
            .catch((loadError: unknown) => {
                if (active) {
                    setError(loadError instanceof Error ? loadError.message : "Unable to load settings.");
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    const loadBrands = async (query: string) => {
        const requestId = ++searchRequestId.current;
        if (query.trim().length < 2) {
            setBrands([]);
            setSearching(false);
            return;
        }
        setSearching(true);
        setError("");
        try {
            const results = await searchChannel3Brands(query);
            if (requestId === searchRequestId.current) setBrands(results);
        } catch (searchError) {
            if (requestId === searchRequestId.current) {
                setError(searchError instanceof Error ? searchError.message : "Unable to search brands.");
            }
        } finally {
            if (requestId === searchRequestId.current) setSearching(false);
        }
    };

    const saveApiKey = async () => {
        setSavingKey(true);
        setError("");
        setNotice("");
        try {
            await storeMerchantChannel3ApiKey(apiKey);
            setApiKey("");
            setNotice("Channel3 API key saved.");
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Unable to save the API key.");
        } finally {
            setSavingKey(false);
        }
    };

    const saveBrand = async () => {
        if (!selectedBrand?.value) return;
        setSavingBrand(true);
        setError("");
        setNotice("");
        try {
            const result = await storeMerchantChannel3Brand(selectedBrand.value);
            setBrandId(result.brandId);
            setNotice("Channel3 brand saved. Products will now use this brand.");
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Unable to save the brand.");
        } finally {
            setSavingBrand(false);
        }
    };

    const brandOptions: SelectProps.Option[] = brands.map((brand) => ({
        label: brand.name,
        value: brand.id,
        description: brand.description || undefined,
    }));
    if (brandId && !brandOptions.some((option) => option.value === brandId) && selectedBrand) {
        brandOptions.unshift(selectedBrand);
    }

    return (
        <SpaceBetween size="l">
            <Header key="settings-header" variant="h1">Settings</Header>
            {error && <Alert key="settings-error" type="error" dismissible onDismiss={() => setError("")}>{error}</Alert>}
            {notice && <Alert key="settings-notice" type="success" dismissible onDismiss={() => setNotice("")}>{notice}</Alert>}
            <Container key="channel3-connection" header={<Header variant="h2">Channel3 connection</Header>}>
                <Form
                    actions={
                        <Button variant="primary" onClick={saveApiKey} loading={savingKey} disabled={loading}>
                            Save API key
                        </Button>
                    }
                >
                    <SpaceBetween size="m">
                        <FormField
                            key="channel3-api-key"
                            label="Channel3 API key"
                            description="Enter a merchant Channel3 key to save or replace the existing key. This key is stored for other merchant-specific operations."
                        >
                            <Input
                                type="password"
                                value={apiKey}
                                onChange={({ detail }) => setApiKey(detail.value)}
                                placeholder="Enter API key"
                                autoComplete="new-password"
                            />
                        </FormField>
                        <Alert key="channel3-api-info" type="info">
                            Find or create your merchant API key in your Channel3 account&apos;s developer/API settings. Brand
                            search and catalog requests use the platform Channel3 key configured on the server.
                        </Alert>
                    </SpaceBetween>
                </Form>
            </Container>
            <Container key="channel3-brand" header={<Header variant="h2">Product brand</Header>}>
                <SpaceBetween size="m">
                    <FormField
                        key="channel3-brand-select"
                        label="Channel3 brand"
                        description="Search by brand name, then save the brand whose products should appear in Products."
                    >
                        <Select
                            selectedOption={selectedBrand}
                            options={brandOptions}
                            filteringType="manual"
                            filteringPlaceholder="Search brands"
                            filteringAriaLabel="Search Channel3 brands"
                            placeholder="Search and select a brand"
                            disabled={loading}
                            statusType={searching ? "loading" : "finished"}
                            loadingText="Searching brands"
                            empty="Type at least two characters to search."
                            onLoadItems={({ detail }) => void loadBrands(detail.filteringText)}
                            onChange={({ detail }) => setSelectedBrand(detail.selectedOption)}
                        />
                    </FormField>
                    <div key="channel3-brand-save">
                        <Button
                            variant="primary"
                            onClick={saveBrand}
                            loading={savingBrand}
                            disabled={!selectedBrand?.value || selectedBrand.value === brandId}
                        >
                            Save brand
                        </Button>
                    </div>
                </SpaceBetween>
            </Container>
        </SpaceBetween>
    );
}
