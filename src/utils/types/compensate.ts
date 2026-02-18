export interface CompensateInput {
  orderId: string;
  reservationResult?: {
    reservationId: string;
    status: string;
  };
  paymentResult?: {
    paymentId: string;
    amount: number;
    status: string;
  };
  error: {
    Error: string;
    Cause: string;
  };
}

export interface CompensateOutput {
  orderId: string;
  compensationActions: string[];
  status: string;
  timestamp: string;
}
