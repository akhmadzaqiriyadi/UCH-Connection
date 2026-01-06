#!/bin/bash

# Load test credentials from environment
if [ -f .env.test ]; then
    source .env.test
fi

ADMIN_EMAIL="${ADMIN_EMAIL:-admin@uty.ac.id}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-password123}"
BASE_URL="${BASE_URL:-https://dev-apps.utycreative.cloud/api}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting Advanced Event Scenarios Test${NC}"
echo "Target: $BASE_URL"
echo "----------------------------------------"

# --- LOGIN ADMIN ---
echo -e "\n🔑 [0] Logging in as Admin..."
LOGIN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RES | jq -r 'if .data.accessToken then .data.accessToken else .accessToken end')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Admin Login Failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Login Success${NC}"


# ========================================================
# CASE 1: FREE EVENT (Auto-Approve, No Payment)
# ========================================================
echo -e "\n${YELLOW}🧪 CASE 1: Free Event (Auto-Approve)${NC}"

# 1.1 Create Free Event
echo "   creating event..."
FREE_EVENT_PAYLOAD='{
  "title": "Gratisan Seminar 2026",
  "description": "Makan gratis",
  "startTime": "2026-03-01T09:00:00Z",
  "endTime": "2026-03-01T12:00:00Z",
  "type": "Seminar",
  "isOnline": false,
  "price": 0,
  "quota": 50,
  "isPublic": true,
  "registrationFormSchema": [
     {
        "key": "notes",
        "label": "Catatan",
        "type": "text",
        "required": false
     }
  ]
}'

FREE_RES=$(curl -s -X POST "$BASE_URL/events" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$FREE_EVENT_PAYLOAD")

if [[ ! "$FREE_RES" == *"success\":true"* ]]; then
   echo -e "${RED}❌ Create Failed${NC}"
   echo "Response: $FREE_RES"
   exit 1
fi
FREE_EVENT_ID=$(echo $FREE_RES | jq -r '.data.id')
echo -e "${GREEN}   ✅ Event Created: $FREE_EVENT_ID${NC}"

# 1.2 Register Guest
echo "   registering guest..."
GUEST_PAYLOAD='{"guestName": "Si Gratisan", "guestEmail": "free@guy.com"}'
REG_FREE_RES=$(curl -s -X POST "$BASE_URL/events/$FREE_EVENT_ID/register" -H "Content-Type: application/json" -d "$GUEST_PAYLOAD")

PAYMENT_STATUS=$(echo $REG_FREE_RES | jq -r '.data.paymentStatus')
HAS_QR=$(echo $REG_FREE_RES | jq -r '.data.qrToken != null')

if [ "$PAYMENT_STATUS" == "free" ] && [ "$HAS_QR" == "true" ]; then
    echo -e "${GREEN}   ✅ SUCCESS: Payment Status '$PAYMENT_STATUS' & QR Token Generated Instantly!${NC}"
    echo "   QR Token: $(echo $REG_FREE_RES | jq -r '.data.qrToken')"
else
    echo -e "${RED}   ❌ FAILED: Expected free status and QR token${NC}"
    echo $REG_FREE_RES
fi


# ========================================================
# CASE 2: QUOTA LIMIT (Full Booked)
# ========================================================
echo -e "\n${YELLOW}🧪 CASE 2: Quota Limit Test${NC}"

# 2.1 Create Limited Event (Quota: 1)
echo "   creating limited event (Quota: 1)..."
LIMIT_EVENT_PAYLOAD='{
  "title": "Exclusive 1 Person Workshop",
  "startTime": "2026-04-01T09:00:00Z",
  "endTime": "2026-04-01T12:00:00Z",
  "type": "Workshop",
  "isOnline": false,
  "price": 0,
  "quota": 1, 
  "isPublic": true,
  "registrationFormSchema": []
}'

LIMIT_RES=$(curl -s -X POST "$BASE_URL/events" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$LIMIT_EVENT_PAYLOAD")
LIMIT_EVENT_ID=$(echo $LIMIT_RES | jq -r '.data.id')
echo -e "${GREEN}   ✅ Event Created: $LIMIT_EVENT_ID${NC}"

# 2.2 Register User 1 (Should Success)
echo "   registering User 1 (The Chosen One)..."
USER1_RES=$(curl -s -X POST "$BASE_URL/events/$LIMIT_EVENT_ID/register" -H "Content-Type: application/json" -d '{"guestName": "User Satu", "guestEmail": "one@test.com"}')
USER1_ID=$(echo $USER1_RES | jq -r '.data.id')

if [ "$USER1_ID" != "null" ]; then
    echo -e "${GREEN}   ✅ User 1 Success${NC}"
else
    echo -e "${RED}   ❌ User 1 Failed (Unexpected)${NC}"
    echo $USER1_RES
    exit 1
fi

# 2.3 Register User 2 (Should Fail)
echo "   registering User 2 (The Late Comer)..."
USER2_RES=$(curl -s -X POST "$BASE_URL/events/$LIMIT_EVENT_ID/register" -H "Content-Type: application/json" -d '{"guestName": "User Telat", "guestEmail": "two@test.com"}')
ERROR_MSG=$(echo $USER2_RES | jq -r '.error')

if [[ "$ERROR_MSG" == *"quota is full"* ]]; then
    echo -e "${GREEN}   ✅ SUCCESS: Blocked as expected! ($ERROR_MSG)${NC}"
else
    echo -e "${RED}   ❌ FAILED: User 2 should be rejected but got response:${NC}"
    echo $USER2_RES
fi


# ========================================================
# CASE 3: ROLE RESTRICTION (Mahasiswa cannot create Event)
# ========================================================
echo -e "\n${YELLOW}🧪 CASE 3: Role Permission Check${NC}"

# 3.1 Login as Mahasiswa
echo "   logging in as Mahasiswa..."
MHS_LOGIN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"mahasiswa1@uch.ac.id\",\"password\":\"mhs123\"}")

MHS_TOKEN=$(echo $MHS_LOGIN_RES | jq -r 'if .data.accessToken then .data.accessToken else .accessToken end')

if [ "$MHS_TOKEN" == "null" ]; then
    echo -e "${RED}   ❌ Pre-condition Failed: Mahasiswa Login Failed${NC}"
    # Register mahasiswa if not exists (optional fallback logic omitted for brevity)
else
    # 3.2 Try Create Event
    echo "   attempting to create event as Mahasiswa..."
    FORBIDDEN_RES=$(curl -s -X POST "$BASE_URL/events" \
      -H "Authorization: Bearer $MHS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$FREE_EVENT_PAYLOAD")
    
    ERROR_MSG=$(echo $FORBIDDEN_RES | jq -r '.error')
    
    if [[ "$ERROR_MSG" == *"Forbidden"* ]] || [[ "$ERROR_MSG" == *"Only Admin"* ]]; then
        echo -e "${GREEN}   ✅ SUCCESS: Blocked as expected! ($ERROR_MSG)${NC}"
    else
        echo -e "${RED}   ❌ FAILED: Mahasiswa SHOULD NOT be able to create event!${NC}"
        echo $FORBIDDEN_RES
    fi
fi


# ========================================================
# CASE 4: DYNAMIC FORM VALIDATION (Missing Field)
# ========================================================
echo -e "\n${YELLOW}🧪 CASE 4: Dynamic Form Validation${NC}"

# 4.1 Create Event with Required Form
echo "   creating event with strict form..."
STRICT_EVENT_PAYLOAD='{
  "title": "Strict Event 2026",
  "startTime": "2026-05-01T09:00:00Z",
  "endTime": "2026-05-01T12:00:00Z",
  "type": "Seminar",
  "isOnline": false,
  "price": 0,
  "quota": 100,
  "isPublic": true,
  "registrationFormSchema": [
     { "key": "ktp", "label": "No KTP", "type": "text", "required": true }
  ]
}'
STRICT_RES=$(curl -s -X POST "$BASE_URL/events" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$STRICT_EVENT_PAYLOAD")
STRICT_ID=$(echo $STRICT_RES | jq -r '.data.id')

# 4.2 Register with Missing Field
echo "   registering with missing 'ktp' field..."
INVALID_REG_RES=$(curl -s -X POST "$BASE_URL/events/$STRICT_ID/register" \
  -H "Content-Type: application/json" \
  -d '{"guestName": "No KTP Guy", "guestEmail": "noktp@test.com", "registrationData": {}}')

VALIDATION_MSG=$(echo $INVALID_REG_RES | jq -r '.error')

if [[ "$VALIDATION_MSG" == *"Missing required field"* ]]; then
    echo -e "${GREEN}   ✅ SUCCESS: Validation caught missing field! ($VALIDATION_MSG)${NC}"
else
    echo -e "${RED}   ❌ FAILED: Should fail validation but passed or unexpected error${NC}"
    echo $INVALID_REG_RES
fi


# ========================================================
# CASE 5: ADMIN VIEW REGISTRANTS
# ========================================================
echo -e "\n${YELLOW}🧪 CASE 5: Admin View Registrants${NC}"

# 5.1 Get Registrants of the Free Event (Case 1)
echo "   fetching registrants list..."
REGISTRANTS_RES=$(curl -s -X GET "$BASE_URL/events/$FREE_EVENT_ID/registrants" \
  -H "Authorization: Bearer $TOKEN")

IS_SUCCESS=$(echo $REGISTRANTS_RES | jq -r '.success')
DATA_COUNT=$(echo $REGISTRANTS_RES | jq -r '.data | length')

if [ "$IS_SUCCESS" == "true" ]; then
    echo -e "${GREEN}   ✅ SUCCESS: Admin can view registrants (Count: $DATA_COUNT)${NC}"
    # Optional: Check if guest name exists in response
else
    echo -e "${RED}   ❌ FAILED: Get Registrants failed${NC}"
    echo $REGISTRANTS_RES
fi


# ========================================================
# CASE 6: USER JOURNEY (Mahasiswa)
# ========================================================
echo -e "\n${YELLOW}🧪 CASE 6: User Journey (Mahasiswa)${NC}"

# 6.1 Login as Mahasiswa (Using Token from Case 3)
echo "   verifying mahasiswa token..."
if [ "$MHS_TOKEN" == "null" ] || [ -z "$MHS_TOKEN" ]; then
    echo -e "${RED}   ❌ Mahasiswa Token Missing (Login failed in Case 3)${NC}"
    exit 1
fi

# 6.2 Register to Free Event (As Authenticated User)
echo "   registering as Auth User to Free Event..."
# Note: For Auth User, guestName/Email is NOT required. UserId is taken from token.
USER_REG_RES=$(curl -s -X POST "$BASE_URL/events/$FREE_EVENT_ID/register" \
  -H "Authorization: Bearer $MHS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{}")

USER_PAYMENT_STATUS=$(echo $USER_REG_RES | jq -r '.data.paymentStatus')
USER_HAS_QR=$(echo $USER_REG_RES | jq -r '.data.qrToken != null')

if [ "$USER_PAYMENT_STATUS" == "free" ] && [ "$USER_HAS_QR" == "true" ]; then
    echo -e "${GREEN}   ✅ User Registration Success! (QR Generated)${NC}"
else
    echo -e "${RED}   ❌ User Registration Failed${NC}"
    echo $USER_REG_RES
fi

# 6.3 Check My Tickets
echo "   checking 'My Tickets'..."
MY_TICKETS_RES=$(curl -s -X GET "$BASE_URL/events/me/tickets" \
  -H "Authorization: Bearer $MHS_TOKEN")

TICKET_COUNT=$(echo $MY_TICKETS_RES | jq -r '.data | length')
FIRST_TICKET_TITLE=$(echo $MY_TICKETS_RES | jq -r '.data[0].event.title')

if [ "$TICKET_COUNT" -gt 0 ]; then
    echo -e "${GREEN}   ✅ My Tickets OK! Found $TICKET_COUNT ticket(s).${NC}"
    echo -e "      User has ticket for: $FIRST_TICKET_TITLE"
else
    echo -e "${RED}   ❌ My Tickets Empty (Expected at least 1)${NC}"
    echo $MY_TICKETS_RES
fi

echo -e "\n🎉 All Scenarios Completed!"
