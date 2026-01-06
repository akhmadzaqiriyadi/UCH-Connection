import { pgTable, uuid, varchar, timestamp, text, integer, pgEnum, json, boolean, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const roleEnum = pgEnum('role', ['admin', 'dosen', 'mahasiswa', 'staff', 'user']);
export const bookingStatusEnum = pgEnum('booking_status', ['pending', 'approved', 'rejected', 'cancelled', 'checked_in', 'completed']);
export const roomStatusEnum = pgEnum('room_status', ['available', 'maintenance']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  role: roleEnum('role').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  resetToken: varchar('reset_token', { length: 500 }),
  resetTokenExpires: timestamp('reset_token_expires'),
});

// Fakultas table
export const fakultas = pgTable('fakultas', {
  id: uuid('id').primaryKey().defaultRandom(),
  kode: varchar('kode', { length: 10 }).notNull().unique(),
  nama: varchar('nama', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// Prodi table
export const prodi = pgTable('prodi', {
  id: uuid('id').primaryKey().defaultRandom(),
  kode: varchar('kode', { length: 10 }).notNull().unique(),
  nama: varchar('nama', { length: 255 }).notNull(),
  fakultasId: uuid('fakultas_id').notNull().references(() => fakultas.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// Mahasiswa table
export const mahasiswa = pgTable('mahasiswa', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  nim: varchar('nim', { length: 20 }).notNull().unique(),
  prodiId: uuid('prodi_id').notNull().references(() => prodi.id),
  angkatan: integer('angkatan').notNull(),
  noHp: varchar('no_hp', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// Dosen table
export const dosen = pgTable('dosen', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  nip: varchar('nip', { length: 20 }).notNull().unique(),
  fakultasId: uuid('fakultas_id').notNull().references(() => fakultas.id),
  jabatan: varchar('jabatan', { length: 100 }),
  noHp: varchar('no_hp', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// UKM table
export const ukm = pgTable('ukm', {
  id: uuid('id').primaryKey().defaultRandom(),
  nama: varchar('nama', { length: 255 }).notNull(),
  deskripsi: text('deskripsi'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// UKM Members table
export const ukmMembers = pgTable('ukm_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  ukmId: uuid('ukm_id').notNull().references(() => ukm.id, { onDelete: 'cascade' }),
  mahasiswaId: uuid('mahasiswa_id').notNull().references(() => mahasiswa.id, { onDelete: 'cascade' }),
  jabatan: varchar('jabatan', { length: 100 }),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

// Himpunan table
export const himpunan = pgTable('himpunan', {
  id: uuid('id').primaryKey().defaultRandom(),
  nama: varchar('nama', { length: 255 }).notNull(),
  prodiId: uuid('prodi_id').notNull().references(() => prodi.id),
  deskripsi: text('deskripsi'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// Himpunan Members table
export const himpunanMembers = pgTable('himpunan_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  himpunanId: uuid('himpunan_id').notNull().references(() => himpunan.id, { onDelete: 'cascade' }),
  mahasiswaId: uuid('mahasiswa_id').notNull().references(() => mahasiswa.id, { onDelete: 'cascade' }),
  jabatan: varchar('jabatan', { length: 100 }),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

// Refresh Tokens table (for JWT)
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 500 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Ruangan (Room Master Data)
export const ruangan = pgTable('ruangan', {
  id: uuid('id').primaryKey().defaultRandom(),
  kode: varchar('kode', { length: 20 }).notNull().unique(), // e.g. 'A.2.1'
  nama: varchar('nama', { length: 100 }).notNull(), // e.g. 'Lab Komputer 1'
  lantai: integer('lantai').notNull(),
  gedung: varchar('gedung', { length: 50 }).notNull(),
  kapasitas: integer('kapasitas').notNull(),
  fasilitas: text('fasilitas'), // e.g. "AC, Proyektor, Sound"
  image: varchar('image', { length: 255 }), // URL path to image
  status: varchar('status', { length: 20 }).default('available'), // available, maintenance
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// Bookings
export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  ruanganId: uuid('ruangan_id').notNull().references(() => ruangan.id),
  purpose: text('purpose').notNull(),
  audienceCount: integer('audience_count').notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  rejectionReason: text('rejection_reason'),
  qrToken: varchar('qr_token', { length: 255 }), // Generated upon approval
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Checkins
export const checkins = pgTable('checkins', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').notNull().references(() => bookings.id).unique(),
  checkinTime: timestamp('checkin_time').defaultNow().notNull(),
  checkedInBy: uuid('checked_in_by').references(() => users.id), // Optional: who scanned it?
});

// Events
export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  bannerImage: varchar('banner_image', { length: 255 }),
  
  // Schedule
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  
  // Details
  type: varchar('type', { length: 50 }).notNull(), // seminar, workshop, etc
  isOnline: boolean('is_online').default(false),
  location: varchar('location', { length: 255 }), // address or link
  
  // Registration Flow
  price: decimal('price', { precision: 10, scale: 2 }).default('0'),
  quota: integer('quota').notNull(),
  isPublic: boolean('is_public').default(false), // Allow guest registration
  
  // Dynamic Form Schema
  // Example: [{ key: "size", label: "T-Shirt Size", type: "select", options: ["S","M"] }]
  registrationFormSchema: json('registration_form_schema'),
  
  // Organizer
  organizerId: uuid('organizer_id').references(() => users.id),
  
  status: varchar('status', { length: 20 }).default('published'), // draft, published, cancelled, ended
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Event Registrants
export const eventRegistrants = pgTable('event_registrants', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').references(() => events.id).notNull(),
  
  // User Link (Optional for Guest)
  userId: uuid('user_id').references(() => users.id),
  
  // Guest Info (If userId is null)
  guestName: varchar('guest_name', { length: 255 }),
  guestEmail: varchar('guest_email', { length: 255 }),
  guestPhone: varchar('guest_phone', { length: 50 }),
  
  // Dynamic Form Answers
  // Example: { "size": "M", "github": "..." }
  registrationData: json('registration_data'),
  
  // Payment
  paymentStatus: varchar('payment_status', { length: 20 }).default('free'), // free, pending, paid, rejected
  paymentProof: varchar('payment_proof', { length: 255 }), // Image path
  
  // Check-in
  status: varchar('status', { length: 20 }).default('registered'), // registered, attended, cancelled
  qrToken: varchar('qr_token', { length: 255 }).unique(),
  checkedInAt: timestamp('checked_in_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const eventsRelations = relations(events, ({ one, many }) => ({
  organizer: one(users, {
    fields: [events.organizerId],
    references: [users.id],
  }),
  registrants: many(eventRegistrants),
}));

export const eventRegistrantsRelations = relations(eventRegistrants, ({ one }) => ({
  event: one(events, {
    fields: [eventRegistrants.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventRegistrants.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  mahasiswa: one(mahasiswa, {
    fields: [users.id],
    references: [mahasiswa.userId],
  }),
  dosen: one(dosen, {
    fields: [users.id],
    references: [dosen.userId],
  }),
}));

export const fakultasRelations = relations(fakultas, ({ many }) => ({
  prodi: many(prodi),
  dosen: many(dosen),
}));

export const prodiRelations = relations(prodi, ({ one, many }) => ({
  fakultas: one(fakultas, {
    fields: [prodi.fakultasId],
    references: [fakultas.id],
  }),
  mahasiswa: many(mahasiswa),
  himpunan: many(himpunan),
}));

export const mahasiswaRelations = relations(mahasiswa, ({ one, many }) => ({
  user: one(users, {
    fields: [mahasiswa.userId],
    references: [users.id],
  }),
  prodi: one(prodi, {
    fields: [mahasiswa.prodiId],
    references: [prodi.id],
  }),
  ukmMembers: many(ukmMembers),
  himpunanMembers: many(himpunanMembers),
}));

export const dosenRelations = relations(dosen, ({ one }) => ({
  user: one(users, {
    fields: [dosen.userId],
    references: [users.id],
  }),
  fakultas: one(fakultas, {
    fields: [dosen.fakultasId],
    references: [fakultas.id],
  }),
}));

export const ukmRelations = relations(ukm, ({ many }) => ({
  members: many(ukmMembers),
}));

export const ukmMembersRelations = relations(ukmMembers, ({ one }) => ({
  ukm: one(ukm, {
    fields: [ukmMembers.ukmId],
    references: [ukm.id],
  }),
  mahasiswa: one(mahasiswa, {
    fields: [ukmMembers.mahasiswaId],
    references: [mahasiswa.id],
  }),
}));

export const himpunanRelations = relations(himpunan, ({ one, many }) => ({
  prodi: one(prodi, {
    fields: [himpunan.prodiId],
    references: [prodi.id],
  }),
  members: many(himpunanMembers),
}));

export const himpunanMembersRelations = relations(himpunanMembers, ({ one }) => ({
  himpunan: one(himpunan, {
    fields: [himpunanMembers.himpunanId],
    references: [himpunan.id],
  }),
  mahasiswa: one(mahasiswa, {
    fields: [himpunanMembers.mahasiswaId],
    references: [mahasiswa.id],
  }),
}));

export const ruanganRelations = relations(ruangan, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  ruangan: one(ruangan, {
    fields: [bookings.ruanganId],
    references: [ruangan.id],
  }),
  checkin: one(checkins),
}));

export const checkinsRelations = relations(checkins, ({ one }) => ({
  booking: one(bookings, {
    fields: [checkins.bookingId],
    references: [bookings.id],
  }),
  checkedInBy: one(users, {
    fields: [checkins.checkedInBy],
    references: [users.id],
  }),
}));
