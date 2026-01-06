import { db } from '../../db/index.ts';
import { events, eventRegistrants } from '../../db/schema/index.ts';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { FormField } from './events.types.ts';

export class EventsService {

    /**
     * Create a new event
     */
    async create(organizerId: string, data: any) {
        // Validate dates
        const start = new Date(data.startTime);
        const end = new Date(data.endTime);
        if (start >= end) throw new Error('Start time must be before end time');

        // Insert
        const [event] = await db.insert(events).values({
            ...data,
            startTime: start,
            endTime: end,
            organizerId,
            registrationFormSchema: data.registrationFormSchema || [],
            status: 'published' // Auto publish for now
        }).returning();

        return event;
    }

    /**
     * List Events (Public)
     */
    async findAll(filters: { isPublic?: boolean } = {}) {
        return db.query.events.findMany({
            where: (table, { eq, and }) => {
                const conditions = [];
                // Only show published events
                conditions.push(eq(table.status, 'published'));
                
                // If filtering strictly for public
                if (filters.isPublic) {
                    conditions.push(eq(table.isPublic, true));
                }
                
                return and(...conditions);
            },
            orderBy: [desc(events.createdAt)],
            with: {
                organizer: {
                    columns: { fullName: true, email: true }
                }
            }
        });
    }

    /**
     * Get Event Detail
     */
    async findById(id: string) {
        const event = await db.query.events.findFirst({
            where: eq(events.id, id),
            with: {
                organizer: {
                    columns: { fullName: true, email: true }
                }
            }
        });
        if (!event) throw new Error('Event not found');
        return event;
    }

    /**
     * Register to Event
     */
    async register(data: { eventId: string, userId?: string, guestData?: any, payload: any }) {
        const event = await this.findById(data.eventId);

        // 1. Check Quota
        // Count existing registrants (approved or pending payment)
        const registrantsCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(eventRegistrants)
            .where(
                and(
                    eq(eventRegistrants.eventId, data.eventId),
                    sql`${eventRegistrants.status} != 'cancelled'`
                )
            );
        
        const currentCount = Number(registrantsCount[0].count);
        if (currentCount >= event.quota) {
            throw new Error('Event quota is full');
        }

        // 2. Validate Dynamic Form Answers
        const schema = event.registrationFormSchema as FormField[];
        const answers = data.payload.registrationData || {};

        if (schema && schema.length > 0) {
            for (const field of schema) {
                if (field.required && !answers[field.key]) {
                    throw new Error(`Missing required field: ${field.label}`);
                }
            }
        }

        // 3. Determine Payment Status
        // If price is 0 -> Free (Approved/Paid immediatelly)
        // If price > 0 -> Pending Payment
        const isFree = Number(event.price) === 0;
        const initialStatus = isFree ? 'registered' : 'registered'; // Status pendaftaran
        const initialPaymentStatus = isFree ? 'free' : 'pending';

        // 4. Save Registration
        const [registration] = await db.insert(eventRegistrants).values({
            eventId: data.eventId,
            userId: data.userId || null,
            guestName: data.guestData?.name,
            guestEmail: data.guestData?.email,
            guestPhone: data.guestData?.phone,
            registrationData: answers,
            paymentStatus: initialPaymentStatus,
            status: initialStatus,
            // Generate QR Token immediately if FREE, else wait for payment
            qrToken: isFree ? crypto.randomUUID() : null
        }).returning();

        return {
            ...registration,
            eventTitle: event.title,
            needPayment: !isFree
        };
    }

    /**
     * Upload Payment Proof
     */
    async uploadPaymentProof(registrantId: string, imagePath: string) {
        const [updated] = await db.update(eventRegistrants)
            .set({ 
                paymentProof: imagePath,
                // Status remains pending until Admin verifies, but we know proof is uploaded
            })
            .where(eq(eventRegistrants.id, registrantId))
            .returning();
        
        return updated;
    }

    /**
     * Verify Payment (Admin)
     */
    async verifyPayment(registrantId: string, status: 'paid' | 'rejected') {
        const updateData: any = { paymentStatus: status };
        
        if (status === 'paid') {
            // Generate QR Token upon payment approval
            updateData.qrToken = crypto.randomUUID();
            updateData.status = 'registered';
        } else {
            updateData.status = 'cancelled'; // Or rejected
        }

        const [updated] = await db.update(eventRegistrants)
            .set(updateData)
            .where(eq(eventRegistrants.id, registrantId))
            .returning();

        return updated;
    }

    
    /**
     * Get Registrants of an Event (For Organizer)
     */
    async getRegistrants(eventId: string) {
        return db.query.eventRegistrants.findMany({
            where: eq(eventRegistrants.eventId, eventId),
            orderBy: [desc(eventRegistrants.createdAt)],
            with: {
                user: {
                    columns: { fullName: true, email: true, role: true }
                }
            }
        });
    }

    /**
     * Get Events created by Organizer
     */
    async getOwnedEvents(organizerId: string) {
        return db.query.events.findMany({
            where: eq(events.organizerId, organizerId),
            orderBy: [desc(events.createdAt)]
        });
    }

    /**
     * Get My Tickets (Events I registered to)
     */
    async getMyTickets(userId: string) {
        return db.query.eventRegistrants.findMany({
            where: eq(eventRegistrants.userId, userId),
            orderBy: [desc(eventRegistrants.createdAt)],
            with: {
                event: {
                    columns: { 
                        title: true, 
                        startTime: true, 
                        endTime: true, 
                        location: true, 
                        bannerImage: true 
                    }
                }
            }
        });
    }

    /**
     * Check-in (Scan QR)
     */
    async checkIn(qrToken: string) {
        const registrant = await db.query.eventRegistrants.findFirst({
            where: eq(eventRegistrants.qrToken, qrToken),
            with: {
                event: true,
                user: { columns: { fullName: true, email: true, role: true } }
            }
        });

        if (!registrant) throw new Error('Invalid QR Code');
        if (registrant.status === 'attended') throw new Error('Already checked in');
        if (registrant.status === 'cancelled') throw new Error('Registration cancelled');

        // Check if event is today? (Optional logic)

        const now = new Date();
        
        // Update status
        await db.update(eventRegistrants)
            .set({ 
                status: 'attended',
                checkedInAt: now
            })
            .where(eq(eventRegistrants.id, registrant.id));

        return {
            valid: true,
            message: 'Check-in successful',
            checkedInAt: now,
            registrant: {
                id: registrant.id,
                name: registrant.guestName || registrant.user?.fullName,
                email: registrant.guestEmail || registrant.user?.email,
                phone: registrant.guestPhone,
                registrationData: registrant.registrationData
            },
            event: {
                id: registrant.event.id,
                title: registrant.event.title,
                startTime: registrant.event.startTime,
                endTime: registrant.event.endTime,
                location: registrant.event.location,
                type: registrant.event.type
            }
        };
    }
}

export const eventsService = new EventsService();
