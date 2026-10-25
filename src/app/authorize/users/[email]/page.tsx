import { redirect } from "next/navigation";
import { getUserPaymentAuthorizeLink } from "@/serverActions/paypal";

type Props = {
    params: Promise<{ email: string }>;
    searchParams: Promise<{ state?: string, ext_paypal_merchant_id?: string }>;
};

export default async function AuthorizeUsersPayments({ params, searchParams }: Props) {
    const { email } = await params;
    const { state, ext_paypal_merchant_id } = await searchParams;
    if(!email || !state || !ext_paypal_merchant_id){
        console.error("either email, state or session token missing")
        throw new Error("either email, state or session token missing")
    } 
    const emaildecode = decodeURIComponent(email);
    const res = await getUserPaymentAuthorizeLink({email: emaildecode, state, paypalMerchantId: ext_paypal_merchant_id})
    const approvalLink = res.links[1].href
    redirect(approvalLink);

}