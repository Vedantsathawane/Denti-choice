-- ============================================
-- Denti-Choice Consolidated Database Schema
-- Complete MySQL schema with multi-tenancy & SaaS
-- ============================================

CREATE DATABASE IF NOT EXISTS dentichoice
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE dentichoice;

-- ============================================
-- 1. CLINICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS clinics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  subdomain VARCHAR(100) NOT NULL UNIQUE,
  custom_domain VARCHAR(255) DEFAULT NULL UNIQUE,
  logo_url VARCHAR(255) DEFAULT NULL,
  branding_color VARCHAR(50) DEFAULT '#0066FF',
  secondary_color VARCHAR(50) DEFAULT '#555555',
  theme VARCHAR(50) DEFAULT 'default',
  business_hours JSON DEFAULT NULL,
  google_maps TEXT DEFAULT NULL,
  social_links JSON DEFAULT NULL,
  appointment_rules JSON DEFAULT NULL,
  seo_title VARCHAR(255) DEFAULT NULL,
  seo_description TEXT DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_clinics_subdomain (subdomain),
  INDEX idx_clinics_custom_domain (custom_domain)
) ENGINE=InnoDB;

-- ============================================
-- 2. SUBSCRIPTION PLANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  billing_cycle VARCHAR(50) NOT NULL DEFAULT 'monthly',
  features_json JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- 3. SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  plan_id INT NOT NULL,
  status ENUM('active', 'past_due', 'trialing', 'cancelled') NOT NULL DEFAULT 'trialing',
  stripe_subscription_id VARCHAR(255) DEFAULT NULL,
  current_period_end DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_subscriptions_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- 4. CLINIC USERS TABLE (Unified admin table)
-- ============================================
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

-- ============================================
-- 5. DOCTORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL DEFAULT 1,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  qualification VARCHAR(255) NOT NULL,
  experience INT NOT NULL DEFAULT 0 COMMENT 'Years of experience',
  specialization VARCHAR(255) NOT NULL,
  availability JSON DEFAULT NULL COMMENT 'JSON array of available days e.g. ["Monday","Tuesday"]',
  image VARCHAR(255) DEFAULT NULL,
  bio TEXT DEFAULT NULL,
  social_links JSON DEFAULT NULL COMMENT '{"facebook":"","twitter":"","linkedin":"","instagram":""}',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_doctors_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  INDEX idx_doctors_specialization (specialization),
  INDEX idx_doctors_active (is_active),
  INDEX idx_doctors_clinic (clinic_id)
) ENGINE=InnoDB;

-- ============================================
-- 6. SERVICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL DEFAULT 1,
  name VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(100) DEFAULT NULL COMMENT 'Icon class name e.g. FaTooth',
  image VARCHAR(255) DEFAULT NULL,
  duration VARCHAR(50) NOT NULL COMMENT 'e.g. 30 mins, 1 hour',
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Starting price',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_services_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  INDEX idx_services_active (is_active),
  INDEX idx_services_sort (sort_order),
  INDEX idx_services_clinic (clinic_id)
) ENGINE=InnoDB;

-- ============================================
-- 7. PATIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL DEFAULT 1,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  age INT DEFAULT NULL,
  gender ENUM('male', 'female', 'other') DEFAULT NULL,
  address TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_patients_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  INDEX idx_patients_email (email),
  INDEX idx_patients_phone (phone),
  INDEX idx_patients_clinic (clinic_id)
) ENGINE=InnoDB;

-- ============================================
-- 8. APPOINTMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL DEFAULT 1,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  service_id INT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  message TEXT DEFAULT NULL,
  cancellation_reason TEXT DEFAULT NULL,
  reminder_sent TINYINT(1) NOT NULL DEFAULT 0,
  reminder_sent_at DATETIME DEFAULT NULL,
  reminder_24h_sent TINYINT(1) NOT NULL DEFAULT 0,
  reminder_24h_sent_at DATETIME DEFAULT NULL,
  reminder_2h_sent TINYINT(1) NOT NULL DEFAULT 0,
  reminder_2h_sent_at DATETIME DEFAULT NULL,
  reminder_30m_sent TINYINT(1) NOT NULL DEFAULT 0,
  reminder_30m_sent_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_doctor_datetime (doctor_id, appointment_date, appointment_time),
  CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_appointments_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  CONSTRAINT fk_appointments_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  CONSTRAINT fk_appointments_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  INDEX idx_appointments_date (appointment_date),
  INDEX idx_appointments_status (status),
  INDEX idx_appointments_doctor_date (doctor_id, appointment_date),
  INDEX idx_appointments_patient (patient_id),
  INDEX idx_appointments_clinic (clinic_id)
) ENGINE=InnoDB;

-- ============================================
-- 9. APPOINTMENT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS appointment_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT NOT NULL,
  old_status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT NULL,
  new_status ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL,
  changed_by VARCHAR(100) DEFAULT NULL COMMENT 'Admin/Staff name or system',
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_logs_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  INDEX idx_logs_appointment (appointment_id)
) ENGINE=InnoDB;

-- ============================================
-- 10. CLINICAL RECORDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS clinical_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT NOT NULL,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  raw_dictation TEXT DEFAULT NULL,
  pdf_url VARCHAR(255) DEFAULT NULL,
  xray_url VARCHAR(255) DEFAULT NULL,
  soap_notes TEXT DEFAULT NULL,
  diagnosis_summary TEXT DEFAULT NULL,
  treatment_plan TEXT DEFAULT NULL,
  prescription_draft TEXT DEFAULT NULL,
  patient_summary TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_clinical_records_appt FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  CONSTRAINT fk_clinical_records_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_clinical_records_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  UNIQUE KEY uk_appointment_record (appointment_id)
) ENGINE=InnoDB;

-- ============================================
-- 11. TESTIMONIALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS testimonials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL DEFAULT 1,
  patient_name VARCHAR(100) NOT NULL,
  patient_photo VARCHAR(255) DEFAULT NULL,
  review TEXT NOT NULL,
  rating TINYINT NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  is_visible TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_testimonials_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  INDEX idx_testimonials_visible (is_visible),
  INDEX idx_testimonials_clinic (clinic_id)
) ENGINE=InnoDB;

-- ============================================
-- 12. CONTACT MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL DEFAULT 1,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  subject VARCHAR(255) DEFAULT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  admin_reply TEXT DEFAULT NULL,
  replied_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_contact_messages_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  INDEX idx_contacts_read (is_read),
  INDEX idx_contacts_created (created_at),
  INDEX idx_contacts_clinic (clinic_id)
) ENGINE=InnoDB;

-- ============================================
-- 13. SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL DEFAULT 1,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT DEFAULT NULL,
  setting_type ENUM('text', 'email', 'url', 'json', 'number', 'boolean') NOT NULL DEFAULT 'text',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_settings_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  UNIQUE KEY uk_clinic_settings_key (clinic_id, setting_key),
  INDEX idx_settings_key (setting_key),
  INDEX idx_settings_clinic (clinic_id)
) ENGINE=InnoDB;

-- ============================================
-- 14. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL DEFAULT 1,
  type ENUM('appointment', 'message', 'system', 'alert') NOT NULL DEFAULT 'system',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSON DEFAULT NULL COMMENT 'Additional JSON payload',
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  INDEX idx_notifications_read (is_read),
  INDEX idx_notifications_type (type),
  INDEX idx_notifications_created (created_at DESC),
  INDEX idx_notifications_clinic (clinic_id)
) ENGINE=InnoDB;

-- ============================================
-- 15. PAYMENTS TABLE
-- ============================================
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

-- ============================================
-- 16. PAYMENT HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payment_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_id INT NOT NULL,
  status VARCHAR(50) NOT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_history_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- 17. AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT DEFAULT NULL,
  user_id INT DEFAULT NULL,
  action_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_logs_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL,
  CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES clinic_users(id) ON DELETE SET NULL,
  INDEX idx_audit_clinic (clinic_id),
  INDEX idx_audit_user (user_id)
) ENGINE=InnoDB;

-- ============================================
-- 18. USAGE LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS usage_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  feature_name VARCHAR(100) NOT NULL,
  count INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_usage_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  INDEX idx_usage_clinic_feature (clinic_id, feature_name)
) ENGINE=InnoDB;

-- ============================================
-- 19. SUPPORT TICKETS TABLE
-- ============================================
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

-- ============================================
-- 20. SYSTEM NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS system_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT DEFAULT NULL COMMENT 'NULL for global notifications',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sys_notif_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  INDEX idx_sys_notification_clinic (clinic_id)
) ENGINE=InnoDB;

-- ============================================
-- 21. API USAGE TABLE
-- ============================================
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

-- ============================================
-- 22. FEATURE LIMITS TABLE
-- ============================================
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

-- ============================================
-- 23. COUPONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  expires_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_coupons_code (code)
) ENGINE=InnoDB;

-- ============================================
-- 24. INVOICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  invoice_number VARCHAR(100) NOT NULL UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  gst_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  gst_percent DECIMAL(5, 2) NOT NULL DEFAULT 18.00,
  status VARCHAR(50) NOT NULL DEFAULT 'unpaid' COMMENT 'unpaid, paid, voided',
  payment_method VARCHAR(50) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_invoices_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  INDEX idx_invoices_clinic (clinic_id),
  INDEX idx_invoices_number (invoice_number)
) ENGINE=InnoDB;

-- ============================================
-- 25. NOTIFICATION HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notification_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  patient_id INT NULL DEFAULT NULL,
  recipient VARCHAR(255) NOT NULL,
  channel VARCHAR(50) NOT NULL COMMENT 'email, whatsapp, sms, push, socket',
  type VARCHAR(50) NULL DEFAULT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' COMMENT 'pending, delivered, failed, retry_success, read',
  error_message TEXT DEFAULT NULL,
  provider_response TEXT NULL DEFAULT NULL,
  sent_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  delivery_time DATETIME NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_history_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  CONSTRAINT fk_notif_history_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
  INDEX idx_notif_hist_clinic (clinic_id),
  INDEX idx_notif_hist_status (status)
) ENGINE=InnoDB;

-- ============================================
-- 26. WHATSAPP CONVERSATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  message_direction VARCHAR(10) NOT NULL COMMENT 'inbound or outbound',
  message_body TEXT NOT NULL,
  provider_response TEXT NULL DEFAULT NULL,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_wa_conv_clinic (clinic_id),
  INDEX idx_wa_conv_phone (phone_number),
  CONSTRAINT fk_wa_conv_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- 27. AI LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ai_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  user_type ENUM('patient', 'doctor', 'admin') NOT NULL,
  feature_name VARCHAR(100) NOT NULL,
  prompt_tokens INT DEFAULT 0,
  completion_tokens INT DEFAULT 0,
  prompt_summary TEXT DEFAULT NULL,
  response_summary TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ai_logs_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  INDEX idx_ai_logs_feature (feature_name),
  INDEX idx_ai_logs_clinic (clinic_id)
) ENGINE=InnoDB;

-- ============================================
-- 28. ACTIVITY LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  user_id INT DEFAULT NULL COMMENT 'Refers to clinic_users id',
  action_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activity_logs_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  INDEX idx_activity_logs_action (action_type),
  INDEX idx_activity_logs_clinic (clinic_id)
) ENGINE=InnoDB;

-- ============================================
-- 29. MAPPING TABLES (AI / Compatibility Layer)
-- ============================================
CREATE TABLE IF NOT EXISTS clinic_admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  admin_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_clinic_admins_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  CONSTRAINT fk_clinic_admins_user FOREIGN KEY (admin_id) REFERENCES clinic_users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_clinic_admin (clinic_id, admin_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS clinic_doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  doctor_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_clinic_doctors_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  CONSTRAINT fk_clinic_doctors_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  UNIQUE KEY uk_clinic_doctor (clinic_id, doctor_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS clinic_patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  patient_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_clinic_patients_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  CONSTRAINT fk_clinic_patients_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  UNIQUE KEY uk_clinic_patient (clinic_id, patient_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS clinic_appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  appointment_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_clinic_appointments_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  CONSTRAINT fk_clinic_appointments_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  UNIQUE KEY uk_clinic_appointment (clinic_id, appointment_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS clinic_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  service_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_clinic_services_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  CONSTRAINT fk_clinic_services_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  UNIQUE KEY uk_clinic_service (clinic_id, service_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS clinic_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_clinic_settings_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  UNIQUE KEY uk_clinic_setting (clinic_id, setting_key)
) ENGINE=InnoDB;
