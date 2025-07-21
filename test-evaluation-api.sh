#!/bin/bash

# Test script for the answer evaluation API
# This script tests the /evaluate-answers endpoint

BASE_URL="http://localhost:8080"

echo "🧪 Testing Answer Evaluation API"
echo "================================"
echo ""

# Check if server is running
echo "1. Checking if server is running..."
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/question?id=1" | {
    read status_code
    if [ "$status_code" = "200" ]; then
        echo "✅ Server is running"
    else
        echo "❌ Server is not running. Start the Go server first."
        exit 1
    fi
}
echo ""

# Test 1: Valid answer evaluation (all correct)
echo "2. Testing valid answer evaluation (all correct answers)..."
response=$(curl -s -X POST "$BASE_URL/evaluate-answers" \
    -H "Content-Type: application/json" \
    -d '{
        "questionIds": ["1", "2", "3"],
        "userAnswers": ["a", "b", "c"]
    }')

echo "Response:"
echo "$response" | jq '.'
echo ""

# Test 2: Mixed correct/incorrect answers
echo "3. Testing mixed correct/incorrect answers..."
response=$(curl -s -X POST "$BASE_URL/evaluate-answers" \
    -H "Content-Type: application/json" \
    -d '{
        "questionIds": ["1", "2", "3", "4", "5"],
        "userAnswers": ["a", "x", "c", "d", "wrong"]
    }')

echo "Response:"
echo "$response" | jq '.'
echo ""

# Test 3: All incorrect answers
echo "4. Testing all incorrect answers..."
response=$(curl -s -X POST "$BASE_URL/evaluate-answers" \
    -H "Content-Type: application/json" \
    -d '{
        "questionIds": ["1", "2", "3"],
        "userAnswers": ["x", "y", "z"]
    }')

echo "Response:"
echo "$response" | jq '.'
echo ""

# Test 4: Invalid request (mismatched arrays)
echo "5. Testing invalid request (mismatched arrays)..."
response=$(curl -s -X POST "$BASE_URL/evaluate-answers" \
    -H "Content-Type: application/json" \
    -d '{
        "questionIds": ["1", "2", "3"],
        "userAnswers": ["a", "b"]
    }')

echo "Response:"
echo "$response" | jq '.'
echo ""

# Test 5: Invalid question ID
echo "6. Testing with invalid question ID..."
response=$(curl -s -X POST "$BASE_URL/evaluate-answers" \
    -H "Content-Type: application/json" \
    -d '{
        "questionIds": ["1", "999", "3"],
        "userAnswers": ["a", "b", "c"]
    }')

echo "Response:"
echo "$response" | jq '.'
echo ""

# Test 6: Case insensitive comparison
echo "7. Testing case insensitive comparison..."
response=$(curl -s -X POST "$BASE_URL/evaluate-answers" \
    -H "Content-Type: application/json" \
    -d '{
        "questionIds": ["1", "2", "3"],
        "userAnswers": ["A", "B", "C"]
    }')

echo "Response:"
echo "$response" | jq '.'
echo ""

echo "🎉 All tests completed!"
echo ""
echo "To test the full frontend flow:"
echo "1. Start the Go server: cd src/backend/go/cmd && go run main.go"
echo "2. Start the frontend: cd src/frontend && npm run dev"
echo "3. Open the terminal in your browser"
echo "4. Complete the question flow and see the evaluation results"
