const { pool } = require('../../config/db');

const ClinicPatientModel = {
  async findAll(clinicId, filters = {}) {
    let query = 'SELECT * FROM patients WHERE clinic_id = ?';
    const params = [clinicId];

    if (filters.search) {
      query += ' AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY full_name ASC';

    if (filters.limit) {
      const offset = ((filters.page || 1) - 1) * filters.limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(filters.limit), offset);
    }

    const [rows] = await pool.query(query, params);
    return rows;
  },

  async count(clinicId, filters = {}) {
    let query = 'SELECT COUNT(*) as total FROM patients WHERE clinic_id = ?';
    const params = [clinicId];

    if (filters.search) {
      query += ' AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    const [rows] = await pool.query(query, params);
    return rows[0].total;
  },

  async findById(clinicId, id) {
    const [rows] = await pool.query('SELECT * FROM patients WHERE clinic_id = ? AND id = ?', [clinicId, id]);
    return rows[0] || null;
  },

  async findByEmailOrPhone(clinicId, email, phone) {
    const [rows] = await pool.query(
      'SELECT * FROM patients WHERE clinic_id = ? AND (email = ? OR phone = ?)',
      [clinicId, email, phone]
    );
    return rows[0] || null;
  },

  async create(clinicId, data) {
    const [result] = await pool.query(
      `INSERT INTO patients (clinic_id, full_name, email, phone, age, gender, address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [clinicId, data.full_name, data.email, data.phone, data.age || null, data.gender || null, data.address || null]
    );

    // Also populate mapping table for AI backward compatibility
    await pool.query(
      'INSERT IGNORE INTO clinic_patients (clinic_id, patient_id) VALUES (?, ?)',
      [clinicId, result.insertId]
    );

    return result.insertId;
  },

  async update(clinicId, id, data) {
    const fields = [];
    const values = [];
    const allowed = ['full_name', 'email', 'phone', 'age', 'gender', 'address'];

    allowed.forEach(f => {
      if (data[f] !== undefined) {
        fields.push(`${f} = ?`);
        values.push(data[f]);
      }
    });

    if (fields.length === 0) return false;

    values.push(clinicId, id);
    const [res] = await pool.query(`UPDATE patients SET ${fields.join(', ')} WHERE clinic_id = ? AND id = ?`, values);
    return res.affectedRows > 0;
  },

  async delete(clinicId, id) {
    const [res] = await pool.query('DELETE FROM patients WHERE clinic_id = ? AND id = ?', [clinicId, id]);
    await pool.query('DELETE FROM clinic_patients WHERE clinic_id = ? AND patient_id = ?', [clinicId, id]);
    return res.affectedRows > 0;
  }
};

module.exports = ClinicPatientModel;
