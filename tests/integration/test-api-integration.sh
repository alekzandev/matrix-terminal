#!/bin/bash

# Test script for Go API integration with Matrix Terminal
# This script tests the user creation API endpoint

echo "🧪 Testing Go API Integration with Matrix Terminal"
echo "================================================="

# Test user creation API
echo "1. Testing user creation API..."

# Sample test data
USER_EMAIL="test@example.com"
SESSION_ID="session_$(date +%s)"

echo "   📧 Email: $USER_EMAIL"
echo "   🔑 Session: $SESSION_ID"

# Make API call
echo "   📡 Calling API..."
response=$(curl -s -X POST http://localhost:8080/user/create \
  -H "Content-Type: application/json" \
  -d "{
    \"userEmail\": \"$USER_EMAIL\",
    \"sessionId\": \"$SESSION_ID\"
  }")

# Check if response is successful
if [[ $response == *"success"* ]]; then
  echo "   ✅ User creation API: SUCCESS"
  echo "   📄 Response: $response"
  
  # Extract filename from response
  filename=$(echo $response | grep -o '"filename":"[^"]*"' | cut -d'"' -f4)
  echo "   📁 Created file: $filename"
  
  # Check if file exists
  if [ -f "data/$filename" ]; then
    echo "   ✅ File verification: SUCCESS"
    echo "   📖 File contents:"
    cat "data/$filename" | sed 's/^/       /'
  else
    echo "   ❌ File verification: FAILED - File not found"
  fi
else
  echo "   ❌ User creation API: FAILED"
  echo "   📄 Response: $response"
fi

echo ""
echo "2. Testing question API..."

# Test question retrieval
question_response=$(curl -s http://localhost:8080/question?id=CRD0001)

if [[ $question_response == *"question"* ]]; then
  echo "   ✅ Question API: SUCCESS"
  echo "   📄 Sample question: $question_response"
else
  echo "   ❌ Question API: FAILED"
  echo "   📄 Response: $question_response"
fi

echo ""
echo "3. Testing random questions API..."

# Test random questions
random_response=$(curl -s http://localhost:8080/choose-questions)

if [[ $random_response == *"["* ]]; then
  echo "   ✅ Random questions API: SUCCESS"
  echo "   📄 Random IDs: $random_response"
else
  echo "   ❌ Random questions API: FAILED"
  echo "   📄 Response: $random_response"
fi

echo ""
echo "4. Testing /user/update endpoint..."

# Test user update
response=$(curl -s -X POST http://localhost:8080/user/update \
    -H "Content-Type: application/json" \
    -d '{
        "email": "test@example.com",
        "sessionId": "test123",
        "questionId": "1",
        "answer": "a"
    }')

echo "   📄 Response: $response"

echo ""
echo "5. Testing /evaluate-answers endpoint..."

# Test answer evaluation
response=$(curl -s -X POST http://localhost:8080/evaluate-answers \
    -H "Content-Type: application/json" \
    -d '{
        "questionIds": ["1", "2", "3"],
        "userAnswers": ["a", "b", "c"]
    }')

echo "   📄 Response: $response"
echo ""

echo "🏁 Integration test complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Start your Go server: cd src/backend/go/cmd && go run main.go"
echo "   2. Open your frontend: cd src/frontend && npm run dev"
echo "   3. Navigate to debug.html or index.html"
echo "   4. Test the email collection and menu flow"
