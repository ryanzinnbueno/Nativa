CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customer_owner_phone` ON `customers` (`owner`,`phone`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`customer_id` text NOT NULL,
	`items` text NOT NULL,
	`total` integer NOT NULL,
	`status` text DEFAULT 'Novo' NOT NULL,
	`channel` text NOT NULL,
	`delivery` text NOT NULL,
	`address` text NOT NULL,
	`payment` text NOT NULL,
	`notes` text NOT NULL,
	`created` text NOT NULL,
	`request_key` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `order_owner_request` ON `orders` (`owner`,`request_key`);--> statement-breakpoint
CREATE TABLE `settings` (
	`owner` text PRIMARY KEY NOT NULL,
	`phone` text DEFAULT '' NOT NULL
);
