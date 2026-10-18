import { Schema } from '../../data/resource';
import { env } from "$amplify/env/generate-paypal-auth-jwt";

export const handler: Schema["getPayPalAuthJWT"]["functionHandler"] = async (event) => {
    // Explicitly type the input parameter as an object (or unknown/any based on your strictness)
    function encodeObjectToBase64(obj: object): string {
        const objectString = JSON.stringify(obj);
        return Buffer
            .from(objectString)
            .toString("base64");
    }

    const clientId: string = `${env.PAYPAL_CLIENT_ID}`;
    const sellerPayerId: string = `${event.arguments.sellerId}`;

    // Define the header shape
    interface JwtHeader {
        alg: string;
    }

    const header: JwtHeader = {
        alg: "none"
    };

    const encodedHeader: string = encodeObjectToBase64(header);

    // Define the payload shape (making optional fields explicit if needed)
    interface JwtPayload {
        iss: string;
        payer_id?: string;
        email?: string;
    }

    const payload: JwtPayload = {
        iss: clientId,
        payer_id: sellerPayerId
    };

    const encodedPayload: string = encodeObjectToBase64(payload);

    const jwt: string = `${encodedHeader}.${encodedPayload}.`;
    return {jwt};
}