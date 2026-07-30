const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const writeLog = (filename, message) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  fs.appendFile(path.join(logsDir, filename), logEntry, (err) => {
    if (err) console.error('Failed to write saas log:', err);
  });
};

const saasLogger = {
  // Activity Logging (e.g. Admin actions, user logs)
  logActivity: async ({ clinicId, userId, actionType, description, ipAddress }) => {
    try {
      const msg = `[CLINIC ${clinicId}] [USER ${userId || 'SYSTEM'}] [ACTION: ${actionType}] - ${description}`;
      writeLog('activity.log', msg);

      // Insert into MySQL activity_logs
      await pool.query(
        `INSERT INTO activity_logs (clinic_id, user_id, action_type, description, ip_address) 
         VALUES (?, ?, ?, ?, ?)`,
        [clinicId, userId || null, actionType, description, ipAddress || '127.0.0.1']
      );
    } catch (error) {
      console.error('Failed to write activity log to DB:', error.message);
    }
  },

  // AI Logs (tokens used, completions, prompt summary)
  logAI: async ({ clinicId, userType, featureName, promptTokens, completionTokens, promptSummary, responseSummary }) => {
    try {
      const msg = `[CLINIC ${clinicId}] [AI FEATURE: ${featureName}] - Prompt Tokens: ${promptTokens || 0}, Completion Tokens: ${completionTokens || 0}`;
      writeLog('ai.log', msg);

      // Insert into MySQL ai_logs
      await pool.query(
        `INSERT INTO ai_logs (clinic_id, user_type, feature_name, prompt_tokens, completion_tokens, prompt_summary, response_summary) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          clinicId,
          userType || 'patient',
          featureName,
          promptTokens || 0,
          completionTokens || 0,
          promptSummary || null,
          responseSummary || null
        ]
      );
    } catch (error) {
      console.error('Failed to write AI log to DB:', error.message);
    }
  },

  // Booking specific logs
  logBooking: (clinicId, action, details) => {
    const msg = `[CLINIC ${clinicId}] [BOOKING ACTION: ${action}] - ${details}`;
    writeLog('bookings.log', msg);
  },

  // General Admin logs
  logAdmin: (clinicId, adminId, action) => {
    const msg = `[CLINIC ${clinicId}] [ADMIN ${adminId}] - ${action}`;
    writeLog('admin.log', msg);
  }
};

module.exports = saasLogger;
