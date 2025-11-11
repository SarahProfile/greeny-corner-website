#!/bin/bash

# Test Google Translation API Endpoint
# Replace YOUR_AUTH_TOKEN with your actual token from localStorage

API_URL="https://greenycorner.com/api"
AUTH_TOKEN="YOUR_AUTH_TOKEN"  # Get this from browser localStorage after login

echo "Testing Plant Translation Endpoint..."
echo "======================================"
echo ""

# Test refreshing plants to Arabic
echo "1. Refreshing plants to Arabic (ar)..."
curl -X POST "${API_URL}/plants/refresh-language" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"language": "ar"}' \
  | jq '.'

echo ""
echo "======================================"
echo ""

# Test refreshing plants back to English
echo "2. Refreshing plants to English (en)..."
curl -X POST "${API_URL}/plants/refresh-language" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"language": "en"}' \
  | jq '.'

echo ""
echo "======================================"
echo "Testing complete!"
