const { pool } = require('../config/db');

const DoctorModel = {
  async findAll(filters = {}) {
    let query = 'SELECT * FROM doctors WHERE 1=1';
    const params = [];

    if (filters.is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(filters.is_active);
    }
    if (filters.specialization) {
      query += ' AND specialization LIKE ?';
      params.push(`%${filters.specialization}%`);
    }
    if (filters.search) {
      query += ' AND (name LIKE ? OR specialization LIKE ? OR qualification LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY name ASC';

    if (filters.limit) {
      const offset = ((filters.page || 1) - 1) * filters.limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(filters.limit), offset);
    }

    const [rows] = await pool.query(query, params);
    return rows;
  },

  async count(filters = {}) {
    let query = 'SELECT COUNT(*) as total FROM doctors WHERE 1=1';
    const params = [];

    if (filters.is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(filters.is_active);
    }
    if (filters.search) {
      query += ' AND (name LIKE ? OR specialization LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const [rows] = await pool.query(query, params);
    return rows[0].total;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM doctors WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO doctors (name, email, phone, qualification, experience, specialization, availability, image, bio, social_links)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.name, data.email, data.phone, data.qualification, data.experience, data.specialization,
       JSON.stringify(data.availability || []), data.image || null, data.bio || null, JSON.stringify(data.social_links || {})]
    );
    return result.insertId;
  },

  async update(id, data) {
    const fields = [];
    const values = [];

    const allowedFields = ['name', 'email', 'phone', 'qualification', 'experience', 'specialization', 'bio', 'is_active', 'image'];
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    });

    if (data.availability !== undefined) {
      fields.push('availability = ?');
      values.push(JSON.stringify(data.availability));
    }
    if (data.social_links !== undefined) {
      fields.push('social_links = ?');
      values.push(JSON.stringify(data.social_links));
    }

    if (fields.length === 0) return false;

    values.push(id);
    await pool.query(`UPDATE doctors SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM doctors WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async getActiveCount() {
    const [rows] = await pool.query('SELECT COUNT(*) as total FROM doctors WHERE is_active = 1');
    return rows[0].total;
  }
};

module.exports = DoctorModel;
