-- Multi-tenant SaaS Notification Upgrade Migration

-- 1. Extend notification_history with detail columns
ALTER TABLE notification_history
  ADD COLUMN patient_id INT NULL DEFAULT NULL AFTER clinic_id,
  ADD COLUMN type VARCHAR(50) NULL DEFAULT NULL AFTER channel,
  ADD COLUMN provider_response TEXT NULL DEFAULT NULL AFTER status,
  ADD COLUMN sent_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER provider_response,
  ADD COLUMN delivery_time DATETIME NULL DEFAULT NULL AFTER sent_time;

-- 2. Create whatsapp_conversations for incoming/outgoing history
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  message_direction VARCHAR(10) NOT NULL, -- 'inbound' or 'outbound'
  message_body TEXT NOT NULL,
  provider_response TEXT NULL DEFAULT NULL,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_wa_conv_clinic (clinic_id),
  INDEX idx_wa_conv_phone (phone_number),
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);
