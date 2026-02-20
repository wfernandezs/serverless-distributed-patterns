import { Logger } from "@aws-lambda-powertools/logger";
import { Handler } from "aws-lambda";
import {
  SendNotificationInput,
  SendNotificationOutput,
} from "../../utils/types/notifications";
import { OrderStatus } from "../../utils/types/order";
import { updateOrderStatus } from "../../utils/db/dynamo";
import { createTracer, addTraceContext } from "../../shared/tracer-util";

const logger = new Logger({ serviceName: "send-notification" });
const tracer = createTracer("send-notification");

export const handler: Handler<
  SendNotificationInput,
  SendNotificationOutput
> = async (input) => {
  // Add trace context for distributed tracing
  addTraceContext(
    tracer,
    { orderId: input.orderId, customerId: input.customerId },
    {
      paymentId: input.paymentResult.paymentId,
      step: "send-notification",
    },
  );

  logger.info("Sending notification for order", {
    orderId: input.orderId,
    customerId: input.customerId,
    paymentId: input.paymentResult.paymentId,
  });

  try {
    // Simulate sending email/SMS notification
    // In production: integrate with SES, SNS, or third-party service

    logger.info("Notification sent successfully", {
      orderId: input.orderId,
      customerId: input.customerId,
    });

    // Update order status to COMPLETED
    await updateOrderStatus(input.orderId, OrderStatus.COMPLETED);

    return {
      orderId: input.orderId,
      notificationType: "ORDER_CONFIRMATION",
      status: "SENT",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Error sending notification", {
      error: error as Error,
      orderId: input.orderId,
    });
    // Don't fail the entire saga if notification fails
    return {
      orderId: input.orderId,
      notificationType: "ORDER_CONFIRMATION",
      status: "FAILED",
      timestamp: new Date().toISOString(),
    };
  }
};
