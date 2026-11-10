"use client";

import { Amplify } from "aws-amplify";
import { fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import outputs from "../../amplify_outputs.json";

Amplify.configure(outputs, { ssr: true });

const client = generateClient<Schema>();

export interface OrderLineItem {
    name: string;
    quantity: string;
    unitAmount: string;
    sku: string;
    category: string;
}

export interface MerchantOrder {
    id: string;
    paypalMerchantId: string;
    userEmail: string;
    status: string;
    currencyCode: string;
    itemTotal: string;
    platformFee: string;
    grandTotal: string;
    captureId: string;
    captureStatus: string;
    payerEmail: string;
    payerName: string;
    items: OrderLineItem[];
    createdAt: string;
}

async function getPaypalMerchantId(): Promise<string> {
    const attributes = await fetchUserAttributes();
    const merchantId = attributes["custom:paypalMerchId"];
    if (!merchantId) {
        console.error(
            "[merchant-orders] missing PayPal merchant ID. user attributes present:",
            Object.keys(attributes),
        );
        throw new Error("Your account is missing its PayPal merchant ID.");
    }
    return merchantId;
}

/** Load every order for the signed-in merchant, newest first. */
export async function loadMerchantOrders(): Promise<MerchantOrder[]> {
    const merchantId = await getPaypalMerchantId();

    const all: Schema["Order"]["type"][] = [];
    let nextToken: string | null | undefined;

    // Page through all matching orders.
    do {
        const { data, errors, nextToken: token } = await client.models.Order.list({
            filter: { paypalMerchantId: { eq: merchantId } },
            authMode: "userPool",
            nextToken,
            limit: 200,
        });
        if (errors?.length) {
            // Surface the real AppSync error so failures are diagnosable in
            // the live environment instead of a generic message.
            console.error("[merchant-orders] Order.list errors:", JSON.stringify(errors, null, 2));
            throw new Error(errors.map((e) => e.message).join("; ") || "Unable to load your orders.");
        }
        all.push(...data);
        nextToken = token;
    } while (nextToken);

    return all
        .map((o) => ({
            id: o.id,
            paypalMerchantId: o.paypalMerchantId,
            userEmail: o.userEmail ?? "",
            status: o.status ?? "",
            currencyCode: o.currencyCode ?? "USD",
            itemTotal: o.itemTotal ?? "0.00",
            platformFee: o.platformFee ?? "0.00",
            grandTotal: o.grandTotal ?? "0.00",
            captureId: o.captureId ?? "",
            captureStatus: o.captureStatus ?? "",
            payerEmail: o.payerEmail ?? "",
            payerName: o.payerName ?? "",
            items: (o.items ?? [])
                .filter((it): it is NonNullable<typeof it> => it != null)
                .map((it) => ({
                    name: it.name ?? "",
                    quantity: it.quantity ?? "",
                    unitAmount: it.unitAmount ?? "",
                    sku: it.sku ?? "",
                    category: it.category ?? "",
                })),
            createdAt: o.createdAt ?? "",
        }))
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function formatCurrency(value: string, currencyCode: string): string {
    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currencyCode,
        }).format(Number(value));
    } catch {
        return `${currencyCode} ${value}`;
    }
}

export function formatDate(iso: string): string {
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
