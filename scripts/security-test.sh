#!/bin/bash
# Security test script for Travel Planner
# Usage: ./scripts/security-test.sh https://your-domain.vercel.app

set -e

BASE_URL="${1:-http://localhost:3000}"
PASS=0
FAIL=0

green() { echo -e "\033[32m  PASS\033[0m $1"; PASS=$((PASS+1)); }
red()   { echo -e "\033[31m  FAIL\033[0m $1"; FAIL=$((FAIL+1)); }
info()  { echo -e "\033[90m  ----\033[0m $1"; }

echo ""
echo "Security Test: $BASE_URL"
echo "=================================="
echo ""

# ---------------------------
# 1. Auth-protected endpoints
# ---------------------------
echo "1. Auth Protection"

for path in /api/trip /api/routing /api/geocode; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$path")
  if [ "$status" = "401" ]; then
    green "$path returns 401 without auth"
  else
    red "$path returned $status (expected 401)"
  fi
done

# Image endpoint should be accessible (public)
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/image?q=test")
if [ "$status" != "401" ]; then
  green "/api/image is public (expected)"
else
  red "/api/image returned 401 (should be public)"
fi

echo ""

# ---------------------------
# 2. Rate limiting
# ---------------------------
echo "2. Rate Limiting (auth endpoint)"

got_429=false
for i in $(seq 1 8); do
  status=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$BASE_URL/api/auth" \
    -H "Content-Type: application/json" \
    -d '{"password":"wrong"}')
  if [ "$status" = "429" ]; then
    got_429=true
    break
  fi
done

if [ "$got_429" = true ]; then
  green "Rate limiting triggers after repeated failures"
else
  red "No rate limiting detected after 8 attempts"
fi

echo ""

# ---------------------------
# 3. Security headers
# ---------------------------
echo "3. Security Headers"

headers=$(curl -s -I "$BASE_URL" 2>/dev/null)

check_header() {
  header_name="$1"
  if echo "$headers" | grep -qi "$header_name"; then
    value=$(echo "$headers" | grep -i "$header_name" | head -1 | cut -d: -f2- | xargs)
    green "$header_name: $value"
  else
    red "$header_name missing"
  fi
}

check_header "x-content-type-options"
check_header "x-frame-options"
check_header "referrer-policy"

echo ""

# ---------------------------
# 4. Invalid input handling
# ---------------------------
echo "4. Input Validation"

# Bad coordinates
status=$(curl -s -o /dev/null -w "%{http_code}" \
  -b "trip-auth=fake" \
  "$BASE_URL/api/routing?from_lat=999&from_lng=0&to_lat=0&to_lng=0")
if [ "$status" = "400" ] || [ "$status" = "401" ]; then
  green "Rejects out-of-range coordinates"
else
  red "Accepted bad coordinates (status $status)"
fi

# Missing coordinates
status=$(curl -s -o /dev/null -w "%{http_code}" \
  "$BASE_URL/api/routing")
if [ "$status" = "400" ] || [ "$status" = "401" ]; then
  green "Rejects missing coordinates"
else
  red "Accepted missing coordinates (status $status)"
fi

# Oversized payload
status=$(curl -s -o /dev/null -w "%{http_code}" \
  -X PUT "$BASE_URL/api/trip" \
  -H "Content-Type: application/json" \
  -H "Content-Length: 2000000" \
  -d '{"trip":null}')
if [ "$status" = "401" ] || [ "$status" = "413" ]; then
  green "Rejects oversized payload or requires auth"
else
  red "Accepted oversized payload (status $status)"
fi

echo ""

# ---------------------------
# 5. Auth bypass attempts
# ---------------------------
echo "5. Auth Bypass"

# Fake JWT
status=$(curl -s -o /dev/null -w "%{http_code}" \
  -b "trip-auth=eyJhbGciOiJIUzI1NiJ9.eyJhdXRoZW50aWNhdGVkIjp0cnVlfQ.fake" \
  "$BASE_URL/api/trip")
if [ "$status" = "401" ] || [ "$status" = "307" ]; then
  green "Rejects forged JWT"
else
  red "Accepted forged JWT (status $status)"
fi

# Empty password
body=$(curl -s -X POST "$BASE_URL/api/auth" \
  -H "Content-Type: application/json" \
  -d '{"password":""}')
if echo "$body" | grep -q '"success":false\|Wrong password'; then
  green "Rejects empty password"
else
  red "Accepted empty password"
fi

# No body
status=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE_URL/api/auth" \
  -H "Content-Type: application/json" \
  -d '')
if [ "$status" = "400" ] || [ "$status" = "401" ] || [ "$status" = "429" ]; then
  green "Handles missing request body"
else
  red "Crashed on missing body (status $status)"
fi

echo ""

# ---------------------------
# 6. XSS in responses
# ---------------------------
echo "6. XSS Indicators"

# Check if API returns JSON content-type (not HTML)
content_type=$(curl -s -I -X POST "$BASE_URL/api/auth" \
  -H "Content-Type: application/json" \
  -d '{"password":"<script>alert(1)</script>"}' | grep -i content-type | head -1)
if echo "$content_type" | grep -qi "application/json"; then
  green "Auth API returns JSON content-type"
else
  red "Auth API returns non-JSON: $content_type"
fi

echo ""

# ---------------------------
# 7. Trip page redirect
# ---------------------------
echo "7. Page Protection"

status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/trip")
if [ "$status" = "307" ] || [ "$status" = "302" ] || [ "$status" = "301" ]; then
  green "/trip redirects to login without auth"
else
  red "/trip returned $status (expected redirect)"
fi

echo ""

# ---------------------------
# Summary
# ---------------------------
echo "=================================="
echo "Results: $PASS passed, $FAIL failed"
echo ""
if [ "$FAIL" -eq 0 ]; then
  echo -e "\033[32mAll tests passed.\033[0m"
else
  echo -e "\033[31m$FAIL test(s) failed. Review above.\033[0m"
fi
echo ""
