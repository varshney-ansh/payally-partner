import { getMerchantSignupDetails } from "@/serverActions/paypal";
import AuthorizeSignupForm from "./authorize-signup-form";

type Props = {
  params: Promise<{ payeeId: string }>;
};

export default async function AuthorizePaymentsPage({ params }: Props) {
  const { payeeId } = await params;
  const signupDetails = await getMerchantSignupDetails({ paypalMerchantId: payeeId });

  if (!signupDetails) {
    return (
      <main>
        <h1>Unable to start signup</h1>
        <p>
          We couldn&apos;t find the email address associated with this PayPal
          onboarding. Please start the PayPal signup process again.
        </p>
      </main>
    );
  }

  return <AuthorizeSignupForm {...signupDetails} />;
}
