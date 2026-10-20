"use client";

import { Amplify } from "aws-amplify";
import { fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import outputs from "../../amplify_outputs.json";

Amplify.configure(outputs, { ssr: true });

const client = generateClient<Schema>();

async function getPaypalMerchantId() {
    const attributes = await fetchUserAttributes();
    const merchantId = attributes["custom:custom:paypalMerchId"];
    if (!merchantId) {
        throw new Error("Your account is missing its PayPal merchant ID.");
    }
    return merchantId;
}

export async function loadChannel3Settings() {
    const merchantId = await getPaypalMerchantId();
    const { data, errors } = await client.models.StoreMerchantSettings.get(
        { id: merchantId },
        { authMode: "userPool", selectionSet: ["id", "channel3brand"] },
    );
    if (errors?.length) {
        throw new Error("Unable to load your Channel3 settings.");
    }
    return {
        brandId: data?.channel3brand || "",
    };
}

export async function storeMerchantChannel3ApiKey(apiKey: string) {
    const normalizedKey = apiKey.trim();
    if (!normalizedKey) {
        throw new Error("Enter a Channel3 API key.");
    }

    const merchantId = await getPaypalMerchantId();
    const { data: existing, errors: getErrors } = await client.models.StoreMerchantSettings.get(
        { id: merchantId },
        { authMode: "userPool", selectionSet: ["id"] },
    );
    if (getErrors?.length) {
        throw new Error("Unable to check your Channel3 settings.");
    }

    const result = existing
        ? await client.models.StoreMerchantSettings.update(
              { id: merchantId, channel3ApiKey: normalizedKey },
              { authMode: "userPool" },
          )
        : await client.models.StoreMerchantSettings.create(
              {
                  id: merchantId,
                  paypalMerchantId: merchantId,
                  channel3ApiKey: normalizedKey,
                  channel3brand: "",
              },
              { authMode: "userPool" },
          );
    if (result.errors?.length) {
        throw new Error("Unable to save your Channel3 API key.");
    }
    return { apiKeyConfigured: true };
}

export async function storeMerchantChannel3Brand(brandId: string) {
    const normalizedBrandId = brandId.trim();
    if (!normalizedBrandId) {
        throw new Error("Select a Channel3 brand.");
    }

    const merchantId = await getPaypalMerchantId();
    const { data: existing, errors: getErrors } = await client.models.StoreMerchantSettings.get(
        { id: merchantId },
        { authMode: "userPool", selectionSet: ["id"] },
    );
    if (getErrors?.length) {
        throw new Error("Unable to load your Channel3 settings.");
    }

    const result = existing
        ? await client.models.StoreMerchantSettings.update(
              { id: merchantId, channel3brand: normalizedBrandId },
              { authMode: "userPool" },
          )
        : await client.models.StoreMerchantSettings.create(
              {
                  id: merchantId,
                  paypalMerchantId: merchantId,
                  channel3brand: normalizedBrandId,
                  channel3ApiKey: "",
              },
              { authMode: "userPool" },
          );
    if (result.errors?.length) {
        throw new Error("Unable to save your Channel3 brand.");
    }
    return { brandId: normalizedBrandId };
}
