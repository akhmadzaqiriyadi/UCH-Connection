import { Elysia, t } from 'elysia';
import { eventsService } from './events.service.ts';
import { authMiddleware, requireRole } from '../../middlewares/auth.middleware.ts';
import { CreateEventDTO, FormFieldSchema, RegisterEventDTO, VerifyPaymentDTO } from './events.types.ts';
import { saveFile } from '../../lib/file_utils.ts';

// Helper for form data parsing (since Bun/Elysia handles file upload via FormData)
// But for Create Event we might use JSON/Multipart. Let's assume JSON first for creation, Multipart for Image.

export const eventsController = new Elysia({ prefix: '/events' })

    /**
     * GET /events
     * List all published events
     */
    .get('/', async ({ query }) => {
        try {
            const data = await eventsService.findAll({ 
                isPublic: query.public === 'true' 
            });
            return { success: true, data };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }, {
        detail: {
            tags: ['Events'],
            summary: 'List Events',
            description: 'Get list of upcoming events'
        }
    })

    /**
     * GET /events/:id
     * Event Detail
     */
    .get('/:id', async ({ params }) => {
        try {
            const data = await eventsService.findById(params.id);
            return { success: true, data };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }, {
        detail: {
            tags: ['Events'],
            summary: 'Event Detail',
            description: 'Get detailed info of an event'
        }
    })

    // --- Public Registration Components ---

    /**
     * POST /events/:id/register
     * Register to an event (Logic for both User and Guest)
     */
    .post('/:id/register', async ({ params, body, headers, jwt }: any) => {
        try {
            let userId: string | undefined = undefined;

            // Attempt to identify user from Token (If provided)
            const authHeader = headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.replace('Bearer ', '');
                const payload = await jwt.verify(token);
                if (payload) userId = payload.userId as string;
            }

            const payloadBody = body as any;
            
            // Logic: If guest, validate guest fields
            if (!userId) {
                if (!payloadBody.guestName || !payloadBody.guestEmail) {
                    throw new Error('Guest Name and Email are required for public registration');
                }
            }

            const result = await eventsService.register({
                eventId: params.id,
                userId,
                guestData: {
                    name: payloadBody.guestName,
                    email: payloadBody.guestEmail,
                    phone: payloadBody.guestPhone
                },
                payload: payloadBody
            });

            return { success: true, data: result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }, {
        detail: {
            tags: ['Events'],
            summary: 'Register Event',
            description: 'Register as user or guest'
        }
    })

    /**
     * POST /events/upload-proof
     * Upload Payment Proof
     */
    .post('/upload-proof', async ({ body }: any) => {
        try {
            const file = body.file;
            const registrantId = body.registrantId;

            if (!file || !registrantId) throw new Error('File and Registrant ID required');

            const path = await saveFile(file, 'payments'); // Save to /uploads/payments
            
            const updated = await eventsService.uploadPaymentProof(registrantId, path);
            return { success: true, data: updated };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }, {
        body: t.Object({
            file: t.File(),
            registrantId: t.String()
        }),
        detail: {
            tags: ['Events'],
            summary: 'Upload Payment Proof',
            description: 'Upload transfer receipt'
        }
    })

    // --- PROTECTED ROUTES (Admin/Organizer) ---
    // Using manual verification for stability
    
    /**
     * POST /events
     * Create New Event
     */
    .post('/', async ({ body, headers, jwt }: any) => {
        try {
            const authHeader = headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) throw new Error('Unauthorized');
            const token = authHeader.replace('Bearer ', '');
            const payload = await jwt.verify(token);
            if (!payload) throw new Error('Invalid Token');
            
            // Authorization Check: Only Admin, Dosen, Staff can create events
            // Mahasiswa (UKM/Hima) permissions can be added later
            const allowedRoles = ['admin', 'dosen', 'staff'];
            if (!allowedRoles.includes(payload.role)) {
                throw new Error('Forbidden: Only Admin/Staff can create events');
            }

            // Organizer is the creator
            const data = await eventsService.create(payload.userId, body);
            return { success: true, data };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }, {
        body: CreateEventDTO,
        detail: {
            tags: ['Events'],
            summary: 'Create Event',
            description: 'Create a new event (Admin/UKM)'
        }
    })

    /**
     * POST /events/registrants/:id/verify
     * Verify Payment
     */
    .post('/registrants/:id/verify', async ({ params, body, headers, jwt }: any) => {
        try {
            const authHeader = headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) throw new Error('Unauthorized');
            const token = authHeader.replace('Bearer ', '');
            const payload = await jwt.verify(token);
            if (!payload) throw new Error('Invalid Token');

            // Authorization: Admin Only
            // Ideally should check if user is the organizer of this specific event
            if (payload.role !== 'admin' && payload.role !== 'staff') {
                throw new Error('Forbidden: Only Admin/Staff can verify payments');
            }

            const status = body.status;
            const updated = await eventsService.verifyPayment(params.id, status as 'paid' | 'rejected');
            return { success: true, data: updated };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }, {
        body: t.Object({
            status: t.Union([t.Literal('paid'), t.Literal('rejected')])
        }),
        detail: {
            tags: ['Events'],
            summary: 'Verify Payment',
            description: 'Approve or Reject payment'
        }
    })

    /**
     * POST /events/checkin
     * Scan QR Code
     */
    .post('/checkin', async ({ body }: any) => {
        try {
            const { qrToken } = body;
            const result = await eventsService.checkIn(qrToken);
            return { success: true, data: result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }, {
        body: t.Object({
            qrToken: t.String()
        }),
        detail: {
            tags: ['Events'],
            summary: 'Event Check-in',
            description: 'Scan QR Code for attendance'
        }
    });
