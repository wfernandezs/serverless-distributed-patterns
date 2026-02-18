import { makeIdempotent } from "@aws-lambda-powertools/idempotency";
import { APIGatewayProxyHandler } from "aws-lambda";
import { createIdempotencyConfig } from "./idempotency-config";

export const makeIdempotentHandler = (
  handler: APIGatewayProxyHandler,
): APIGatewayProxyHandler => {
  const { persistenceStore, config } = createIdempotencyConfig();
  return makeIdempotent(handler, {
    persistenceStore,
    config,
  });
};
