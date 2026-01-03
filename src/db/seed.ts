import { db } from './index.ts';
import { users, fakultas, prodi } from './schema/index.ts';
import { logger } from '../lib/utils.ts';
import bcrypt from 'bcryptjs';

async function seed() {
  logger.info('🌱 Seeding database...');

  try {
    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const [admin] = await db.insert(users).values({
      email: 'admin@uch.ac.id',
      password: hashedPassword,
      fullName: 'Administrator',
      role: 'admin',
    }).returning();
    
    logger.info('✅ Admin user created:', admin.email);

    // Create sample Fakultas
    const [fakultasTeknik] = await db.insert(fakultas).values({
      kode: 'FT',
      nama: 'Fakultas Teknik',
    }).returning();

    const [fakultasEkonomi] = await db.insert(fakultas).values({
      kode: 'FE',
      nama: 'Fakultas Ekonomi',
    }).returning();

    logger.info('✅ Fakultas created');

    // Create sample Prodi
    await db.insert(prodi).values([
      {
        kode: 'IF',
        nama: 'Teknik Informatika',
        fakultasId: fakultasTeknik.id,
      },
      {
        kode: 'SI',
        nama: 'Sistem Informasi',
        fakultasId: fakultasTeknik.id,
      },
      {
        kode: 'MJ',
        nama: 'Manajemen',
        fakultasId: fakultasEkonomi.id,
      },
      {
        kode: 'AK',
        nama: 'Akuntansi',
        fakultasId: fakultasEkonomi.id,
      },
    ]);

    logger.info('✅ Prodi created');
    logger.info('🎉 Seeding completed!');
    logger.info('');
    logger.info('Default admin credentials:');
    logger.info('  Email: admin@uch.ac.id');
    logger.info('  Password: admin123');
    
  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seed();
