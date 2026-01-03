import { db } from './index';
import { users, fakultas, prodi, mahasiswa, dosen, ukm, himpunan, roleEnum } from './schema';
import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Starting seeding process...');

  // 1. Clear existing data (optional, be careful in production!)
  // await db.delete(users); 
  // await db.delete(fakultas); 
  // ... better to use upsert or check existence

  console.log('🏫 Seeding Fakultas...');
  const fakultasData = [
    { nama: 'Fakultas Sains & Teknologi', kode: 'FST' },
    { nama: 'Fakultas Bisnis & Humaniora', kode: 'FBH' },
    { nama: 'Fakultas Ilmu Kesehatan', kode: 'FIKES' },
  ];

  const insertedFakultas = await db.insert(fakultas).values(fakultasData).returning().onConflictDoNothing();
  console.log(`✅ Seeded ${insertedFakultas.length} Fakultas`);

  // Fetch IDs for referencing
  const fst = await db.query.fakultas.findFirst({ where: eq(fakultas.kode, 'FST') });
  const fbh = await db.query.fakultas.findFirst({ where: eq(fakultas.kode, 'FBH') });

  if (!fst || !fbh) throw new Error('Fakultas IDs not found');

  console.log('📚 Seeding Prodi...');
  const prodiData = [
    // FST
    { nama: 'Informatika', kode: 'IF', fakultasId: fst.id },
    { nama: 'Sistem Informasi', kode: 'SI', fakultasId: fst.id },
    { nama: 'Teknik Komputer', kode: 'TK', fakultasId: fst.id },
    { nama: 'Teknik Elektro', kode: 'TE', fakultasId: fst.id },
    { nama: 'Teknik Sipil', kode: 'TS', fakultasId: fst.id },
    { nama: 'Arsitektur', kode: 'ARS', fakultasId: fst.id },
    // FBH
    { nama: 'Manajemen', kode: 'MNJ', fakultasId: fbh.id },
    { nama: 'Akuntansi', kode: 'AKT', fakultasId: fbh.id },
    { nama: 'Psikologi', kode: 'PSI', fakultasId: fbh.id },
    { nama: 'Ilmu Komunikasi', kode: 'ILKOM', fakultasId: fbh.id },
    { nama: 'Sastra Inggris', kode: 'SASING', fakultasId: fbh.id },
  ];

  await db.insert(prodi).values(prodiData).onConflictDoNothing();
  console.log('✅ Seeded Prodi');

  console.log('🚩 Seeding UKM & Himpunan...');
  const ukmData = [
    { nama: 'Mapala', deskripsi: 'Mahasiswa Pecinta Alam' },
    { nama: 'KSR PMI', deskripsi: 'Korps Sukarela Palang Merah Indonesia' },
    { nama: 'Teater', deskripsi: 'Seni Peran dan Pementasan' },
    { nama: 'Musik', deskripsi: 'Band dan Paduan Suara' },
    { nama: 'Olahraga', deskripsi: 'Futsal, Basket, Voli, Badminton' },
    { nama: 'Roboracers', deskripsi: 'Komunitas Robotika' },
    { nama: 'LDK', deskripsi: 'Lembaga Dakwah Kampus' },
  ];
  await db.insert(ukm).values(ukmData).onConflictDoNothing();

  const ifProdi = await db.query.prodi.findFirst({ where: eq(prodi.kode, 'IF') });
  const siProdi = await db.query.prodi.findFirst({ where: eq(prodi.kode, 'SI') });

  if (ifProdi && siProdi) {
      const himpunanData = [
        { nama: 'HMTI', deskripsi: 'Himpunan Mahasiswa Teknik Informatika', prodiId: ifProdi.id },
        { nama: 'HIMASI', deskripsi: 'Himpunan Mahasiswa Sistem Informasi', prodiId: siProdi.id },
      ];
      await db.insert(himpunan).values(himpunanData).onConflictDoNothing();
  }
  console.log('✅ Seeded UKM & Himpunan');


  console.log('👥 Seeding Users...');
  const passwordHash = await hash('password123', 10);

  // 1. Admin
  const [adminUser] = await db.insert(users).values({
    email: 'admin@uty.ac.id',
    password: passwordHash,
    fullName: 'Super Admin',
    role: 'admin',
  }).returning().onConflictDoNothing();

  if (adminUser) console.log('✅ Created Admin: admin@uty.ac.id');

  // 2. Dosen (Kaprodi IF)
  const [dosenUser] = await db.insert(users).values({
    email: 'dosen.if@uty.ac.id',
    password: passwordHash,
    fullName: 'Dr. Budi Santoso, M.Kom.',
    role: 'dosen',
  }).returning().onConflictDoNothing();

  if (dosenUser && ifProdi) {
    await db.insert(dosen).values({
      userId: dosenUser.id,
      nip: '0512345678',
      fakultasId: fst.id,
      jabatan: 'Lektor Kepala',
    }).onConflictDoNothing();
    console.log('✅ Created Dosen: dosen.if@uty.ac.id');
  }

  // 3. Mahasiswa (Informatika)
  const [mhsUser] = await db.insert(users).values({
    email: 'mhs.if@uty.ac.id',
    password: passwordHash,
    fullName: 'Ahmad Mahasiswa',
    role: 'mahasiswa',
  }).returning().onConflictDoNothing();

  if (mhsUser && ifProdi) {
    await db.insert(mahasiswa).values({
      userId: mhsUser.id,
      nim: '5200411001',
      prodiId: ifProdi.id,
      angkatan: 2024,
    }).onConflictDoNothing();
    console.log('✅ Created Mahasiswa: mhs.if@uty.ac.id');
  }

  // 4. Staff
  await db.insert(users).values({
    email: 'staff.baak@uty.ac.id',
    password: passwordHash,
    fullName: 'Staff BAAK',
    role: 'staff',
  }).onConflictDoNothing();
  console.log('✅ Created Staff: staff.baak@uty.ac.id');

  console.log('✨ Seeding completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
