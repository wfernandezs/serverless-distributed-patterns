import { Logger } from "@aws-lambda-powertools/logger";
import { Handler } from "aws-lambda";
import {
  ReserveInventoryInput,
  ReserveInventoryOutput,
} from "../../utils/types/reservation";
import { OrderStatus } from "../../utils/types/order";
import { v4 as uuidbv4 } from "uuid";
import { updateOrderStatus } from "../../utils/db/dynamo";
import { createTracer, addTraceContext } from "../../shared/tracer-util";

const logger = new Logger({ serviceName: "reserve-inventory" });
const tracer = createTracer("reserve-inventory");

export const handler: Handler<
  ReserveInventoryInput,
  ReserveInventoryOutput
> = async (input) => {
  // Add trace context for distributed tracing
  addTraceContext(
    tracer,
    { orderId: input.orderId, customerId: input.customerId },
    { itemCount: input.items.length, step: "reserve-inventory" },
  );

  logger.info("Reserving inventory for order", {
    orderId: input.orderId,
    itemCount: input.items.length,
  });

  try {
    const inventoryAvailable = Math.random() > 0.2; // Simulate inventory check with 80% success rate

    if (!inventoryAvailable) {
      logger.warn("Inventory not available for order", {
        orderId: input.orderId,
      });
      await updateOrderStatus(input.orderId, OrderStatus.FAILED);
      throw new Error(
        "Insufficient inventory for one or more items in the order",
      );
    }

    const reservationId = uuidbv4();

    logger.info("Inventory reserved successfully", {
      orderId: input.orderId,
      reservationId,
    });

    await updateOrderStatus(input.orderId, OrderStatus.INVENTORY_RESERVED);

    return {
      orderId: input.orderId,
      reservationId,
      status: "RESERVED",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Error reserving inventory", {
      error: error as Error,
      orderId: input.orderId,
    });
    throw error;
  }
};
