ALTER TABLE "users" ADD COLUMN "reset_token" varchar(500);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_token_expires" timestamp;