const { pool } = require('../config/db');

const AppointmentLogModel = {
  async findByAppointment(appointmentId) {
    const [rows] = await pool.query(
      'SELECT * FROM appointment_logs WHERE appointment_id = ? ORDER BY created_at DESC',
      [appointmentId]
    );
    return rows;
  },

  async create(data) {
    const [result] = await pool.query(
      'INSERT INTO appointment_logs (appointment_id, old_status, new_status, changed_by, notes) VALUES (?, ?, ?, ?, ?)',
      [data.appointment_id, data.old_status || null, data.new_status, data.changed_by, data.notes || null]
    );
    return result.insertId;
  }
};

module.exports = AppointmentLogModel;
