const { pool } = require('../../config/db');

const ClinicDoctorModel = {
  async findAll(clinicId, filters = {}) {
    let query = 'SELECT * FROM doctors WHERE clinic_id = ?';
    const params = [clinicId];

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

  async count(clinicId, filters = {}) {
    let query = 'SELECT COUNT(*) as total FROM doctors WHERE clinic_id = ?';
    const params = [clinicId];

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

  async findById(clinicId, id) {
    const [rows] = await pool.query('SELECT * FROM doctors WHERE clinic_id = ? AND id = ?', [clinicId, id]);
    return rows[0] || null;
  },

  async create(clinicId, data) {
    const [result] = await pool.query(
      `INSERT INTO doctors (clinic_id, name, email, phone, qualification, experience, specialization, availability, image, bio, social_links)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [clinicId, data.name, data.email, data.phone, data.qualification, data.experience, data.specialization,
       JSON.stringify(data.availability || []), data.image || null, data.bio || null, JSON.stringify(data.social_links || {})]
    );

    // Also populate mapping table for AI backward compatibility
    await pool.query(
      'INSERT IGNORE INTO clinic_doctors (clinic_id, doctor_id) VALUES (?, ?)',
      [clinicId, result.insertId]
    );

    return result.insertId;
  },

  async update(clinicId, id, data) {
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

    values.push(clinicId, id);
    const [res] = await pool.query(`UPDATE doctors SET ${fields.join(', ')} WHERE clinic_id = ? AND id = ?`, values);
    return res.affectedRows > 0;
  },

  async delete(clinicId, id) {
    const [result] = await pool.query('DELETE FROM doctors WHERE clinic_id = ? AND id = ?', [clinicId, id]);
    // Also remove from mapping table
    await pool.query('DELETE FROM clinic_doctors WHERE clinic_id = ? AND doctor_id = ?', [clinicId, id]);
    return result.affectedRows > 0;
  }
};

module.exports = ClinicDoctorModel;
