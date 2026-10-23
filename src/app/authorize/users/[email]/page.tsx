import { redirect } from "next/navigation";
import { getUserPaymentAuthorizeLink } from "@/serverActions/paypal";

type Props = {
    params: Promise<{ email: string }>;
    searchParams: Promise<{ state?: string }>;
};

export default async function AuthorizeUsersPayments({ params, searchParams }: Props) {
    const { email } = await params;
    const { state } = await searchParams;
    if(!email || !state ){
        console.error("either email, state or session token missing")
        throw new Error("either email, state or session token missing")
    } 
    const emaildecode = decodeURIComponent(email);
    const res = await getUserPaymentAuthorizeLink({email: emaildecode, state })
    const approvalLink = res.links[1].href
    redirect(approvalLink);

}