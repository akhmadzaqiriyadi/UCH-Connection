import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { users, mahasiswa, dosen, ukm, himpunan, bookings } from '../../db/schema';
import { authMiddleware, requireRole } from '../../middlewares/auth.middleware';
import { count, isNull, eq, desc } from 'drizzle-orm';

export const dashboardController = new Elysia({ prefix: '/dashboard' })
  .use(authMiddleware)

  // Get Stats
  .get('/stats', async ({ user, set }: any) => {
    // Role Check
    if (!user || user.role !== 'admin') {
      set.status = 403;
      return { success: false, error: 'Forbidden: Admin only' };
    }

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
  })

  // Get Events Stats
  .get('/events-stats', async ({ user, set }: any) => {
    // Role Check
    if (!user || user.role !== 'admin') {
      set.status = 403;
      return { success: false, error: 'Forbidden: Admin only' };
    }

    const { events, eventRegistrants } = await import('../../db/schema');
    const { gte, lte } = await import('drizzle-orm');

    // Total Events & by Status
    const [eventsCount] = await db.select({ count: count() }).from(events);
    
    const eventsByStatus = await db.select({
      status: events.status,
      count: count()
    })
    .from(events)
    .groupBy(events.status);

    const publishedCount = eventsByStatus.find((s: any) => s.status === 'published')?.count || 0;
    const draftCount = eventsByStatus.find((s: any) => s.status === 'draft')?.count || 0;

    // Total Registrants
    const [registrantsCount] = await db.select({ count: count() }).from(eventRegistrants);

    // Payment Status Breakdown
    const paymentStats = await db.select({
      paymentStatus: eventRegistrants.paymentStatus,
      count: count()
    })
    .from(eventRegistrants)
    .groupBy(eventRegistrants.paymentStatus);

    const pendingPayment = paymentStats.find((s: any) => s.paymentStatus === 'pending')?.count || 0;
    const paidCount = paymentStats.find((s: any) => s.paymentStatus === 'paid')?.count || 0;
    const freeCount = paymentStats.find((s: any) => s.paymentStatus === 'free')?.count || 0;
    const rejectedPayment = paymentStats.find((s: any) => s.paymentStatus === 'rejected')?.count || 0;

    // Attendance Status
    const attendanceStats = await db.select({
      status: eventRegistrants.status,
      count: count()
    })
    .from(eventRegistrants)
    .groupBy(eventRegistrants.status);

    const registeredCount = attendanceStats.find((s: any) => s.status === 'registered')?.count || 0;
    const attendedCount = attendanceStats.find((s: any) => s.status === 'attended')?.count || 0;

    // Upcoming Events (next 30 days, published only)
    const now = new Date();
    const next30Days = new Date();
    next30Days.setDate(now.getDate() + 30);

    const upcomingEvents = await db.query.events.findMany({
      where: (table: any, { and, eq, gte, lte }: any) => and(
        eq(table.status, 'published'),
        gte(table.startTime, now),
        lte(table.startTime, next30Days)
      ),
      orderBy: [desc(events.startTime)],
      limit: 5,
      with: {
        organizer: { columns: { fullName: true } }
      }
    });

    // Recent Registrations
    const recentRegistrations = await db.query.eventRegistrants.findMany({
      orderBy: [desc(eventRegistrants.createdAt)],
      limit: 5,
      with: {
        event: { columns: { title: true } },
        user: { columns: { fullName: true } }
      }
    });

    return {
      success: true,
      data: {
        totalEvents: eventsCount.count,
        published: publishedCount,
        draft: draftCount,
        totalRegistrants: registrantsCount.count,
        payment: {
          pending: pendingPayment,
          paid: paidCount,
          free: freeCount,
          rejected: rejectedPayment
        },
        attendance: {
          registered: registeredCount,
          attended: attendedCount
        },
        upcomingEvents: upcomingEvents.map((e: any) => ({
          id: e.id,
          title: e.title,
          startTime: e.startTime,
          organizer: e.organizer?.fullName,
          type: e.type
        })),
        recentRegistrations: recentRegistrations.map((r: any) => ({
          id: r.id,
          user: r.guestName || r.user?.fullName || 'Guest',
          event: r.event.title,
          paymentStatus: r.paymentStatus,
          createdAt: r.createdAt
        }))
      }
    };
  }, {
    detail: {
      tags: ['Dashboard'],
      summary: 'Get Events Dashboard Statistics',
      description: 'Get comprehensive events metrics for admin dashboard',
      responses: {
        200: {
          description: 'Events Stats',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                example: {
                  success: true,
                  data: {
                    totalEvents: 25,
                    published: 20,
                    draft: 5,
                    totalRegistrants: 150,
                    payment: {
                      pending: 30,
                      paid: 100,
                      free: 20,
                      rejected: 0
                    },
                    attendance: {
                      registered: 120,
                      attended: 80
                    },
                    upcomingEvents: [
                      {
                        id: "evt_1",
                        title: "Seminar AI",
                        startTime: "2026-02-15T09:00:00.000Z",
                        organizer: "Staff Events",
                        type: "Seminar"
                      }
                    ],
                    recentRegistrations: [
                      {
                        id: "reg_1",
                        user: "Budi",
                        event: "Workshop Backend",
                        paymentStatus: "paid",
                        createdAt: "2026-01-05T10:00:00.000Z"
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      }
    }
  });
