
import { ruanganService } from './src/features/ruangan/ruangan.service';
import { db } from './src/db';
import { ruangan } from './src/db/schema';
import { eq } from 'drizzle-orm';

console.log('🧪 Testing Ruangan Master Data CRUD...');

const TEST_KODE = 'LAB-TEST-01';

// Clean up previous test
await db.delete(ruangan).where(eq(ruangan.kode, TEST_KODE));

try {
  // 1. Create
  console.log('📝 Creating Room...');
  const newRoom = await ruanganService.create({
    kode: TEST_KODE,
    nama: 'Lab Testing Automasi',
    gedung: 'Gedung C',
    lantai: 3,
    kapasitas: 50,
    fasilitas: 'PC Specs Tinggi, AC',
    status: 'available'
  });
  console.log('✅ Created:', newRoom.nama);

  // 2. Read (Find All)
  console.log('🔍 Listing Rooms...');
  const allRooms = await ruanganService.findAll({ search: 'Testing' });
  if (allRooms.length === 0) throw new Error('Failed to list created room');
  console.log('✅ Found', allRooms.length, 'rooms');

  // 3. Update
  console.log('✏️ Updating Room...');
  const updatedRoom = await ruanganService.update(newRoom.id, {
    kapasitas: 60,
    status: 'maintenance'
  });
  if (updatedRoom.kapasitas !== 60) throw new Error('Update failed');
  console.log('✅ Updated Kapasitas:', updatedRoom.kapasitas);

  // 4. Delete
  console.log('🗑️ Deleting Room...');
  await ruanganService.delete(newRoom.id);
  
  // Verify Delete
  try {
    await ruanganService.findById(newRoom.id);
    throw new Error('Soft delete failed (Room still found)');
  } catch (e: any) {
    if (e.message === 'Ruangan not found') {
        console.log('✅ Room successfully deleted (Soft Delete verified)');
    } else {
        throw e;
    }
  }

  console.log('🎉 All Ruangan Tests Passed!');
  process.exit(0);

} catch (error) {
  console.error('❌ Test Failed:', error);
  process.exit(1);
}
