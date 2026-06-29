const nodemailer = require('nodemailer');
require('dotenv').config();

const createTransporter = () => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
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
