export enum EventType {
  ORDER_CREATED = "ORDER_CREATED",
  INVENTORY_RESERVED = "INVENTORY_RESERVED",
  INVENTORY_RESERVATION_FAILED = "INVENTORY_RESERVATION_FAILED",
  PAYMENT_PROCESSED = "PAYMENT_PROCESSED",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  NOTIFICATION_SENT = "NOTIFICATION_SENT",
  NOTIFICATION_FAILED = "NOTIFICATION_FAILED",
  SAGA_FAILED = "SAGA_FAILED",
}

export interface OrderCreatedEvent {
  orderId: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  timestamp: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface InventoryReservedEvent {
  orderId: string;
  reservationId: string;
  timestamp: string;
}

export interface PaymentProcessedEvent {
  orderId: string;
  paymentId: string;
  amount: number;
  timestamp: string;
}

export interface NotificationSentEvent {
  orderId: string;
  customerId: string;
  notificationType: string;
  timestamp: string;
}

export interface SagaFailedEvent {
  orderId: string;
  failedStep: string;
  reason: string;
  timestamp: string;
}
