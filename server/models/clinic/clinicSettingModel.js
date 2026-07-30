const { pool } = require('../../config/db');

const ClinicSettingModel = {
  async getSettings(clinicId) {
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM clinic_settings WHERE clinic_id = ?', [clinicId]);
    const settings = {};
    rows.forEach(r => {
      settings[r.setting_key] = r.setting_value;
    });
    return settings;
  },

  async updateSettings(clinicId, settingsObject) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const [key, value] of Object.entries(settingsObject)) {
        await connection.query(
          `INSERT INTO clinic_settings (clinic_id, setting_key, setting_value) 
           VALUES (?, ?, ?) 
           ON DUPLICATE KEY UPDATE setting_value = ?`,
          [clinicId, key, value, value]
        );
      }

      await connection.commit();
      return true;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
};

module.exports = ClinicSettingModel;
