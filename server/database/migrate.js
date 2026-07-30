const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');

const runMigration = async () => {
  try {
    const dbName = process.env.DB_NAME || 'dentichoice';
    console.log('🔄 Checking database schema for reminder columns...');
    
    // Check if reminder_sent column already exists
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'appointments' 
        AND COLUMN_NAME = 'reminder_sent'
    `, [dbName]);

    if (columns.length === 0) {
      console.log('ℹ️ Adding reminder_sent and reminder_sent_at columns to appointments table...');
      await pool.query(`
        ALTER TABLE appointments 
        ADD COLUMN reminder_sent TINYINT(1) NOT NULL DEFAULT 0,
        ADD COLUMN reminder_sent_at DATETIME DEFAULT NULL
      `);
      console.log('✅ Appointments table migrated successfully (reminder columns added).');
    } else {
      console.log('✅ Reminder columns already exist in appointments table.');
    }

    // Check if patient_id column exists in notification_history
    const [notifCols] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'notification_history' 
        AND COLUMN_NAME = 'patient_id'
    `, [dbName]);

    if (notifCols.length === 0) {
      console.log('ℹ️ Migrating notification_history table with extended columns...');
      await pool.query(`
        ALTER TABLE notification_history 
        ADD COLUMN patient_id INT NULL DEFAULT NULL AFTER clinic_id,
        ADD COLUMN type VARCHAR(50) NULL DEFAULT NULL AFTER channel,
        ADD COLUMN provider_response TEXT NULL DEFAULT NULL AFTER error_message,
        ADD COLUMN sent_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER provider_response,
        ADD COLUMN delivery_time DATETIME NULL DEFAULT NULL AFTER sent_time,
        ADD CONSTRAINT fk_notif_history_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL
      `);
      console.log('✅ notification_history table migrated successfully.');
    } else {
      console.log('✅ Extended columns already exist in notification_history table.');
    }

    console.log('🔄 Running SaaS Database Migrations...');
    
    const querySafe = async (query) => {
      try {
        await pool.query(query);
      } catch (err) {
        if (
          err.code === 'ER_DUP_FIELDNAME' ||
          err.code === 'ER_TABLE_EXISTS_KEY' ||
          err.code === 'ER_DUP_KEYNAME' ||
          err.code === 'ER_CANT_DROP_FIELD_OR_KEY' ||
          err.message.includes('Duplicate column') ||
          err.message.includes('already exists')
        ) {
          return;
        }
        throw err;
      }
    };

    // Load saas_schema.sql
    const saasSchemaPath = path.join(__dirname, 'saas_schema.sql');
    if (fs.existsSync(saasSchemaPath)) {
      const queries = fs.readFileSync(saasSchemaPath, 'utf8')
        .split(';')
        .map(q => q.trim())
        .filter(q => q.length > 0);
        
      for (const query of queries) {
        const cleanQuery = query.split('\n')
          .filter(line => !line.trim().startsWith('--'))
          .join('\n')
          .trim();
        if (cleanQuery) {
          await querySafe(cleanQuery);
        }
      }
      console.log('✅ SaaS tables created or verified.');
    }

    // Load saas_extended.sql
    const saasExtendedPath = path.join(__dirname, 'saas_extended.sql');
    if (fs.existsSync(saasExtendedPath)) {
      const queries = fs.readFileSync(saasExtendedPath, 'utf8')
        .split(';')
        .map(q => q.trim())
        .filter(q => q.length > 0);
        
      for (const query of queries) {
        const cleanQuery = query.split('\n')
          .filter(line => !line.trim().startsWith('--'))
          .join('\n')
          .trim();
        if (cleanQuery) {
          await querySafe(cleanQuery);
        }
      }
      console.log('✅ SaaS Extended tables and columns created or verified.');
    }

    // Seed default clinic (ID = 1) if not exists
    const [clinics] = await pool.query('SELECT id FROM clinics WHERE id = 1');
    if (clinics.length === 0) {
      console.log('🌱 Seeding default clinic...');
      await pool.query(`
        INSERT INTO clinics (id, name, subdomain, branding_color) 
        VALUES (1, 'Denti-Choice Dental Clinic', 'denti-choice', '#0066FF')
      `);
    }

    // Seed default plans if not exists
    const [plans] = await pool.query('SELECT id FROM subscription_plans');
    if (plans.length === 0) {
      console.log('🌱 Seeding subscription plans...');
      await pool.query(`
        INSERT INTO subscription_plans (id, name, price, billing_cycle, features_json) 
        VALUES 
          (1, 'Free Trial', 0.00, 'monthly', '["AI Booking (Basic)", "1 Doctor slot", "Standard notifications"]'),
          (2, 'Clinic Pro', 99.00, 'monthly', '["AI Booking (Uncapped)", "5 Doctors", "AI Doctor Assistant", "Premium review alerts"]'),
          (3, 'Enterprise AI', 249.00, 'monthly', '["Unlimited Everything", "Custom Branding", "Predictive Analytics", "Custom Subdomain"]')
      `);
    }

    // Seed default subscription for clinic ID 1 if not exists
    const [subs] = await pool.query('SELECT id FROM subscriptions WHERE clinic_id = 1');
    if (subs.length === 0) {
      await pool.query(`
        INSERT INTO subscriptions (clinic_id, plan_id, status, current_period_end) 
        VALUES (1, 2, 'active', DATE_ADD(NOW(), INTERVAL 1 YEAR))
      `);
    }

    // Auto-map existing resources to default clinic (ID = 1)
    console.log('🌱 Mapping existing single-tenant data to default clinic...');

    // 1. Admins to mapping
    await querySafe(`
      INSERT IGNORE INTO clinic_admins (clinic_id, admin_id)
      SELECT 1, id FROM admins
    `);
    
    // 2. Doctors to mapping
    await querySafe(`
      INSERT IGNORE INTO clinic_doctors (clinic_id, doctor_id)
      SELECT 1, id FROM doctors
    `);

    // 3. Patients to mapping
    await querySafe(`
      INSERT IGNORE INTO clinic_patients (clinic_id, patient_id)
      SELECT 1, id FROM patients
    `);

    // 4. Appointments to mapping
    await querySafe(`
      INSERT IGNORE INTO clinic_appointments (clinic_id, appointment_id)
      SELECT 1, id FROM appointments
    `);

    // 5. Services to mapping
    await querySafe(`
      INSERT IGNORE INTO clinic_services (clinic_id, service_id)
      SELECT 1, id FROM services
    `);

    // 6. Settings to mapping
    const [settingsExist] = await pool.query('SELECT id FROM clinic_settings WHERE clinic_id = 1');
    if (settingsExist.length === 0) {
      await querySafe(`
        INSERT IGNORE INTO clinic_settings (clinic_id, setting_key, setting_value)
        SELECT 1, setting_key, setting_value FROM settings
      `);
    }

    // 7. Migrate existing admins into clinic_users
    console.log('🌱 Migrating admins to unified clinic_users table...');
    await querySafe(`
      INSERT IGNORE INTO clinic_users (id, clinic_id, name, email, password, role, avatar, is_active, last_login, created_at, updated_at)
      SELECT a.id, 1, a.name, a.email, a.password, a.role, a.avatar, a.is_active, a.last_login, a.created_at, a.updated_at
      FROM admins a
    `);

    // Ensure there is at least one Super Admin seeded
    const [superAdmins] = await pool.query("SELECT id FROM clinic_users WHERE role = 'super_admin'");
    if (superAdmins.length === 0) {
      console.log('🌱 Seeding default Super Admin...');
      const bcrypt = require('bcryptjs');
      const superHash = await bcrypt.hash('superadmin123', 10);
      await pool.query(`
        INSERT INTO clinic_users (name, email, password, role, is_active)
        VALUES ('Super Admin', 'super@dentist-choice.com', ?, 'super_admin', 1)
      `, [superHash]);
    }

    console.log('🎉 Database migrations and mapping updates successfully finished.');
  } catch (error) {
    console.error('❌ Database migration failed:', error.message);
  }
};

module.exports = { runMigration };

if (require.main === module) {
  runMigration().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
