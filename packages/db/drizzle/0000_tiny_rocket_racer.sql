CREATE TYPE "public"."level_tier" AS ENUM('student', 'intermediate', 'professional', 'custom');--> statement-breakpoint
CREATE TYPE "public"."model_status" AS ENUM('draft', 'in_review', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."price_scope" AS ENUM('msrp_global', 'vn_street');--> statement-breakpoint
CREATE TYPE "public"."instrument_section" AS ENUM('brass', 'woodwind');--> statement-breakpoint
CREATE TYPE "public"."answer_source" AS ENUM('chat', 'form');--> statement-breakpoint
CREATE TYPE "public"."publish_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."rule_kind" AS ENUM('constraint', 'modifier');--> statement-breakpoint
CREATE TYPE "public"."rule_target" AS ENUM('family', 'model', 'brand');--> statement-breakpoint
CREATE TYPE "public"."session_intent" AS ENUM('discover', 'compare', 'upgrade');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('in_progress', 'completed', 'abandoned');--> statement-breakpoint
CREATE TABLE "instrument_families" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"section" "instrument_section" NOT NULL,
	"name_vi" text NOT NULL,
	"name_en" text NOT NULL,
	"beginner_difficulty" integer NOT NULL,
	"min_recommended_age" integer NOT NULL,
	"physical_demand" integer NOT NULL,
	"typical_ensembles" text[] NOT NULL,
	CONSTRAINT "instrument_families_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "instrument_models" (
	"id" uuid PRIMARY KEY NOT NULL,
	"brand_id" uuid NOT NULL,
	"family_id" uuid NOT NULL,
	"model_code" text NOT NULL,
	"display_name" text NOT NULL,
	"level_tier" "level_tier" NOT NULL,
	"status" "model_status" NOT NULL,
	"last_verified_at" timestamp with time zone NOT NULL,
	"variant_of_model_id" uuid
);
--> statement-breakpoint
CREATE TABLE "price_points" (
	"id" uuid PRIMARY KEY NOT NULL,
	"model_id" uuid NOT NULL,
	"scope" "price_scope" NOT NULL,
	"amount_min" numeric NOT NULL,
	"amount_max" numeric NOT NULL,
	"is_current" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultation_answers" (
	"session_id" uuid NOT NULL,
	"question_key" text NOT NULL,
	"raw_value" text NOT NULL,
	"normalized_value" text NOT NULL,
	"source" "answer_source" NOT NULL,
	CONSTRAINT "consultation_answers_session_id_question_key_pk" PRIMARY KEY("session_id","question_key")
);
--> statement-breakpoint
CREATE TABLE "consultation_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"anon_id" text NOT NULL,
	"question_set_id" uuid NOT NULL,
	"intent" "session_intent" NOT NULL,
	"locale" text NOT NULL,
	"status" "session_status" NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "question_sets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"status" "publish_status" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"question_set_id" uuid NOT NULL,
	"key" text NOT NULL,
	"required" integer NOT NULL,
	"prompt_vi" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendation_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"run_id" uuid NOT NULL,
	"rank" integer NOT NULL,
	"family_id" uuid NOT NULL,
	"model_id" uuid NOT NULL,
	"score" numeric NOT NULL,
	"score_breakdown" jsonb NOT NULL,
	"reasons" text[] NOT NULL,
	"excluded_by" jsonb
);
--> statement-breakpoint
CREATE TABLE "recommendation_runs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"session_id" uuid NOT NULL,
	"criteria" jsonb NOT NULL,
	"rule_set_id" uuid NOT NULL,
	"question_set_id" uuid NOT NULL,
	"prompt_version_id" text NOT NULL,
	"engine_version" text NOT NULL,
	"llm_model" text NOT NULL,
	"latency_ms" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"no_match" jsonb
);
--> statement-breakpoint
CREATE TABLE "rule_sets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"status" "publish_status" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rules" (
	"id" uuid PRIMARY KEY NOT NULL,
	"rule_set_id" uuid NOT NULL,
	"kind" "rule_kind" NOT NULL,
	"target" "rule_target" NOT NULL,
	"condition" jsonb NOT NULL,
	"effect" jsonb NOT NULL,
	"reason_template_vi" text NOT NULL,
	"reason_template_en" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "instrument_models" ADD CONSTRAINT "instrument_models_family_id_instrument_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."instrument_families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_points" ADD CONSTRAINT "price_points_model_id_instrument_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."instrument_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_answers" ADD CONSTRAINT "consultation_answers_session_id_consultation_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."consultation_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_sessions" ADD CONSTRAINT "consultation_sessions_question_set_id_question_sets_id_fk" FOREIGN KEY ("question_set_id") REFERENCES "public"."question_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_question_set_id_question_sets_id_fk" FOREIGN KEY ("question_set_id") REFERENCES "public"."question_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_items" ADD CONSTRAINT "recommendation_items_run_id_recommendation_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."recommendation_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_items" ADD CONSTRAINT "recommendation_items_family_id_instrument_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."instrument_families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_items" ADD CONSTRAINT "recommendation_items_model_id_instrument_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."instrument_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_runs" ADD CONSTRAINT "recommendation_runs_session_id_consultation_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."consultation_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_runs" ADD CONSTRAINT "recommendation_runs_rule_set_id_rule_sets_id_fk" FOREIGN KEY ("rule_set_id") REFERENCES "public"."rule_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_runs" ADD CONSTRAINT "recommendation_runs_question_set_id_question_sets_id_fk" FOREIGN KEY ("question_set_id") REFERENCES "public"."question_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rules" ADD CONSTRAINT "rules_rule_set_id_rule_sets_id_fk" FOREIGN KEY ("rule_set_id") REFERENCES "public"."rule_sets"("id") ON DELETE no action ON UPDATE no action;