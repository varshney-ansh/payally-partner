import { redirect } from "next/navigation";
import { jwtVerify } from 'jose';

type Payload = Promise<{
    iat: number,
    iss: string,
    sub: string,
    exp: number,
    name: string,
    pic: string,
    user_id: string,
}>

type Props = {
    params: Promise<{ email: string }>;
    searchParams: Promise<{ state?: string, session_token?: string }>;
};

export default async function AuthorizeUsersPayments({ params, searchParams }: Props) {
    const { email } = await params;
    const { state, session_token } = await searchParams;
    const emaildecode = decodeURIComponent(email);
    const secretString = process.env.PLATFORM_AUTH0_SECRETKEY;
    const secretKey = new TextEncoder().encode(secretString);

    // 4. Verify and decode the JWT token
    const { payload } = await jwtVerify(session_token as string, secretKey, {
      algorithms: ['HS256'],
    });
    console.log({ emaildecode, state, session_token, payload });
    redirect(`${process.env.AUTH0_DOMAIN}/continue?state=${state}`);
}