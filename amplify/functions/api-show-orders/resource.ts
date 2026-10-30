import { defineFunction } from "@aws-amplify/backend";

export const ShowOrdersApiFunction = defineFunction({
    name: "api-show-orders",
    entry: './handler.ts',
});
