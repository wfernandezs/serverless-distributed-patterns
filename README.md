# Serverless Distributed Patterns

Demonstration project of distributed patterns using AWS Serverless (Lambda, DynamoDB, Step Functions).

## 🚀 Quick Deploy to AWS

### 1. Configure AWS Credentials

If you don't have credentials configured:

```bash
aws configure
```

Enter:
- AWS Access Key ID
- AWS Secret Access Key
- Default region: `us-east-1`
- Default output: `json`

### 2. Install Dependencies

```bash
npm install
```

### 3. Deploy to AWS

```bash
# Deploy to dev (default)
npm run deploy

# Or specify stage
npm run deploy:dev
npm run deploy:prod
```

This will automatically create:
- ✅ Lambda Functions
- ✅ DynamoDB Tables (Orders, Outbox, Idempotency)
- ✅ Step Functions State Machine
- ✅ API Gateway endpoints
- ✅ Event Bus
- ✅ IAM Roles and permissions

### 4. Test the API

After deployment, you'll see the API Gateway endpoint. Current example: `https://ttn14lhvmi.execute-api.us-east-1.amazonaws.com/dev/orders`

#### Without Idempotency

```bash
curl -X POST https://ttn14lhvmi.execute-api.us-east-1.amazonaws.com/dev/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer-123",
    "items": [
      {"productId": "laptop", "quantity": 1, "price": 1299.99}
    ]
  }'
```

**Expected response:**
```json
{
  "orderId": "generated-uuid",
  "status": "PENDING",
  "totalAmount": 1299.99,
  "message": "Order created successfully"
}
```

#### With Idempotency

```bash
curl -X POST https://ttn14lhvmi.execute-api.us-east-1.amazonaws.com/dev/orders \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: customer-order-001" \
  -d '{
    "customerId": "customer-456",
    "items": [
      {"productId": "monitor", "quantity": 2, "price": 349.99}
    ]
  }'
```

**✨ Feature**: If you execute the same request with the same `x-idempotency-key` within **10 minutes**:
- ✅ You'll receive the same response (same `orderId`)
- ✅ NO duplicate order will be created
- ✅ Protection against accidental retries
- ⏱️ After 10 minutes, the record expires and you can create a new order with the same key

**Important note**: Idempotency returns the original state (`PENDING`), not the state updated by the workflow. To get the current state, query `GET /orders/{orderId}`. See [docs/IDEMPOTENCY.md](docs/IDEMPOTENCY.md) for more details.

#### Automated Test Script

```bash
# Run complete test suite
./test-api.sh
```

This script tests:
1. Create order without idempotency
2. Create order with idempotency (first time)
3. Repeat request with same key (verifies it returns same orderId)
4. Create order with new key (verifies it creates new order)

### 5. View Resources

```bash
# View Lambda functions
aws lambda list-functions --query 'Functions[?contains(FunctionName, `distributed-patterns`)].FunctionName'

# View DynamoDB tables
aws dynamodb list-tables

# View orders
aws dynamodb scan --table-name distributed-patterns-demo-orders-table-dev
```

### 6. Remove Everything

```bash
npm run remove
```

---

## 📁 Project Structure

```
src/
├── functions/
│   ├── order-service/        # API to create orders
│   ├── outbox-processor/     # Process Outbox events
│   └── workflow/              # Workflow functions
│       ├── reserve-inventory.ts
│       ├── process-payment.ts
│       ├── send-notification.ts
│       └── compensate.ts
└── utils/
    ├── db.ts                  # Shared DynamoDB client
    └── types/                 # TypeScript definitions
```

---

## 🔄 Implemented Patterns

### 1. Transactional Outbox Pattern
- Save order + event in a DynamoDB transaction
- Guarantees consistency between writes
- Prevents lost events

### 2. Idempotency Pattern
- Uses AWS Lambda Powertools for idempotency
- Header: `x-idempotency-key`
- TTL: 10 minutes
- Dedicated DynamoDB table for tracking

### 3. Saga Orchestration with Step Functions
- **Workflow**: Reserve Inventory → Process Payment → Send Notification
- **Compensation**: If any step fails, executes rollback
  - Refunds payment (clear TODOs for Stripe/payment gateway integration)
  - Releases inventory (clear TODOs for inventory service API calls)
  - Updates order status to FAILED
- **Retry Logic**: Automatic retries with exponential backoff
- See [docs/COMPENSATION.md](docs/COMPENSATION.md) for production integration examples

### 4. Event-Driven Architecture
- DynamoDB Streams detect new events
- Outbox Processor starts workflows automatically
- Decoupling between services

---

## 💰 Costs

AWS Free Tier includes:
- Lambda: 1M requests/month free
- DynamoDB: 25GB storage free
- Step Functions: 4,000 state transitions/month free

For development, costs are **practically $0**.

---

## 🛠️ Useful Commands

```bash
# View function logs
sls logs -f createOrder --tail

# Invoke function locally (without deploying)
sls invoke local -f createOrder --data '{"body": "{...}"}'

# View stack info
sls info

# Export Step Function ASL
npm run export-asl
```
