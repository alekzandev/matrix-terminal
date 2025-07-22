#!/bin/bash

echo "🧪 Testing Winner Count API"
echo "================================"

# Test 1: Get initial winner count
echo "1. Getting current winner count..."
curl -X GET "http://localhost:8080/winner/count" \
  -H "Content-Type: application/json" | jq .

echo -e "\n"

# Test 2: Increment winner count without user info
echo "2. Incrementing winner count (anonymous)..."
curl -X POST "http://localhost:8080/winner/increment" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .

echo -e "\n"

# Test 3: Increment winner count with user info
echo "3. Incrementing winner count with user info..."
curl -X POST "http://localhost:8080/winner/increment" \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "test@example.com",
    "sessionId": "test-session-123"
  }' | jq .

echo -e "\n"

# Test 4: Get updated winner count
echo "4. Getting updated winner count..."
curl -X GET "http://localhost:8080/winner/count" \
  -H "Content-Type: application/json" | jq .

echo -e "\n✅ Winner API tests completed!"
