const { pool } = require('../config/db');

const ContactModel = {
  async findAll(filters = {}) {
    let query = 'SELECT * FROM contact_messages WHERE 1=1';
    const params = [];
    if (filters.is_read !== undefined) { query += ' AND is_read = ?'; params.push(filters.is_read); }
    if (filters.search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR subject LIKE ?)';
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
    let query = 'SELECT COUNT(*) as total FROM contact_messages WHERE 1=1';
    const params = [];
    if (filters.is_read !== undefined) { query += ' AND is_read = ?'; params.push(filters.is_read); }
    if (filters.search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR subject LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }
    const [rows] = await pool.query(query, params);
    return rows[0].total;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM contact_messages WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await pool.query(
      'INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
      [data.name, data.email, data.phone || null, data.subject || null, data.message]
    );
    return result.insertId;
  },

  async markAsRead(id) {
    await pool.query('UPDATE contact_messages SET is_read = 1 WHERE id = ?', [id]);
    return true;
  },

  async reply(id, replyMessage) {
    await pool.query(
      'UPDATE contact_messages SET admin_reply = ?, replied_at = NOW(), is_read = 1 WHERE id = ?',
      [replyMessage, id]
    );
    return true;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM contact_messages WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async getUnreadCount() {
    const [rows] = await pool.query('SELECT COUNT(*) as total FROM contact_messages WHERE is_read = 0');
    return rows[0].total;
  }
};

module.exports = ContactModel;
