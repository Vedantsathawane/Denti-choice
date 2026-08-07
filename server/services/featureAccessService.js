const { pool } = require('../config/db');
const logger = require('../utils/logger');

const DEFAULT_LIMITS = {
  // Plan 1: Free Trial defaults
  1: {
    max_doctors: 1,
    max_staff: 2,
    max_appointments_monthly: 50,
    ai_allowance: 20,
    whatsapp_allowance: 50,
    email_allowance: 100,
    storage_mb: 50,
    ai_assistant: true,
    whatsapp: true,
    analytics: false,
    website_builder: false,
    marketing_tools: false,
    custom_domain: false,
    api_access: false
  },
  // Plan 2: Clinic Pro defaults
  2: {
    max_doctors: 5,
    max_staff: 10,
    max_appointments_monthly: 500,
    ai_allowance: 500,
    whatsapp_allowance: 1000,
    email_allowance: 2000,
    storage_mb: 1024, // 1 GB
    ai_assistant: true,
    whatsapp: true,
    analytics: true,
    website_builder: true,
    marketing_tools: true,
    custom_domain: true,
    api_access: false
  },
  // Plan 3: Enterprise AI defaults
  3: {
    max_doctors: 999,
    max_staff: 999,
    max_appointments_monthly: 99999,
    ai_allowance: 99999,
    whatsapp_allowance: 99999,
    email_allowance: 99999,
    storage_mb: 10240, // 10 GB
    ai_assistant: true,
    whatsapp: true,
    analytics: true,
    website_builder: true,
    marketing_tools: true,
    custom_domain: true,
    api_access: true
  }
};

const FeatureAccessService = {
  /**
   * Resolve current limits and active flags of a clinic
   */
  async getClinicLimits(clinicId) {
    try {
      const [subs] = await pool.query(
        `SELECT s.plan_id, s.status, s.trial_end, s.current_period_end, p.features_json 
         FROM subscriptions s
         JOIN subscription_plans p ON s.plan_id = p.id
         WHERE s.clinic_id = ?
         ORDER BY s.id DESC
         LIMIT 1`,
        [clinicId]
      );

      if (subs.length === 0) {
        // Fallback to Plan 1 (Free Trial)
        return { planId: 1, status: 'trialing', limits: DEFAULT_LIMITS[1] };
      }

      const activeSub = subs[0];
      let limits = DEFAULT_LIMITS[activeSub.plan_id] || DEFAULT_LIMITS[1];

      // If custom limits are configured in features_json of the plan
      if (activeSub.features_json) {
        try {
          const parsed = typeof activeSub.features_json === 'string' 
            ? JSON.parse(activeSub.features_json) 
            : activeSub.features_json;

          // Merge if it's an object format
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            limits = { ...limits, ...parsed };
          }
        } catch (e) {
          logger.error('Failed to parse features_json custom limits:', e.message);
        }
      }

      return {
        planId: activeSub.plan_id,
        status: activeSub.status,
        trialEnd: activeSub.trial_end,
        periodEnd: activeSub.current_period_end,
        limits
      };

    } catch (err) {
      logger.error('Error fetching clinic plan limits:', err.message);
      return { planId: 1, status: 'expired', limits: DEFAULT_LIMITS[1] };
    }
  },

  /**
   * Check if clinic is allowed to use a feature flag (boolean)
   */
  async isFeatureEnabled(clinicId, featureKey) {
    const { limits, status } = await this.getClinicLimits(clinicId);
    
    // Non-active subscriptions cannot use premium flags
    if (status !== 'active' && status !== 'trialing' && status !== 'reactivated') {
      return false;
    }

    return !!limits[featureKey];
  },

  /**
   * Check if clinic can consume one count of a usage key (limits constraint check)
   */
  async checkLimit(clinicId, limitKey, currentUsage = null) {
    const { limits, status } = await this.getClinicLimits(clinicId);
    
    if (status !== 'active' && status !== 'trialing' && status !== 'reactivated') {
      return { allowed: false, reason: 'Subscription is inactive, suspended, or expired.' };
    }

    const limitVal = limits[limitKey];
    if (limitVal === undefined) {
      return { allowed: true }; // No limit set
    }

    let actualUsage = currentUsage;
    if (actualUsage === null) {
      // Query usage database
      const [rows] = await pool.query('SELECT * FROM feature_usage WHERE clinic_id = ?', [clinicId]);
      if (rows.length === 0) {
        actualUsage = 0;
      } else {
        const u = rows[0];
        if (limitKey === 'max_doctors') actualUsage = u.doctors_count;
        else if (limitKey === 'max_staff') actualUsage = u.staff_count;
        else if (limitKey === 'max_appointments_monthly') actualUsage = u.appointments_count;
        else if (limitKey === 'ai_allowance') actualUsage = u.ai_requests_count;
        else if (limitKey === 'whatsapp_allowance') actualUsage = u.whatsapp_messages_count;
        else if (limitKey === 'email_allowance') actualUsage = u.emails_count;
        else if (limitKey === 'storage_mb') actualUsage = u.storage_bytes / (1024 * 1024);
        else actualUsage = 0;
      }
    }

    if (actualUsage >= limitVal) {
      return { allowed: false, reason: `Plan limit reached for ${limitKey} (${actualUsage} / ${limitVal}). Please upgrade your plan.` };
    }

    return { allowed: true };
  },

  /**
   * Sync/increment usage count for a metric in the ledger
   */
  async incrementUsage(clinicId, usageKey, amount = 1) {
    try {
      const field = `${usageKey}_count`;
      // Ensure usage row exists
      await pool.query(
        `INSERT INTO feature_usage (clinic_id) VALUES (?) ON DUPLICATE KEY UPDATE clinic_id = clinic_id`,
        [clinicId]
      );
      
      const allowedKeys = ['appointments', 'doctors', 'staff', 'ai_requests', 'whatsapp_messages', 'emails'];
      if (allowedKeys.includes(usageKey)) {
        await pool.query(
          `UPDATE feature_usage SET ${usageKey}_count = ${usageKey}_count + ? WHERE clinic_id = ?`,
          [amount, clinicId]
        );
      }
    } catch (err) {
      logger.error(`Failed to increment usage ${usageKey} for clinic ${clinicId}:`, err.message);
    }
  },

  /**
   * Reusable Feature Gating Middleware
   */
  checkFeatureMiddleware(featureKey) {
    return async (req, res, next) => {
      const clinicId = req.user?.clinic_id || req.clinicId || 1;
      const enabled = await FeatureAccessService.isFeatureEnabled(clinicId, featureKey);
      
      if (!enabled) {
        return res.status(403).json({
          success: false,
          message: `Forbidden. Feature "${featureKey}" is not included in your current subscription plan.`
        });
      }
      next();
    };
  },

  /**
   * Reusable Usage Limit Middleware
   */
  checkLimitMiddleware(limitKey) {
    return async (req, res, next) => {
      const clinicId = req.user?.clinic_id || req.clinicId || 1;
      const check = await FeatureAccessService.checkLimit(clinicId, limitKey);
      
      if (!check.allowed) {
        return res.status(403).json({
          success: false,
          message: check.reason
        });
      }
      next();
    };
  }
};

module.exports = FeatureAccessService;
