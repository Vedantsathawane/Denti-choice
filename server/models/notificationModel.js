const { pool } = require('../config/db');

const NotificationModel = {
  async findAll(filters = {}) {
    let query = 'SELECT * FROM notifications WHERE 1=1';
    const params = [];
    if (filters.is_read !== undefined) { query += ' AND is_read = ?'; params.push(filters.is_read); }
    if (filters.type) { query += ' AND type = ?'; params.push(filters.type); }
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
    let query = 'SELECT COUNT(*) as total FROM notifications WHERE 1=1';
    const params = [];
    if (filters.is_read !== undefined) { query += ' AND is_read = ?'; params.push(filters.is_read); }
    const [rows] = await pool.query(query, params);
    return rows[0].total;
  },

  async create(data) {
    const [result] = await pool.query(
      'INSERT INTO notifications (type, title, message, data) VALUES (?, ?, ?, ?)',
      [data.type || 'system', data.title, data.message, data.data ? JSON.stringify(data.data) : null]
    );
    return result.insertId;
  },

  async markAsRead(id) {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
    return true;
  },

  async markAllAsRead() {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE is_read = 0');
    return true;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM notifications WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async getUnreadCount() {
    const [rows] = await pool.query('SELECT COUNT(*) as total FROM notifications WHERE is_read = 0');
    return rows[0].total;
  }
};

module.exports = NotificationModel;
