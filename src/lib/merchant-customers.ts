"use client";

import { Amplify } from "aws-amplify";
import { fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import outputs from "../../amplify_outputs.json";

Amplify.configure(outputs, { ssr: true });

const client = generateClient<Schema>();

export interface CustomerShippingAddress {
    name: string;
    addressLineOne: string;
    city: string;
    state: string;
    zip: string;
    country: string;
}

export interface MerchantCustomer {
    id: string;
    paypalMerchantId: string;
    paypalCustomerId: string;
    email: string;
    paymentTokenId: string;
    payerId: string;
    name: string;
    consumerType: string;
    shipping: CustomerShippingAddress | null;
    createdAt: string;
}

async function getPaypalMerchantId(): Promise<string> {
    const attributes = await fetchUserAttributes();
    const merchantId = attributes["custom:custom:paypalMerchId"];
    if (!merchantId) {
        console.error(
            "[merchant-customers] missing PayPal merchant ID. user attributes present:",
            Object.keys(attributes),
        );
        throw new Error("Your account is missing its PayPal merchant ID.");
    }
    return merchantId;
}

/** Load every customer who authorized a PayPal payment method for this merchant. */
export async function loadMerchantCustomers(): Promise<MerchantCustomer[]> {
    const merchantId = await getPaypalMerchantId();

    const all: Schema["CustomerUserData"]["type"][] = [];
    let nextToken: string | null | undefined;

    do {
        const { data, errors, nextToken: token } = await client.models.CustomerUserData.list({
            filter: { paypalMerchantId: { eq: merchantId } },
            authMode: "identityPool",
            nextToken,
            limit: 200,
        });
        if (errors?.length) {
            // Surface the real AppSync error so failures are diagnosable in
            // the live environment instead of a generic message.
            console.error("[merchant-customers] CustomerUserData.list errors:", JSON.stringify(errors, null, 2));
            throw new Error(errors.map((e) => e.message).join("; ") || "Unable to load your customers.");
        }
        all.push(...data);
        nextToken = token;
    } while (nextToken);

    return all
        .map((c) => {
            const shipping = c.shippingAddress;
            const address = shipping?.address;
            const hasShipping = Boolean(
                shipping?.name ||
                    address?.addressLineOne ||
                    address?.city ||
                    address?.country,
            );
            return {
                id: c.id,
                paypalMerchantId: c.paypalMerchantId,
                paypalCustomerId: c.paypalCustomerId ?? "",
                email: c.email ?? "",
                paymentTokenId: c.paymentTokenId ?? "",
                payerId: c.payerId ?? "",
                name: c.name ?? "",
                consumerType: c.consumerType ?? "",
                shipping: hasShipping
                    ? {
                          name: shipping?.name ?? "",
                          addressLineOne: address?.addressLineOne ?? "",
                          city: address?.city ?? "",
                          state: address?.state ?? "",
                          zip: address?.zip ?? "",
                          country: address?.country ?? "",
                      }
                    : null,
                createdAt: c.createdAt ?? "",
            };
        })
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function formatCustomerDate(iso: string): string {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return iso;
    }
}

export function formatShipping(shipping: CustomerShippingAddress | null): string {
    if (!shipping) return "—";
    const parts = [shipping.city, shipping.state, shipping.country].filter(Boolean);
    return parts.length ? parts.join(", ") : "—";
}
