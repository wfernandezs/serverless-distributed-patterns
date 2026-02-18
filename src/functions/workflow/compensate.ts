import { Handler } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import {
  CompensateInput,
  CompensateOutput,
} from "../../utils/types/compensate";
import { OrderStatus } from "../../utils/types/order";
import { updateOrderStatus } from "../../utils/db";

const logger = new Logger({ serviceName: "compensate" });

/**
 * Compensation handler - Undoes previously completed steps
 *
 * In production, replace these mock implementations with:
 * - Call payment gateway API (Stripe, PayPal, etc.) to refund
 * - Call inventory service API to release reserved stock
 * - Publish events to message queue for async processing
 */
export const handler: Handler<CompensateInput, CompensateOutput> = async (
  input,
) => {
  logger.info("Starting compensation for failed workflow", {
    orderId: input.orderId,
    error: input.error,
  });

  const compensationActions: string[] = [];

  try {
    // 1. Refund payment (if payment was processed)
    if (input.paymentResult?.paymentId) {
      logger.info("Refunding payment", {
        paymentId: input.paymentResult.paymentId,
        amount: input.paymentResult.amount,
      });

      // TODO: In production, call payment gateway API
      // Example: await stripe.refunds.create({ payment_intent: paymentId })

      compensationActions.push(
        `Refunded payment ${input.paymentResult.paymentId}`,
      );
    }

    // 2. Release inventory (if inventory was reserved)
    if (input.reservationResult?.reservationId) {
      logger.info("Releasing inventory", {
        reservationId: input.reservationResult.reservationId,
      });

      // TODO: In production, call inventory service API
      // Example: await inventoryAPI.release(reservationId)

      compensationActions.push(
        `Released inventory ${input.reservationResult.reservationId}`,
      );
    }

    // Update order status to COMPENSATING then FAILED
    await updateOrderStatus(input.orderId, OrderStatus.COMPENSATING);

    logger.info("Compensation actions completed", {
      orderId: input.orderId,
      actions: compensationActions,
    });

    await updateOrderStatus(input.orderId, OrderStatus.FAILED);

    return {
      orderId: input.orderId,
      compensationActions,
      status: "COMPENSATED",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Error during compensation", {
      error: error as Error,
      orderId: input.orderId,
    });

    // Even if compensation fails, we need to mark the order
    await updateOrderStatus(input.orderId, OrderStatus.FAILED);

    throw error;
  }
};
