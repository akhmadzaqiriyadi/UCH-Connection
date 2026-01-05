
import { bookingService } from './src/features/bookings/bookings.service';
import { ruanganService } from './src/features/ruangan/ruangan.service';
import { authService } from './src/features/auth/auth.service';
import { db } from './src/db';
import { bookings, ruangan, users, checkins } from './src/db/schema';
import { eq } from 'drizzle-orm';

console.log('🧪 Testing Booking Check-in Flow...');

// Setup
const TEST_ROOM_CODE = 'LAB-CHECKIN-TEST';
const TEST_USER_EMAIL = 'checkin.test@uty.ac.id';

try {
  // 1. Prepare Room and User
  // Cleanup
  await db.delete(checkins).execute();
  await db.delete(bookings).execute(); // Cascade usually handling but let's be safe
  await db.delete(ruangan).where(eq(ruangan.kode, TEST_ROOM_CODE));
  await db.delete(users).where(eq(users.email, TEST_USER_EMAIL));

  console.log('🔄 Creating Data...');
  const room = await ruanganService.create({
    kode: TEST_ROOM_CODE,
    nama: 'Checkin Test Room',
    lantai: 1,
    gedung: 'Test',
    kapasitas: 10,
    status: 'available'
  });

  const authData = await authService.register({
    email: TEST_USER_EMAIL,
    password: 'password123',
    fullName: 'Checkin Tester',
    role: 'mahasiswa'
  });
  const userId = authData.user.id;

  // 2. Booking Request & Approval
  const startTime = new Date();
  startTime.setHours(startTime.getHours() + 1); 
  const endTime = new Date(startTime);
  endTime.setHours(endTime.getHours() + 2);

  const booking = await bookingService.create(userId, {
    ruanganId: room.id,
    purpose: 'Checkin Test',
    audienceCount: 5,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString()
  });

  const approved = await bookingService.processBooking(booking.id, {
    status: 'approved'
  });
  
  if (!approved.qrToken) throw new Error('No QR Token');
  console.log('✅ Booking Approved. QR Token:', approved.qrToken);

  // 3. User Check-in (Simulated Scan)
  console.log('📲 Scanning QR...');
  const checkinResult = await bookingService.checkIn(approved.qrToken, userId); // Self scan or officer scan

  if (!checkinResult.success) throw new Error('Checkin failed result');
  console.log('✅ Check-in Success:', checkinResult.message);

  // Verify DB
  const checkedBooking = await bookingService.findById(booking.id);
  if (checkedBooking.status !== 'checked_in') throw new Error('Status not updated');
  
  console.log('🎉 Check-in Flow Passed!');
  process.exit(0);

} catch (error) {
  console.error('❌ Test Failed:', error);
  process.exit(1);
}
