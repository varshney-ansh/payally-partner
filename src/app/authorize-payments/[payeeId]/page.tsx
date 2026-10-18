import { merchantOnboardingStatus } from "@/serverActions/paypal";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ payeeId: string }>;
};

export default async function AuthorizePaymentsPage({ params }: Props) {
  const { payeeId } = await params;
  const merchantOnboardingResponse = await merchantOnboardingStatus({merchantId: payeeId});
  if(merchantOnboardingResponse.payments_receivable == true){
     redirect('/dashboard');
  }
    return (
        <div>
            <p>Authorization page</p>
        </div>
    );
}
