const { pool } = require('../config/db');

const AppointmentModel = {
  async findAll(filters = {}) {
    let query = `
      SELECT a.*, 
             p.full_name as patient_name, p.email as patient_email, p.phone as patient_phone,
             p.age as patient_age, p.gender as patient_gender,
             d.name as doctor_name, d.email as doctor_email, d.specialization as doctor_specialization,
             s.name as service_name, s.price as service_price,
             CASE
               WHEN a.reminder_sent = 1 THEN 'Sent'
               WHEN a.status IN ('completed', 'cancelled') THEN 'Not Required'
               WHEN CONCAT(a.appointment_date, ' ', a.appointment_time) <= NOW() THEN 'Not Required'
               WHEN TIMESTAMPDIFF(MINUTE, a.created_at, CONCAT(a.appointment_date, ' ', a.appointment_time)) < 120 THEN 'Not Required'
               ELSE 'Pending'
             END as reminder_status
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN services s ON a.service_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) { query += ' AND a.status = ?'; params.push(filters.status); }
    if (filters.doctor_id) { query += ' AND a.doctor_id = ?'; params.push(filters.doctor_id); }
    if (filters.date) { query += ' AND a.appointment_date = ?'; params.push(filters.date); }
    if (filters.from_date) { query += ' AND a.appointment_date >= ?'; params.push(filters.from_date); }
    if (filters.to_date) { query += ' AND a.appointment_date <= ?'; params.push(filters.to_date); }
    if (filters.search) {
      query += ' AND (p.full_name LIKE ? OR p.email LIKE ? OR p.phone LIKE ? OR d.name LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    // Sorting
    const sortField = filters.sort || 'a.created_at';
    const sortOrder = filters.order === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortField} ${sortOrder}`;

    // Pagination
    if (filters.limit) {
      const offset = ((filters.page || 1) - 1) * filters.limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(filters.limit), offset);
    }

    const [rows] = await pool.query(query, params);
    return rows;
  },

  async count(filters = {}) {
    let query = `
      SELECT COUNT(*) as total
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) { query += ' AND a.status = ?'; params.push(filters.status); }
    if (filters.doctor_id) { query += ' AND a.doctor_id = ?'; params.push(filters.doctor_id); }
    if (filters.date) { query += ' AND a.appointment_date = ?'; params.push(filters.date); }
    if (filters.from_date) { query += ' AND a.appointment_date >= ?'; params.push(filters.from_date); }
    if (filters.to_date) { query += ' AND a.appointment_date <= ?'; params.push(filters.to_date); }
    if (filters.search) {
      query += ' AND (p.full_name LIKE ? OR p.email LIKE ? OR p.phone LIKE ? OR d.name LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    const [rows] = await pool.query(query, params);
    return rows[0].total;
  },

  async findById(id) {
    const [rows] = await pool.query(`
      SELECT a.*, 
             p.full_name as patient_name, p.email as patient_email, p.phone as patient_phone,
             p.age as patient_age, p.gender as patient_gender, p.address as patient_address,
             d.name as doctor_name, d.email as doctor_email, d.phone as doctor_phone, d.specialization as doctor_specialization,
             s.name as service_name, s.price as service_price, s.duration as service_duration,
             CASE
               WHEN a.reminder_sent = 1 THEN 'Sent'
               WHEN a.status IN ('completed', 'cancelled') THEN 'Not Required'
               WHEN CONCAT(a.appointment_date, ' ', a.appointment_time) <= NOW() THEN 'Not Required'
               WHEN TIMESTAMPDIFF(MINUTE, a.created_at, CONCAT(a.appointment_date, ' ', a.appointment_time)) < 120 THEN 'Not Required'
               ELSE 'Pending'
             END as reminder_status
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN services s ON a.service_id = s.id
      WHERE a.id = ?
    `, [id]);
    return rows[0] || null;
  },

  /**
   * Book an appointment with transaction-based double-booking prevention
   */
  async create(data) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Lock and check for existing booking
      const [existing] = await connection.query(
        `SELECT id FROM appointments 
         WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? 
         AND status != 'cancelled'
         FOR UPDATE`,
        [data.doctor_id, data.appointment_date, data.appointment_time]
      );

      if (existing.length > 0) {
        await connection.rollback();
        return { error: 'SLOT_TAKEN', message: 'This time slot is already booked.' };
      }

      // Insert appointment
      const [result] = await connection.query(
        `INSERT INTO appointments (patient_id, doctor_id, service_id, appointment_date, appointment_time, message)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [data.patient_id, data.doctor_id, data.service_id, data.appointment_date, data.appointment_time, data.message || null]
      );

      // Log creation
      await connection.query(
        `INSERT INTO appointment_logs (appointment_id, new_status, changed_by, notes)
         VALUES (?, 'pending', ?, 'Appointment booked')`,
        [result.insertId, 'Patient']
      );

      await connection.commit();
      return { id: result.insertId };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async updateStatus(id, status, changedBy, reason = null) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Get current status
      const [current] = await connection.query('SELECT status FROM appointments WHERE id = ?', [id]);
      if (current.length === 0) {
        await connection.rollback();
        return false;
      }

      const oldStatus = current[0].status;
      const updateFields = ['status = ?'];
      const updateValues = [status];

      if (reason && status === 'cancelled') {
        updateFields.push('cancellation_reason = ?');
        updateValues.push(reason);
      }

      updateValues.push(id);
      await connection.query(
        `UPDATE appointments SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      // Log status change
      await connection.query(
        `INSERT INTO appointment_logs (appointment_id, old_status, new_status, changed_by, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [id, oldStatus, status, changedBy, reason || `Status changed to ${status}`]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    const allowedFields = ['doctor_id', 'service_id', 'appointment_date', 'appointment_time', 'message', 'reminder_sent', 'reminder_sent_at'];
    allowedFields.forEach(field => {
      if (data[field] !== undefined) { fields.push(`${field} = ?`); values.push(data[field]); }
    });
    if (fields.length === 0) return false;
    values.push(id);
    await pool.query(`UPDATE appointments SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM appointments WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  /**
   * Get booked slots for a specific doctor on a specific date
   */
  async getBookedSlots(doctorId, date) {
    const [rows] = await pool.query(
      `SELECT appointment_time FROM appointments 
       WHERE doctor_id = ? AND appointment_date = ? AND status != 'cancelled'`,
      [doctorId, date]
    );
    return rows.map(r => r.appointment_time);
  },

  /**
   * Get today's appointments
   */
  async getToday() {
    const [rows] = await pool.query(`
      SELECT a.*, p.full_name as patient_name, d.name as doctor_name, s.name as service_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN services s ON a.service_id = s.id
      WHERE a.appointment_date = CURDATE()
      ORDER BY a.appointment_time ASC
    `);
    return rows;
  },

  /**
   * Get monthly appointment counts for charts
   */
  async getMonthlyStats(year) {
    const [rows] = await pool.query(`
      SELECT MONTH(appointment_date) as month, COUNT(*) as count
      FROM appointments
      WHERE YEAR(appointment_date) = ?
      GROUP BY MONTH(appointment_date)
      ORDER BY month
    `, [year || new Date().getFullYear()]);
    return rows;
  },

  /**
   * Get status counts
   */
  async getStatusCounts() {
    const [rows] = await pool.query(`
      SELECT status, COUNT(*) as count FROM appointments GROUP BY status
    `);
    const counts = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    rows.forEach(r => { counts[r.status] = r.count; });
    counts.total = Object.values(counts).reduce((a, b) => a + b, 0);
    return counts;
  },

  async getTodayCount() {
    const [rows] = await pool.query(
      'SELECT COUNT(*) as total FROM appointments WHERE appointment_date = CURDATE()'
    );
    return rows[0].total;
  }
};

module.exports = AppointmentModel;
