"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Alert,
    Box,
    Button,
    CollectionPreferences,
    Header,
    Link,
    Pagination,
    SpaceBetween,
    Table,
    TextFilter,
} from "@cloudscape-design/components";
import { getChannel3Products } from "@/serverActions/channel3";
import { getShopifyProducts } from "@/serverActions/shopify";
import { loadStoreSettings } from "@/lib/store-connect-settings";

type Product = {
    id: string;
    name: string;
    description: string;
    category: string;
    imageUrl: string;
    offers: {
        url: string;
        domain: string;
        price: number;
        currency: string;
        compareAtPrice: number | null;
    }[];
};

function formatCurrency(value: string, currencyCode: string): string {
    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currencyCode,
        }).format(Number(value));
    } catch {
        return `${currencyCode} ${value}`;
    }
}

const initialPreferences = {
    pageSize: 10,
    wrapLines: false,
    stripedRows: false,
    contentDensity: "comfortable" as "comfortable" | "compact",
    contentDisplay: [
        { id: "name", visible: true },
        { id: "description", visible: true },
        { id: "category", visible: true },
        { id: "price", visible: true },
    ],
    stickyColumns: { first: 0, last: 0 },
};

export default function ProductsPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [filteringText, setFilteringText] = useState("");
    const [currentPageIndex, setCurrentPageIndex] = useState(1);
    const [preferences, setPreferences] = useState(initialPreferences);
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        let active = true;
        loadStoreSettings()
            .then(async (settings) => {
                if (!settings.storeProvider) {
                    throw new Error("NO_PROVIDER");
                }
                if (settings.storeProvider === "channel3") {
                    if (!settings.channel3brand) throw new Error("No Channel3 brand configured. Go to Store Connect to set up your connection.");
                    return getChannel3Products(settings.channel3brand);
                }
                // shopify
                if (!settings.shopifyConnectionId) throw new Error("No Shopify connection found. Go to Store Connect to reconnect.");
                return getShopifyProducts(settings.shopifyConnectionId);
            })
            .then((fetchedProducts) => {
                if (active) setProducts(fetchedProducts);
            })
            .catch((error: unknown) => {
                if (active) {
                    setLoadError(error instanceof Error ? error.message : "Unable to load products.");
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    const filteredProducts = useMemo(() => {
        const query = filteringText.trim().toLocaleLowerCase();
        if (!query) return products;

        return products.filter((product) =>
            [
                product.id,
                product.name,
                product.description,
                product.category,
            ].some((value) => value.toLocaleLowerCase().includes(query)),
        );
    }, [filteringText, products]);

    const pageCount = Math.max(1, Math.ceil(filteredProducts.length / preferences.pageSize));
    const pageProducts = filteredProducts.slice(
        (currentPageIndex - 1) * preferences.pageSize,
        currentPageIndex * preferences.pageSize,
    );

    return (
        <>
            {loadError === "NO_PROVIDER" ? (
                <Alert type="info" header="No store connected">
                    Connect a store to load your products.{" "}
                </Alert>
            ) : loadError ? (
                <Alert type="error" header="Unable to load products">
                    {loadError}{" "}
                </Alert>
            ) : null}
            <Table<Product>
                renderAriaLive={({ firstIndex, lastIndex, totalItemsCount }) =>
                    `Displaying products ${firstIndex} to ${lastIndex} of ${totalItemsCount}`
                }
                columnDefinitions={[
                    {
                        id: "name",
                        header: "Product",
                        cell: (item) => (
                            <Link href={`/dashboard/products/${encodeURIComponent(item.id)}`}>
                                {item.name}
                            </Link>
                        ),
                        sortingField: "name",
                        isRowHeader: true,
                    },
                    {
                        id: "description",
                        header: "Description",
                        cell: (item) => item.description,
                        sortingField: "description",
                    },
                    {
                        id: "category",
                        header: "Category",
                        cell: (item) => item.category || "-",
                        sortingField: "category",
                    },
                    {
                        id: "price",
                        header: "Price",
                        cell: (item) => {
                            const offer = item.offers[0];
                            return offer ? formatCurrency(String(offer.price), offer.currency) : "-";
                        },
                        sortingField: "offers.0.price",
                    },
                ]}
                columnDisplay={preferences.contentDisplay}
                enableKeyboardNavigation
                items={pageProducts}
                loadingText="Loading products"
                loading={loading}
                resizableColumns
                stickyColumns={{
                    first: preferences.stickyColumns.first,
                    last: preferences.stickyColumns.last,
                }}
                stickyHeader
                trackBy="id"
                variant="full-page"
                empty={
                    <Box margin={{ vertical: "xs" }} textAlign="center" color="inherit">
                        <SpaceBetween size="m">
                            <b>{filteringText ? "No matching products" : loading ? "Loading products" : "No products"}</b>
                            <Box>
                                {filteringText
                                    ? "Try a different search."
                                    : "Connect a store to see products here."}
                            </Box>
                        </SpaceBetween>
                    </Box>
                }
                filter={
                    <TextFilter
                        filteringPlaceholder="Find products"
                        filteringText={filteringText}
                        onChange={({ detail }) => {
                            setFilteringText(detail.filteringText);
                            setCurrentPageIndex(1);
                        }}
                        countText={`${filteredProducts.length} ${filteredProducts.length === 1 ? "match" : "matches"}`}
                    />
                }
                header={
                    <Header
                        variant="h1"
                        description="Products from your connected store."
                        counter={`(${products.length})`}
                        actions={
                            <SpaceBetween direction="horizontal" size="xs">
                                <Button onClick={() => router.push("/dashboard/store-connect")}>
                                    Store Connect
                                </Button>
                            </SpaceBetween>
                        }
                    >
                        Products
                    </Header>
                }
                pagination={
                    <Pagination
                        currentPageIndex={currentPageIndex}
                        pagesCount={pageCount}
                        onChange={({ detail }) => setCurrentPageIndex(detail.currentPageIndex)}
                    />
                }
                preferences={
                    <CollectionPreferences
                        title="Preferences"
                        confirmLabel="Confirm"
                        cancelLabel="Cancel"
                        preferences={preferences}
                        onConfirm={({ detail }) => {
                            setPreferences({
                                pageSize: detail.pageSize ?? preferences.pageSize,
                                wrapLines: detail.wrapLines ?? preferences.wrapLines,
                                stripedRows: detail.stripedRows ?? preferences.stripedRows,
                                contentDensity: detail.contentDensity ?? preferences.contentDensity,
                                contentDisplay: detail.contentDisplay
                                    ? detail.contentDisplay.map((item) => ({ ...item }))
                                    : preferences.contentDisplay,
                                stickyColumns: {
                                    first: detail.stickyColumns?.first ?? preferences.stickyColumns.first,
                                    last: detail.stickyColumns?.last ?? preferences.stickyColumns.last,
                                },
                            });
                            setCurrentPageIndex(1);
                        }}
                        pageSizePreference={{
                            title: "Page size",
                            options: [
                                { value: 10, label: "10 products" },
                                { value: 20, label: "20 products" },
                            ],
                        }}
                        wrapLinesPreference={{}}
                        stripedRowsPreference={{}}
                        contentDensityPreference={{}}
                        contentDisplayPreference={{
                            options: [
                                { id: "name", label: "Product", alwaysVisible: true },
                                { id: "description", label: "Description" },
                                { id: "category", label: "Category" },
                                { id: "price", label: "Price" },
                            ],
                        }}
                        stickyColumnsPreference={{
                            firstColumns: {
                                title: "Stick first column(s)",
                                description: "Keep the first column(s) visible while horizontally scrolling the table.",
                                options: [
                                    { label: "None", value: 0 },
                                    { label: "First column", value: 1 },
                                ],
                            },
                            lastColumns: {
                                title: "Stick last column",
                                description: "Keep the last column visible while horizontally scrolling the table.",
                                options: [
                                    { label: "None", value: 0 },
                                    { label: "Last column", value: 1 },
                                ],
                            },
                        }}
                    />
                }
            />

        </>
    );
}
