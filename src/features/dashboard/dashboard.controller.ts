import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { users, mahasiswa, dosen, ukm, himpunan, bookings } from '../../db/schema';
import { authMiddleware, requireRole } from '../../middlewares/auth.middleware';
import { count, isNull, eq, desc } from 'drizzle-orm';

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
      db.select({ count: count() }).from(bookings) // Total Booking
    ]);

    // Booking Breakdown
    const bookingStats = await db.select({ 
        status: bookings.status, 
        count: count() 
    })
    .from(bookings)
    .groupBy(bookings.status);

    const pendingCount = bookingStats.find(s => s.status === 'pending')?.count || 0;
    const approvedCount = bookingStats.find(s => s.status === 'approved')?.count || 0;
    const checkedInCount = bookingStats.find(s => s.status === 'checked_in')?.count || 0;
    const rejectedCount = bookingStats.find(s => s.status === 'rejected')?.count || 0;

    // Recent 5 Bookings
    const recentBookings = await db.query.bookings.findMany({
        orderBy: [desc(bookings.createdAt)],
        limit: 5,
        with: {
            user: true,
            ruangan: true
        }
    });

    return {
      success: true,
      data: {
        totalUsers: usersCount.count,
        totalMahasiswa: mahasiswaCount.count,
        totalDosen: dosenCount.count,
        totalUKM: ukmCount.count,
        totalHimpunan: himpunanCount.count,
        bookings: {
            total: bookingsCount.count,
            pending: pendingCount,
            approved: approvedCount,
            checkedIn: checkedInCount,
            rejected: rejectedCount,
            recent: recentBookings.map(b => ({
                id: b.id,
                user: b.user.fullName,
                room: b.ruangan.nama,
                startTime: b.startTime,
                status: b.status
            }))
        }
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
                      totalHimpunan: 3,
                      bookings: {
                          total: 10,
                          pending: 2,
                          approved: 5,
                          checkedIn: 1,
                          rejected: 2,
                          recent: [
                            { id: 'x', user: 'Zaq', room: 'Lab A', startTime: '2026-01-01', status: 'pending' }
                          ]
                      }
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
