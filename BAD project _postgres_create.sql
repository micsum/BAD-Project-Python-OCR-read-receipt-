CREATE TABLE "user" (
	"id" serial NOT NULL UNIQUE,
	"password" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL UNIQUE,
	"phone_number" varchar(255) NOT NULL UNIQUE,
	"email" varchar(255) NOT NULL UNIQUE,
	"fps_id" varchar(255) UNIQUE,
	"payme_link" varchar(255) UNIQUE,
	"credit" DECIMAL NOT NULL,
	CONSTRAINT "user_pk" PRIMARY KEY ("id")
) WITH (OIDS = FALSE);
CREATE TABLE "group_member" (
	"id" serial NOT NULL,
	"member_userid" integer NOT NULL UNIQUE,
	"ingroup_credit" varchar(255) NOT NULL,
	"group_name" varchar(255) NOT NULL,
	CONSTRAINT "group_member_pk" PRIMARY KEY ("id")
) WITH (OIDS = FALSE);
CREATE TABLE "receipt" (
	"id" serial NOT NULL,
	"receipt_id" varchar(255) NOT NULL UNIQUE,
	"file_name" varchar(255) NOT NULL,
	"from" integer NOT NULL,
	"to_group" varchar(255),
	"confirm_selection" BOOLEAN NOT NULL DEFAULT '0',
	"confirm_paid" BOOLEAN NOT NULL DEFAULT '0',
	"receipt_type" varchar(255) NOT NULL DEFAULT 'food',
	"transaction_date" DATE NULL,
	"created_at" DATE NULL,
	CONSTRAINT "receipt_pk" PRIMARY KEY ("id")
) WITH (OIDS = FALSE);
CREATE TABLE "receipt_item" (
	"id" serial NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"price" DECIMAL NOT NULL,
	"quantity" integer NOT NULL DEFAULT '1',
	"receipt_id" integer NOT NULL,
	"item_id" varchar(255) NOT NULL,
	CONSTRAINT "receipt_items_pk" PRIMARY KEY ("id")
) WITH (OIDS = FALSE);
CREATE TABLE "notification" (
	"id" serial NOT NULL,
	"from" integer NOT NULL,
	"to" integer NOT NULL,
	"payment" BOOLEAN NOT NULL,
	"information" varchar(255),
	"receipt_id" integer CONSTRAINT "notification_pk" PRIMARY KEY ("id")
) WITH (OIDS = FALSE);
CREATE TABLE "receipt_recipient" (
	"id" serial NOT NULL,
	"receipt_id" integer NOT NULL,
	"to_individual" integer NOT NULL,
	CONSTRAINT "receipt_recipients_pk" PRIMARY KEY ("id")
) WITH (OIDS = FALSE);
CREATE TABLE "item_payer" (
	"id" serial NOT NULL,
	"user_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"payment_date" DATE
) WITH (OIDS = FALSE);
ALTER TABLE "group_member"
ADD CONSTRAINT "group_member_fk0" FOREIGN KEY ("member_userid") REFERENCES "user"("id");
ALTER TABLE "receipt"
ADD CONSTRAINT "receipt_fk0" FOREIGN KEY ("from") REFERENCES "user"("id");
ALTER TABLE "receipt_item"
ADD CONSTRAINT "receipt_item_fk0" FOREIGN KEY ("receipt_id") REFERENCES "receipt"("id");
ALTER TABLE "notification"
ADD CONSTRAINT "notification_fk0" FOREIGN KEY ("from") REFERENCES "user"("id");
ALTER TABLE "notification"
ADD CONSTRAINT "notification_fk1" FOREIGN KEY ("to") REFERENCES "user"("id");
ALTER TABLE "notification"
ADD CONSTRAINT "notification_fk2" FOREIGN KEY ("receipt_id") REFERENCES "receipt"("id");
ALTER TABLE "receipt_recipient"
ADD CONSTRAINT "receipt_recipient_fk0" FOREIGN KEY ("receipt_id") REFERENCES "receipt"("id");
ALTER TABLE "receipt_recipient"
ADD CONSTRAINT "receipt_recipient_fk1" FOREIGN KEY ("to_individual") REFERENCES "user"("id");
ALTER TABLE "item_payer"
ADD CONSTRAINT "item_payer_fk0" FOREIGN KEY ("user_id") REFERENCES "user"("id");
ALTER TABLE "item_payer"
ADD CONSTRAINT "item_payer_fk1" FOREIGN KEY ("item_id") REFERENCES "receipt_item"("id");