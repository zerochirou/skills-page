CREATE TABLE `skills` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`summary` text,
	`visibility` text DEFAULT 'public' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`sub_skills_count` integer DEFAULT 0 NOT NULL,
	`units_count` integer DEFAULT 0 NOT NULL,
	`stars_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`overview` text,
	FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `skills_owner_slug_uidx` ON `skills` (`owner_id`,`slug`);--> statement-breakpoint
CREATE INDEX `skills_owner_updated_idx` ON `skills` (`owner_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `skills_public_stars_idx` ON `skills` (`visibility`,`status`,`stars_count`);--> statement-breakpoint
CREATE INDEX `skills_public_updated_idx` ON `skills` (`visibility`,`status`,`updated_at`);--> statement-breakpoint
CREATE TABLE `sub_skills` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`skill_id` integer NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`units_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sub_skills_skill_slug_uidx` ON `sub_skills` (`skill_id`,`slug`);--> statement-breakpoint
CREATE INDEX `sub_skills_skill_order_idx` ON `sub_skills` (`skill_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `units` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`skill_id` integer NOT NULL,
	`sub_skill_id` integer NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`unit_type` text DEFAULT 'page' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_published` integer DEFAULT true NOT NULL,
	`estimated_minutes` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sub_skill_id`) REFERENCES `sub_skills`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `units_sub_skill_slug_uidx` ON `units` (`sub_skill_id`,`slug`);--> statement-breakpoint
CREATE INDEX `units_skill_sub_order_idx` ON `units` (`skill_id`,`sub_skill_id`,`sort_order`);--> statement-breakpoint
DROP TABLE `courses`;