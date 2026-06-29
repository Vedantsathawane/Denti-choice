const { pool } = require('../config/db');

const SettingModel = {
  async getAll() {
    const [rows] = await pool.query('SELECT * FROM settings ORDER BY setting_key');
    // Convert to key-value object
    const settings = {};
    rows.forEach(row => {
      settings[row.setting_key] = row.setting_type === 'json' 
        ? JSON.parse(row.setting_value || '{}') 
        : row.setting_value;
    });
    return settings;
  },

  async get(key) {
    const [rows] = await pool.query('SELECT * FROM settings WHERE setting_key = ?', [key]);
    if (rows.length === 0) return null;
    const row = rows[0];
    return row.setting_type === 'json' ? JSON.parse(row.setting_value || '{}') : row.setting_value;
  },

  async set(key, value, type = 'text') {
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    await pool.query(
      `INSERT INTO settings (setting_key, setting_value, setting_type) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE setting_value = ?, setting_type = ?`,
      [key, stringValue, type, stringValue, type]
    );
    return true;
  },

  async updateBulk(settingsObj) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const [key, value] of Object.entries(settingsObj)) {
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        const type = typeof value === 'object' ? 'json' : 'text';
        await connection.query(
          `INSERT INTO settings (setting_key, setting_value, setting_type) VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE setting_value = ?, setting_type = ?`,
          [key, stringValue, type, stringValue, type]
        );
      }
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};

module.exports = SettingModel;
