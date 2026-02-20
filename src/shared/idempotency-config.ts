import { DynamoDBPersistenceLayer } from "@aws-lambda-powertools/idempotency/dynamodb";
import { IdempotencyConfig } from "@aws-lambda-powertools/idempotency";

export const createIdempotencyConfig = () => {
  const persistenceStore = new DynamoDBPersistenceLayer({
    tableName: process.env.IDEMPOTENCY_TABLE!,
  });

  const config = new IdempotencyConfig({
    eventKeyJmesPath: 'headers."x-idempotency-key"',
    // TTL 10 minutes
    expiresAfterSeconds: 600,
    // Disable idempotency
    throwOnNoIdempotencyKey: false,
  });

  return { persistenceStore, config };
};
