ALTER TABLE "federated_graphs" ADD COLUMN "admission_webhook_url" text;--> statement-breakpoint
ALTER TABLE "graph_compositions" ADD COLUMN "router_config_signature" text;