import { defineFunction } from "@aws-amplify/backend";

export const ExploreProductApiFunction = defineFunction({
  name: "api-explore-product",
  entry: './handler.ts',
  environment: {
    CHANNEL3APIKEY: `${process.env.PLATFORM_CHANNEL3_APIKEY}`,
    NANGO_APIKEY: `${process.env.NANGO_APIKEY}`
  }
});