export interface ReserveInventoryInput {
  orderId: string;
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
}

export interface ReserveInventoryOutput {
  orderId: string;
  reservationId: string;
  status: string;
  timestamp: string;
}
