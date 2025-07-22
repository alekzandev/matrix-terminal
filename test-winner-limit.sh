#!/bin/bash

echo "🧪 Testing Winner Count Logic"
echo "=============================="

# Get current winner count
echo "📊 Current winner count:"
CURRENT_COUNT=$(curl -s http://localhost:8080/winner/count | jq -r '.winnerCount')
echo "Winner count: $CURRENT_COUNT"

echo ""
echo "🔧 Setting winner count to 45 (above limit) by incrementing..."

# Calculate how many increments we need to reach 45
TARGET=45
NEEDED=$((TARGET - CURRENT_COUNT))

if [ $NEEDED -gt 0 ]; then
    echo "Need to increment $NEEDED times to reach $TARGET"
    
    for i in $(seq 1 $NEEDED); do
        RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
            -d "{\"email\": \"testuser$i@example.com\", \"sessionId\": \"test$i\"}" \
            http://localhost:8080/winner/increment)
        NEW_COUNT=$(echo $RESPONSE | jq -r '.winnerCount')
        echo "Increment $i: Winner count is now $NEW_COUNT"
    done
else
    echo "Winner count is already at or above target"
fi

echo ""
echo "📊 Final winner count:"
curl -s http://localhost:8080/winner/count | jq

echo ""
echo "✅ Now when users win the quiz, the roulette should only give 'Solo honor esta vez' messages"
echo "🎰 Test this by running the frontend and completing a quiz successfully"
