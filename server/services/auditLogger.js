const { pool } = require('../config/db');
const logger = require('../utils/logger');

const AuditLogger = {
  /**
   * Log an audit trail item to database
   */
  async log({ clinicId, userId, actionType, description, ipAddress = '127.0.0.1', userAgent = 'Unknown' }) {
    try {
      await pool.query(
        `INSERT INTO audit_logs (clinic_id, user_id, action_type, description, ip_address, user_agent) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [clinicId, userId, actionType, description, ipAddress, userAgent]
      );
    } catch (err) {
      logger.error('Failed to log audit event in database:', err.message);
    }
  }
};

module.exports = AuditLogger;
