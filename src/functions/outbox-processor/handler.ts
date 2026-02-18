import { DynamoDBStreamHandler } from "aws-lambda";
import { OutboxEvent } from "../../utils/types/order";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { Logger } from "@aws-lambda-powertools/logger";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import { docClient } from "../../utils/db";

const logger = new Logger({ serviceName: "OutboxProcessor" });
const sfnClient = new SFNClient({});

const OUTBOX_TABLE = process.env.OUTBOX_TABLE!;
const STATE_MACHINE_ARN = process.env.STATE_MACHINE_ARN!;

export const processor: DynamoDBStreamHandler = async (event) => {
  logger.info("Processing outbox events:", JSON.stringify(event, null, 2));

  const result = await Promise.allSettled(
    event.Records.map(async (record) => {
      try {
        if (record.eventName !== "INSERT") {
          logger.info("Skipping non-insert event", {
            eventName: record.eventName,
          });
          return;
        }

        if (!record.dynamodb?.NewImage) {
          logger.warn("No NewImage found in record", { record });
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

        const exeuctionName = `${outBoxEvent.aggregateId}-${Date.now()}`;

        await sfnClient.send(
          new StartExecutionCommand({
            stateMachineArn: STATE_MACHINE_ARN,
            name: exeuctionName,
            input: JSON.stringify(outBoxEvent.payload),
          }),
        );

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
