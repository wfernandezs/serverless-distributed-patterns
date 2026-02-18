import { DynamoDBPersistenceLayer } from "@aws-lambda-powertools/idempotency/dynamodb";
import { IdempotencyConfig } from "@aws-lambda-powertools/idempotency";

export const createIdempotencyConfig = () => {
  // Use default attribute names that Powertools expects
  const persistenceStore = new DynamoDBPersistenceLayer({
    tableName: process.env.IDEMPOTENCY_TABLE!,
  });

  const config = new IdempotencyConfig({
    eventKeyJmesPath: 'headers."x-idempotency-key"',
    // TTL de 10 minutos (600 segundos)
    // Protege contra retries accidentales pero permite nuevas órdenes después
    expiresAfterSeconds: 600,
    // No requerir idempotency key (opcional)
    throwOnNoIdempotencyKey: false,
  });

  return { persistenceStore, config };
};
