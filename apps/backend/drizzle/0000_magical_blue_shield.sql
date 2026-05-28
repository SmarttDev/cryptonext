CREATE TABLE "crypto_events" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"asset_id" varchar(100) NOT NULL,
	"asset_type" varchar(50) NOT NULL,
	"algorithm" varchar(50) NOT NULL,
	"severity" varchar NOT NULL,
	"source_ip" varchar(45) NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"event_type" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_algorithm" ON "crypto_events" USING btree ("algorithm");--> statement-breakpoint
CREATE INDEX "idx_severity" ON "crypto_events" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_asset_type" ON "crypto_events" USING btree ("asset_type");--> statement-breakpoint
CREATE INDEX "idx_observed_at" ON "crypto_events" USING btree ("observed_at");--> statement-breakpoint
CREATE INDEX "idx_source_ip" ON "crypto_events" USING btree ("source_ip");--> statement-breakpoint
CREATE INDEX "idx_event_type" ON "crypto_events" USING btree ("event_type");