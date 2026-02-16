import {
  IdempotencyConfig,
  makeIdempotent,
} from "@aws-lambda-powertools/idempotency";
import { APIGatewayProxyHandler } from "aws-lambda";
import { createIdempotencyConfig } from "./idempotency-config";
import { LocalIdempotencyConfig } from "../utils/types/idempotency";

export const makeIdempotentHandler = (
  handler: APIGatewayProxyHandler,
  customConfig?: Partial<LocalIdempotencyConfig>,
): APIGatewayProxyHandler => {
  const { persistenceStore, config } = createIdempotencyConfig();
  return makeIdempotent(handler, {
    persistenceStore,
    config: { ...config, ...customConfig } as unknown as IdempotencyConfig,
  });
};
