#!/bin/bash

# Mac-friendly Translation Testing Script
# Make sure jq is installed: brew install jq

echo "🌿 Greeny Corner Translation Test"
echo "=================================="
echo ""
echo "First, get your auth token:"
echo "1. Open your app in browser and login"
echo "2. Press Cmd+Option+J (Chrome) or Cmd+Option+C (Safari)"
echo "3. Type: localStorage.getItem('authToken')"
echo "4. Copy the token value (without quotes)"
echo ""
read -p "Paste your auth token here: " AUTH_TOKEN
echo ""

API_URL="https://greenycorner.com/api"

if [ -z "$AUTH_TOKEN" ]; then
    echo "❌ No token provided. Exiting."
    exit 1
fi

echo "Testing translation to Arabic..."
echo "================================"
RESPONSE=$(curl -s -X POST "${API_URL}/plants/refresh-language" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"language": "ar"}')

# Check if jq is installed
if command -v jq &> /dev/null; then
    echo "$RESPONSE" | jq '.'
else
    echo "$RESPONSE"
    echo ""
    echo "💡 Tip: Install jq for better formatting: brew install jq"
fi

echo ""
echo "================================"

# Check for success indicators
if echo "$RESPONSE" | grep -q "success\|refreshed\|translated"; then
    echo "✅ Translation request sent successfully!"
    echo ""
    echo "Now check your app:"
    echo "1. Go to 'My Plants'"
    echo "2. Click on any plant"
    echo "3. The plant details should be in Arabic"
else
    echo "⚠️  Response doesn't indicate success. Check the output above."
fi

echo ""
echo "To test switching back to English, run this script again"
echo "and manually switch the language in the app."
