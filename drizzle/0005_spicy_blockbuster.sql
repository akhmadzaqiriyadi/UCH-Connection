CREATE TABLE "event_registrants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" uuid,
	"guest_name" varchar(255),
	"guest_email" varchar(255),
	"guest_phone" varchar(50),
	"registration_data" json,
	"payment_status" varchar(20) DEFAULT 'free',
	"payment_proof" varchar(255),
	"status" varchar(20) DEFAULT 'registered',
	"qr_token" varchar(255),
	"checked_in_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "event_registrants_qr_token_unique" UNIQUE("qr_token")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"banner_image" varchar(255),
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"type" varchar(50) NOT NULL,
	"is_online" boolean DEFAULT false,
	"location" varchar(255),
	"price" numeric(10, 2) DEFAULT '0',
	"quota" integer NOT NULL,
	"is_public" boolean DEFAULT false,
	"registration_form_schema" json,
	"organizer_id" uuid,
	"status" varchar(20) DEFAULT 'published',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_registrants" ADD CONSTRAINT "event_registrants_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrants" ADD CONSTRAINT "event_registrants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;