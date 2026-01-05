#!/bin/bash

# Test Events Dashboard Endpoint
# Run: ./test_events_dashboard.sh

BASE_URL="https://dev-apps.utycreative.cloud/api"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo "🚀 Testing Events Dashboard Stats"
echo "Target: $BASE_URL"
echo "----------------------------------------"

# Step 1: Login as Admin
echo -e "\n🔑 [1] Logging in as Admin..."
LOGIN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@uty.ac.id","password":"password123"}')

TOKEN=$(echo $LOGIN_RES | jq -r '.data.accessToken')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Login Failed${NC}"
    echo $LOGIN_RES
    exit 1
fi

echo -e "${GREEN}✅ Login Success${NC}"

# Step 2: Get Events Dashboard Stats
echo -e "\n📊 [2] Fetching Events Dashboard Stats..."
STATS_RES=$(curl -s -X GET "$BASE_URL/dashboard/events-stats" \
  -H "Authorization: Bearer $TOKEN")

IS_SUCCESS=$(echo $STATS_RES | jq -r '.success')

if [ "$IS_SUCCESS" == "true" ]; then
    echo -e "${GREEN}✅ Dashboard Stats Retrieved${NC}"
    
    # Display Key Metrics
    TOTAL_EVENTS=$(echo $STATS_RES | jq -r '.data.totalEvents')
    PUBLISHED=$(echo $STATS_RES | jq -r '.data.published')
    TOTAL_REGISTRANTS=$(echo $STATS_RES | jq -r '.data.totalRegistrants')
    PENDING_PAYMENT=$(echo $STATS_RES | jq -r '.data.payment.pending')
    PAID=$(echo $STATS_RES | jq -r '.data.payment.paid')
    ATTENDED=$(echo $STATS_RES | jq -r '.data.attendance.attended')
    UPCOMING_COUNT=$(echo $STATS_RES | jq -r '.data.upcomingEvents | length')
    RECENT_REG_COUNT=$(echo $STATS_RES | jq -r '.data.recentRegistrations | length')
    
    echo ""
    echo "   📈 Total Events: $TOTAL_EVENTS"
    echo "   📢 Published: $PUBLISHED"
    echo "   👥 Total Registrants: $TOTAL_REGISTRANTS"
    echo "   💰 Pending Payment: $PENDING_PAYMENT"
    echo "   ✅ Paid: $PAID"
    echo "   🎯 Attended: $ATTENDED"
    echo "   📅 Upcoming Events: $UPCOMING_COUNT"
    echo "   🆕 Recent Registrations: $RECENT_REG_COUNT"
    echo ""
    
    # Show first upcoming event if exists
    if [ "$UPCOMING_COUNT" -gt 0 ]; then
        FIRST_UPCOMING=$(echo $STATS_RES | jq -r '.data.upcomingEvents[0].title')
        echo -e "${GREEN}   Next Event: $FIRST_UPCOMING${NC}"
    fi
else
    echo -e "${RED}❌ Failed to retrieve stats${NC}"
    echo $STATS_RES
    exit 1
fi

echo -e "\n🎉 Dashboard Test Completed Successfully!"
