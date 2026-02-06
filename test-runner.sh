#!/bin/bash
# Stacean v2.0 Test Runner
# Runs unit and E2E tests to find bugs

set -e

echo "🧪 Running Stacean v2.0 Test Suite"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if dev server is running
if ! curl -s http://localhost:3001 > /dev/null; then
    echo -e "${YELLOW}⚠️  Dev server not running on port 3001${NC}"
    echo "Starting dev server in background..."
    cd /home/clawdbot/stacean-repo
    npm run dev > /dev/null 2>&1 &
    DEV_PID=$!
    echo "Waiting for server to start..."
    sleep 5
else
    echo -e "${GREEN}✓ Dev server running${NC}"
fi

echo ""
echo "📋 Running Unit Tests..."
echo "======================================"
node --test __tests__/unit/*.test.ts

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Unit tests passed${NC}"
else
    echo -e "${RED}✗ Unit tests failed${NC}"
    UNIT_FAILED=1
fi

echo ""
echo "🧪 Running E2E Tests with Playwright..."
echo "======================================"

# Check if playwright is installed
if ! npx playwright --version > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Playwright not installed. Installing...${NC}"
    npx playwright install --with-deps
fi

# Run E2E tests
npx playwright test __tests__/e2e/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ E2E tests passed${NC}"
else
    echo -e "${RED}✗ E2E tests failed${NC}"
    E2E_FAILED=1
fi

# Summary
echo ""
echo "======================================"
echo "📊 Test Summary"
echo "======================================"

if [ -z "$UNIT_FAILED" ] && [ -z "$E2E_FAILED" ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    if [ -n "$UNIT_FAILED" ]; then
        echo -e "  ${RED}✗${NC} Unit tests failed"
    fi
    if [ -n "$E2E_FAILED" ]; then
        echo -e "  ${RED}✗${NC} E2E tests failed"
    fi
    exit 1
fi
