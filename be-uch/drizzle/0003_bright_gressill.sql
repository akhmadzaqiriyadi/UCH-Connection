CREATE TYPE "public"."booking_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled', 'checked_in', 'completed');--> statement-breakpoint
CREATE TYPE "public"."room_status" AS ENUM('available', 'maintenance');--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"ruangan_id" uuid NOT NULL,
	"purpose" text NOT NULL,
	"audience_count" integer NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"qr_token" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checkins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"checkin_time" timestamp DEFAULT now() NOT NULL,
	"checked_in_by" uuid,
	CONSTRAINT "checkins_booking_id_unique" UNIQUE("booking_id")
);
--> statement-breakpoint
CREATE TABLE "ruangan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kode" varchar(20) NOT NULL,
	"nama" varchar(100) NOT NULL,
	"lantai" integer NOT NULL,
	"gedung" varchar(50) NOT NULL,
	"kapasitas" integer NOT NULL,
	"fasilitas" text,
	"status" varchar(20) DEFAULT 'available',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "ruangan_kode_unique" UNIQUE("kode")
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_ruangan_id_ruangan_id_fk" FOREIGN KEY ("ruangan_id") REFERENCES "public"."ruangan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_checked_in_by_users_id_fk" FOREIGN KEY ("checked_in_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;