import { t } from 'elysia';

// Define the Schema for Dynamic Form Field
export const FormFieldSchema = t.Object({
    key: t.String(),
    label: t.String(),
    type: t.Union([t.Literal('text'), t.Literal('number'), t.Literal('select'), t.Literal('date')]),
    required: t.Boolean(),
    options: t.Optional(t.Array(t.String())) // Only for 'select'
});

// Input DTO: Create Event
export const CreateEventDTO = t.Object({
    title: t.String(),
    description: t.Optional(t.String()),
    bannerImage: t.Optional(t.String()),
    startTime: t.String(), // ISO DateTime
    endTime: t.String(),   // ISO DateTime
    type: t.String(),      // Seminar, Workshop
    isOnline: t.Boolean(),
    location: t.Optional(t.String()),
    price: t.Number(),
    quota: t.Number(),
    isPublic: t.Boolean(),
    registrationFormSchema: t.Optional(t.Array(FormFieldSchema))
});

// Input DTO: Register Event
export const RegisterEventDTO = t.Object({
    eventId: t.String(),
    // Guest Fields (Optional)
    guestName: t.Optional(t.String()),
    guestEmail: t.Optional(t.String()),
    guestPhone: t.Optional(t.String()),
    
    // Dynamic Answers (JSON)
    // We treat it as generic Object because structure varies
    registrationData: t.Optional(t.Object({}, { additionalProperties: true })),
});

// Input DTO: Verify Payment
export const VerifyPaymentDTO = t.Object({
    status: t.Union([t.Literal('paid'), t.Literal('rejected')]),
});

// Types for Service logic
export type FormField = {
    key: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'date';
    required: boolean;
    options?: string[];
};

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'ended';
export type PaymentStatus = 'free' | 'pending' | 'paid' | 'rejected';
