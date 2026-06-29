const { pool } = require('../config/db');

const ServiceModel = {
  async findAll(filters = {}) {
    let query = 'SELECT * FROM services WHERE 1=1';
    const params = [];

    if (filters.is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(filters.is_active);
    }
    if (filters.search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY sort_order ASC, name ASC';

    if (filters.limit) {
      const offset = ((filters.page || 1) - 1) * filters.limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(filters.limit), offset);
    }

    const [rows] = await pool.query(query, params);
    return rows;
  },

  async count(filters = {}) {
    let query = 'SELECT COUNT(*) as total FROM services WHERE 1=1';
    const params = [];
    if (filters.is_active !== undefined) { query += ' AND is_active = ?'; params.push(filters.is_active); }
    if (filters.search) { query += ' AND (name LIKE ? OR description LIKE ?)'; params.push(`%${filters.search}%`, `%${filters.search}%`); }
    const [rows] = await pool.query(query, params);
    return rows[0].total;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM services WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await pool.query(
      'INSERT INTO services (name, description, icon, image, duration, price, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.name, data.description, data.icon || null, data.image || null, data.duration, data.price, data.sort_order || 0]
    );
    return result.insertId;
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    const allowedFields = ['name', 'description', 'icon', 'image', 'duration', 'price', 'is_active', 'sort_order'];
    allowedFields.forEach(field => {
      if (data[field] !== undefined) { fields.push(`${field} = ?`); values.push(data[field]); }
    });
    if (fields.length === 0) return false;
    values.push(id);
    await pool.query(`UPDATE services SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM services WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async getActiveCount() {
    const [rows] = await pool.query('SELECT COUNT(*) as total FROM services WHERE is_active = 1');
    return rows[0].total;
  },

  async getPopular() {
    const [rows] = await pool.query(
      `SELECT s.id, s.name, COUNT(a.id) as booking_count
       FROM services s
       LEFT JOIN appointments a ON s.id = a.service_id
       GROUP BY s.id, s.name
       ORDER BY booking_count DESC
       LIMIT 5`
    );
    return rows;
  }
};

module.exports = ServiceModel;
