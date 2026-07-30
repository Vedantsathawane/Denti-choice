const { pool } = require('../config/db');

const tenantMiddleware = async (req, res, next) => {
  try {
    let clinicId = 1; // Default to clinic ID 1
    let clinic = null;
    let subdomain = null;
    let customDomain = null;

    // 1. Resolve domain or subdomain
    const hostname = req.hostname; // e.g. "clinic1.denti-choice.app" or "localhost"
    
    // Check if custom domain or subdomain header is provided
    const headerClinicId = req.headers['x-clinic-id'];
    const headerSubdomain = req.headers['x-clinic-subdomain'];

    if (headerClinicId) {
      clinicId = parseInt(headerClinicId);
    } else if (headerSubdomain) {
      subdomain = headerSubdomain;
    } else if (hostname && hostname !== 'localhost' && !hostname.match(/^127\./) && !hostname.match(/^::1/)) {
      // If there is a custom domain, check database
      const [customDomainRows] = await pool.query(
        'SELECT * FROM clinics WHERE custom_domain = ? AND is_active = 1',
        [hostname]
      );

      if (customDomainRows.length > 0) {
        clinic = customDomainRows[0];
        clinicId = clinic.id;
      } else {
        // Fallback to subdomain check, e.g. "myclinic.dentichoice.com"
        const parts = hostname.split('.');
        if (parts.length > 2) {
          subdomain = parts[0];
        }
      }
    }

    // 2. Fetch clinic by subdomain if we resolved subdomain and didn't find custom domain
    if (!clinic && subdomain) {
      const [subdomainRows] = await pool.query(
        'SELECT * FROM clinics WHERE subdomain = ? AND is_active = 1',
        [subdomain]
      );
      if (subdomainRows.length > 0) {
        clinic = subdomainRows[0];
        clinicId = clinic.id;
      }
    }

    // 3. Fetch default clinic if still unresolved
    if (!clinic) {
      const [defaultRows] = await pool.query('SELECT * FROM clinics WHERE id = ?', [clinicId]);
      if (defaultRows.length > 0) {
        clinic = defaultRows[0];
      } else {
        // Absolute fallback metadata
        clinic = {
          id: 1,
          name: 'Denti-Choice Dental Clinic',
          subdomain: 'denti-choice',
          branding_color: '#0066FF',
          logo_url: null,
          is_active: 1
        };
      }
    }

    // 4. Attach to request object
    req.clinicId = clinicId;
    req.clinic = clinic;

    // 5. Fetch subscription status and verify access
    const [subRows] = await pool.query(
      `SELECT s.status, p.name as plan_name, p.features_json 
       FROM subscriptions s 
       JOIN subscription_plans p ON s.plan_id = p.id 
       WHERE s.clinic_id = ? 
       ORDER BY s.created_at DESC LIMIT 1`,
      [clinicId]
    );

    if (subRows.length > 0) {
      req.subscription = subRows[0];
    } else {
      req.subscription = {
        status: 'trialing',
        plan_name: 'Free Trial',
        features_json: []
      };
    }

    // Enforce Tenant Isolation (prevent cross-tenant data leakage)
    if (req.user && req.user.role !== 'super_admin') {
      if (parseInt(req.user.clinic_id) !== parseInt(clinicId)) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied. You do not have permission to access data from another tenant clinic.'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    next(); // Fallback gracefully to default
  }
};

/**
 * Middleware helper to restrict features based on subscription plans
 */
const requireFeature = (featureName) => {
  return (req, res, next) => {
    const sub = req.subscription;
    if (!sub || (sub.status !== 'active' && sub.status !== 'trialing')) {
      return res.status(402).json({
        success: false,
        message: 'Payment required. Clinic subscription is inactive.'
      });
    }

    // Parse features_json
    let features = [];
    try {
      features = typeof sub.features_json === 'string' 
        ? JSON.parse(sub.features_json) 
        : (sub.features_json || []);
    } catch (e) {
      features = [];
    }

    const hasFeature = features.some(f => f.toLowerCase().includes(featureName.toLowerCase()) || f.toLowerCase() === 'unlimited everything');
    if (!hasFeature) {
      return res.status(403).json({
        success: false,
        message: `Your current subscription plan does not support this feature: ${featureName}`
      });
    }

    next();
  };
};

module.exports = { tenantMiddleware, requireFeature };
