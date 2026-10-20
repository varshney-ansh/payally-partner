import { signOut } from "aws-amplify/auth";
import { NextRequest, NextResponse } from "next/server";
import { runWithAmplifyServerContext } from "@/utils/amplify-utils";

export async function GET(request: NextRequest) {
    const response = NextResponse.redirect(new URL("/signin", request.url));

    await runWithAmplifyServerContext({
        nextServerContext: { request, response },
        operation: (contextSpec) => signOut(contextSpec, { global: true }),
    });

    return response;
}
