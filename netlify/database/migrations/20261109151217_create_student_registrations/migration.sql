CREATE TABLE "student_registrations" (
	"name" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp
);
