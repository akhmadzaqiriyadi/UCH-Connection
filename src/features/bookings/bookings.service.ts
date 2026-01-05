import { db } from '../../db/index.ts';
import { bookings, ruangan, users, checkins } from '../../db/schema/index.ts';
import { eq, and, or, gt, lt, lte, gte, desc } from 'drizzle-orm';
import { mailer } from '../../lib/mailer.ts';
import type { CreateBookingDTO, UpdateBookingStatusDTO } from './bookings.types.ts';

export class BookingService {
  /**
   * Create Booking Request
   */
  async create(userId: string, data: CreateBookingDTO) {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (start >= end) {
      throw new Error('Start time must be before end time');
    }

    // Check Availability
    const isAvailable = await this.checkAvailability(data.ruanganId, start, end);
    if (!isAvailable) {
      throw new Error('Room is already booked for the selected time slot');
    }

    const [newBooking] = await db.insert(bookings).values({
      userId,
      ruanganId: data.ruanganId,
      purpose: data.purpose,
      audienceCount: data.audienceCount,
      startTime: start,
      endTime: end,
      status: 'pending',
    }).returning();

    // Notify Admin (Optional) or just User
    // For now, silently succeed. User waits for approval.

    return newBooking;
  }

  /**
   * Get Room Schedule (Public)
   * Returns list of APPROVED bookings for a specific room and date range
   */
  async getRoomSchedule(ruanganId: string, startDate: Date, endDate: Date) {
    // Determine bounds
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const schedule = await db.query.bookings.findMany({
      where: (table, { and, eq, gte, lte, or }) => and(
        eq(table.ruanganId, ruanganId),
        or(eq(table.status, 'approved'), eq(table.status, 'checked_in')), // Only active bookings
        // Overlap with the day range
        and(
            gte(table.endTime, start),
            lte(table.startTime, end)
        )
      ),
      with: {
        user: true // Maybe sanitize this in controller
      },
      orderBy: (table, { asc }) => [asc(table.startTime)]
    });

    return schedule.map(b => ({
      id: b.id,
      title: 'Booked', // Privacy: Don't show purpose/user public? Or show? Let's show "Booked by X" or just "Booked"
      start: b.startTime,
      end: b.endTime,
      status: b.status,
      organizer: b.user.fullName // Show organizer
    }));
  }

  /**
   * Check if slot is available
   */
  async checkAvailability(ruanganId: string, startTime: Date, endTime: Date): Promise<boolean> {
     const overlap = await db.query.bookings.findFirst({
      where: (table, { and, eq, lt, gt, ne, or }) => and(
        eq(table.ruanganId, ruanganId),
        or(eq(table.status, 'pending'), eq(table.status, 'approved'), eq(table.status, 'checked_in')), // Count pending as blocked? Or only approved?
        // Usually, pending requests block the slot until rejected to prevent double booking race conditions.
        // Let's assume PENDING also reserves the slot temporarily.
        lt(table.startTime, endTime),
        gt(table.endTime, startTime)
      ),
    });
    
    return !overlap;
  }

  /**
   * Validate Operating Hours (08:00 - 16:00)
   * This is a soft check helper.
   */
  isWithinOperatingHours(startTime: Date, endTime: Date): boolean {
    const startHour = startTime.getHours();
    const endHour = endTime.getHours();
    const endMinutes = endTime.getMinutes();

    // 08:00
    if (startHour < 8) return false;

    // 16:00 (End time must be <= 16:00)
    // If endHour is 16, minutes must be 0
    if (endHour > 16 || (endHour === 16 && endMinutes > 0)) return false;

    return true;
  }

  /**
   * List Bookings (My Bookings or All for Admin)
   */
  async findAll({ userId, isAdmin }: { userId?: string, isAdmin?: boolean }) {
    if (isAdmin) {
      // Admin sees all? Or maybe filter by status?
      // For comprehensive system, admin sees all.
      return db.query.bookings.findMany({
        with: {
          ruangan: true,
          user: true, // See who booked
        },
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      });
    } else {
      // User sees only their own
      return db.query.bookings.findMany({
        where: (table, { eq }) => eq(table.userId, userId!),
        with: {
          ruangan: true,
        },
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      });
    }
  }

  /**
   * Get Detail
   */
  async findById(id: string) {
    const booking = await db.query.bookings.findFirst({
      where: (table, { eq }) => eq(table.id, id),
      with: {
        ruangan: true,
        user: true,
      },
    });
    if (!booking) throw new Error('Booking not found');
    return booking;
  }

  /**
   * Process Booking (Approve/Reject) - Admin Only
   */
  async processBooking(id: string, data: UpdateBookingStatusDTO) {
    const booking = await this.findById(id);

    if (booking.status !== 'pending') {
      throw new Error(`Cannot update booking status from ${booking.status}`);
    }

    let updates: any = {
      status: data.status,
      updatedAt: new Date(),
    };

    if (data.status === 'rejected') {
      updates.rejectionReason = data.rejectionReason || 'No reason provided';
    } else if (data.status === 'approved') {
      // Generate QR Token
      updates.qrToken = crypto.randomUUID();
    }

    const [updatedBooking] = await db.update(bookings)
      .set(updates)
      .where(eq(bookings.id, id))
      .returning();

    // Send Email Notification
    await this.sendNotificationEmail(updatedBooking, booking.user.email, booking.user.fullName);

    return updatedBooking;
  }

  /**
   * Check-in User
   */
  async checkIn(qrToken: string, checkedInBy?: string) {
    // Find booking with this token
    const booking = await db.query.bookings.findFirst({
      where: (table, { eq }) => eq(table.qrToken, qrToken),
      with: {
        user: true,
        ruangan: true
      }
    });

    if (!booking) {
      throw new Error('Invalid QR Token');
    }

    if (booking.status === 'checked_in') {
      throw new Error('Already checked in');
    }

    if (booking.status !== 'approved') {
      throw new Error(`Cannot check-in. Booking status is ${booking.status}`);
    }

    // Optional: Date Check (Can only check-in on the day of booking?)
    // const now = new Date();
    // if (now < booking.startTime) throw new Error('Too early to check-in');
    
    // Perform Check-in
    await db.transaction(async (tx) => {
      // Create checkin record (optional logic for checkedInBy if needed)
      await tx.insert(checkins).values({
        bookingId: booking.id,
        checkedInBy: checkedInBy || null, // If the scanner is logged in
        checkinTime: new Date()
      });

      // Update booking status
      await tx.update(bookings)
        .set({ 
            status: 'checked_in',
            updatedAt: new Date()
        })
        .where(eq(bookings.id, booking.id));
    });

    return { 
        success: true, 
        message: 'Check-in successful', 
        booking: {
            id: booking.id,
            user: booking.user.fullName,
            room: booking.ruangan.nama,
            time: booking.startTime
        }
    };
  }

  /**
   * Send Email Notification
   */
  private async sendNotificationEmail(booking: any, email: string, name: string) {
    let subject = '';
    let html = '';

    const dateStr = new Date(booking.startTime).toLocaleDateString();
    const timeStr = `${new Date(booking.startTime).toLocaleTimeString()} - ${new Date(booking.endTime).toLocaleTimeString()}`;

    if (booking.status === 'approved') {
      subject = 'Booking Approved - UTY Connection';
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${booking.qrToken}`; // Simple QR API for demo
      
      html = `
        <h3>Booking Approved! 🎉</h3>
        <p>Hello ${name},</p>
        <p>Your booking request has been approved.</p>
        <ul>
          <li><strong>Purpose:</strong> ${booking.purpose}</li>
          <li><strong>Date:</strong> ${dateStr}</li>
          <li><strong>Time:</strong> ${timeStr}</li>
        </ul>
        <p>Show this QR code to check-in:</p>
        <img src="${qrCodeUrl}" alt="Check-in QR Code" />
        <p><strong>QR Token:</strong> ${booking.qrToken}</p>
      `;
    } else if (booking.status === 'rejected') {
      subject = 'Booking Rejected - UTY Connection';
      html = `
        <h3>Booking Rejected ❌</h3>
        <p>Hello ${name},</p>
        <p>Your booking request was rejected.</p>
        <p><strong>Reason:</strong> ${booking.rejectionReason}</p>
        <p>Please try selecting a different time or room.</p>
      `;
    }

    if (subject) {
      await mailer.send({ to: email, subject, html });
    }
  }
}

export const bookingService = new BookingService();
