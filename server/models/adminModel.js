const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

const AdminModel = {
  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM clinic_users WHERE email = ?', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT id, clinic_id, name, email, role, avatar, is_active, last_login, created_at FROM clinic_users WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create(data) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const [result] = await pool.query(
      'INSERT INTO clinic_users (clinic_id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [data.clinic_id || null, data.name, data.email, hashedPassword, data.role || 'admin']
    );
    return result.insertId;
  },

  async updateProfile(id, data) {
    const fields = [];
    const values = [];

    if (data.name) { fields.push('name = ?'); values.push(data.name); }
    if (data.email) { fields.push('email = ?'); values.push(data.email); }
    if (data.avatar) { fields.push('avatar = ?'); values.push(data.avatar); }

    if (fields.length === 0) return false;

    values.push(id);
    await pool.query(`UPDATE clinic_users SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE clinic_users SET password = ? WHERE id = ?', [hashedPassword, id]);
    return true;
  },

  async updateLastLogin(id) {
    await pool.query('UPDATE clinic_users SET last_login = NOW() WHERE id = ?', [id]);
  },

  async comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
};

module.exports = AdminModel;
