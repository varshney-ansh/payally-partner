"use server";

import { Channel3 } from "@channel3/sdk";

async function getChannel3Client() {
    const apiKey = process.env.PLATFORM_CHANNEL3_APIKEY;
    if (!apiKey) {
        throw new Error("The platform Channel3 API key is not configured on the server.");
    }
    return new Channel3({ apiKey });
}

export async function searchChannel3Brands(query: string) {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) {
        return [];
    }

    const client = await getChannel3Client();
    const result = await client.brands.search({ query: normalizedQuery, limit: 20 });
    return result.brands.map((brand) => ({
        id: brand.id,
        name: brand.name,
        description: brand.description || "",
    }));
}

export async function getChannel3Products(brandId: string) {
    const normalizedBrandId = brandId.trim();
    if (!normalizedBrandId) {
        throw new Error("Select a Channel3 brand in Settings to load products.");
    }

    const client = await getChannel3Client();
    const page = await client.products.browse({
        filters: { brand_ids: [normalizedBrandId] },
        limit: 30,
    });
    const channel3Products = [...page.data];
    let pagesLoaded = 1;
    while (page.hasNextPage() && pagesLoaded < 5) {
        await page.getNextPage();
        channel3Products.push(...page.data);
        pagesLoaded += 1;
    }

    return channel3Products.map((product) => ({
        id: product.id,
        name: product.title,
        description: product.description || "",
        category: product.category?.title || "",
        imageUrl: product.images?.[0]?.url || "",
        offers: (product.offers || []).map((offer) => ({
            url: offer.url,
            domain: offer.domain,
            price: offer.price.price,
            currency: offer.price.currency,
            compareAtPrice: offer.price.compare_at_price ?? null,
        })),
    }));
}

export async function getChannel3Product(productId: string, brandId: string) {
    const normalizedProductId = productId.trim();
    const normalizedBrandId = brandId.trim();
    if (!normalizedProductId || !normalizedBrandId) {
        throw new Error("A product ID and selected brand are required.");
    }

    const client = await getChannel3Client();
    const product = await client.products.retrieve({ product_id: normalizedProductId });
    if (!product.brands?.some((brand) => brand.id === normalizedBrandId)) {
        throw new Error("This product does not belong to your selected Channel3 brand.");
    }
    return {
        id: product.id,
        name: product.title,
        description: product.description || "",
        category: product.category?.title || "",
        imageUrl: product.images?.[0]?.url || "",
        offers: (product.offers || []).map((offer) => ({
            url: offer.url,
            domain: offer.domain,
            price: offer.price.price,
            currency: offer.price.currency,
            compareAtPrice: offer.price.compare_at_price ?? null,
        })),
    };
}
