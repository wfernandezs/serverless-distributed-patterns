import { Logger } from "@aws-lambda-powertools/logger";
import { Handler } from "aws-lambda";
import { v4 as uuidbv4 } from "uuid";
import {
  OrderStatus,
  ProcessPaymentInput,
  ProcessPaymentOutput,
} from "../../utils/types/order";
import { updateOrderStatus } from "../../utils/db/dynamo";
import { createTracer, addTraceContext } from "../../shared/tracer-util";

const logger = new Logger({ serviceName: "process-payment" });
const tracer = createTracer("process-payment");

export const handler: Handler<
  ProcessPaymentInput,
  ProcessPaymentOutput
> = async (input) => {
  // Add trace context for distributed tracing
  addTraceContext(
    tracer,
    { orderId: input.orderId, customerId: input.customeId },
    {
      amount: input.totalAmount,
      reservationId: input.reservationResult.reservationId,
      step: "process-payment",
    },
  );

  logger.info("Processing payment for order", {
    orderId: input.orderId,
    amount: input.totalAmount,
    reservationId: input.reservationResult.reservationId,
  });

  try {
    const paymentSuccessful = Math.random() > 0.2; // Simulate payment processing with 80% success rate

    if (!paymentSuccessful) {
      logger.warn("Payment failed for order", {
        orderId: input.orderId,
      });

      await updateOrderStatus(input.orderId, OrderStatus.FAILED);
      throw new Error("Payment gateway returned error");
    }

    const paymentId = uuidbv4();

    logger.info("Payment processed successfully", {
      orderId: input.orderId,
      paymentId,
      amount: input.totalAmount,
    });

    await updateOrderStatus(input.orderId, OrderStatus.PAYMENT_PROCESSED);

    return {
      orderId: input.orderId,
      paymentId,
      amount: input.totalAmount,
      status: "PROCESSED",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Error processing payment", {
      error: error as Error,
      orderId: input.orderId,
    });
    throw error;
  }
};
