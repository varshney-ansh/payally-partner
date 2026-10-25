import { createPaypalPaymentToken } from "@/serverActions/paypal";
import { redirect } from "next/navigation";

type Props = {
    searchParams: Promise<{ state: string, approval_token_id: string, approval_session_id: string, ext_paypal_merchant_id: string }>;
};

export default async function AuthorizeUsersPaymentsPaypal({ searchParams }: Props) {
    const { approval_token_id, state, ext_paypal_merchant_id } = await searchParams
    const res = await createPaypalPaymentToken({ paypalSetupToken: approval_token_id,  paypalMerchantId: ext_paypal_merchant_id });
    if(res.status != 200) {
        console.error(`createPaymentToken Error : ${res}`)
    }

    redirect(`${process.env.AUTH0_DOMAIN}/continue?state=${state}&ext_paypal_merchant_id=${ext_paypal_merchant_id}`);

}