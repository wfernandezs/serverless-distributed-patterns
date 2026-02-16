import { DynamoDB } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyHandler } from "aws-lambda";
import { v4 as uuidbv4 } from "uuid";
import { Order, OrderStatus, OutboxEvent } from "../../utils/types/order";
import { EventType } from "../../utils/types/events";
import { makeIdempotentHandler } from "../../shared/idempotent-handler";

const client = new DynamoDB({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);

const ORDERS_TABLE = process.env.ORDERS_TABLE!;
const OUTBOX_TABLE = process.env.OUTBOX_TABLE!;

const createOrderInternal: APIGatewayProxyHandler = async (event) => {
  try {
    // 1. Parse and validate input
    const body = JSON.parse(event.body || "{}");
    const { customerId, items } = body;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "customerId and items (non-empty array) are required",
        }),
      };
    }

    // 2. Create order and outbox event
    const orderId = uuidbv4();
    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0,
    );

    const order: Order = {
      orderId,
      customerId,
      items,
      totalAmount,
      status: OrderStatus.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const outBoxEvent: OutboxEvent = {
      eventId: uuidbv4(),
      aggregateId: orderId,
      eventType: EventType.ORDER_CREATED,
      payload: {
        orderId,
        customerId,
        items,
        totalAmount,
        timestamp: new Date().toISOString(),
      },
      createdAt: order.createdAt,
      processed: false,
    };

    // 3. Save order and outbox event in a transaction
    await docClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: ORDERS_TABLE,
              Item: order,
            },
          },
          {
            Put: {
              TableName: OUTBOX_TABLE,
              Item: outBoxEvent,
            },
          },
        ],
      }),
    );

    console.log("Order and outbox event created successfully:", orderId);

    const response = {
      orderId,
      status: order.status,
      totalAmount,
      message: "Order created successfully",
    };

    return {
      statusCode: 201,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error("Error creating order:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to create order",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};

export const create = makeIdempotentHandler(createOrderInternal);
