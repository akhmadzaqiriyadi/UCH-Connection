import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { users, mahasiswa, dosen, ukm, himpunan, bookings } from '../../db/schema';
import { authMiddleware, requireRole } from '../../middlewares/auth.middleware';
import { count, isNull } from 'drizzle-orm';

export const dashboardController = new Elysia({ prefix: '/dashboard' })
  .use(authMiddleware)
  .use(requireRole('admin'))

  // Get Stats
  .get('/stats', async () => {
    // Parallel queries for speed
    const [
      [usersCount],
      [mahasiswaCount],
      [dosenCount],
      [ukmCount],
      [himpunanCount],
      [bookingsCount]
    ] = await Promise.all([
      db.select({ count: count() }).from(users).where(isNull(users.deletedAt)),
      db.select({ count: count() }).from(mahasiswa).where(isNull(mahasiswa.deletedAt)),
      db.select({ count: count() }).from(dosen).where(isNull(dosen.deletedAt)),
      db.select({ count: count() }).from(ukm).where(isNull(ukm.deletedAt)),
      db.select({ count: count() }).from(himpunan).where(isNull(himpunan.deletedAt)),
      db.select({ count: count() }).from(bookings) // Total Bookings
    ]);

    return {
      success: true,
      data: {
        totalUsers: usersCount.count,
        totalMahasiswa: mahasiswaCount.count,
        totalDosen: dosenCount.count,
        totalUKM: ukmCount.count,
        totalHimpunan: himpunanCount.count,
        totalBookings: bookingsCount.count
      }
    };
  }, {
    detail: {
      tags: ['Dashboard'],
      summary: 'Get Dashboard Statistics',
      description: 'Get total counts for dashboard cards.',
      responses: {
        200: {
          description: 'Dashboard Stats',
          content: {
            'application/json': {
              examples: {
                success: {
                  summary: 'Success',
                  value: {
                    success: true,
                    data: {
                      totalUsers: 100,
                      totalMahasiswa: 80,
                      totalDosen: 20,
                      totalUKM: 5,
                      totalHimpunan: 3
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
