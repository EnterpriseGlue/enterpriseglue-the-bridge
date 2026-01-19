#!/usr/bin/env bash
set -e

# API Validation Script
# Tests all critical API endpoints to ensure they work after deployment

API_BASE=${API_BASE:-"http://localhost:8787"}
ADMIN_EMAIL=${ADMIN_EMAIL:-"amankejriwal@gmail.com"}
ADMIN_PASSWORD=${ADMIN_PASSWORD:-"Newpass1234!!"}

echo "=========================================="
echo "API Validation Test"
echo "=========================================="
echo "Base URL: $API_BASE"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass=0
fail=0

test_endpoint() {
  local name="$1"
  local method="$2"
  local endpoint="$3"
  local auth_header="$4"
  local expected_code="${5:-200}"
  
  printf "%-40s" "  $name..."
  
  if [ -n "$auth_header" ]; then
    response=$(curl -s -X "$method" "$API_BASE$endpoint" -H "$auth_header" -w "\n%{http_code}" -o /tmp/response.json)
  else
    response=$(curl -s -X "$method" "$API_BASE$endpoint" -w "\n%{http_code}" -o /tmp/response.json)
  fi
  
  http_code=$(echo "$response" | tail -n1)
  
  if [ "$http_code" = "$expected_code" ]; then
    echo -e "${GREEN}✓ $http_code${NC}"
    ((pass++))
  else
    echo -e "${RED}✗ $http_code (expected $expected_code)${NC}"
    ((fail++))
  fi
}

# 1. Health Check
echo "1. Health & Status"
test_endpoint "Health check" "GET" "/health" "" "200"
echo ""

# 2. Authentication
echo "2. Authentication"
echo -n "  Logging in as $ADMIN_EMAIL..."
TOKEN=$(curl -s -X POST "$API_BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  | jq -r '.accessToken')

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
  echo -e "${GREEN}✓${NC}"
  ((pass++))
else
  echo -e "${RED}✗ No token received${NC}"
  ((fail++))
  exit 1
fi

AUTH_HEADER="Authorization: Bearer $TOKEN"
test_endpoint "Get current user" "GET" "/api/auth/me" "$AUTH_HEADER" "200"
echo ""

# 3. User Management (Leia)
echo "3. User Management (Leia DB)"
test_endpoint "List users" "GET" "/api/admin/users" "$AUTH_HEADER" "200"
test_endpoint "Get environments" "GET" "/api/admin/environments" "$AUTH_HEADER" "200"
echo ""

# 4. Engines (Leia)
echo "4. Engines (Leia DB)"
test_endpoint "List engines" "GET" "/engines-api/engines" "$AUTH_HEADER" "200"
test_endpoint "List active engines" "GET" "/engines-api/engines/active" "$AUTH_HEADER" "200"
echo ""

# 5. Projects (Railway)
echo "5. Projects (Railway DB)"
test_endpoint "List projects" "GET" "/starbase-api/projects" "$AUTH_HEADER" "200"
echo ""

# 6. Git (Leia)
echo "6. Git Providers & Credentials (Leia DB)"
test_endpoint "List git providers" "GET" "/git-api/providers" "$AUTH_HEADER" "200"
test_endpoint "List git repositories" "GET" "/git-api/repositories" "$AUTH_HEADER" "200"
echo ""

# 7. Platform Settings (Leia)
echo "7. Platform Settings (Leia DB)"
test_endpoint "Get platform settings" "GET" "/api/admin/settings" "$AUTH_HEADER" "200"
echo ""

# Summary
echo "=========================================="
echo "Test Results"
echo "=========================================="
echo -e "Passed: ${GREEN}$pass${NC}"
echo -e "Failed: ${RED}$fail${NC}"
echo "Total:  $((pass + fail))"
echo ""

if [ $fail -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  exit 1
fi
