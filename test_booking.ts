
import { bookingService } from './src/features/bookings/bookings.service';
import { ruanganService } from './src/features/ruangan/ruangan.service';
import { authService } from './src/features/auth/auth.service';
import { db } from './src/db';
import { bookings, ruangan, users } from './src/db/schema';
import { eq } from 'drizzle-orm';

console.log('🧪 Testing Booking Flow...');

// Setup
const TEST_ROOM_CODE = 'LAB-BOOK-TEST';
const TEST_USER_EMAIL = 'booking.test@uty.ac.id';

try {
  // 1. Prepare Room and User
  console.log('🔄 Preparing Test Data...');
  
  // Cleanup
  await db.delete(ruangan).where(eq(ruangan.kode, TEST_ROOM_CODE));
  await db.delete(users).where(eq(users.email, TEST_USER_EMAIL));

  const room = await ruanganService.create({
    kode: TEST_ROOM_CODE,
    nama: 'Booking Test Room',
    lantai: 1,
    gedung: 'Test',
    kapasitas: 10,
    status: 'available'
  });

  const authData = await authService.register({
    email: TEST_USER_EMAIL,
    password: 'password123',
    fullName: 'Booking Tester',
    role: 'mahasiswa'
  });
  const userId = authData.user.id;

  // 2. Booking Request
  console.log('📅 Requesting Booking...');
  const startTime = new Date();
  startTime.setHours(startTime.getHours() + 24); // Tomorrow
  const endTime = new Date(startTime);
  endTime.setHours(endTime.getHours() + 2); // 2 Hours duration

  const booking = await bookingService.create(userId, {
    ruanganId: room.id,
    purpose: 'Skripsi Discussion',
    audienceCount: 5,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString()
  });

  console.log('✅ Booking Created:', booking.id, 'Status:', booking.status);

  // 3. Overlap Check
  console.log('🛑 Testing Overlap...');
  try {
    await bookingService.create(userId, {
      ruanganId: room.id,
      purpose: 'Overlap Attempt',
      audienceCount: 5,
      startTime: startTime.toISOString(), // Same time
      endTime: endTime.toISOString()
    });
    throw new Error('Overlap check failed (Should throw error)');
  } catch (e: any) {
    if (e.message.includes('already booked')) {
        console.log('✅ Overlap Prevented');
    } else {
        throw e;
    }
  }

  // 4. Admin Approval
  console.log('👮 Admin Approving...');
  const approved = await bookingService.processBooking(booking.id, {
    status: 'approved'
  });

  if (approved.status !== 'approved' || !approved.qrToken) {
    throw new Error('Approval failed');
  }
  console.log('✅ Approved & QR Token Generated:', approved.qrToken);

  console.log('🎉 Booking Flow Logic Passed!');
  process.exit(0);

} catch (error) {
  console.error('❌ Test Failed:', error);
  process.exit(1);
}
