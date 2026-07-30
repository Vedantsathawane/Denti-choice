const { pool } = require('../config/db');

const checkLimit = (resourceType) => {
  return async (req, res, next) => {
    try {
      const clinicId = req.clinicId || 1;

      // 1. Fetch feature limits for this clinic
      const [limitRows] = await pool.query(
        'SELECT * FROM feature_limits WHERE clinic_id = ?',
        [clinicId]
      );

      // Fallback/Default limits if none configured in DB
      const limits = limitRows.length > 0 ? limitRows[0] : {
        max_doctors: 5,
        max_ai_requests: 100,
        max_monthly_appointments: 500
      };

      if (resourceType === 'doctors') {
        const [[{ count }]] = await pool.query(
          'SELECT COUNT(*) as count FROM doctors WHERE clinic_id = ? AND is_active = 1',
          [clinicId]
        );
        if (count >= limits.max_doctors) {
          return res.status(403).json({
            success: false,
            message: `Plan Limit Exceeded. Your plan allows a maximum of ${limits.max_doctors} doctors. Please upgrade your subscription.`
          });
        }
      } 
      else if (resourceType === 'appointments') {
        const [[{ count }]] = await pool.query(
          `SELECT COUNT(*) as count FROM appointments 
           WHERE clinic_id = ? 
             AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')`,
          [clinicId]
        );
        if (count >= limits.max_monthly_appointments) {
          return res.status(403).json({
            success: false,
            message: `Plan Limit Exceeded. Your plan allows a maximum of ${limits.max_monthly_appointments} appointments per month. Please upgrade your subscription.`
          });
        }
      } 
      else if (resourceType === 'ai') {
        const [[{ count }]] = await pool.query(
          `SELECT COUNT(*) as count FROM ai_logs 
           WHERE clinic_id = ? 
             AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')`,
          [clinicId]
        );
        if (count >= limits.max_ai_requests) {
          return res.status(403).json({
            success: false,
            message: `Plan Limit Exceeded. Your plan allows a maximum of ${limits.max_ai_requests} AI operations per month. Please upgrade your subscription.`
          });
        }
      }

      next();
    } catch (err) {
      console.error('Plan limits middleware error:', err.message);
      next(); // Fail open for safety or handle custom
    }
  };
};

module.exports = { checkLimit };
