import { Elysia, t } from 'elysia';
import { bookingService } from './bookings.service.ts';
import { authMiddleware, requireRole } from '../../middlewares/auth.middleware.ts';

export const bookingsController = new Elysia({ prefix: '/bookings' })
  // .use(authMiddleware) -- Moved auth to specific routes or sub-groups if needed.
  // Actually, standard practice: Public routes first, then auth group.
  
  /**
   * GET /bookings/schedule/:ruanganId
   * Public: Check room schedule
   */
  .get('/schedule/:ruanganId', async ({ params, query }) => {
    try {
        const date = query.date ? new Date(query.date) : new Date();
        const schedule = await bookingService.getRoomSchedule(params.ruanganId, date, date);
        return { success: true, data: schedule };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
  }, {
    query: t.Object({
        date: t.Optional(t.String()) // YYYY-MM-DD
    }),
    detail: {
      tags: ['Bookings'],
      summary: 'Public: Room Schedule',
      description: 'Get list of approved bookings for calendar view',
      responses: {
        200: {
          description: 'Schedule List',
          content: {
            'application/json': {
              examples: {
                success: {
                    summary: 'Success',
                    value: {
                        success: true,
                        data: [
                            {
                                id: '123-abc',
                                title: 'Booked',
                                start: '2026-01-05T09:00:00.000Z',
                                end: '2026-01-05T11:00:00.000Z',
                                status: 'approved',
                                organizer: 'John Doe'
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
  })

  /**
   * GET /bookings/check-availability
   * Public: Check specific slot availability
   */
  .get('/check-availability', async ({ query }) => {
      try {
          const start = new Date(query.startTime);
          const end = new Date(query.endTime);
          
          if (isNaN(start.getTime()) || isNaN(end.getTime())) throw new Error('Invalid dates');
          
          const isAvailable = await bookingService.checkAvailability(query.ruanganId, start, end);
          
          // Check operating hours warning
          const isStandardHours = bookingService.isWithinOperatingHours(start, end);

          return { 
              success: true, 
              available: isAvailable, 
              isStandardHours,
              message: isAvailable 
                ? (isStandardHours ? 'Available' : 'Available (Outside Standard Hours 08:00-16:00)')
                : 'Not Available'
          };
      } catch (error: any) {
          return { success: false, error: error.message };
      }
  }, {
      query: t.Object({
          ruanganId: t.String(),
          startTime: t.String(),
          endTime: t.String()
      }),
      detail: {
      tags: ['Bookings'],
      summary: 'Public: Check Availability Slot',
      description: 'Check if a specific time range is available',
      responses: {
        200: {
          description: 'Availability Result',
          content: {
            'application/json': {
              examples: {
                available: {
                    summary: 'Available (Standard)',
                    value: {
                        success: true,
                        available: true,
                        isStandardHours: true,
                        message: 'Available'
                    }
                },
                blocked: {
                    summary: 'Not Available',
                    value: {
                        success: true,
                        available: false,
                        isStandardHours: true,
                        message: 'Not Available'
                    }
                }
              }
            }
          }
        }
      }
    }
  })

  /**
   * GET /bookings/slots
   * Public: Get available time slots for dropdown
   */
  .get('/slots', async ({ query }) => {
      try {
          const date = new Date(query.date); // YYYY-MM-DD
          const duration = query.duration ? parseInt(query.duration) : 60; // Minutes
          
          if (isNaN(date.getTime())) throw new Error('Invalid date');

          const slots = await bookingService.getAvailableSlots(query.ruanganId, date, duration);
          return { success: true, data: slots };
      } catch (error: any) {
          return { success: false, error: error.message };
      }
  }, {
      query: t.Object({
          ruanganId: t.String(),
          date: t.String(),
          duration: t.Optional(t.String())
      }),
      detail: {
        tags: ['Bookings'],
        summary: 'Public: Get Available Slots Dropdown',
        description: 'Get clean list of available start times for a given duration. Filters out blocked slots.',
        responses: {
            200: {
                description: 'List of Time Slots',
                content: {
                    'application/json': {
                        examples: {
                            success: {
                                summary: 'Slots List',
                                value: {
                                    success: true,
                                    data: [
                                        { time: '08.00', available: true },
                                        { time: '09.00', available: true },
                                        { time: '13.00', available: true }
                                    ]
                                }
                            }
                        }
                    }
                }
            }
        }
      }
  })

  // Protected Routes (User)
  .group('', app => app
    .use(authMiddleware)
    
    /**
     * GET /bookings
     * My Bookings
     */
    .get('/', async ({ user }: any) => {
        try {
            const data = await bookingService.findAll({ userId: user.userId });
            return { success: true, data };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }, {
        detail: {
            tags: ['Bookings'],
            summary: 'My Bookings',
            description: 'Get list of bookings created by current user'
        }
    })

    /**
     * POST /bookings
     * Create Booking Request
     */
    .post('/', async (context: any) => {
        try {
            const { user, body } = context;
            console.log('DEBUG FULL CONTEXT KEYS:', Object.keys(context));
            console.log('DEBUG USER VALUE:', user);
            
            if (!user) throw new Error('User context missing');
            const data = await bookingService.create(user.userId, body);
            return { success: true, data };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }, {
        body: t.Object({
            ruanganId: t.String(),
            purpose: t.String(),
            audienceCount: t.Number(),
            startTime: t.String(),
            endTime: t.String()
        }),
        detail: {
            tags: ['Bookings'],
            summary: 'Request Booking',
            description: 'Submit a new room booking request'
        }
    })
  )

  // Admin Routes
  .group('/manage', app => app
    .use(requireRole('admin'))

    /**
     * GET /bookings/manage
     * List All Bookings (Admin)
     */
    .get('/', async () => {
        const data = await bookingService.findAll({ isAdmin: true });
        return { success: true, data };
    }, {
        detail: { tags: ['Bookings'], summary: 'List All Bookings (Admin)' }
    })

    /**
     * POST /bookings/manage/:id/process
     * Approve or Reject Booking
     */
    .post('/:id/process', async ({ params, body }) => {
      try {
        const data = await bookingService.processBooking(params.id, body);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }, {
      body: t.Object({
        status: t.Union([t.Literal('approved'), t.Literal('rejected'), t.Literal('cancelled')]),
        rejectionReason: t.Optional(t.String())
      }),
      detail: {
        tags: ['Bookings'],
        summary: 'Process Booking (Approve/Reject)',
        description: 'Admin action to approve/reject booking'
      }
    })

    /**
     * POST /bookings/manage/checkin
     * Validate QR and Check-in
     */
    .post('/checkin', async ({ body, user }: any) => {
      try {
        const result = await bookingService.checkIn(body.qrToken, user.userId);
        return { success: true, data: result };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }, {
      body: t.Object({
        qrToken: t.String()
      }),
      detail: {
        tags: ['Bookings'],
        summary: 'Check-in User (Scan QR)',
        description: 'Update status to checked_in using QR Token'
      }
    })
  );
