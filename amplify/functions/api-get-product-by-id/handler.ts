import type { APIGatewayProxyHandler } from "aws-lambda";
import { Schema } from '../../data/resource';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/api-get-product-by-id';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

interface Money {
    amount: number;
    currency: string;
}

interface ProductImage {
    url: string;
    altText?: string;
}

interface ProductVariant {
    id: string;
    title: string;
    price: Money;
    compareAtPrice?: Money;
    image?: ProductImage;
}

interface Product {
    id: string;
    title: string;
    description?: string;
    seller?: string;
    image?: ProductImage;
    images: ProductImage[];
    category?: string;
    price: Money;
    variants: ProductVariant[];
    rating?: { value: number; count: number };
}

function mapShopifyProduct(raw: any): Product {
    const product = raw?.data?.product ?? {};
    const shopCurrency: string =
        product?.variants?.nodes?.[0]?.presentmentPrices?.nodes?.[0]?.price?.currencyCode ?? "USD";

    const variants: ProductVariant[] = (product?.variants?.nodes ?? []).map((v: any) => ({
        id: v.id,
        title: v.title,
        price: { amount: Number(v.price), currency: shopCurrency },
        ...(v.compareAtPrice != null
            ? { compareAtPrice: { amount: Number(v.compareAtPrice), currency: shopCurrency } }
            : {}),
    }));

    const images: ProductImage[] = (product?.media?.nodes ?? [])
        .filter((m: any) => m?.image?.url)
        .map((m: any) => ({ url: m.image.url, altText: m.alt ?? undefined }));

    const mainImage: ProductImage | undefined = product?.featuredImage?.url
        ? { url: product.featuredImage.url, altText: product.featuredImage.altText ?? undefined }
        : images[0];

    return {
        id: product.id,
        title: product.title ?? product?.seo?.title,
        description: product.descriptionHtml ?? product?.seo?.description ?? undefined,
        seller: product.vendor ?? undefined,
        image: mainImage,
        images,
        category: product.productType ?? undefined,
        price: variants[0]?.price ?? { amount: 0, currency: shopCurrency },
        variants,
    };
}

function mapChannel3Product(raw: any): Product {
    const offer = raw?.offers?.[0];
    const offerCurrency: string = offer?.price?.currency ?? "USD";
    const offerPrice: Money = {
        amount: Number(offer?.price?.price ?? 0),
        currency: offerCurrency,
    };

    const images: ProductImage[] = (raw?.images ?? [])
        .filter((img: any) => img?.url)
        .map((img: any) => ({ url: img.url, altText: img.alt_text ?? undefined }));

    const mainImage: ProductImage | undefined =
        (raw?.images ?? []).find((img: any) => img?.is_main_image)
            ? {
                  url: (raw.images.find((img: any) => img.is_main_image)).url,
                  altText: (raw.images.find((img: any) => img.is_main_image)).alt_text ?? undefined,
              }
            : images[0];

    let variants: ProductVariant[];
    if (Array.isArray(raw?.variants) && raw.variants.length > 0) {
        variants = raw.variants.flatMap((option: any) =>
            (option?.values ?? []).map((value: any) => ({
                id: value.product_id,
                title: value.label,
                price: offerPrice,
                ...(value.thumbnail_url ? { image: { url: value.thumbnail_url } } : {}),
            }))
        );
    } else {
        variants = [
            {
                id: raw.id,
                title: raw.title,
                price: offerPrice,
            },
        ];
    }

    return {
        id: raw.id,
        title: raw.title,
        description: raw.description ?? undefined,
        seller: raw?.brands?.[0]?.name ?? undefined,
        image: mainImage,
        images,
        category: raw?.category?.title ?? undefined,
        price: offerPrice,
        variants,
        ...(raw?.ratings
            ? { rating: { value: raw.ratings.value, count: raw.ratings.count } }
            : {}),
    };
}

export const handler: APIGatewayProxyHandler = async (event) => {
    const queryparams = event.queryStringParameters;
    const productId = queryparams?.productId;
    const merchantid = queryparams?.merchantid;

    if (!productId || !merchantid) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing required parameters" }),
        }
    }

    const merchantSettingsData = await client.models.StoreMerchantSettings.get({ id: merchantid });
    const merchantstoreProvider = merchantSettingsData.data?.storeProvider;

    switch (merchantstoreProvider) {
        case "shopify":
            const shopifyConnectionId = merchantSettingsData.data?.shopifyConnectionId
            const fetchProducts = fetch('https://api.nango.dev/proxy/admin/api/2026-10/graphql.json', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${env.NANGO_APIKEY}`,
                    "Provider-Config-Key": `shopify`,
                    "Connection-Id": `${shopifyConnectionId}`
                },
                body: JSON.stringify({
                    "query": "query GetFullProductDetails($ownerId: ID!) { product(id: $ownerId) { id title handle descriptionHtml vendor productType status createdAt tags totalInventory seo { title description } options { id name values } featuredImage { id url altText width height } media(first: 10) { nodes { mediaContentType alt ... on MediaImage { image { url width height } } } } variants(first: 20) { nodes { id title sku price barcode availableForSale inventoryQuantity selectedOptions { name value } } } metafields(first: 10) { edges { node { id namespace key value type } } } } }",
                    "variables": {
                        "ownerId": `${productId}`
                    }
                })
            })

            const shopifyResponse = await fetchProducts;
            const shopifyData = await shopifyResponse.json();

            if (!shopifyResponse.ok || shopifyData?.error) {
                return {
                    statusCode: shopifyData?.error?.code === 'server_error' ? 502 : shopifyResponse.status,
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Headers": "*",
                    },
                    body: JSON.stringify({ error: shopifyData?.error?.message ?? 'Failed to fetch products from Shopify' }),
                };
            }

            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*",
                },
                body: JSON.stringify(mapShopifyProduct(shopifyData)),
            }
            break;

        case "channel3":
            const fetchProductsChannel = fetch(`https://api.trychannel3.com/v1/products/${productId}`, {
                method: 'GET',
                headers: {
                    "x-api-key": `${env.CHANNEL3APIKEY}`,
                    "Content-Type": "application/json",
                },
            })

            const channel3Response = await fetchProductsChannel;
            const channel3Data = await channel3Response.json();

            if (!channel3Response.ok) {
                return {
                    statusCode: channel3Response.status,
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Headers": "*",
                    },
                    body: JSON.stringify({ error: channel3Data?.error ?? 'Failed to fetch products from Channel3' }),
                };
            }

            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*",
                },
                body: JSON.stringify(mapChannel3Product(channel3Data)),
            }
            break;

        default:
            return {
                statusCode: 500,
                body: JSON.stringify({
                    error: "Merchant doesn't have neither shopify nor channel3"
                })
            }
            break;
    }
};