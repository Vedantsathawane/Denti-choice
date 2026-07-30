const { pool } = require('../../config/db');

const ClinicAppointmentModel = {
  async findAll(clinicId, filters = {}) {
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
      WHERE a.clinic_id = ?
    `;
    const params = [clinicId];

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

  async count(clinicId, filters = {}) {
    let query = `
      SELECT COUNT(*) as total
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.clinic_id = ?
    `;
    const params = [clinicId];

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

  async findById(clinicId, id) {
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
      WHERE a.clinic_id = ? AND a.id = ?
    `, [clinicId, id]);
    return rows[0] || null;
  },

  async create(clinicId, data) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Double-booking check
      const [existing] = await connection.query(
        `SELECT id FROM appointments 
         WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status != 'cancelled'`,
        [data.doctor_id, data.appointment_date, data.appointment_time]
      );

      if (existing.length > 0) {
        throw new Error('SLOT_ALREADY_BOOKED');
      }

      // Insert appointment
      const [result] = await connection.query(
        `INSERT INTO appointments (clinic_id, patient_id, doctor_id, service_id, appointment_date, appointment_time, status, message)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [clinicId, data.patient_id, data.doctor_id, data.service_id, data.appointment_date, data.appointment_time, data.status || 'pending', data.message || null]
      );
      const appointmentId = result.insertId;

      // Add to mapping table for AI backward compatibility
      await connection.query(
        'INSERT IGNORE INTO clinic_appointments (clinic_id, appointment_id) VALUES (?, ?)',
        [clinicId, appointmentId]
      );

      // Log status change
      await connection.query(
        `INSERT INTO appointment_logs (appointment_id, new_status, changed_by, notes)
         VALUES (?, ?, ?, 'Appointment booked via system')`,
        [appointmentId, data.status || 'pending', data.changed_by || 'system']
      );

      await connection.commit();
      return appointmentId;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },

  async update(clinicId, id, data) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [current] = await connection.query(
        'SELECT status, doctor_id, appointment_date, appointment_time FROM appointments WHERE clinic_id = ? AND id = ?',
        [clinicId, id]
      );

      if (current.length === 0) {
        throw new Error('APPOINTMENT_NOT_FOUND');
      }

      const original = current[0];

      // If rescheduling, check slot availability
      if (
        (data.doctor_id && data.doctor_id !== original.doctor_id) ||
        (data.appointment_date && data.appointment_date !== original.appointment_date) ||
        (data.appointment_time && data.appointment_time !== original.appointment_time)
      ) {
        const checkDoctor = data.doctor_id || original.doctor_id;
        const checkDate = data.appointment_date || original.appointment_date;
        const checkTime = data.appointment_time || original.appointment_time;

        const [existing] = await connection.query(
          `SELECT id FROM appointments 
           WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status != 'cancelled' AND id != ?`,
          [checkDoctor, checkDate, checkTime, id]
        );

        if (existing.length > 0) {
          throw new Error('SLOT_ALREADY_BOOKED');
        }
      }

      // Build fields
      const fields = [];
      const values = [];
      const allowed = ['patient_id', 'doctor_id', 'service_id', 'appointment_date', 'appointment_time', 'status', 'message', 'cancellation_reason'];
      
      allowed.forEach(f => {
        if (data[f] !== undefined) {
          fields.push(`${f} = ?`);
          values.push(data[f]);
        }
      });

      if (fields.length > 0) {
        values.push(clinicId, id);
        await connection.query(`UPDATE appointments SET ${fields.join(', ')} WHERE clinic_id = ? AND id = ?`, values);
      }

      // Log status changes
      if (data.status && data.status !== original.status) {
        await connection.query(
          `INSERT INTO appointment_logs (appointment_id, old_status, new_status, changed_by, notes)
           VALUES (?, ?, ?, ?, ?)`,
          [id, original.status, data.status, data.changed_by || 'system', data.notes || 'Status updated']
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
  },

  async delete(clinicId, id) {
    const [res] = await pool.query('DELETE FROM appointments WHERE clinic_id = ? AND id = ?', [clinicId, id]);
    // Also remove from mapping
    await pool.query('DELETE FROM clinic_appointments WHERE clinic_id = ? AND appointment_id = ?', [clinicId, id]);
    return res.affectedRows > 0;
  }
};

module.exports = ClinicAppointmentModel;
