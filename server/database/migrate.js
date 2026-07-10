const { pool } = require('../config/db');

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
  } catch (error) {
    console.error('❌ Database migration failed:', error.message);
  }
};

module.exports = { runMigration };
