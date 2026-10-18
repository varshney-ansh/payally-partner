import "server-only";

import SignupClient from "./signup-client";
import { fetchPayPalAccessToken, fetchPaypalReferalLink } from "@/serverActions/paypal";

export default async function SignupPage() {
    let paypalSignup: { referralUrl: string; sellerNonce: string } | null = null;

    try {
        const accessToken = await fetchPayPalAccessToken();
        const referral = await fetchPaypalReferalLink({ accessToken });

        paypalSignup = {
            referralUrl: referral.referralUrl,
            sellerNonce: referral.sellerNonce,
        };
    } catch (error) {
        console.error("Failed to prepare PayPal signup.", error);
    }

    return <SignupClient paypalSignup={paypalSignup} />;
}
