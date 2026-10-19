-- VendorVerify AI Relational Database Schema
-- Target: MySQL 8.0+

CREATE DATABASE IF NOT EXISTS vendorverify;
USE vendorverify;

CREATE TABLE `alembic_version` (
  `version_num` varchar(32) NOT NULL,
  PRIMARY KEY (`version_num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `company_verifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int NOT NULL,
  `provider` varchar(100) NOT NULL,
  `search_query` varchar(255) NOT NULL,
  `jurisdiction_code` varchar(50) DEFAULT NULL,
  `api_status_code` int DEFAULT NULL,
  `raw_response` json DEFAULT NULL,
  `extracted_company_name` varchar(255) DEFAULT NULL,
  `extracted_reg_number` varchar(100) DEFAULT NULL,
  `extracted_jurisdiction` varchar(100) DEFAULT NULL,
  `extracted_status` varchar(100) DEFAULT NULL,
  `outcome` varchar(50) NOT NULL,
  `mismatch_notes` text,
  `is_simulated` tinyint(1) NOT NULL,
  `verified_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_company_verifications_vendor_id` (`vendor_id`),
  KEY `ix_company_verifications_id` (`id`),
  CONSTRAINT `company_verifications_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `document_checklists` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int NOT NULL,
  `document_type` varchar(100) NOT NULL,
  `status` varchar(50) NOT NULL,
  `notes` text,
  `checked_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_document_checklists_vendor_id` (`vendor_id`),
  KEY `ix_document_checklists_id` (`id`),
  CONSTRAINT `document_checklists_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `document_extractions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `document_id` int NOT NULL,
  `raw_text` text,
  `extracted_json` json DEFAULT NULL,
  `user_edited_json` json DEFAULT NULL,
  `is_user_corrected` tinyint(1) NOT NULL,
  `model_used` varchar(100) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_document_extractions_document_id` (`document_id`),
  KEY `ix_document_extractions_id` (`id`),
  CONSTRAINT `document_extractions_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int NOT NULL,
  `document_type` varchar(100) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `original_filename` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` int NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `processing_status` varchar(50) NOT NULL,
  `verification_status` varchar(50) NOT NULL,
  `uploaded_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_documents_vendor_id` (`vendor_id`),
  KEY `ix_documents_document_type` (`document_type`),
  KEY `ix_documents_id` (`id`),
  CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `email_notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int NOT NULL,
  `recipient_email` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `body_text` text NOT NULL,
  `missing_documents` json DEFAULT NULL,
  `provider` varchar(50) NOT NULL,
  `status` varchar(50) NOT NULL,
  `provider_message_id` varchar(255) DEFAULT NULL,
  `error_message` text,
  `sent_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_email_notifications_id` (`id`),
  KEY `ix_email_notifications_vendor_id` (`vendor_id`),
  CONSTRAINT `email_notifications_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `field_comparisons` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int NOT NULL,
  `field_name` varchar(100) NOT NULL,
  `vendor_value` text,
  `registration_value` text,
  `gst_value` text,
  `bank_value` text,
  `external_api_value` text,
  `match_status` varchar(50) NOT NULL,
  `explanation` text,
  `review_status` varchar(50) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_field_comparisons_vendor_id` (`vendor_id`),
  KEY `ix_field_comparisons_id` (`id`),
  CONSTRAINT `field_comparisons_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `priority` varchar(20) NOT NULL,
  `due_date` datetime DEFAULT NULL,
  `status` varchar(50) NOT NULL,
  `created_at` datetime NOT NULL,
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_tasks_vendor_id` (`vendor_id`),
  KEY `ix_tasks_id` (`id`),
  CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `vendor_versions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int NOT NULL,
  `version_number` int NOT NULL,
  `snapshot` json NOT NULL,
  `changed_fields` json DEFAULT NULL,
  `actor` varchar(100) DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_vendor_versions_id` (`id`),
  KEY `ix_vendor_versions_vendor_id` (`vendor_id`),
  CONSTRAINT `vendor_versions_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `vendors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_name` varchar(255) NOT NULL,
  `contact_person` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `address` text NOT NULL,
  `registration_number` varchar(100) NOT NULL,
  `gst_number` varchar(100) NOT NULL,
  `bank_account_number` varchar(100) NOT NULL,
  `ifsc_code` varchar(50) NOT NULL,
  `status` varchar(50) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_vendors_id` (`id`),
  KEY `ix_vendors_status` (`status`),
  KEY `ix_vendors_email` (`email`),
  KEY `ix_vendors_gst_number` (`gst_number`),
  KEY `ix_vendors_registration_number` (`registration_number`),
  KEY `ix_vendors_company_name` (`company_name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `workflow_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int NOT NULL,
  `previous_status` varchar(50) NOT NULL,
  `new_status` varchar(50) NOT NULL,
  `reason` text,
  `actor` varchar(100) NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_workflow_history_vendor_id` (`vendor_id`),
  KEY `ix_workflow_history_id` (`id`),
  CONSTRAINT `workflow_history_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
