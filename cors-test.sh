#!/bin/bash

echo "🔧 Testing CORS Configuration"
echo "============================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test CORS headers with OPTIONS request
echo "1. Testing CORS preflight (OPTIONS) request..."
echo ""

response=$(curl -s -I -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  http://localhost:8080/user/create)

echo "Response headers:"
echo "$response"
echo ""

# Check for required CORS headers
if echo "$response" | grep -q "Access-Control-Allow-Origin: \*"; then
  echo -e "${GREEN}✅ Access-Control-Allow-Origin: * - PASS${NC}"
else
  echo -e "${RED}❌ Access-Control-Allow-Origin header missing - FAIL${NC}"
fi

if echo "$response" | grep -q "Access-Control-Allow-Methods:"; then
  echo -e "${GREEN}✅ Access-Control-Allow-Methods header present - PASS${NC}"
else
  echo -e "${RED}❌ Access-Control-Allow-Methods header missing - FAIL${NC}"
fi

if echo "$response" | grep -q "Access-Control-Allow-Headers:"; then
  echo -e "${GREEN}✅ Access-Control-Allow-Headers header present - PASS${NC}"
else
  echo -e "${RED}❌ Access-Control-Allow-Headers header missing - FAIL${NC}"
fi

echo ""
echo "2. Testing actual POST request with CORS..."

# Test actual POST request
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" \
  -X POST \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -d '{"userEmail": "cors-test@example.com", "sessionId": "cors-test-session"}' \
  http://localhost:8080/user/create)

echo "Response:"
echo "$response"

if echo "$response" | grep -q "HTTP_STATUS:201"; then
  echo -e "${GREEN}✅ POST request successful (201) - CORS WORKING${NC}"
elif echo "$response" | grep -q "HTTP_STATUS:200"; then
  echo -e "${GREEN}✅ POST request successful (200) - CORS WORKING${NC}"
else
  echo -e "${RED}❌ POST request failed - Check server logs${NC}"
fi

echo ""
echo "3. Testing from browser perspective..."

# Create a simple HTML test page
cat > cors-test.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>CORS Test</title>
</head>
<body>
    <h1>CORS Test for ConvAnalytics API</h1>
    <button onclick="testCORS()">Test User Creation API</button>
    <div id="result"></div>

    <script>
        async function testCORS() {
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = '<p>Testing CORS...</p>';
            
            try {
                const response = await fetch('http://localhost:8080/user/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userEmail: 'browser-test@example.com',
                        sessionId: 'browser-test-session'
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    resultDiv.innerHTML = `
                        <p style="color: green;">✅ CORS Test PASSED!</p>
                        <pre>${JSON.stringify(data, null, 2)}</pre>
                    `;
                } else {
                    resultDiv.innerHTML = `
                        <p style="color: red;">❌ API Error: ${response.status}</p>
                    `;
                }
            } catch (error) {
                resultDiv.innerHTML = `
                    <p style="color: red;">❌ CORS Error: ${error.message}</p>
                    <p>This usually means CORS is not properly configured.</p>
                `;
            }
        }
    </script>
</body>
</html>
EOF

echo -e "${YELLOW}📄 Created cors-test.html${NC}"
echo -e "${YELLOW}🌐 Open this file in your browser to test CORS from a web page${NC}"

echo ""
echo "🏁 CORS Test Complete!"
echo ""
echo "📋 Next steps:"
echo "1. Make sure your Go server is running: cd src/backend/go/cmd && go run main.go"
echo "2. Open cors-test.html in your browser"
echo "3. Click the 'Test User Creation API' button"
echo "4. If it works, CORS is properly configured!"
