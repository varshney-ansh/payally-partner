"use client";

import { Amplify } from "aws-amplify";
import { fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import outputs from "../../amplify_outputs.json";

Amplify.configure(outputs, { ssr: true });

const client = generateClient<Schema>();

export interface PayPalCapability {
    name: string;
    status: string;
}

export interface PayPalProduct {
    name: string;
    status: string;
    vettingStatus: string;
    capabilities: PayPalCapability[];
}

export interface PayPalAccount {
    legalName: string;
    primaryEmailConfirmed: boolean | null;
    paymentsReceivable: boolean | null;
    trackingId: string;
    products: PayPalProduct[];
    capabilities: PayPalCapability[];
}

export interface MerchantSignupInfo {
    merchantEmail: string;
    merchantIdInPayPal: string;
    permissionsGranted: boolean | null;
    accountStatus: string;
    consentStatus: string;
    isEmailConfirmed: boolean | null;
}

export interface MerchantProfile {
    email: string;
    paypalMerchantId: string;
}

export async function getMerchantProfile(): Promise<MerchantProfile> {
    const attributes = await fetchUserAttributes();
    return {
        email: attributes.email ?? "—",
        paypalMerchantId: attributes["custom:custom:paypalmerchid"] ?? "—",
    };
}

async function getPaypalMerchantId(): Promise<string> {
    const attributes = await fetchUserAttributes();
    const merchantId = attributes["custom:custom:paypalmerchid"];
    if (!merchantId) {
        throw new Error("Your account is missing its PayPal merchant ID.");
    }
    return merchantId;
}

/** Load the saved PayPal onboarding/capability record for this merchant. */
export async function loadPayPalAccount(): Promise<PayPalAccount | null> {
    const merchantId = await getPaypalMerchantId();
    const { data, errors } = await client.models.MerchantPaypalOAuth.get(
        { id: merchantId },
        { authMode: "identityPool" },
    );
    if (errors?.length) {
        throw new Error("Unable to load your PayPal account details.");
    }
    if (!data) return null;

    const products = (data.products ?? [])
        .filter((p): p is NonNullable<typeof p> => p != null)
        .map((p) => ({
            name: p.name ?? "",
            status: p.status ?? "",
            vettingStatus: p.vettingStatus ?? "",
            capabilities: (p.capabilities ?? [])
                .filter((c): c is NonNullable<typeof c> => c != null)
                .map((c) => ({ name: c.name ?? "", status: c.status ?? "" })),
        }));

    const capabilities = (data.capabilities ?? [])
        .filter((c): c is NonNullable<typeof c> => c != null)
        .map((c) => ({ name: c.name ?? "", status: c.status ?? "" }));

    return {
        legalName: data.legalName ?? "",
        primaryEmailConfirmed: data.primaryEmailConfirmed ?? null,
        paymentsReceivable: data.paymentsReceivable ?? null,
        trackingId: data.trackingId ?? "",
        products,
        capabilities,
    };
}

/** Load the merchant's onboarding/signup record. */
export async function loadMerchantSignupInfo(): Promise<MerchantSignupInfo | null> {
    const merchantId = await getPaypalMerchantId();
    const { data, errors } = await client.models.StoreMerchantInfo.get(
        { id: merchantId },
        { authMode: "identityPool" },
    );
    if (errors?.length) {
        throw new Error("Unable to load your onboarding status.");
    }
    if (!data) return null;

    return {
        merchantEmail: data.merchantId ?? "",
        merchantIdInPayPal: data.merchantIdInPayPal ?? "",
        permissionsGranted: data.permissionsGranted ?? null,
        accountStatus: data.accountStatus ?? "",
        consentStatus: data.consentStatus ?? "",
        isEmailConfirmed: data.isEmailConfirmed ?? null,
    };
}
