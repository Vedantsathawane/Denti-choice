-- ============================================
-- SaaS Extended Schema for Denti-Choice Upgrade
-- ============================================

-- Alter clinics table to support website builder properties
ALTER TABLE clinics 
  ADD COLUMN secondary_color VARCHAR(50) DEFAULT '#555555',
  ADD COLUMN theme VARCHAR(50) DEFAULT 'default',
  ADD COLUMN business_hours JSON DEFAULT NULL,
  ADD COLUMN google_maps TEXT DEFAULT NULL,
  ADD COLUMN social_links JSON DEFAULT NULL,
  ADD COLUMN appointment_rules JSON DEFAULT NULL,
  ADD COLUMN seo_title VARCHAR(255) DEFAULT NULL,
  ADD COLUMN seo_description TEXT DEFAULT NULL;

-- 1. UNIFIED CLINIC USERS TABLE
CREATE TABLE IF NOT EXISTS clinic_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT DEFAULT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin' COMMENT 'super_admin, owner, admin, doctor, receptionist, staff, patient',
  avatar VARCHAR(255) DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_clinic_users_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL,
  INDEX idx_clinic_users_email (email),
  INDEX idx_clinic_users_role (role),
  INDEX idx_clinic_users_clinic (clinic_id)
) ENGINE=InnoDB;

-- 2. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  subscription_id INT DEFAULT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  status VARCHAR(50) NOT NULL DEFAULT 'pending' COMMENT 'pending, completed, failed, refunded',
  payment_method VARCHAR(50) DEFAULT NULL COMMENT 'stripe, razorpay, bank_transfer',
  transaction_id VARCHAR(255) DEFAULT NULL,
  invoice_url TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. PAYMENT HISTORY TABLE
CREATE TABLE IF NOT EXISTS payment_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_id INT NOT NULL,
  status VARCHAR(50) NOT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_history_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT DEFAULT NULL,
  user_id INT DEFAULT NULL,
  action_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_clinic (clinic_id),
  INDEX idx_audit_user (user_id)
) ENGINE=InnoDB;

-- 5. USAGE LOGS TABLE
CREATE TABLE IF NOT EXISTS usage_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  feature_name VARCHAR(100) NOT NULL,
  count INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_usage_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  INDEX idx_usage_clinic_feature (clinic_id, feature_name)
) ENGINE=InnoDB;

-- 6. SUPPORT TICKETS TABLE
CREATE TABLE IF NOT EXISTS support_tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  user_id INT NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'open' COMMENT 'open, in_progress, resolved, closed',
  priority VARCHAR(50) NOT NULL DEFAULT 'medium' COMMENT 'low, medium, high, urgent',
  admin_reply TEXT DEFAULT NULL,
  replied_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tickets_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  CONSTRAINT fk_tickets_user FOREIGN KEY (user_id) REFERENCES clinic_users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. SYSTEM NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS system_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT DEFAULT NULL COMMENT 'NULL for global notifications',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sys_notification_clinic (clinic_id)
) ENGINE=InnoDB;

-- 8. API USAGE TABLE
CREATE TABLE IF NOT EXISTS api_usage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INT NOT NULL,
  duration_ms INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_api_usage_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  INDEX idx_api_usage_clinic (clinic_id)
) ENGINE=InnoDB;

-- 9. FEATURE LIMITS TABLE
CREATE TABLE IF NOT EXISTS feature_limits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  max_doctors INT NOT NULL DEFAULT 5,
  max_ai_requests INT NOT NULL DEFAULT 100,
  max_monthly_appointments INT NOT NULL DEFAULT 500,
  whatsapp_enabled TINYINT(1) NOT NULL DEFAULT 0,
  custom_branding_enabled TINYINT(1) NOT NULL DEFAULT 0,
  analytics_enabled TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_feature_limits_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  UNIQUE KEY uk_limit_clinic (clinic_id)
) ENGINE=InnoDB;

-- 10. ADD clinic_id TO BUSINESS TABLES (if not present)
ALTER TABLE doctors ADD COLUMN clinic_id INT NOT NULL DEFAULT 1, ADD INDEX idx_doctors_clinic (clinic_id);
ALTER TABLE patients ADD COLUMN clinic_id INT NOT NULL DEFAULT 1, ADD INDEX idx_patients_clinic (clinic_id);
ALTER TABLE appointments ADD COLUMN clinic_id INT NOT NULL DEFAULT 1, ADD INDEX idx_appointments_clinic (clinic_id);
ALTER TABLE services ADD COLUMN clinic_id INT NOT NULL DEFAULT 1, ADD INDEX idx_services_clinic (clinic_id);
ALTER TABLE settings ADD COLUMN clinic_id INT NOT NULL DEFAULT 1, ADD INDEX idx_settings_clinic (clinic_id);
ALTER TABLE testimonials ADD COLUMN clinic_id INT NOT NULL DEFAULT 1, ADD INDEX idx_testimonials_clinic (clinic_id);
ALTER TABLE contact_messages ADD COLUMN clinic_id INT NOT NULL DEFAULT 1, ADD INDEX idx_contacts_clinic (clinic_id);
ALTER TABLE notifications ADD COLUMN clinic_id INT NOT NULL DEFAULT 1, ADD INDEX idx_notifications_clinic (clinic_id);

-- 11. STAGED REMINDERS COLUMNS IN APPOINTMENTS
ALTER TABLE appointments
  ADD COLUMN reminder_24h_sent TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN reminder_24h_sent_at DATETIME DEFAULT NULL,
  ADD COLUMN reminder_2h_sent TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN reminder_2h_sent_at DATETIME DEFAULT NULL,
  ADD COLUMN reminder_30m_sent TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN reminder_30m_sent_at DATETIME DEFAULT NULL;

-- 12. COUPONS TABLE
CREATE TABLE IF NOT EXISTS coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  expires_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_coupons_code (code)
) ENGINE=InnoDB;

-- 13. INVOICES TABLE
CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  invoice_number VARCHAR(100) NOT NULL UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  gst_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  gst_percent DECIMAL(5, 2) NOT NULL DEFAULT 18.00,
  status VARCHAR(50) NOT NULL DEFAULT 'unpaid' COMMENT 'unpaid, paid, voideded',
  payment_method VARCHAR(50) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_invoices_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  INDEX idx_invoices_clinic (clinic_id),
  INDEX idx_invoices_number (invoice_number)
) ENGINE=InnoDB;

-- 14. NOTIFICATION HISTORY TABLE
CREATE TABLE IF NOT EXISTS notification_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  channel VARCHAR(50) NOT NULL COMMENT 'email, whatsapp, sms, push, socket',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' COMMENT 'pending, delivered, failed, read',
  error_message TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_history_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  INDEX idx_notif_hist_clinic (clinic_id),
  INDEX idx_notif_hist_status (status)
) ENGINE=InnoDB;
