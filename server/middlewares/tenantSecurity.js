const { z } = require('zod');
const logger = require('../utils/logger');

/**
 * Express middleware to validate request payload against Zod schema
 */
const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

/**
 * Express middleware to validate query parameters against Zod schema
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Query validation failed',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

/**
 * Centralized Error Handler Middleware
 */
const centralizedErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred on the server.';
  
  logger.error(`[SaaS Security] Central Error caught: ${message}`, err);

  // Return clean JSON response
  res.status(statusCode).json({
    success: false,
    message: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

/**
 * Cross-Site Scripting (XSS) Sanitizer
 */
const xssSanitizer = (req, res, next) => {
  const sanitize = (val) => {
    if (typeof val === 'string') {
      return val
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }
    if (val && typeof val === 'object') {
      for (const key in val) {
        val[key] = sanitize(val[key]);
      }
    }
    return val;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  next();
};

/**
 * Express middleware to validate tenant (clinic) isolation and prevent IDOR/BOLA cross-tenant access.
 */
const tenantIsolationGuard = (req, res, next) => {
  // Bypassed for Super Admins
  if (req.user && req.user.role === 'super_admin') {
    return next();
  }

  const clinicIdHeader = req.headers['x-clinic-id'];
  const parameterClinicId = req.params?.clinicId || req.query?.clinicId || req.body?.clinicId || req.clinicId;
  const targetClinicId = parameterClinicId ? parseInt(parameterClinicId) : (clinicIdHeader ? parseInt(clinicIdHeader) : null);
  
  if (req.user) {
    const userClinicId = req.user.clinic_id;
    if (targetClinicId && userClinicId !== targetClinicId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Cross-tenant access attempt blocked.'
      });
    }
  }
  next();
};

module.exports = {
  validateBody,
  validateQuery,
  centralizedErrorHandler,
  xssSanitizer,
  tenantIsolationGuard
};
