import { fetchPayPalAccessToken, fetchPaypalReferalLink } from "@/serverActions/paypal";
import Script from "next/script";

export default async function TestPage() {
  const PayPalAccessToken = await fetchPayPalAccessToken();
  const paypalReferralLink = await fetchPaypalReferalLink({ accessToken: JSON.parse(PayPalAccessToken).data.accessToken });
  const sellerNonce = JSON.stringify(paypalReferralLink.sellerNonce);
  
  return (
    <div>
      <h1>PayPal Test Page</h1>
      <Script id="paypal-onboarding-callback" strategy="afterInteractive">
        {`
          window.onboardedCallback = function(authCode, sharedId) {
            fetch('/api/paypal-merchant-onboard-complete', {
              method: 'POST',
              headers: {
                'content-type': 'application/json'
              },
              body: JSON.stringify({ authCode: authCode, sharedId: sharedId, sellerToken: ${sellerNonce} })
            })
              .then(function(res) {
                if (!res.ok) {
                  console.log(res)
                }
                console.log(res);
              })
              .catch(function() {
                alert("Something went wrong!");
              });
          };
        `}
      </Script>
      <a
        target="_blank"
        rel="noopener noreferrer"
        data-paypal-onboard-complete="onboardedCallback"
        href={`${paypalReferralLink.data.links[1].href}&displayMode=minibrowser`}
        data-paypal-button="true"
      >
        Sign up for PayPal
      </a>
      <script id="paypal-js" src="https://www.sandbox.paypal.com/webapps/merchantboarding/js/lib/lightbox/partner.js"></script>
    </div>
  )
}