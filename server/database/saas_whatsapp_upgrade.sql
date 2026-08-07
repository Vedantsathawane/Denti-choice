-- ============================================
-- SaaS WhatsApp Multi-Tenant Integration Upgrade
-- ============================================

-- 1. WHATSAPP CONFIGURATION ACCOUNTS
CREATE TABLE IF NOT EXISTS whatsapp_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  phone_number_id VARCHAR(100) NULL DEFAULT NULL,
  access_token TEXT NULL DEFAULT NULL,
  verify_token VARCHAR(100) NULL DEFAULT NULL,
  webhook_secret VARCHAR(100) NULL DEFAULT NULL,
  display_name VARCHAR(100) NULL DEFAULT NULL,
  webhook_status VARCHAR(50) DEFAULT 'inactive' COMMENT 'active, inactive, error',
  api_status VARCHAR(50) DEFAULT 'inactive' COMMENT 'active, inactive, error',
  templates_json JSON NULL DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_wa_acc_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  UNIQUE KEY uk_wa_acc_clinic (clinic_id)
) ENGINE=InnoDB;

-- 2. WHATSAPP TEMPLATES MANAGER
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  template_name VARCHAR(100) NOT NULL,
  category VARCHAR(50) DEFAULT 'utility' COMMENT 'utility, marketing, authentication',
  language_code VARCHAR(20) DEFAULT 'en_US',
  body_text TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'approved' COMMENT 'pending, approved, rejected',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wa_tmpl_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  UNIQUE KEY uk_wa_tmpl_name (clinic_id, template_name)
) ENGINE=InnoDB;

-- 3. WHATSAPP OUTBOUND/INBOUND MESSAGES LEDGER
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  direction VARCHAR(10) NOT NULL COMMENT 'inbound, outbound',
  message_text TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'queued' COMMENT 'queued, sent, delivered, read, failed',
  error_message TEXT NULL DEFAULT NULL,
  message_id VARCHAR(255) NULL DEFAULT NULL COMMENT 'Meta message reference ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wa_msg_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  INDEX idx_wa_msg_phone (phone_number),
  INDEX idx_wa_msg_status (status)
) ENGINE=InnoDB;

-- 4. WHATSAPP MESSAGE DISPATCH BACKGROUND QUEUE
CREATE TABLE IF NOT EXISTS whatsapp_queue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  message_id INT NOT NULL,
  retry_count INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending' COMMENT 'pending, processing, failed, completed',
  run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wa_q_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  CONSTRAINT fk_wa_q_message FOREIGN KEY (message_id) REFERENCES whatsapp_messages(id) ON DELETE CASCADE,
  INDEX idx_wa_q_status_run (status, run_at)
) ENGINE=InnoDB;

-- 5. WHATSAPP WEBHOOK AUDITING AND EVENT LOGS
CREATE TABLE IF NOT EXISTS whatsapp_webhooks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NULL DEFAULT NULL,
  event_type VARCHAR(100) NOT NULL COMMENT 'messages, message_status, account_alerts',
  payload JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_wa_wh_clinic (clinic_id)
) ENGINE=InnoDB;
