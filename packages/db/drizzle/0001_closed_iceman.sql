CREATE TYPE "public"."comparison_note_aspect" AS ENUM('tone', 'weight_response', 'projection', 'general');--> statement-breakpoint
CREATE TABLE "confirmed_references" (
	"session_id" uuid NOT NULL,
	"model_id" uuid NOT NULL,
	"confirmed_at" timestamp with time zone NOT NULL,
	CONSTRAINT "confirmed_references_session_id_model_id_pk" PRIMARY KEY("session_id","model_id")
);
--> statement-breakpoint
CREATE TABLE "model_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" uuid NOT NULL,
	"alias" text NOT NULL,
	"locale" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_comparison_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_a_id" uuid NOT NULL,
	"model_b_id" uuid NOT NULL,
	"aspect" "comparison_note_aspect" NOT NULL,
	"note_vi" text NOT NULL,
	"note_en" text NOT NULL,
	"source_url" text NOT NULL,
	"author" text NOT NULL,
	"reviewed_by" text NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "model_comparison_notes_pair_order" CHECK ("model_comparison_notes"."model_a_id" < "model_comparison_notes"."model_b_id")
);
--> statement-breakpoint
ALTER TABLE "confirmed_references" ADD CONSTRAINT "confirmed_references_session_id_consultation_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."consultation_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "confirmed_references" ADD CONSTRAINT "confirmed_references_model_id_instrument_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."instrument_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_aliases" ADD CONSTRAINT "model_aliases_model_id_instrument_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."instrument_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_comparison_notes" ADD CONSTRAINT "model_comparison_notes_model_a_id_instrument_models_id_fk" FOREIGN KEY ("model_a_id") REFERENCES "public"."instrument_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_comparison_notes" ADD CONSTRAINT "model_comparison_notes_model_b_id_instrument_models_id_fk" FOREIGN KEY ("model_b_id") REFERENCES "public"."instrument_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "model_aliases_alias_locale_uidx" ON "model_aliases" USING btree ("alias","locale");