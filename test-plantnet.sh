#!/bin/bash

# Test PlantNet API Key
API_KEY="2b104ikDQb5QqFv9hnxwOjb9Y"

echo "Testing PlantNet API Key..."
echo "API Key: $API_KEY"
echo ""

# Test simple API call
curl -s "https://my-api.plantnet.org/v2/identify/all?api-key=${API_KEY}" \
  -X GET

echo ""
echo "If you see valid JSON response, the API key is working!"
