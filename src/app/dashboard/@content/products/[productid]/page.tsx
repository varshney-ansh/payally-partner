"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Box,
    BreadcrumbGroup,
    Button,
    ColumnLayout,
    Container,
    Header,
    Link,
    SpaceBetween,
} from "@cloudscape-design/components";
import { getChannel3Product } from "@/serverActions/channel3";
import { getShopifyProduct } from "@/serverActions/shopify";
import { loadStoreSettings } from "@/lib/store-connect-settings";

type Product = Awaited<ReturnType<typeof getChannel3Product>>;

export default function ProductDetailPage() {
    const params = useParams<{ productid: string }>();
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        setIsLoaded(false);
        setProduct(null);
        setError("");

        const productId = decodeURIComponent(params.productid);

        loadStoreSettings()
            .then(async (settings) => {
                if (!settings.storeProvider) {
                    throw new Error("No store connected. Go to Store Connect to set up your connection.");
                }
                if (settings.storeProvider === "channel3") {
                    if (!settings.channel3brand) throw new Error("No Channel3 brand configured.");
                    return getChannel3Product(productId, settings.channel3brand);
                }
                if (!settings.shopifyConnectionId) throw new Error("No Shopify connection found.");
                return getShopifyProduct(settings.shopifyConnectionId, productId);
            })
            .then((result) => {
                if (active) setProduct(result);
            })
            .catch((loadError: unknown) => {
                if (active) {
                    setError(loadError instanceof Error ? loadError.message : "Unable to load this product.");
                }
            })
            .finally(() => {
                if (active) setIsLoaded(true);
            });

        return () => { active = false; };
    }, [params.productid]);

    if (!isLoaded) return null;

    if (!product) {
        return (
            <Container>
                <SpaceBetween size="m">
                    <Header variant="h1">{error ? "Unable to load product" : "Product not found"}</Header>
                    <Box>{error || `No product exists with ID ${params.productid}.`}</Box>
                    <div>
                        <Button onClick={() => router.push("/dashboard/products")}>Back to products</Button>
                    </div>
                </SpaceBetween>
            </Container>
        );
    }

    return (
        <SpaceBetween size="l">
            <BreadcrumbGroup
                items={[
                    { text: "Dashboard", href: "/dashboard" },
                    { text: "Products", href: "/dashboard/products" },
                    { text: product.name, href: `/dashboard/products/${encodeURIComponent(product.id)}` },
                ]}
                ariaLabel="Product navigation"
            />

            <Container
                header={
                    <Header
                        variant="h1"
                        description={`Product ID: ${product.id}`}
                        actions={
                            <Button onClick={() => router.push("/dashboard/products")}>
                                Back to products
                            </Button>
                        }
                    >
                        {product.name}
                    </Header>
                }
            >
                <ColumnLayout columns={2} borders="horizontal">
                    <SpaceBetween size="s">
                        <Box variant="awsui-key-label">Product ID</Box>
                        <Box>{product.id}</Box>
                    </SpaceBetween>
                    <SpaceBetween size="s">
                        <Box variant="awsui-key-label">Category</Box>
                        <Box>{product.category || "-"}</Box>
                    </SpaceBetween>
                    <SpaceBetween size="s">
                        <Box variant="awsui-key-label">Description</Box>
                        <Box>{product.description || "No description available."}</Box>
                    </SpaceBetween>
                    <SpaceBetween size="s">
                        <Box variant="awsui-key-label">Product image</Box>
                        {product.imageUrl ? (
                            <Link href={product.imageUrl} external>Open image</Link>
                        ) : (
                            <Box>-</Box>
                        )}
                    </SpaceBetween>
                    <SpaceBetween size="s">
                        <Box variant="awsui-key-label">Price</Box>
                        <Box>
                            {product.offers[0]
                                ? new Intl.NumberFormat("en-US", {
                                      style: "currency",
                                      currency: product.offers[0].currency,
                                  }).format(product.offers[0].price)
                                : "-"}
                        </Box>
                    </SpaceBetween>
                    {product.offers.length > 0 && product.offers[0].url && (
                        <SpaceBetween size="s">
                            <Box variant="awsui-key-label">Offers</Box>
                            <SpaceBetween size="xs">
                                {product.offers.map((offer) => (
                                    <Link key={offer.url} href={offer.url} external>
                                        {offer.domain} -{" "}
                                        {new Intl.NumberFormat("en-US", {
                                            style: "currency",
                                            currency: offer.currency,
                                        }).format(offer.price)}
                                    </Link>
                                ))}
                            </SpaceBetween>
                        </SpaceBetween>
                    )}
                </ColumnLayout>
            </Container>
        </SpaceBetween>
    );
}
