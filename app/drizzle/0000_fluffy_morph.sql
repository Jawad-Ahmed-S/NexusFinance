-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `accounts` (
	`account_id` int AUTO_INCREMENT NOT NULL,
	`customer_id` int NOT NULL,
	`account_type` enum('wadi_ah','mudarabah','charity') NOT NULL,
	`balance` decimal(15,2) NOT NULL DEFAULT '0.00',
	`status` enum('active','frozen','closed') NOT NULL DEFAULT 'active',
	`opened_at` timestamp DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `accounts_account_id` PRIMARY KEY(`account_id`),
	CONSTRAINT `chk_balance` CHECK((`balance` >= 0))
);
--> statement-breakpoint
CREATE TABLE `churn_signal` (
	`signal_id` int AUTO_INCREMENT NOT NULL,
	`customer_id` int NOT NULL,
	`transaction_velocity_score` decimal(8,4) NOT NULL,
	`balance_volatility_score` decimal(8,4) NOT NULL,
	`last_computed_at` timestamp DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `churn_signal_signal_id` PRIMARY KEY(`signal_id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`customer_id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`full_name` varchar(100) NOT NULL,
	`national_id` varchar(15),
	`phone` varchar(20) NOT NULL,
	`email` varchar(100) NOT NULL,
	`created_at` timestamp DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `customers_customer_id` PRIMARY KEY(`customer_id`),
	CONSTRAINT `email` UNIQUE(`email`),
	CONSTRAINT `national_id` UNIQUE(`national_id`),
	CONSTRAINT `user_id` UNIQUE(`user_id`),
	CONSTRAINT `checkCNIC` CHECK(regexp_like(`national_id`,_utf8mb4\'^[0-9]{5}-[0-9]{7}-[0-9]{1}$\')),
	CONSTRAINT `checkPhone` CHECK(regexp_like(`phone`,_utf8mb4\'^[0-9]{10}$\')),
	CONSTRAINT `checkEmail` CHECK(regexp_like(`email`,_utf8mb4\'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\\\.[A-Za-z]{2,}$\'))
);
--> statement-breakpoint
CREATE TABLE `mudarabah_detail` (
	`mudarabah_id` int AUTO_INCREMENT NOT NULL,
	`account_id` int NOT NULL,
	`profit_sharing_ratio` decimal(5,4) NOT NULL,
	`investment_period_months` int NOT NULL,
	CONSTRAINT `mudarabah_detail_mudarabah_id` PRIMARY KEY(`mudarabah_id`),
	CONSTRAINT `account_id` UNIQUE(`account_id`),
	CONSTRAINT `checkProfitRatio` CHECK(((`profit_sharing_ratio` > 0) and (`profit_sharing_ratio` < 1)))
);
--> statement-breakpoint
CREATE TABLE `nbo_recommendation` (
	`nbo_id` int AUTO_INCREMENT NOT NULL,
	`customer_id` int NOT NULL,
	`rule_id` int NOT NULL,
	`status` enum('presented','accepted','dismissed') NOT NULL DEFAULT 'presented',
	`offer_generated_at` timestamp DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `nbo_recommendation_nbo_id` PRIMARY KEY(`nbo_id`)
);
--> statement-breakpoint
CREATE TABLE `nbo_rules` (
	`rule_id` int AUTO_INCREMENT NOT NULL,
	`trigger_rule` varchar(100) NOT NULL,
	`product_id` int NOT NULL,
	CONSTRAINT `nbo_rules_rule_id` PRIMARY KEY(`rule_id`),
	CONSTRAINT `trigger_rule` UNIQUE(`trigger_rule`)
);
--> statement-breakpoint
CREATE TABLE `product_catalog` (
	`product_id` int AUTO_INCREMENT NOT NULL,
	`product_name` varchar(100) NOT NULL,
	`product_type` enum('murabaha','ijarah','musharakah','istisna','salam') NOT NULL,
	`is_active` tinyint(1) NOT NULL DEFAULT 1,
	CONSTRAINT `product_catalog_product_id` PRIMARY KEY(`product_id`),
	CONSTRAINT `product_name` UNIQUE(`product_name`)
);
--> statement-breakpoint
CREATE TABLE `purification_entry` (
	`entry_id` int AUTO_INCREMENT NOT NULL,
	`txn_id` int NOT NULL,
	`purified_amount` decimal(15,2) NOT NULL,
	`purification_date` date NOT NULL,
	CONSTRAINT `purification_entry_entry_id` PRIMARY KEY(`entry_id`),
	CONSTRAINT `txn_id` UNIQUE(`txn_id`),
	CONSTRAINT `checkPurifiedAmount` CHECK((`purified_amount` > 0))
);
--> statement-breakpoint
CREATE TABLE `staff` (
	`staff_id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`full_name` varchar(100) NOT NULL,
	`created_at` timestamp DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `staff_staff_id` PRIMARY KEY(`staff_id`),
	CONSTRAINT `user_id` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `transaction_ledger` (
	`txn_id` int AUTO_INCREMENT NOT NULL,
	`account_id` int NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`direction` enum('debit','credit') NOT NULL,
	`txn_type` enum('deposit','withdrawal','transfer','purification','profit_distribution') NOT NULL,
	`reference_note` varchar(255),
	`created_at` timestamp DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `transaction_ledger_txn_id` PRIMARY KEY(`txn_id`),
	CONSTRAINT `checkAmount` CHECK((`amount` > 0))
);
--> statement-breakpoint
CREATE TABLE `txn_pair` (
	`pair_id` int AUTO_INCREMENT NOT NULL,
	`debit_txn_id` int NOT NULL,
	`credit_txn_id` int NOT NULL,
	`pair_type` enum('transfer','profit_distribution','purification') NOT NULL,
	`created_at` timestamp DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `txn_pair_pair_id` PRIMARY KEY(`pair_id`),
	CONSTRAINT `credit_txn_id` UNIQUE(`credit_txn_id`),
	CONSTRAINT `debit_txn_id` UNIQUE(`debit_txn_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`user_id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(50) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` enum('customer','staff','admin') NOT NULL,
	`created_at` timestamp DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `users_user_id` PRIMARY KEY(`user_id`),
	CONSTRAINT `username` UNIQUE(`username`)
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`customer_id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `churn_signal` ADD CONSTRAINT `churn_signal_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`customer_id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `customers` ADD CONSTRAINT `customers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `mudarabah_detail` ADD CONSTRAINT `mudarabah_detail_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`account_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `nbo_recommendation` ADD CONSTRAINT `nbo_recommendation_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`customer_id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `nbo_recommendation` ADD CONSTRAINT `nbo_recommendation_ibfk_2` FOREIGN KEY (`rule_id`) REFERENCES `nbo_rules`(`rule_id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `nbo_rules` ADD CONSTRAINT `nbo_rules_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `product_catalog`(`product_id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `purification_entry` ADD CONSTRAINT `purification_entry_ibfk_1` FOREIGN KEY (`txn_id`) REFERENCES `transaction_ledger`(`txn_id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `staff` ADD CONSTRAINT `staff_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `transaction_ledger` ADD CONSTRAINT `transaction_ledger_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`account_id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `txn_pair` ADD CONSTRAINT `txn_pair_ibfk_1` FOREIGN KEY (`debit_txn_id`) REFERENCES `transaction_ledger`(`txn_id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `txn_pair` ADD CONSTRAINT `txn_pair_ibfk_2` FOREIGN KEY (`credit_txn_id`) REFERENCES `transaction_ledger`(`txn_id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `customer_id` ON `accounts` (`customer_id`);--> statement-breakpoint
CREATE INDEX `customer_id` ON `churn_signal` (`customer_id`);--> statement-breakpoint
CREATE INDEX `customer_id` ON `nbo_recommendation` (`customer_id`);--> statement-breakpoint
CREATE INDEX `rule_id` ON `nbo_recommendation` (`rule_id`);--> statement-breakpoint
CREATE INDEX `product_id` ON `nbo_rules` (`product_id`);--> statement-breakpoint
CREATE INDEX `account_id` ON `transaction_ledger` (`account_id`);
*/