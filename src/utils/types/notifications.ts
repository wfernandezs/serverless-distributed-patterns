export interface SendNotificationInput {
  orderId: string;
  customerId: string;
  paymentResult: {
    paymentId: string;
    amount: number;
    status: string;
  };
}

export interface SendNotificationOutput {
  orderId: string;
  notificationType: string;
  status: string;
  timestamp: string;
}
