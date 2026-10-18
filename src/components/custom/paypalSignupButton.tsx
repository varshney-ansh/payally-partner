"use client";

import { SpaceBetween } from "@cloudscape-design/components";
import Script from "next/script";
import { useEffect, useState } from "react";

declare global {
    interface Window {
        onboardedCallback?: (authCode: string, sharedId: string) => Promise<void>;
    }
}

function PayPalIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24" height="24" aria-hidden="true">
            <path fill="#001C64" d="M37.972 13.82c.107-5.565-4.485-9.837-10.799-9.837H14.115a1.278 1.278 0 0 0-1.262 1.079L7.62 37.758a1.038 1.038 0 0 0 1.025 1.2h7.737l-1.21 7.572a1.038 1.038 0 0 0 1.026 1.2H22.5c.305 0 .576-.11.807-.307.231-.198.269-.471.316-.772l1.85-10.885c.047-.3.2-.69.432-.888.231-.198.433-.306.737-.307H30.5c6.183 0 11.43-4.394 12.389-10.507.678-4.34-1.182-8.287-4.916-10.244Z" />
            <path fill="#0070E0" d="m18.056 26.9-1.927 12.22-1.21 7.664a1.038 1.038 0 0 0 1.026 1.2h6.67a1.278 1.278 0 0 0 1.261-1.079l1.758-11.14a1.277 1.277 0 0 1 1.261-1.078h3.927c6.183 0 11.429-4.51 12.388-10.623.68-4.339-1.504-8.286-5.238-10.244-.01.462-.05.923-.121 1.38-.959 6.112-6.206 10.623-12.389 10.623h-6.145a1.277 1.277 0 0 0-1.261 1.077Z" />
            <path fill="#003087" d="M16.128 39.12h-7.76a1.037 1.037 0 0 1-1.025-1.2l5.232-33.182a1.277 1.277 0 0 1 1.262-1.078h13.337c6.313 0 10.905 4.595 10.798 10.16-1.571-.824-3.417-1.295-5.44-1.295H21.413a1.278 1.278 0 0 0-1.261 1.078L18.057 26.9l-1.93 12.22Z" />
        </svg>
    );
}

export default function PaypalSignupButton({
    sellerNonce,
    referralLink,
}: {
    sellerNonce: string;
    referralLink: string;
}) {
    const [callbackState, setCallbackState] = useState<"idle" | "loading" | "success" | "error">("idle");
    const onboardingUrl = new URL(referralLink);
    onboardingUrl.searchParams.set("displayMode", "minibrowser");
    const ReferralToken = onboardingUrl.searchParams.get("referralToken");

    useEffect(() => {
        const onboardedCallback = async (authCode: string, sharedId: string) => {
            setCallbackState("loading");

            try {
                const response = await fetch("/api/paypal-merchant-onboard-complete", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ authCode, sharedId, sellerToken: sellerNonce, referralToken: ReferralToken }),
                });

                if (!response.ok) {
                    throw new Error(`PayPal onboarding completion failed (${response.status}).`);
                }

                setCallbackState("success");
            } catch (error) {
                console.error("Failed to complete PayPal onboarding.", error);
                setCallbackState("error");
            }
        };

        window.onboardedCallback = onboardedCallback;
        return () => {
            if (window.onboardedCallback === onboardedCallback) {
                delete window.onboardedCallback;
            }
        };
    }, [sellerNonce, ReferralToken]);

    return (
        <SpaceBetween size="xs">
            <a
                href={onboardingUrl.toString()}
                target="_blank"
                rel="noopener noreferrer"
                data-paypal-onboard-complete="onboardedCallback"
                data-paypal-button="true"
                aria-disabled={callbackState === "loading"}
                onClick={(event) => {
                    if (callbackState === "loading") {
                        event.preventDefault();
                    }
                }}
                style={{
                    alignItems: "center",
                    backgroundColor: "#fff",
                    border: "1px solid #8a8a8a",
                    borderRadius: "20px",
                    color: "#001c64",
                    display: "flex",
                    fontWeight: 600,
                    gap: "8px",
                    justifyContent: "center",
                    minHeight: "40px",
                    textDecoration: "none",
                    width: "100%",
                }}
            >
                <PayPalIcon />
                Signup with PayPal
            </a>
            <Script
                id="paypal-js"
                src="https://www.sandbox.paypal.com/webapps/merchantboarding/js/lib/lightbox/partner.js"
                strategy="afterInteractive"
            />
        </SpaceBetween>
    );
}
