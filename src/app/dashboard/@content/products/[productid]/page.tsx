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
import { loadChannel3Settings } from "@/lib/channel3-settings";

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
        loadChannel3Settings()
            .then((settings) => {
                if (!settings.brandId) {
                    throw new Error("Select a Channel3 brand in Settings to view products.");
                }
                return getChannel3Product(params.productid, settings.brandId);
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
        return () => {
            active = false;
        };
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
                        {product.imageUrl ? <Link href={product.imageUrl} external>
                            Open image
                        </Link> : <Box>-</Box>}
                    </SpaceBetween>
                    <SpaceBetween size="s">
                        <Box variant="awsui-key-label">Offers</Box>
                        <SpaceBetween size="xs">
                            {product.offers.length
                                ? product.offers.map((offer) => (
                                <Link key={offer.url} href={offer.url} external>
                                    {offer.domain} - {new Intl.NumberFormat("en-US", {
                                        style: "currency",
                                        currency: offer.currency,
                                    }).format(offer.price)}
                                </Link>
                                ))
                                : <Box>No offers available.</Box>}
                        </SpaceBetween>
                    </SpaceBetween>
                </ColumnLayout>
            </Container>
        </SpaceBetween>
    );
}
