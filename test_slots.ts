
import { bookingService } from './src/features/bookings/bookings.service';
import { ruanganService } from './src/features/ruangan/ruangan.service';
import { db } from './src/db';
import { ruangan, bookings } from './src/db/schema';
import { eq } from 'drizzle-orm';
import { authService } from './src/features/auth/auth.service';

console.log('🧪 Testing Slot Generator Dropdown...');

const TEST_ROOM_CODE = 'LAB-SLOTS';

try {
  // 1. Setup Room
  await db.delete(bookings).execute();
  await db.delete(ruangan).where(eq(ruangan.kode, TEST_ROOM_CODE));

  const room = await ruanganService.create({
    kode: TEST_ROOM_CODE,
    nama: 'Slot Test Room',
    lantai: 1,
    gedung: 'Test',
    kapasitas: 10
  });

  // Create or get user
  const u = await authService.login({email: 'admin@uch.ac.id', password: 'admin123'}); // assume admin exists
  const userId = u.user.id;

  // 2. Create Blocking Booking (10:00 - 12:00)
  const d = new Date();
  d.setHours(10, 0, 0, 0); // Today 10:00
  const dEnd = new Date(d);
  dEnd.setHours(12, 0, 0, 0); // Today 12:00

  await bookingService.create(userId, {
      ruanganId: room.id,
      purpose: 'Blocker',
      audienceCount: 10,
      startTime: d.toISOString(),
      endTime: dEnd.toISOString()
  });
  console.log('  ✅ Created Blocker Booking: 10:00 - 12:00');

  // 3. Generate Slots for Today (1 Hour Duration)
  console.log('Please check the operating hours logic (08-16)...');
  const slots = await bookingService.getAvailableSlots(room.id, new Date(), 60);
  
  console.log('  📋 Generated Slots:');
  console.table(slots);

  // 4. Verify
  // Expected: 08:00, 09:00, [10,11 BLOCKED], 12:00, 13:00, 14:00, 15:00. 16:00 invalid (ends 17)
  const has08 = slots.find(s => s.time.startsWith('08'));
  const has10 = slots.find(s => s.time.startsWith('10'));
  const has12 = slots.find(s => s.time.startsWith('12'));

  if (!has08 || has10 || !has12) {
      throw new Error('Slot logic incorrect. 10:00 should be missing, 08:00 & 12:00 present.');
  }

  console.log('🎉 Slot Generator is Working Correctly!');
  process.exit(0);

} catch (error) {
  console.error('❌ Test Failed:', error);
  process.exit(1);
}
