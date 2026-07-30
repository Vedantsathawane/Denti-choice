const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const patientRoutes = require('./routes/patientRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const contactRoutes = require('./routes/contactRoutes');
const settingRoutes = require('./routes/settingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const aiRoutes = require('./ai/routes/aiRoutes');

// Import middleware
const { errorHandler, notFound } = require('./middlewares/errorMiddleware');
const { centralizedErrorHandler, xssSanitizer } = require('./middlewares/tenantSecurity');

const app = express();

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-clinic-id', 'x-clinic-subdomain']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Stricter rate limit for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.'
  }
});
app.use('/api/auth/login', authLimiter);

// Strict rate limit for AI endpoints to prevent denial-of-service / billing spikes
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: {
    success: false,
    message: 'Too many requests to the AI service. Please wait a bit before requesting again.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/ai', aiLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(xssSanitizer);

// Cookie parser
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Debug route
app.get('/api/debug/notifications', async (req, res, next) => {
  try {
    const { pool } = require('./config/db');
    const [rows] = await pool.query(
      'SELECT id, clinic_id, setting_key, CASE WHEN setting_key LIKE "%pass%" OR setting_key LIKE "%key%" THEN "********" ELSE setting_value END as setting_value FROM clinic_settings WHERE clinic_id = 1'
    );
    return res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/super-admin', require('./routes/superAdmin/superAdminRoutes'));
app.use('/api/clinic', require('./routes/clinic/clinicRoutes'));
app.use('/api/billing', require('./routes/clinic/billingRoutes'));
app.use('/api/public/clinic', require('./routes/public/publicClinicRoutes'));

// Setup Swagger Documentation
const { setupSwagger } = require('./config/swagger');
setupSwagger(app);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Dental Clinic API is running', timestamp: new Date().toISOString() });
});

// Error handling
app.use(notFound);
app.use(errorHandler);
app.use(centralizedErrorHandler);

module.exports = app;
