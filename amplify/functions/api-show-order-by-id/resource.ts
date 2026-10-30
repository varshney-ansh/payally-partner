import { defineFunction } from "@aws-amplify/backend";

export const ShowOrderByIdApiFunction = defineFunction({
    name: "api-show-order-by-id",
    entry: './handler.ts',
});
