import type { APIGatewayProxyHandler } from "aws-lambda";
import { Schema } from '../../data/resource';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/api-get-product-by-id';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

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
                body: JSON.stringify(shopifyData),
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
                body: JSON.stringify(channel3Data),
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