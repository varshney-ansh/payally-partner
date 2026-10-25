import type { APIGatewayProxyHandler } from "aws-lambda";
import { Schema } from '../../data/resource';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/api-explore-product';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

export const handler: APIGatewayProxyHandler = async (event) => {
    const queryparams = event.queryStringParameters;
    const query = queryparams?.query || "";
    const merchantid = queryparams?.merchantid;
    const min_price = queryparams?.min_price;
    const max_price = queryparams?.max_price;

    if (!query || !merchantid) {
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
            // 2. Build the filter array dynamically
            const filterParts = [];

            if (query) {
                filterParts.push(query);
            }
            if (min_price !== undefined && min_price !== null && min_price !== "") {
                filterParts.push(`price:>=${min_price}`);
            }
            if (max_price !== undefined && max_price !== null && max_price !== "") {
                filterParts.push(`price:<=${max_price}`);
            }

            // 3. Join filters with a space (Shopify interprets spaces as implicit AND)
            const finalShopifyQuery = filterParts.join(" ").trim();

            const fetchProducts = fetch('https://api.nango.dev/proxy/admin/api/2026-10/graphql.json', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${env.NANGO_APIKEY}`,
                    "Provider-Config-Key": `shopify`,
                    "Connection-Id": `${shopifyConnectionId}`
                },
                body: JSON.stringify({
                    "query": `query GetProducts { products(first: 20, query: "${finalShopifyQuery.replace(/"/g, '\\"')}") { nodes { id title description variants(first: 1) { nodes { price presentmentPrices(first: 1) { nodes { price { currencyCode } } } } } featuredImage { url altText } } } }`
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
            const channel3brand = merchantSettingsData.data?.channel3brand
            const fetchProductsChannel = fetch('https://api.trychannel3.com/v1/search', {
                method: 'POST',
                headers: {
                    "x-api-key": `${env.CHANNEL3APIKEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    "query": `${query}`,
                    "filters": {
                        "brand_ids": [`${channel3brand}`],
                        "price": {
                            "min_price": min_price ? min_price : 0,
                            "max_price": max_price ? max_price : null,
                        }
                    },
                    "limit": 20
                })
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