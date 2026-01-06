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
NC='\033[0m'

echo "🚀 Starting Event System Test (Production)"
echo "Target: $BASE_URL"
echo "----------------------------------------"

# 1. Login Admin
echo -e "\n🔑 [1] Logging in as Admin..."
LOGIN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RES | jq -r 'if .data.accessToken then .data.accessToken else .accessToken end')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Admin Login Failed${NC}"
    echo $LOGIN_RES
    exit 1
fi
echo -e "${GREEN}✅ Login Success${NC}"

# 2. Create Event (Paid + Dynamic Form)
echo -e "\n📅 [2] Creating Paid Workshop Event..."
EVENT_PAYLOAD='{
  "title": "Workshop Backend Masterclass 2026",
  "description": "Belajar Backend dari nol sampai deploy",
  "startTime": "2026-02-01T09:00:00Z",
  "endTime": "2026-02-01T15:00:00Z",
  "type": "Workshop",
  "isOnline": true,
  "location": "Zoom Meeting",
  "price": 50000,
  "quota": 100,
  "isPublic": true,
  "registrationFormSchema": [
    {
      "key": "laptop_os",
      "label": "Operating System Laptop",
      "type": "select",
      "required": true,
      "options": ["Windows", "MacOS", "Linux"]
    },
    {
      "key": "github_username",
      "label": "GitHub Username",
      "type": "text",
      "required": true
    }
  ]
}'

CREATE_RES=$(curl -s -X POST "$BASE_URL/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$EVENT_PAYLOAD")

EVENT_ID=$(echo $CREATE_RES | jq -r '.data.id')

if [ "$EVENT_ID" == "null" ]; then
   echo -e "${RED}❌ Create Event Failed${NC}"
   echo $CREATE_RES
   exit 1
fi
echo -e "${GREEN}✅ Event Created! ID: $EVENT_ID${NC}"

# 3. Guest Registration
echo -e "\n📝 [3] Registering as Guest..."
REGISTER_PAYLOAD='{
  "guestName": "Budi Tamu",
  "guestEmail": "budi.guest@gmail.com",
  "guestPhone": "081234567890",
  "registrationData": {
    "laptop_os": "MacOS",
    "github_username": "budicoding"
  }
}'

REG_RES=$(curl -s -X POST "$BASE_URL/events/$EVENT_ID/register" \
  -H "Content-Type: application/json" \
  -d "$REGISTER_PAYLOAD")

REGISTRANT_ID=$(echo $REG_RES | jq -r '.data.id')
PAYMENT_STATUS=$(echo $REG_RES | jq -r '.data.paymentStatus')

if [ "$REGISTRANT_ID" == "null" ]; then
   echo -e "${RED}❌ Registration Failed${NC}"
   echo $REG_RES
   exit 1
fi
echo -e "${GREEN}✅ Registered Success! ID: $REGISTRANT_ID${NC}"
echo "   Status: $PAYMENT_STATUS (Expected: pending)"

# 4. Upload Payment Proof (Dummy)
echo -e "\n📤 [4] Uploading Fake Payment Proof..."
# Create dummy file
echo "fake image content" > dummy_proof.jpg

UPLOAD_RES=$(curl -s -X POST "$BASE_URL/events/upload-proof" \
  -F "file=@dummy_proof.jpg" \
  -F "registrantId=$REGISTRANT_ID")

PROOF_PATH=$(echo $UPLOAD_RES | jq -r '.data.paymentProof')

if [ "$PROOF_PATH" == "null" ]; then
   echo -e "${RED}❌ Upload Failed${NC}"
   echo $UPLOAD_RES
   exit 1
fi
echo -e "${GREEN}✅ Upload Success! Path: $PROOF_PATH${NC}"

# 5. Verify Payment (Admin)
echo -e "\n👮 [5] Verifying Payment (Admin)..."
VERIFY_PAYLOAD='{"status": "paid"}'

VERIFY_RES=$(curl -s -X POST "$BASE_URL/events/registrants/$REGISTRANT_ID/verify" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$VERIFY_PAYLOAD")

QR_TOKEN=$(echo $VERIFY_RES | jq -r '.data.qrToken')

if [ "$QR_TOKEN" == "null" ]; then
   echo -e "${RED}❌ Verification Failed${NC}"
   echo $VERIFY_RES
   exit 1
fi
echo -e "${GREEN}✅ Payment Verified! QR Token Issued.${NC}"

# 6. Check-in (QR Scan)
echo -e "\n📲 [6] Scanning QR Code (Check-in)..."
CHECKIN_PAYLOAD="{\"qrToken\": \"$QR_TOKEN\"}"

CHECKIN_RES=$(curl -s -X POST "$BASE_URL/events/checkin" \
  -H "Content-Type: application/json" \
  -d "$CHECKIN_PAYLOAD")

CHECK_STATUS=$(echo $CHECKIN_RES | jq -r '.success')

if [ "$CHECK_STATUS" == "true" ]; then
    GUEST=$(echo $CHECKIN_RES | jq -r '.data.guestName')
    EVENT=$(echo $CHECKIN_RES | jq -r '.data.eventName')
    echo -e "${GREEN}✅ Check-in Success!${NC}"
    echo "   Welcome $GUEST to $EVENT"
else
    echo -e "${RED}❌ Check-in Failed${NC}"
    echo $CHECKIN_RES
fi

# Cleanup
rm dummy_proof.jpg

echo -e "\n🎉 End of Test Script"
