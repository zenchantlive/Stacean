#!/bin/bash

API_URL="${API_URL:-http://localhost:3000/api/tracker/tasks}"

echo "--- Atlas Task Tracker API Test ---"

echo "1. Listing tasks..."
curl -s "$API_URL" | jq

echo -e "\n\n2. Creating a task..."
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Task", "priority": "high", "description": "Created by verification script"}')
echo "$RESPONSE" | jq

TASK_ID=$(echo "$RESPONSE" | jq -r '.id')

if [ "$TASK_ID" == "null" ] || [ -z "$TASK_ID" ]; then
  echo "Failed to create task."
  exit 1
fi

echo "Task ID: $TASK_ID"

echo -e "\n3. Get task by ID..."
curl -s "$API_URL/$TASK_ID" | jq

echo -e "\n4. Update task..."
curl -s -X PATCH "$API_URL/$TASK_ID" \
  -H "Content-Type: application/json" \
  -d '{"status": "in-progress"}' | jq

echo -e "\n5. Delete task..."
curl -s -X DELETE "$API_URL/$TASK_ID" | jq

echo -e "\n6. Verify deletion (should be 404)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/$TASK_ID")
echo "HTTP Code: $HTTP_CODE"

if [ "$HTTP_CODE" == "404" ]; then
    echo "SUCCESS: Task deleted."
else
    echo "FAILURE: Task still exists or error."
fi
