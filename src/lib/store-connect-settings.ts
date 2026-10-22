"use client";

import { Amplify } from "aws-amplify";
import { fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import outputs from "../../amplify_outputs.json";

Amplify.configure(outputs, { ssr: true });

const client = generateClient<Schema>();

export interface StoreSettings {
    storeProvider: "channel3" | "shopify" | null;
    channel3brand: string;
    shopifyConnectionId: string;
    shopifyShop: string;
}

async function getPaypalMerchantId(): Promise<string> {
    const attributes = await fetchUserAttributes();
    const merchantId = attributes["custom:custom:paypalMerchId"];
    if (!merchantId) {
        throw new Error("Your account is missing its PayPal merchant ID.");
    }
    return merchantId;
}

export async function loadStoreSettings(): Promise<StoreSettings> {
    const merchantId = await getPaypalMerchantId();
    const { data, errors } = await client.models.StoreMerchantSettings.get(
        { id: merchantId },
        {
            authMode: "userPool",
            selectionSet: ["id", "storeProvider", "channel3brand", "shopifyConnectionId", "shopifyShop"],
        },
    );
    if (errors?.length) {
        throw new Error("Unable to load your store settings.");
    }
    if (!data) {
        return {
            storeProvider: null,
            channel3brand: "",
            shopifyConnectionId: "",
            shopifyShop: "",
        };
    }
    return {
        storeProvider: (data.storeProvider as "channel3" | "shopify" | null) ?? null,
        channel3brand: data.channel3brand ?? "",
        shopifyConnectionId: data.shopifyConnectionId ?? "",
        shopifyShop: data.shopifyShop ?? "",
    };
}

export async function saveChannel3Connection(brandId: string): Promise<void> {
    const normalizedBrandId = brandId.trim();
    if (!normalizedBrandId) {
        throw new Error("Brand ID must not be empty.");
    }

    const merchantId = await getPaypalMerchantId();

    const { data: existing, errors: getErrors } = await client.models.StoreMerchantSettings.get(
        { id: merchantId },
        { authMode: "userPool", selectionSet: ["id"] },
    );
    if (getErrors?.length) {
        throw new Error("Unable to load your store settings.");
    }

    const result = existing
        ? await client.models.StoreMerchantSettings.update(
              { id: merchantId, storeProvider: "channel3", channel3brand: normalizedBrandId },
              { authMode: "userPool" },
          )
        : await client.models.StoreMerchantSettings.create(
              {
                  id: merchantId,
                  paypalMerchantId: merchantId,
                  storeProvider: "channel3",
                  channel3brand: normalizedBrandId,
                  channel3ApiKey: "",
                  shopifyConnectionId: "",
                  shopifyShop: "",
              },
              { authMode: "userPool" },
          );

    if (result.errors?.length) {
        throw new Error("Unable to save your store connection.");
    }
}

export async function saveShopifyConnection(connectionId: string, shopDomain?: string): Promise<void> {
    const normalizedConnectionId = connectionId.trim();
    if (!normalizedConnectionId) {
        throw new Error("Connection ID must not be empty.");
    }

    const merchantId = await getPaypalMerchantId();

    const { data: existing, errors: getErrors } = await client.models.StoreMerchantSettings.get(
        { id: merchantId },
        { authMode: "userPool", selectionSet: ["id"] },
    );
    if (getErrors?.length) {
        throw new Error("Unable to load your store settings.");
    }

    const shopifyFields: Record<string, string> = {
        storeProvider: "shopify",
        shopifyConnectionId: normalizedConnectionId,
    };
    const trimmedShop = shopDomain?.trim();
    if (trimmedShop) {
        shopifyFields.shopifyShop = trimmedShop;
    }

    const result = existing
        ? await client.models.StoreMerchantSettings.update(
              { id: merchantId, ...shopifyFields },
              { authMode: "userPool" },
          )
        : await client.models.StoreMerchantSettings.create(
              {
                  id: merchantId,
                  paypalMerchantId: merchantId,
                  channel3brand: "",
                  channel3ApiKey: "",
                  ...shopifyFields,
              },
              { authMode: "userPool" },
          );

    if (result.errors?.length) {
        throw new Error("Unable to save your Shopify connection.");
    }
}
