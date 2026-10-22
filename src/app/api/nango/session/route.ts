import { NextRequest, NextResponse } from "next/server";
import { Nango } from "@nangohq/node";
import { runWithAmplifyServerContext } from "@/utils/amplify-utils";
import { fetchUserAttributes } from "aws-amplify/auth/server";
import { cookies } from "next/headers";

export async function POST() {
    try {
        const apiKey = process.env.NANGO_APIKEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "NANGO_APIKEY is not configured." },
                { status: 500 }
            );
        }

        // Get the merchant's PayPal ID to use as the end-user ID in Nango
        const attributes = await runWithAmplifyServerContext({
            nextServerContext: { cookies },
            operation: (contextSpec) => fetchUserAttributes(contextSpec),
        });
        const merchantId = attributes["custom:custom:paypalMerchId"];
        if (!merchantId) {
            return NextResponse.json(
                { error: "Merchant ID not found on account." },
                { status: 401 }
            );
        }

        const nango = new Nango({ apiKey });
        const session = await nango.createConnectSession({
            end_user: {
                id: merchantId,
                display_name: merchantId,
            },
            allowed_integrations: ["shopify"],
        });

        return NextResponse.json({ token: session.data.token });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
