CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`trip` text NOT NULL,
	`user` text DEFAULT '' NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`token` text DEFAULT '' NOT NULL,
	`expires` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `records` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`trip` text DEFAULT '' NOT NULL,
	`owner` text NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL
);
