#!/bin/bash

# Quick CORS test for the evaluate-answers endpoint
echo "🔧 Testing CORS for /evaluate-answers endpoint"
echo "=============================================="

# Test OPTIONS request (preflight)
echo "1. Testing OPTIONS preflight request..."
curl -v -X OPTIONS "http://localhost:8080/evaluate-answers" \
    -H "Origin: http://localhost:5173" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type"

echo ""
echo ""

# Test actual POST request
echo "2. Testing POST request with CORS headers..."
curl -v -X POST "http://localhost:8080/evaluate-answers" \
    -H "Origin: http://localhost:5173" \
    -H "Content-Type: application/json" \
    -d '{
        "questionIds": ["CRD0001", "CRD0002"],
        "userAnswers": ["a", "c"]
    }'

echo ""
echo ""
echo "✅ CORS test complete. Check the Access-Control-* headers in the response."
