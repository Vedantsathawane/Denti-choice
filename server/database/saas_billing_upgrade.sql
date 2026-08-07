-- ========================================================
-- Denti-Choice Phase 3: Subscription & Billing Upgrades SQL
-- ========================================================

-- 1. ALTER SUBSCRIPTIONS TABLE
ALTER TABLE subscriptions 
ADD COLUMN trial_start DATETIME NULL DEFAULT NULL,
ADD COLUMN trial_end DATETIME NULL DEFAULT NULL,
ADD COLUMN remaining_ai_credits INT NOT NULL DEFAULT 50,
ADD COLUMN remaining_whatsapp_messages INT NOT NULL DEFAULT 100,
ADD COLUMN remaining_email_credits INT NOT NULL DEFAULT 200,
ADD COLUMN billing_cycle VARCHAR(50) NOT NULL DEFAULT 'monthly';

-- 2. CREATE FEATURE USAGE TRACKING TABLE
CREATE TABLE IF NOT EXISTS feature_usage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  appointments_count INT DEFAULT 0,
  doctors_count INT DEFAULT 0,
  staff_count INT DEFAULT 0,
  ai_requests_count INT DEFAULT 0,
  whatsapp_messages_count INT DEFAULT 0,
  emails_count INT DEFAULT 0,
  storage_bytes BIGINT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_feat_usage_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  UNIQUE KEY uk_feat_usage_clinic (clinic_id)
) ENGINE=InnoDB;

-- 3. CREATE INVOICES DETAILED LINE ITEMS TABLE
CREATE TABLE IF NOT EXISTS invoice_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  description VARCHAR(255) NOT NULL,
  quantity INT DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_inv_items_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. CREATE SUBSCRIPTION ACTION AUDITING LOGS TABLE
CREATE TABLE IF NOT EXISTS subscription_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  user_id INT NULL DEFAULT NULL,
  action_type VARCHAR(100) NOT NULL COMMENT 'PLAN_CHANGE, STATUS_CHANGE, LIMIT_EXTENDED',
  old_plan_id INT NULL DEFAULT NULL,
  new_plan_id INT NULL DEFAULT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sub_logs_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. UPGRADE INVOICES TABLE FIELDS
ALTER TABLE invoices 
ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0.00 AFTER amount,
ADD COLUMN coupon_code VARCHAR(100) DEFAULT NULL AFTER discount_amount,
ADD COLUMN billing_notes TEXT DEFAULT NULL AFTER payment_method,
ADD COLUMN due_date DATETIME DEFAULT NULL AFTER billing_notes,
ADD COLUMN paid_at DATETIME DEFAULT NULL AFTER due_date;
