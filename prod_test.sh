#!/bin/bash

# Configuration
BASE_URL="https://dev-apps.utycreative.cloud/api"
ADMIN_EMAIL="admin@uty.ac.id"
ADMIN_PASSWORD="password123"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "🚀 Starting Production API Test"
echo "Target: $BASE_URL"
echo "----------------------------------------"

# 1. Health Check
echo -e "\n📡 Testing Health..."
curl -s "$BASE_URL/health" | jq
echo "----------------------------------------"

# 2. Login as Admin
echo -e "\n🔑 Logging in as Admin..."
LOGIN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RES | jq -r '.data.accessToken')

if [ "$TOKEN" != "null" ]; then
    echo -e "${GREEN}✅ Admin Login Success${NC}"
else
    echo -e "${RED}❌ Admin Login Failed${NC}"
    echo $LOGIN_RES
    exit 1
fi

echo "----------------------------------------"

# ================= DASHBOARD & MASTER GROUP (Verified) =================

echo -e "\n📊 Testing Dashboard Stats (Admin)..."
curl -s "$BASE_URL/dashboard/stats" \
  -H "Authorization: Bearer $TOKEN" | jq

echo -e "\n🗂️ Testing Master Data (Public/Auth)..."
echo "  [GET] /master/fakultas"
curl -s "$BASE_URL/master/fakultas" \
  -H "Authorization: Bearer $TOKEN" | head -n 5 

echo -e "\n  [GET] /master/prodi"
curl -s "$BASE_URL/master/prodi" \
  -H "Authorization: Bearer $TOKEN" | head -n 5
echo ""
echo "----------------------------------------"


# ================= LIST CHECKS (Condensed) =================

echo -e "\n🎓 Testing Mahasiswa List (Structure)..."
curl -s "$BASE_URL/mahasiswa?limit=1" \
  -H "Authorization: Bearer $TOKEN" | jq -c '.meta'

echo -e "\n👨‍🏫 Testing Dosen List (Structure)..."
curl -s "$BASE_URL/dosen?limit=1" \
  -H "Authorization: Bearer $TOKEN" | jq -c '.meta'

echo -e "\n🏆 Testing UKM List (Structure)..."
curl -s "$BASE_URL/ukm?limit=1" \
  -H "Authorization: Bearer $TOKEN" | jq -c '.data[0] | {id, nama}'

echo -e "\n📢 Testing Himpunan List (Structure)..."
curl -s "$BASE_URL/himpunan?limit=1" \
  -H "Authorization: Bearer $TOKEN" | jq -c '.data[0] | {id, nama}'

echo -e "\n✅ All Tests Completed"
