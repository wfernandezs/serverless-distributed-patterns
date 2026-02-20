import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { Logger } from "@aws-lambda-powertools/logger";
import { OrderStatus } from "../types/order";

const logger = new Logger({ serviceName: "db-utils" });

/**
 * Singleton DynamoDB client instance
 * Reused across Lambda invocations for better performance
 */
const dynamoClient = new DynamoDBClient({});

/**
 * DynamoDB Document Client for simplified object operations
 */
export const docClient = DynamoDBDocumentClient.from(dynamoClient);

/**
 * Updates the status of an order in DynamoDB
 * @param orderId - The ID of the order to update
 * @param status - The new status to set
 * @param tableName - The name of the DynamoDB table (defaults to ORDERS_TABLE env var)
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  tableName?: string,
): Promise<void> {
  const ORDERS_TABLE = tableName || process.env.ORDERS_TABLE!;

  await docClient.send(
    new UpdateCommand({
      TableName: ORDERS_TABLE,
      Key: { orderId },
      UpdateExpression: "SET #status = :status, updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": status,
        ":updatedAt": new Date().toISOString(),
      },
    }),
  );

  logger.info("Order status updated", { orderId, status });
}
