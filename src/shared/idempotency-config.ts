import { DynamoDBPersistenceLayer } from "@aws-lambda-powertools/idempotency/dynamodb";
import { LocalIdempotencyConfig } from "../utils/types/idempotency";

export const createIdempotencyConfig = () => {
  const persistenceStore = new DynamoDBPersistenceLayer({
    tableName: process.env.IDEMPOTENCY_TABLE_NAME!,
  });

  const config: LocalIdempotencyConfig = {
    eventKeyJmesPath: 'headers."x-idempotency-key"',
    expiresAfterSeconds: 86400,
    throwOnNoIdempotencyKey: false,
  };

  return { persistenceStore, config };
};
