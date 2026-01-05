import { Elysia, t } from 'elysia';
import { bookingService } from './bookings.service.ts';
import { authMiddleware, requireRole } from '../../middlewares/auth.middleware.ts';

export const bookingsController = new Elysia({ prefix: '/bookings' })
  .use(authMiddleware) // All routes require login

  /**
   * GET /bookings
   * List bookings (User sees own, Admin sees all?)
   * Let's split: /bookings (Own), /bookings/all (Admin)
   */
  .get('/', async ({ user, query }: any) => {
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
  .post('/', async ({ user, body }: any) => {
    try {
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
      startTime: t.String(), // Validated as ISO string in logic
      endTime: t.String()
    }),
    detail: {
      tags: ['Bookings'],
      summary: 'Request Booking',
      description: 'Submit a new room booking request'
    }
  })

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
