ALTER TABLE "dosen" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "fakultas" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "himpunan" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "mahasiswa" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "prodi" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "ukm" ADD COLUMN "deleted_at" timestamp;