import { defineFunction } from "@aws-amplify/backend";

export const GetProductByIdApiFunction = defineFunction({
  name: "api-get-product-by-id",
  entry: './handler.ts',
  environment: {
    CHANNEL3APIKEY: `${process.env.PLATFORM_CHANNEL3_APIKEY}`,
    NANGO_APIKEY: `${process.env.NANGO_APIKEY}`
  }
});