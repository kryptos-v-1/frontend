#!/bin/bash

# Update user plan via admin API
EMAIL="0day.ashish@gmail.com"
PLAN="pro"
API_URL="http://localhost:3000/api/admin/user-plan"

echo "Updating user plan..."
echo "Email: $EMAIL"
echo "Plan: $PLAN"
echo ""

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"plan\": \"$PLAN\"}"

echo ""
echo "Done!"
