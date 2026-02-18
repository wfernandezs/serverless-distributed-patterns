export interface Order {
  orderId: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export enum OrderStatus {
  PENDING = "PENDING",
  INVENTORY_RESERVED = "INVENTORY_RESERVED",
  PAYMENT_PROCESSED = "PAYMENT_PROCESSED",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  COMPENSATING = "COMPENSATING",
}

export interface OutboxEvent {
  eventId: string;
  aggregateId: string;
  eventType: string;
  payload: any;
  createdAt: string;
  processed: boolean;
}

export interface ProcessPaymentInput {
  orderId: string;
  customeId: string;
  totalAmount: number;
  reservationResult: {
    reservationId: string;
    status: string;
  };
}

export interface ProcessPaymentOutput {
  orderId: string;
  paymentId: string;
  amount: number;
  status: string;
  timestamp: string;
}
