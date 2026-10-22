"use server";

import { Nango } from "@nangohq/node";

// Shape returned by the Nango "list-products" action for Shopify
export type ShopifyListProduct = {
    id: string;
    title: string;
    handle?: string;
    description: string;
    vendor?: string;
    productType?: string;
    status?: string;
    tags?: string[];
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string;
};

// Unified Product type shared with the Products page
export type Product = {
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

export async function getShopifyProducts(connectionId: string): Promise<Product[]> {
    const secretKey = process.env.NANGO_APIKEY;
    if (!secretKey) {
        throw new Error(
            "NANGO_APIKEY is not configured on the server. Add it to your environment variables."
        );
    }

    const nango = new Nango({ apiKey: secretKey });

    let rawProducts: ShopifyListProduct[];
    try {
        const response = await nango.triggerAction("shopify", connectionId, "list-products", {});
        rawProducts = (response as { products: ShopifyListProduct[] }).products ?? [];
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to fetch Shopify products via Nango: ${message}`);
    }

    return rawProducts.map((p): Product => ({
        id: String(p.id),
        name: p.title,
        description: p.description || "",
        category: p.productType || "",
        imageUrl: "",   // list-products response does not include media
        offers: [],     // list-products response does not include variants/price
    }));
}

// Shape returned by the Nango "get-product" action for Shopify
export type ShopifyDetailProduct = {
    id: string;
    title: string;
    description?: string;
    handle?: string;
    productType?: string;
    vendor?: string;
    status?: string;
    totalInventory?: number;
    variants?: {
        id: string;
        title: string;
        price: string;
        sku?: string;
        inventoryQuantity?: number;
    }[];
    media?: {
        id: string;
        alt?: string;
        url: string;
    }[];
};

export async function getShopifyProduct(connectionId: string, productId: string): Promise<Product> {
    const secretKey = process.env.NANGO_APIKEY;
    if (!secretKey) {
        throw new Error("NANGO_APIKEY is not configured on the server.");
    }

    const nango = new Nango({ apiKey: secretKey });

    let raw: ShopifyDetailProduct;
    try {
        const response = await nango.triggerAction("shopify", connectionId, "get-product", { id: productId });
        raw = response as ShopifyDetailProduct;
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to fetch Shopify product: ${message}`);
    }

    return {
        id: String(raw.id),
        name: raw.title,
        description: raw.description || "",
        category: raw.productType || "",
        imageUrl: raw.media?.[0]?.url ?? "",
        offers: raw.variants?.[0]
            ? [{
                url: "",
                domain: "",
                price: Number(raw.variants[0].price),
                currency: "USD",
                compareAtPrice: null,
              }]
            : [],
    };
}
