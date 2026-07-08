const nodemailer = require('nodemailer');
require('dotenv').config();

const createTransporter = (settings = {}) => {
  const host = settings.smtp_host || process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(settings.smtp_port || process.env.SMTP_PORT) || 587;
  const user = settings.smtp_user || process.env.SMTP_USER;
  const pass = settings.smtp_pass || process.env.SMTP_PASS;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  return transporter;
};

const verifyTransporter = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ SMTP connection verified');
    return true;
  } catch (error) {
    console.warn('⚠️  SMTP verification failed:', error.message);
    console.warn('   Email notifications will not work until SMTP is configured.');
    return false;
  }
};

module.exports = { createTransporter, verifyTransporter };
