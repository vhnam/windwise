CREATE TYPE "public"."source_kind" AS ENUM('manufacturer', 'dealer', 'manual_pdf', 'editorial', 'expert_review');--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "brands_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "model_images" (
	"id" uuid PRIMARY KEY NOT NULL,
	"model_id" uuid NOT NULL,
	"url" text NOT NULL,
	"alt_vi" text NOT NULL,
	"alt_en" text NOT NULL,
	"credit" text NOT NULL,
	"license_note" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY NOT NULL,
	"model_id" uuid NOT NULL,
	"kind" "source_kind" NOT NULL,
	"url" text NOT NULL,
	"publisher" text NOT NULL,
	"retrieved_at" timestamp with time zone NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "model_images" ADD CONSTRAINT "model_images_model_id_instrument_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."instrument_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_model_id_instrument_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."instrument_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
INSERT INTO "brands" ("id", "slug", "name")
SELECT DISTINCT m."brand_id", 'brand-' || substr(m."brand_id"::text, 1, 8), 'Unknown brand'
FROM "instrument_models" m
LEFT JOIN "brands" b ON b."id" = m."brand_id"
WHERE b."id" IS NULL;--> statement-breakpoint
ALTER TABLE "instrument_models" ADD CONSTRAINT "instrument_models_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;