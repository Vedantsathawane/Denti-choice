const { pool } = require('../../config/db');

const SuperAdminModel = {
  // --- Dashboard KPIs ---
  async getDashboardKpis() {
    const [[{ total_clinics }]] = await pool.query('SELECT COUNT(*) as total_clinics FROM clinics');
    const [[{ active_clinics }]] = await pool.query('SELECT COUNT(*) as active_clinics FROM clinics WHERE is_active = 1');
    const [[{ suspended_clinics }]] = await pool.query('SELECT COUNT(*) as suspended_clinics FROM clinics WHERE is_active = 0');
    
    // Trial clinics
    const [[{ trial_clinics }]] = await pool.query(`
      SELECT COUNT(DISTINCT clinic_id) as trial_clinics 
      FROM subscriptions 
      WHERE status = 'trialing' AND current_period_end > NOW()
    `);

    // Total appointments today
    const [[{ appointments_today }]] = await pool.query(`
      SELECT COUNT(*) as appointments_today 
      FROM appointments 
      WHERE appointment_date = CURDATE()
    `);

    // Total Doctors & Patients
    const [[{ total_doctors }]] = await pool.query('SELECT COUNT(*) as total_doctors FROM doctors');
    const [[{ total_patients }]] = await pool.query('SELECT COUNT(*) as total_patients FROM patients');

    // AI Request stats
    const [[{ total_ai_requests }]] = await pool.query('SELECT COUNT(*) as total_ai_requests FROM ai_logs');
    const [[{ total_prompt_tokens, total_completion_tokens }]] = await pool.query(
      'SELECT SUM(prompt_tokens) as total_prompt_tokens, SUM(completion_tokens) as total_completion_tokens FROM ai_logs'
    );

    // Approximate cost: 1.5$/million tokens for input, 5$/million for output (Gemini / GPT-4o-mini blended)
    const openAiCost = (((total_prompt_tokens || 0) * 0.15) + ((total_completion_tokens || 0) * 0.60)) / 100000;
    const geminiCost = (((total_prompt_tokens || 0) * 0.075) + ((total_completion_tokens || 0) * 0.30)) / 100000;

    // Revenue KPIs
    const [[{ total_revenue }]] = await pool.query("SELECT SUM(amount) as total_revenue FROM payments WHERE status = 'completed'");
    const [[{ mrr }]] = await pool.query(`
      SELECT SUM(p.price) as mrr
      FROM subscriptions s
      JOIN subscription_plans p ON s.plan_id = p.id
      WHERE s.status = 'active' AND p.billing_cycle = 'monthly'
    `);
    const [[{ yrr }]] = await pool.query(`
      SELECT SUM(p.price) as yrr
      FROM subscriptions s
      JOIN subscription_plans p ON s.plan_id = p.id
      WHERE s.status = 'active' AND p.billing_cycle = 'yearly'
    `);
    const calculatedMRR = parseFloat(mrr || 0) + (parseFloat(yrr || 0) / 12);
    const calculatedARR = calculatedMRR * 12;

    // Open support tickets count
    const [[{ open_tickets }]] = await pool.query("SELECT COUNT(*) as open_tickets FROM support_tickets WHERE status = 'open'");

    return {
      clinics: {
        total: total_clinics,
        active: active_clinics,
        trial: trial_clinics,
        suspended: suspended_clinics
      },
      system: {
        appointmentsToday: appointments_today,
        totalDoctors: total_doctors,
        totalPatients: total_patients,
        aiRequests: total_ai_requests,
        openAiCost: parseFloat(openAiCost.toFixed(4)),
        geminiCost: parseFloat(geminiCost.toFixed(4)),
        openTickets: open_tickets
      },
      revenue: {
        totalRevenue: parseFloat(total_revenue || 0),
        mrr: parseFloat(calculatedMRR.toFixed(2)),
        arr: parseFloat(calculatedARR.toFixed(2))
      }
    };
  },

  // --- Clinic Management ---
  async getClinics(filters = {}) {
    let query = `
      SELECT c.*, s.status as subscription_status, p.name as plan_name, s.current_period_end
      FROM clinics c
      LEFT JOIN (
        SELECT s1.* FROM subscriptions s1
        INNER JOIN (
          SELECT MAX(id) as id FROM subscriptions GROUP BY clinic_id
        ) s2 ON s1.id = s2.id
      ) s ON c.id = s.clinic_id
      LEFT JOIN subscription_plans p ON s.plan_id = p.id
      WHERE 1=1
    `;
    const params = [];
    if (filters.search) {
      query += ' AND (c.name LIKE ? OR c.subdomain LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    if (filters.is_active !== undefined) {
      query += ' AND c.is_active = ?';
      params.push(filters.is_active);
    }
    query += ' ORDER BY c.id DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  },

  async createClinic(data) {
    const [result] = await pool.query(
      'INSERT INTO clinics (name, subdomain, custom_domain, logo_url, branding_color, theme) VALUES (?, ?, ?, ?, ?, ?)',
      [data.name, data.subdomain, data.custom_domain || null, data.logo_url || null, data.branding_color || '#0066FF', data.website_theme || 'modern']
    );
    const clinicId = result.insertId;

    // Auto create default feature limits
    await pool.query(
      'INSERT INTO feature_limits (clinic_id, max_doctors, max_ai_requests, max_monthly_appointments) VALUES (?, ?, ?, ?)',
      [clinicId, 5, 100, 500]
    );

    // Auto create default settings
    const defaultSettings = [
      ['clinic_name', data.name],
      ['website_theme', data.website_theme || 'modern'],
      ['primary_color', data.branding_color || '#0066FF'],
      ['secondary_color', '#38bdf8'],
      ['business_hours', '[{"day":"Monday","open":"09:00","close":"17:00"},{"day":"Tuesday","open":"09:00","close":"17:00"},{"day":"Wednesday","open":"09:00","close":"17:00"},{"day":"Thursday","open":"09:00","close":"17:00"},{"day":"Friday","open":"09:00","close":"17:00"}]'],
      ['hero_title', 'Exemplary Dental Care for Your Family'],
      ['hero_subtitle', 'Experience state-of-the-art dental services with Denti-Choice AI-powered booking and clinic care.'],
      ['social_links', '{"facebook":"","instagram":"","twitter":"","linkedin":""}'],
      ['seo_title', `${data.name} - Modern Dentist & Oral Care`],
      ['seo_description', `Book appointments and consult with dentist experts at ${data.name}.`]
    ];

    for (const [key, val] of defaultSettings) {
      await pool.query(
        'INSERT INTO clinic_settings (clinic_id, setting_key, setting_value) VALUES (?, ?, ?)',
        [clinicId, key, val]
      );
    }

    return clinicId;
  },

  async updateClinic(id, data) {
    const fields = [];
    const values = [];
    const allowed = ['name', 'subdomain', 'custom_domain', 'logo_url', 'branding_color', 'is_active', 'secondary_color', 'theme', 'seo_title', 'seo_description'];
    
    allowed.forEach(f => {
      if (data[f] !== undefined) {
        fields.push(`${f} = ?`);
        values.push(data[f]);
      }
    });

    if (fields.length === 0) return false;
    values.push(id);
    await pool.query(`UPDATE clinics SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async deleteClinic(id) {
    const [res] = await pool.query('DELETE FROM clinics WHERE id = ?', [id]);
    return res.affectedRows > 0;
  },

  // --- Subscriptions & Plans ---
  async getPlans() {
    const [rows] = await pool.query('SELECT * FROM subscription_plans');
    return rows;
  },

  async createPlan(data) {
    const [res] = await pool.query(
      'INSERT INTO subscription_plans (name, price, billing_cycle, features_json) VALUES (?, ?, ?, ?)',
      [data.name, data.price, data.billing_cycle, JSON.stringify(data.features || [])]
    );
    return res.insertId;
  },

  async updateSubscription(clinicId, planId, status, durationDays = 30) {
    const [existing] = await pool.query('SELECT id FROM subscriptions WHERE clinic_id = ?', [clinicId]);
    if (existing.length > 0) {
      await pool.query(
        'UPDATE subscriptions SET plan_id = ?, status = ?, current_period_end = DATE_ADD(NOW(), INTERVAL ? DAY) WHERE clinic_id = ?',
        [planId, status, durationDays, clinicId]
      );
    } else {
      await pool.query(
        'INSERT INTO subscriptions (clinic_id, plan_id, status, current_period_end) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))',
        [clinicId, planId, status, durationDays]
      );
    }
    return true;
  },

  // --- Support Tickets ---
  async getTickets() {
    const [rows] = await pool.query(`
      SELECT t.*, c.name as clinic_name, u.name as user_name
      FROM support_tickets t
      JOIN clinics c ON t.clinic_id = c.id
      JOIN clinic_users u ON t.user_id = u.id
      ORDER BY t.id DESC
    `);
    return rows;
  },

  async replyTicket(ticketId, replyText) {
    const [res] = await pool.query(
      "UPDATE support_tickets SET admin_reply = ?, replied_at = NOW(), status = 'resolved' WHERE id = ?",
      [replyText, ticketId]
    );
    return res.affectedRows > 0;
  },

  // --- Payments ---
  async getPayments() {
    const [rows] = await pool.query(`
      SELECT p.*, c.name as clinic_name
      FROM payments p
      JOIN clinics c ON p.clinic_id = c.id
      ORDER BY p.id DESC
    `);
    return rows;
  },

  // --- Audit Logs ---
  async getAuditLogs(limit = 100) {
    const [rows] = await pool.query(`
      SELECT l.*, c.name as clinic_name, u.name as user_name
      FROM audit_logs l
      LEFT JOIN clinics c ON l.clinic_id = c.id
      LEFT JOIN clinic_users u ON l.user_id = u.id
      ORDER BY l.id DESC
      LIMIT ?
    `, [parseInt(limit)]);
    return rows;
  }
};

module.exports = SuperAdminModel;
