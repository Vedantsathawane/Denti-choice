const { pool } = require('../config/db');

const PatientModel = {
  async findAll(filters = {}) {
    let query = 'SELECT * FROM patients WHERE 1=1';
    const params = [];

    if (filters.search) {
      query += ' AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      const offset = ((filters.page || 1) - 1) * filters.limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(filters.limit), offset);
    }

    const [rows] = await pool.query(query, params);
    return rows;
  },

  async count(filters = {}) {
    let query = 'SELECT COUNT(*) as total FROM patients WHERE 1=1';
    const params = [];
    if (filters.search) {
      query += ' AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }
    const [rows] = await pool.query(query, params);
    return rows[0].total;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM patients WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM patients WHERE email = ?', [email]);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await pool.query(
      'INSERT INTO patients (full_name, email, phone, age, gender, address) VALUES (?, ?, ?, ?, ?, ?)',
      [data.full_name, data.email, data.phone, data.age || null, data.gender || null, data.address || null]
    );
    return result.insertId;
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    const allowedFields = ['full_name', 'email', 'phone', 'age', 'gender', 'address'];
    allowedFields.forEach(field => {
      if (data[field] !== undefined) { fields.push(`${field} = ?`); values.push(data[field]); }
    });
    if (fields.length === 0) return false;
    values.push(id);
    await pool.query(`UPDATE patients SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async findOrCreate(data) {
    let patient = await this.findByEmail(data.email);
    if (patient) {
      // Update existing patient info
      await this.update(patient.id, data);
      return patient.id;
    }
    return await this.create(data);
  }
};

module.exports = PatientModel;
