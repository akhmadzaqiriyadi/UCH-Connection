CREATE TYPE "public"."role" AS ENUM('admin', 'dosen', 'mahasiswa', 'staff');--> statement-breakpoint
CREATE TABLE "dosen" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"nip" varchar(20) NOT NULL,
	"fakultas_id" uuid NOT NULL,
	"jabatan" varchar(100),
	"no_hp" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dosen_nip_unique" UNIQUE("nip")
);
--> statement-breakpoint
CREATE TABLE "fakultas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kode" varchar(10) NOT NULL,
	"nama" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fakultas_kode_unique" UNIQUE("kode")
);
--> statement-breakpoint
CREATE TABLE "himpunan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nama" varchar(255) NOT NULL,
	"prodi_id" uuid NOT NULL,
	"deskripsi" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "himpunan_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"himpunan_id" uuid NOT NULL,
	"mahasiswa_id" uuid NOT NULL,
	"jabatan" varchar(100),
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mahasiswa" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"nim" varchar(20) NOT NULL,
	"prodi_id" uuid NOT NULL,
	"angkatan" integer NOT NULL,
	"no_hp" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mahasiswa_nim_unique" UNIQUE("nim")
);
--> statement-breakpoint
CREATE TABLE "prodi" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kode" varchar(10) NOT NULL,
	"nama" varchar(255) NOT NULL,
	"fakultas_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "prodi_kode_unique" UNIQUE("kode")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(500) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "ukm" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nama" varchar(255) NOT NULL,
	"deskripsi" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ukm_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ukm_id" uuid NOT NULL,
	"mahasiswa_id" uuid NOT NULL,
	"jabatan" varchar(100),
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"role" "role" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "dosen" ADD CONSTRAINT "dosen_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dosen" ADD CONSTRAINT "dosen_fakultas_id_fakultas_id_fk" FOREIGN KEY ("fakultas_id") REFERENCES "public"."fakultas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "himpunan" ADD CONSTRAINT "himpunan_prodi_id_prodi_id_fk" FOREIGN KEY ("prodi_id") REFERENCES "public"."prodi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "himpunan_members" ADD CONSTRAINT "himpunan_members_himpunan_id_himpunan_id_fk" FOREIGN KEY ("himpunan_id") REFERENCES "public"."himpunan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "himpunan_members" ADD CONSTRAINT "himpunan_members_mahasiswa_id_mahasiswa_id_fk" FOREIGN KEY ("mahasiswa_id") REFERENCES "public"."mahasiswa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mahasiswa" ADD CONSTRAINT "mahasiswa_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mahasiswa" ADD CONSTRAINT "mahasiswa_prodi_id_prodi_id_fk" FOREIGN KEY ("prodi_id") REFERENCES "public"."prodi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prodi" ADD CONSTRAINT "prodi_fakultas_id_fakultas_id_fk" FOREIGN KEY ("fakultas_id") REFERENCES "public"."fakultas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ukm_members" ADD CONSTRAINT "ukm_members_ukm_id_ukm_id_fk" FOREIGN KEY ("ukm_id") REFERENCES "public"."ukm"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ukm_members" ADD CONSTRAINT "ukm_members_mahasiswa_id_mahasiswa_id_fk" FOREIGN KEY ("mahasiswa_id") REFERENCES "public"."mahasiswa"("id") ON DELETE cascade ON UPDATE no action;