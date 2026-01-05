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
            summary: '[PUBLIC] List Events',
            description: 'Get list of upcoming events. Publicly accessible.',
            responses: {
                200: {
                    description: 'List of events',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: { 
                                        type: 'array', 
                                        items: { 
                                            type: 'object', 
                                            example: { 
                                                id: 'evt_123', 
                                                title: 'Workshop Backend Modern', 
                                                description: 'Belajar membuat REST API dengan ElysiaJS',
                                                bannerImage: '/uploads/events/banner-1.jpg',
                                                startTime: '2026-02-20T09:00:00.000Z',
                                                endTime: '2026-02-20T16:00:00.000Z',
                                                type: 'Workshop',
                                                isOnline: false,
                                                location: 'Lab Komputer 3, Kampus 1',
                                                price: 50000, 
                                                quota: 100,
                                                organizer: { fullName: 'Himpunan Mahasiswa Informatika' }
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

    /**
     * GET /events/manage/owned
     * List Events Created by Me (Organizer)
     */
    .get('/manage/owned', async ({ headers, jwt }: any) => {
        try {
            const authHeader = headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) throw new Error('Unauthorized');
            const token = authHeader.replace('Bearer ', '');
            const payload = await jwt.verify(token);
            if (!payload) throw new Error('Invalid Token');

            const data = await eventsService.getOwnedEvents(payload.userId);
            return { success: true, data };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }, {
        detail: {
            tags: ['Events'],
            summary: '[ADMIN/STAFF] My Managed Events',
            description: 'Get list of events created by the logged-in user.',
            responses: {
                200: {
                    description: 'List of owned events',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                example: {
                                    success: true,
                                    data: [{ id: "evt_1", title: "My Event" }]
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    /**
     * GET /events/me/tickets
     * List My Tickets
     */
    .get('/me/tickets', async ({ headers, jwt }: any) => {
        try {
            const authHeader = headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) throw new Error('Unauthorized');
            const token = authHeader.replace('Bearer ', '');
            const payload = await jwt.verify(token);
            if (!payload) throw new Error('Invalid Token');

            const data = await eventsService.getMyTickets(payload.userId);
            return { success: true, data };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }, {
        detail: {
            tags: ['Events'],
            summary: '[USER] My Tickets',
            description: 'Get list of events registered by the logged-in user.',
            responses: {
                200: {
                    description: 'List of tickets',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                example: {
                                    success: true,
                                    data: [{ 
                                        id: "reg_999",
                                        paymentStatus: "paid",
                                        qrToken: "uuid-qr-token-secret",
                                        checkedInAt: null,
                                        event: { 
                                            title: "Seminar Teknologi AI", 
                                            bannerImage: "/uploads/events/ai.jpg",
                                            startTime: "2026-04-05T09:00:00.000Z",
                                            endTime: "2026-04-05T12:00:00.000Z",
                                            location: "Zoom Meeting"
                                        } 
                                    }]
                                }
                            }
                        }
                    }
                }
            }
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
            summary: '[PUBLIC] Event Detail',
            description: 'Get detailed info of an event including schema form.',
            responses: {
                200: {
                    description: 'Event Detail Data',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                example: {
                                    success: true,
                                    data: {
                                        id: "evt_123",
                                        title: "Workshop Backend Modern",
                                        description: "Belajar membuat REST API dengan ElysiaJS",
                                        bannerImage: "/uploads/events/banner-1.jpg",
                                        startTime: "2026-02-20T09:00:00.000Z",
                                        endTime: "2026-02-20T16:00:00.000Z",
                                        type: "Workshop",
                                        isOnline: false,
                                        location: "Lab Komputer 3, Kampus 1",
                                        price: 50000, 
                                        quota: 100,
                                        registrationFormSchema: [
                                            { key: "size", label: "Ukuran Kaos", type: "select", options: ["S","M","L","XL"], required: true },
                                            { key: "github", label: "Username GitHub", type: "text", required: true }
                                        ],
                                        organizer: { fullName: "Himpunan Mahasiswa Informatika", email: "hmif@uty.ac.id" }
                                    }
                                }
                            }
                        }
                    }
                }
            }
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
            summary: '[PUBLIC/AUTH] Register Event',
            description: 'Register as user (with Token) or guest (without Token). Guest must provide name & email.',
            responses: {
                200: {
                    description: 'Registration Successful',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                example: {
                                    success: true,
                                    data: {
                                        id: "reg_123",
                                        paymentStatus: "pending",
                                        needPayment: true,
                                        qrToken: null
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
            summary: '[PUBLIC] Upload Payment Proof',
            description: 'Upload transfer receipt for paid events.',
            responses: {
                200: {
                    description: 'Proof Uploaded Successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                example: {
                                    success: true,
                                    data: { paymentProof: "/uploads/payments/xyz.jpg" }
                                }
                            }
                        }
                    }
                }
            }
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
            summary: '[ADMIN/STAFF] Create Event',
            description: 'Create a new event. Restricted to Admin, Dosen, Staff.',
            responses: {
                200: {
                    description: 'Event Created Successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                example: {
                                    success: true,
                                    data: { id: "evt_new_1", title: "New Event" }
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    /**
     * GET /events/:id/registrants
     * List registrants (For Verification)
     */
    .get('/:id/registrants', async ({ params, headers, jwt }: any) => {
        try {
            const authHeader = headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) throw new Error('Unauthorized');
            const token = authHeader.replace('Bearer ', '');
            const payload = await jwt.verify(token);
            if (!payload) throw new Error('Invalid Token');

            // Role Check: Admin/Staff only
            if (!['admin', 'dosen', 'staff'].includes(payload.role)) {
                throw new Error('Forbidden');
            }

            const data = await eventsService.getRegistrants(params.id);
            return { success: true, data };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }, {
        detail: {
            tags: ['Events'],
            summary: '[ADMIN/STAFF] List Registrants',
            description: 'Get list of users registered to an event. Used for verifying payments.',
            responses: {
                200: {
                    description: 'List of registrants',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                example: {
                                    success: true,
                                    data: [{ user: { fullName: "Budi" }, paymentStatus: "pending", paymentProof: "/img.jpg" }]
                                }
                            }
                        }
                    }
                }
            }
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
        body: VerifyPaymentDTO,
        detail: {
            tags: ['Events'],
            summary: '[ADMIN/STAFF] Verify Payment',
            description: 'Approve or Reject payment. Approving generates QR Token.',
            responses: {
                200: {
                    description: 'Payment Verified',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                example: {
                                    success: true,
                                    data: { status: "registered", qrToken: "uuid-token" }
                                }
                            }
                        }
                    }
                }
            }
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
            summary: '[OPERATOR] Event Check-in',
            description: 'Scan QR Code for attendance.',
             responses: {
                200: {
                    description: 'Checkin Successful',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                example: {
                                    success: true,
                                    data: { valid: true, guestName: "Budi", eventName: "Seminar" }
                                }
                            }
                        }
                    }
                }
            }
        }
    });
