import { DynamoDBStreamHandler } from "aws-lambda";
import { OutboxEvent } from "../../utils/types/order";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { AttributeValue, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { Logger } from "@aws-lambda-powertools/logger";
import { PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { SFNClient } from "@aws-sdk/client-sfn";

const logger = new Logger({ serviceName: "OutboxProcessor" });

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sfnClient = new SFNClient({});

const OUTBOX_TABLE = process.env.OUTBOX_TABLE!;
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME!;

export const processor: DynamoDBStreamHandler = async (event) => {
  console.log("Processing outbox events:", JSON.stringify(event, null, 2));

  const result = await Promise.allSettled(
    event.Records.map(async (record) => {
      try {
        if (record.eventName !== "INSERT") {
          console.log("Skipping non-insert event:", record.eventName);
          return;
        }

        if (!record.dynamodb?.NewImage) {
          console.warn("No NewImage found in record:", record);
          return;
        }

        const outBoxEvent = unmarshall(
          record.dynamodb.NewImage as Record<string, AttributeValue>,
        ) as OutboxEvent;

        logger.info("Processing outbox event", {
          eventId: outBoxEvent.eventId,
          eventType: outBoxEvent.eventType,
          aggregateId: outBoxEvent.aggregateId,
        });

        if (outBoxEvent.processed) {
          logger.info("Event already processed, skipping", {
            eventId: outBoxEvent.eventId,
          });
          return;
        }

        await eventBrigdgeClient.send(
          new PutEventsCommand({
            Entries: [
              {
                Source: "myapp.orders",
                DetailType: outBoxEvent.eventType,
                Detail: JSON.stringify(outBoxEvent.payload),
                EventBusName: EVENT_BUS_NAME,
              },
            ],
          }),
        );

        logger.info("Event sent to EventBridge", {
          eventId: outBoxEvent.eventId,
          eventType: outBoxEvent.eventType,
        });

        await docClient.send(
          new UpdateCommand({
            TableName: OUTBOX_TABLE,
            Key: { eventId: outBoxEvent.eventId },
            UpdateExpression: "SET processed = :processed",
            ExpressionAttributeValues: {
              ":processed": true,
            },
          }),
        );

        logger.info("Event marked as processed", {
          eventId: outBoxEvent.eventId,
        });
      } catch (error) {
        logger.error("Error processing record", {
          error: error as Error,
          record,
        });
        throw error;
      }
    }),
  );
};
