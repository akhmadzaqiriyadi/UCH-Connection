
import { bookingService } from './src/features/bookings/bookings.service';
import { ruanganService } from './src/features/ruangan/ruangan.service';
import { authService } from './src/features/auth/auth.service';
import { db } from './src/db';
import { ruangan, users, bookings, checkins } from './src/db/schema';
import { eq } from 'drizzle-orm';

console.log('🧪 Testing Dynamic Hours & Outside Office Request...');

const TEST_ROOM_CODE = 'LAB-DYN-TEST';
const TEST_EMAIL = 'dynamic.tester@uty.ac.id';

try {
  // Setup Data
  await db.delete(checkins).execute();
  await db.delete(bookings).execute();
  await db.delete(ruangan).where(eq(ruangan.kode, TEST_ROOM_CODE));
  await db.delete(users).where(eq(users.email, TEST_EMAIL));

  const room = await ruanganService.create({
    kode: TEST_ROOM_CODE,
    nama: 'Dynamic Test Room',
    lantai: 1,
    gedung: 'Test',
    kapasitas: 10
  });

  const auth = await authService.register({
    email: TEST_EMAIL, password: 'pw', fullName: 'Dyn Tester', role: 'mahasiswa'
  });
  const userId = auth.user.id;

  // 1. Test Standard Hour (09:00 - 10:30) - Dynamic Minute
  console.log('🕐 Booking Standard Time (09:30 - 10:45)...');
  const d1 = new Date();
  d1.setHours(9, 30, 0, 0);
  const d1End = new Date(d1);
  d1End.setHours(10, 45, 0, 0); // 1h 15m duration

  const b1 = await bookingService.create(userId, {
    ruanganId: room.id,
    purpose: 'Kuliah Reguler',
    audienceCount: 10,
    startTime: d1.toISOString(),
    endTime: d1End.toISOString()
  });
  console.log('  ✅ Standard Booking PENDING:', b1.id);

  // 2. Test Outside Office Hour (19:00 - 21:00) - "By Request"
  console.log('🌙 Booking Outside Office (19:00 - 21:00)...');
  const d2 = new Date();
  d2.setHours(19, 0, 0, 0);
  const d2End = new Date(d2);
  d2End.setHours(21, 0, 0, 0);

  const b2 = await bookingService.create(userId, {
    ruanganId: room.id,
    purpose: 'Kegiatan Malam (Request)',
    audienceCount: 10,
    startTime: d2.toISOString(),
    endTime: d2End.toISOString()
  });
  console.log('  ✅ Outside Hour Booking PENDING:', b2.id); // Should succeed creation

  // 3. Verify Availability Helper only (Independent check)
  console.log('🔍 Checking Operating Hours Logic...');
  
  // We already proved we CAN book it (Step 2 succeeded).
  // Now just verify the helper correctly identifies it as "Non-Standard"
  const hourCheck = bookingService.isWithinOperatingHours(d2, d2End);
  console.log(`  ℹ️ Is Standard Hour (08-16)? ${hourCheck} (Expected: false)`);

  if (hourCheck === true) {
      throw new Error('Logic check failed: 19:00-21:00 should be Non-Standard');
  }

  // Also verify the booking is in DB
  const savedBooking = await bookingService.findById(b2.id);
  if (!savedBooking) throw new Error('Booking not saved');
  console.log('  ✅ Booking successfully saved in DB with status:', savedBooking.status);

  console.log('🎉 System handles dynamic & outside hours correctly!');
  process.exit(0);

} catch (error) {
  console.error('❌ Test Failed:', error);
  process.exit(1);
}
