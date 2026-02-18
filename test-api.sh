#!/bin/bash

# Script de prueba para la API de órdenes
# Uso: ./test-api.sh

API_URL="https://ttn14lhvmi.execute-api.us-east-1.amazonaws.com/dev/orders"

echo "🧪 Testing Order API with Idempotency"
echo "======================================"
echo ""

# Test 1: Crear orden sin idempotencia
echo "📦 Test 1: Creating order WITHOUT idempotency key"
echo "----------------------------------------------"
RESPONSE1=$(curl -s -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "test-customer-001",
    "items": [
      {"productId": "laptop", "quantity": 1, "price": 1299.99}
    ]
  }')
echo "Response: $RESPONSE1"
ORDER_ID1=$(echo $RESPONSE1 | jq -r '.orderId')
echo "✅ Order ID: $ORDER_ID1"
echo ""

# Test 2: Crear orden con idempotencia (primera vez)
echo "🔐 Test 2: Creating order WITH idempotency key (first time)"
echo "-----------------------------------------------------------"
IDEM_KEY="test-$(date +%s)"
RESPONSE2=$(curl -s -X POST $API_URL \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: $IDEM_KEY" \
  -d '{
    "customerId": "test-customer-002",
    "items": [
      {"productId": "monitor", "quantity": 2, "price": 349.99}
    ]
  }')
echo "Response: $RESPONSE2"
ORDER_ID2=$(echo $RESPONSE2 | jq -r '.orderId')
echo "✅ Order ID: $ORDER_ID2"
echo ""

# Test 3: Repetir la misma petición con idempotencia
echo "🔁 Test 3: Repeating same request with SAME idempotency key"
echo "------------------------------------------------------------"
sleep 1
RESPONSE3=$(curl -s -X POST $API_URL \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: $IDEM_KEY" \
  -d '{
    "customerId": "test-customer-002",
    "items": [
      {"productId": "monitor", "quantity": 2, "price": 349.99}
    ]
  }')
echo "Response: $RESPONSE3"
ORDER_ID3=$(echo $RESPONSE3 | jq -r '.orderId')
echo "✅ Order ID: $ORDER_ID3"
echo ""

# Verificar idempotencia
echo "🔍 Verification"
echo "---------------"
if [ "$ORDER_ID2" == "$ORDER_ID3" ]; then
  echo "✅ IDEMPOTENCY WORKS! Both requests returned the same Order ID: $ORDER_ID2"
  echo "✅ No duplicate order was created"
else
  echo "❌ IDEMPOTENCY FAILED! Different Order IDs: $ORDER_ID2 vs $ORDER_ID3"
fi
echo ""

# Test 4: Crear orden con nuevo idempotency key
echo "🆕 Test 4: Creating order with DIFFERENT idempotency key"
echo "---------------------------------------------------------"
IDEM_KEY2="test-$(date +%s)-new"
RESPONSE4=$(curl -s -X POST $API_URL \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: $IDEM_KEY2" \
  -d '{
    "customerId": "test-customer-003",
    "items": [
      {"productId": "keyboard", "quantity": 1, "price": 89.99}
    ]
  }')
echo "Response: $RESPONSE4"
ORDER_ID4=$(echo $RESPONSE4 | jq -r '.orderId')
echo "✅ Order ID: $ORDER_ID4"
echo ""

echo "📊 Summary"
echo "----------"
echo "Order 1 (no idempotency):     $ORDER_ID1"
echo "Order 2 (idempotency key 1):  $ORDER_ID2"
echo "Order 3 (same key as 2):      $ORDER_ID3  $([ "$ORDER_ID2" == "$ORDER_ID3" ] && echo '✅ SAME' || echo '❌ DIFFERENT')"
echo "Order 4 (idempotency key 2):  $ORDER_ID4"
echo ""
echo "✨ All tests completed!"
