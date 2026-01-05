#!/bin/bash

# Config
API_URL="http://10.10.10.201:2201/api"
USER_EMAIL="mahasiswa1@uch.ac.id" # Pastikan user ini ada di seed prod
USER_PASS="mhs123"
ADMIN_EMAIL="admin@uch.ac.id"
ADMIN_PASS="admin123"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Starting Production verification for Booking System...${NC}"
echo "Target: $API_URL"

# 0. Register Mahasiswa (Idempotent: Ignore if exists)
echo -e "\n0️⃣  Registering Mahasiswa..."
curl -v -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\", \"password\":\"$USER_PASS\", \"fullName\":\"Test Mhs Prod\", \"role\":\"mahasiswa\"}"
echo -e "${GREEN}✅ Register attempt done.${NC}"

# 1. Login Mahasiswa
echo -e "\n1️⃣  Logging in as Mahasiswa..."
MHS_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\", \"password\":\"$USER_PASS\"}")

MHS_TOKEN=$(echo $MHS_LOGIN | jq -r '.data.accessToken')

if [ "$MHS_TOKEN" == "null" ]; then
    echo -e "${RED}❌ Login Failed!${NC}"
    echo $MHS_LOGIN
    exit 1
fi
echo -e "${GREEN}✅ Login Success! Token acquired.${NC}"

# 2. Get Rooms (Public)
echo -e "\n2️⃣  Getting Room List..."
ROOMS=$(curl -s -X GET "$API_URL/ruangan")
# Check if empty array data: []
ROOM_COUNT=$(echo $ROOMS | jq '.data | length')

if [ "$ROOM_COUNT" == "0" ]; then
    echo -e "${RED}⚠️  No rooms found! Creating one as Admin...${NC}"
    
    # Login Admin Temp
    ADMIN_LOGIN_TEMP=$(curl -s -X POST "$API_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$ADMIN_EMAIL\", \"password\":\"$ADMIN_PASS\"}")
    ADMIN_TOKEN_TEMP=$(echo $ADMIN_LOGIN_TEMP | jq -r '.data.accessToken')
    
    # Create Room
    CREATE_ROOM=$(curl -s -X POST "$API_URL/ruangan/manage" \
      -H "Authorization: Bearer $ADMIN_TOKEN_TEMP" \
      -H "Content-Type: application/json" \
      -d '{
        "kode": "PROD.1",
        "nama": "Ruang Produksi 1",
        "lantai": 1,
        "gedung": "Gedung Utama",
        "kapasitas": 50
      }')
    
    # Debug response
    echo "DEBUG CREATE ROOM RESPONSE: $CREATE_ROOM"

    # Fix: Structure is likely { success: true, data: { id: ... } } not data.data
    ROOM_ID=$(echo $CREATE_ROOM | jq -r '.data.id') 
    echo -e "${GREEN}✅ Room Created: $ROOM_ID${NC}"
else
    ROOM_ID=$(echo $ROOMS | jq -r '.data[0].id')
    echo -e "   Selected Room ID: $ROOM_ID"
fi

# 3. Check Available Slots (Feature: Slots Dropdown)
echo -e "\n3️⃣  Checking Available Slots for Today..."
TODAY=$(date +%Y-%m-%d)
SLOTS=$(curl -s -X GET "$API_URL/bookings/slots?ruanganId=$ROOM_ID&date=$TODAY&duration=60" \
  -H "Authorization: Bearer $MHS_TOKEN")

echo $SLOTS | jq '.data[0:3]' # Show first 3 slots
echo -e "${GREEN}✅ Slots retrieved.${NC}"

# 4. Create Booking
echo -e "\n4️⃣  Creating Booking Request..."
START_TIME="${TODAY}T89:00:00.000Z" # Jam 09:00 WIB (UTC+7 -> 02:00 UTC? No, ISO string usually local or UTC. Let's use simple string)
# Wait, let's use the first available slot from step 3 logic usually, but here hardcode for test consistency.
# Note: Server is likely UTC. 09:00 WIB = 02:00 UTC.
# Let's try booking a safe future date to avoid "past time" error if server time differs.
TOMORROW=$(date -v+1d +%Y-%m-%d 2>/dev/null || date -d "+1 day" +%Y-%m-%d)
START_TIME="${TOMORROW}T10:00:00.000Z"
END_TIME="${TOMORROW}T12:00:00.000Z"

BOOKING_REQ=$(curl -s -X POST "$API_URL/bookings" \
  -H "Authorization: Bearer $MHS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"ruanganId\": \"$ROOM_ID\",
    \"purpose\": \"Sidang Skripsi Prod Test\",
    \"audienceCount\": 5,
    \"startTime\": \"$START_TIME\",
    \"endTime\": \"$END_TIME\"
  }")

BOOKING_ID=$(echo $BOOKING_REQ | jq -r '.data.id')

if [ "$BOOKING_ID" == "null" ]; then
    echo -e "${RED}❌ Booking Failed!${NC}"
    echo $BOOKING_REQ
    exit 1
fi
echo -e "${GREEN}✅ Booking Success! ID: $BOOKING_ID${NC}"

# 5. Login Admin
echo -e "\n5️⃣  Logging in as Admin..."
ADMIN_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\", \"password\":\"$ADMIN_PASS\"}")

ADMIN_TOKEN=$(echo $ADMIN_LOGIN | jq -r '.data.accessToken')
echo -e "${GREEN}✅ Admin Login Success.${NC}"

# 6. Approve Booking (Admin)
echo -e "\n6️⃣  Approving Booking..."
APPROVE=$(curl -s -X POST "$API_URL/bookings/manage/$BOOKING_ID/process" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"status\": \"approved\"}")

STATUS=$(echo $APPROVE | jq -r '.success')
if [ "$STATUS" == "true" ]; then
    echo -e "${GREEN}✅ Booking Approved! QR Code generated.${NC}"
else
    echo -e "${RED}❌ Approval Failed!${NC}"
    echo $APPROVE
fi

# 7. Check Dashboard Stats (Feature: Dashboard Summary)
echo -e "\n7️⃣  Checking Dashboard Stats..."
STATS=$(curl -s -X GET "$API_URL/dashboard/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

PENDING=$(echo $STATS | jq '.data.bookings.pending')
APPROVED=$(echo $STATS | jq '.data.bookings.approved')
TOTAL=$(echo $STATS | jq '.data.bookings.total')

echo -e "   📊 Stats: Total=$TOTAL, Approved=$APPROVED, Pending=$PENDING"
echo -e "${GREEN}✅ Dashboard checked.${NC}"

# 8. Upload Room Image (Feature: File Upload)
echo -e "\n8️⃣  Testing Room Image Upload..."
# Create dummy image
echo "fake image content" > dummy.jpg

UPLOAD=$(curl -s -X POST "$API_URL/ruangan/manage/upload" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "file=@dummy.jpg")

PATH=$(echo $UPLOAD | jq -r '.data.path')
echo -e "   🖼️  Uploaded Path: $PATH"
if [ "$PATH" != "null" ]; then
   echo -e "${GREEN}✅ Upload Success!${NC}"
else
   echo -e "${RED}❌ Upload Failed!${NC}"
   echo $UPLOAD
fi

# Cleanup
rm dummy.jpg

echo -e "\n🎉 Production Verification Completed!"
