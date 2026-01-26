CREATE TABLE "stripeWebhookEvents" (
	"id" serial PRIMARY KEY,
	"eventId" varchar(255) NOT NULL UNIQUE,
	"eventType" varchar(255) NOT NULL,
	"status" varchar(32) NOT NULL DEFAULT 'processing',
	"createdAt" timestamp NOT NULL DEFAULT now(),
	"updatedAt" timestamp NOT NULL DEFAULT now()
);
