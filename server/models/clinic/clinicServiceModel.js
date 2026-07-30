const { pool } = require('../../config/db');

const ClinicServiceModel = {
  async findAll(clinicId, filters = {}) {
    let query = 'SELECT * FROM services WHERE clinic_id = ?';
    const params = [clinicId];

    if (filters.is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(filters.is_active);
    }
    if (filters.search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY sort_order ASC, name ASC';

    const [rows] = await pool.query(query, params);
    return rows;
  },

  async findById(clinicId, id) {
    const [rows] = await pool.query('SELECT * FROM services WHERE clinic_id = ? AND id = ?', [clinicId, id]);
    return rows[0] || null;
  },

  async create(clinicId, data) {
    const [result] = await pool.query(
      `INSERT INTO services (clinic_id, name, description, icon, image, duration, price, is_active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [clinicId, data.name, data.description, data.icon || null, data.image || null, data.duration, data.price, data.is_active !== undefined ? data.is_active : 1, data.sort_order || 0]
    );

    // Also populate mapping table for AI backward compatibility
    await pool.query(
      'INSERT IGNORE INTO clinic_services (clinic_id, service_id) VALUES (?, ?)',
      [clinicId, result.insertId]
    );

    return result.insertId;
  },

  async update(clinicId, id, data) {
    const fields = [];
    const values = [];
    const allowed = ['name', 'description', 'icon', 'image', 'duration', 'price', 'is_active', 'sort_order'];

    allowed.forEach(f => {
      if (data[f] !== undefined) {
        fields.push(`${f} = ?`);
        values.push(data[f]);
      }
    });

    if (fields.length === 0) return false;

    values.push(clinicId, id);
    const [res] = await pool.query(`UPDATE services SET ${fields.join(', ')} WHERE clinic_id = ? AND id = ?`, values);
    return res.affectedRows > 0;
  },

  async delete(clinicId, id) {
    const [res] = await pool.query('DELETE FROM services WHERE clinic_id = ? AND id = ?', [clinicId, id]);
    await pool.query('DELETE FROM clinic_services WHERE clinic_id = ? AND service_id = ?', [clinicId, id]);
    return res.affectedRows > 0;
  }
};

module.exports = ClinicServiceModel;
