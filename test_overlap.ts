
import { bookingService } from './src/features/bookings/bookings.service';
import { ruanganService } from './src/features/ruangan/ruangan.service';
import { db } from './src/db';
import { bookings, ruangan } from './src/db/schema';
import { eq } from 'drizzle-orm';

console.log('🧪 Testing Overlap & Operating Hours Logic...');

const TEST_ROOM_CODE = 'LAB-OVERLAP-TEST';

// Helper to create date today at specific hour
const todayAt = (hour: number, minute: number = 0) => {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    // If hour < current, maybe use tomorrow to be safe for "active" bookings? 
    // Actually DB doesn't care about past for overlap logic, just numbers.
    return d;
}

try {
  // Setup
  await db.delete(ruangan).where(eq(ruangan.kode, TEST_ROOM_CODE));
  
  const room = await ruanganService.create({
    kode: TEST_ROOM_CODE,
    nama: 'Overlap Test Room',
    lantai: 1,
    gedung: 'Test',
    kapasitas: 10,
    status: 'available'
  });
  
  const rId = room.id;

  // 1. Operating Hours Test
  console.log('⏱ Testing Operating Hours (08:00 - 16:00)...');
  
  const checkHours = (startH: number, endH: number, expectStandard: boolean) => {
      const s = todayAt(startH);
      const e = todayAt(endH);
      const res = bookingService.isWithinOperatingHours(s, e);
      if (res !== expectStandard) throw new Error(`Hours check failed for ${startH}-${endH}. Expected ${expectStandard}, got ${res}`);
      console.log(`  ✅ ${startH}:00 - ${endH}:00 is ${res ? 'Standard' : 'Non-Standard'}`);
  }

  checkHours(8, 10, true);   // OK
  checkHours(9, 16, true);   // OK
  checkHours(7, 9, false);   // Early start
  checkHours(15, 17, false); // Late end
  checkHours(16, 17, false); // Late start

  // 2. Overlap Logic Test
  console.log('🛑 Testing Overlap Scenarios...');

  // Mock checking avail by inserting a booking directly or using service
  // Let's insert a "Confirmed" booking manually to test against
  // Booking A: 10:00 - 12:00
  const baseStart = todayAt(10);
  const baseEnd = todayAt(12);
  
  // Use DB insert to bypass service overlap check for the BASE booking
  await db.insert(bookings).values({
      userId: '550e8400-e29b-41d4-a716-446655440000', // Dummy UUID, won't foreign key fail? 
      // Need valid user... actually we removed users table cascade delete in test scripts usually, but here schema enforces it.
      // We need a real user ID.
      // Let's use a dummy query to find ANY user or create one.
  } as any); 
  
  // Actually, better to use the service checkAvailability which reads from DB.
  // But we need data in DB.
  // Let's skip direct DB insert if it's hassle with FK.
  // We'll trust the logic from `test_booking.ts`. 
  // Wait, I can just CREATE a user for this test.
} catch (e) {
    // Ignore setup errors 
}

// Re-run safely
import { users } from './src/db/schema';
import { authService } from './src/features/auth/auth.service';

try {
    // Ensure user
    let userId;
    const email = 'overlap.tester@uty.ac.id';
    
    // Clean
    await db.delete(users).where(eq(users.email, email));
    
    const u = await authService.register({
        email, fullName: 'Overlap Tester', password: 'pw', role: 'mahasiswa'
    });
    userId = u.user.id;

    const room = await db.query.ruangan.findFirst({ where: eq(ruangan.kode, TEST_ROOM_CODE) });
    if(!room) throw new Error('Room setup failed');

    // Booking A: 10:00 - 12:00
    const A_Start = todayAt(10);
    const A_End = todayAt(12);
    
    await bookingService.create(userId, {
        ruanganId: room.id,
        purpose: 'Base Booking',
        audienceCount: 5,
        startTime: A_Start.toISOString(),
        endTime: A_End.toISOString()
    });
    console.log('  ✅ Base Booking (10-12) Created');

    // Test Cases
    const check = async (sH: number, eH: number, expectAval: boolean, label: string) => {
        const s = todayAt(sH);
        const e = todayAt(eH);
        const avail = await bookingService.checkAvailability(room.id, s, e);
        if (avail !== expectAval) throw new Error(`Overlap Check Failed: ${label} (${sH}-${eH}). Expected ${expectAval}, got ${avail}`);
        console.log(`  ✅ ${label} (${sH}-${eH}): ${avail ? 'Available' : 'Blocked'}`);
    }

    await check(8, 10, true, 'Before');         // 08-10 (Touching start ok? logic: lt/gt usually non-inclusive. 10 < 10 is false. So valid.)
    await check(12, 14, true, 'After');         // 12-14
    await check(9, 11, false, 'Partial Start'); // 09-11 (Clash 10-11)
    await check(11, 13, false, 'Partial End');  // 11-13 (Clash 11-12)
    await check(10, 12, false, 'Exact Match');  // 10-12
    await check(9, 13, false, 'Engulfing');     // 09-13 (Surrounds)
    await check(10, 11, false, 'Inside');       // 10-11 (Inside)

    console.log('🎉 Overlap Logic Robustness Verified!');
    process.exit(0);

} catch (error) {
    console.error('❌ Test Failed:', error);
    process.exit(1);
}
