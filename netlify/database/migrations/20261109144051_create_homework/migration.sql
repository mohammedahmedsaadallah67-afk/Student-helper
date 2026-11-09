CREATE TABLE "homework" (
	"id" serial PRIMARY KEY,
	"poster" text NOT NULL,
	"text" text NOT NULL,
	"date" text NOT NULL,
	"file_name" text,
	"file_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
