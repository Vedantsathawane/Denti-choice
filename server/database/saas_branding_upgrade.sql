-- ========================================================
-- Denti-Choice Phase 4: White-Label & Multi-Tenant Branding Upgrades SQL
-- ========================================================

-- 1. TENANT MEDIA LIBRARY REFERENCE
CREATE TABLE IF NOT EXISTS tenant_media (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(555) NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  category VARCHAR(50) DEFAULT 'general' COMMENT 'logo, favicon, doctor, service, testimonial, general',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tenant_media_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  INDEX idx_t_media_clinic (clinic_id)
) ENGINE=InnoDB;

-- 2. TENANT CUSTOM DOMAINS MANAGER
CREATE TABLE IF NOT EXISTS tenant_domains (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  domain_name VARCHAR(255) NOT NULL UNIQUE,
  is_verified TINYINT(1) DEFAULT 0,
  verification_key VARCHAR(100) DEFAULT NULL,
  ssl_enabled TINYINT(1) DEFAULT 0,
  redirect_to_www TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_t_domains_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  INDEX idx_t_domains_clinic (clinic_id)
) ENGINE=InnoDB;
