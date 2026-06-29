const { pool } = require('../config/db');

const TestimonialModel = {
  async findAll(filters = {}) {
    let query = 'SELECT * FROM testimonials WHERE 1=1';
    const params = [];
    if (filters.is_visible !== undefined) { query += ' AND is_visible = ?'; params.push(filters.is_visible); }
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
    let query = 'SELECT COUNT(*) as total FROM testimonials WHERE 1=1';
    const params = [];
    if (filters.is_visible !== undefined) { query += ' AND is_visible = ?'; params.push(filters.is_visible); }
    const [rows] = await pool.query(query, params);
    return rows[0].total;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM testimonials WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await pool.query(
      'INSERT INTO testimonials (patient_name, patient_photo, review, rating, is_visible) VALUES (?, ?, ?, ?, ?)',
      [data.patient_name, data.patient_photo || null, data.review, data.rating || 5, data.is_visible !== undefined ? data.is_visible : 1]
    );
    return result.insertId;
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    const allowedFields = ['patient_name', 'patient_photo', 'review', 'rating', 'is_visible'];
    allowedFields.forEach(field => {
      if (data[field] !== undefined) { fields.push(`${field} = ?`); values.push(data[field]); }
    });
    if (fields.length === 0) return false;
    values.push(id);
    await pool.query(`UPDATE testimonials SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async toggleVisibility(id) {
    await pool.query('UPDATE testimonials SET is_visible = NOT is_visible WHERE id = ?', [id]);
    return true;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM testimonials WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

module.exports = TestimonialModel;
