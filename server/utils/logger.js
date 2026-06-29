const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const writeLog = (filename, message) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  fs.appendFile(path.join(logsDir, filename), logEntry, (err) => {
    if (err) console.error('Failed to write log:', err);
  });
};

const logger = {
  info: (message) => {
    writeLog('app.log', `[INFO] ${message}`);
    if (process.env.NODE_ENV === 'development') {
      console.log(`ℹ️  ${message}`);
    }
  },
  warn: (message) => {
    writeLog('app.log', `[WARN] ${message}`);
    console.warn(`⚠️  ${message}`);
  },
  error: (message, error = null) => {
    const fullMessage = error ? `${message} - ${error.message || error}` : message;
    writeLog('error.log', `[ERROR] ${fullMessage}`);
    console.error(`❌ ${fullMessage}`);
  },
  appointment: (message) => {
    writeLog('appointments.log', message);
  },
  email: (message) => {
    writeLog('emails.log', message);
  }
};

module.exports = logger;
