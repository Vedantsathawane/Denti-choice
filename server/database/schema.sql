-- ============================================
-- Denti-Choice Database Schema
-- Complete MySQL schema with normalization
-- ============================================

CREATE DATABASE IF NOT EXISTS dentichoice
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE dentichoice;

-- ============================================
-- 1. ADMINS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'receptionist') NOT NULL DEFAULT 'admin',
  avatar VARCHAR(255) DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_admins_email (email),
  INDEX idx_admins_role (role)
) ENGINE=InnoDB;

-- ============================================
-- 2. DOCTORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
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
  INDEX idx_doctors_specialization (specialization),
  INDEX idx_doctors_active (is_active)
) ENGINE=InnoDB;

-- ============================================
-- 3. SERVICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
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
  INDEX idx_services_active (is_active),
  INDEX idx_services_sort (sort_order)
) ENGINE=InnoDB;

-- ============================================
-- 4. PATIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  age INT DEFAULT NULL,
  gender ENUM('male', 'female', 'other') DEFAULT NULL,
  address TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_patients_email (email),
  INDEX idx_patients_phone (phone)
) ENGINE=InnoDB;

-- ============================================
-- 5. APPOINTMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  service_id INT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  message TEXT DEFAULT NULL,
  cancellation_reason TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Prevent double-booking: one doctor can have only one appointment at a specific date+time
  UNIQUE KEY uk_doctor_datetime (doctor_id, appointment_date, appointment_time),

  CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_appointments_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  CONSTRAINT fk_appointments_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,

  INDEX idx_appointments_date (appointment_date),
  INDEX idx_appointments_status (status),
  INDEX idx_appointments_doctor_date (doctor_id, appointment_date),
  INDEX idx_appointments_patient (patient_id)
) ENGINE=InnoDB;

-- ============================================
-- 6. APPOINTMENT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS appointment_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT NOT NULL,
  old_status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT NULL,
  new_status ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL,
  changed_by VARCHAR(100) DEFAULT NULL COMMENT 'Admin name or system',
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_logs_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  INDEX idx_logs_appointment (appointment_id)
) ENGINE=InnoDB;

-- ============================================
-- 7. TESTIMONIALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS testimonials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_name VARCHAR(100) NOT NULL,
  patient_photo VARCHAR(255) DEFAULT NULL,
  review TEXT NOT NULL,
  rating TINYINT NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  is_visible TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_testimonials_visible (is_visible)
) ENGINE=InnoDB;

-- ============================================
-- 8. CONTACT MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  subject VARCHAR(255) DEFAULT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  admin_reply TEXT DEFAULT NULL,
  replied_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contacts_read (is_read),
  INDEX idx_contacts_created (created_at)
) ENGINE=InnoDB;

-- ============================================
-- 9. SETTINGS TABLE (Key-Value Store)
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT DEFAULT NULL,
  setting_type ENUM('text', 'email', 'url', 'json', 'number', 'boolean') NOT NULL DEFAULT 'text',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_settings_key (setting_key)
) ENGINE=InnoDB;

-- ============================================
-- 10. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('appointment', 'message', 'system', 'alert') NOT NULL DEFAULT 'system',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSON DEFAULT NULL COMMENT 'Additional JSON payload',
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_read (is_read),
  INDEX idx_notifications_type (type),
  INDEX idx_notifications_created (created_at DESC)
) ENGINE=InnoDB;
