const SuperAdminModel = require('../../models/superAdmin/superAdminModel');
const AdminModel = require('../../models/adminModel');
const { success, error, created } = require('../../utils/apiResponse');
const bcrypt = require('bcryptjs');

const SuperAdminController = {
  // 1. Dashboard metrics
  async getDashboardKpis(req, res, next) {
    try {
      const kpis = await SuperAdminModel.getDashboardKpis();
      return success(res, kpis);
    } catch (err) { next(err); }
  },

  // 2. Clinics list & CRUD
  async getClinics(req, res, next) {
    try {
      const { search, is_active } = req.query;
      const filters = { search };
      if (is_active !== undefined) filters.is_active = parseInt(is_active);

      const clinics = await SuperAdminModel.getClinics(filters);
      return success(res, clinics);
    } catch (err) { next(err); }
  },

  async createClinic(req, res, next) {
    try {
      const { name, subdomain, custom_domain, logo_url, branding_color, website_theme, ownerName, ownerEmail, ownerPassword } = req.body;
      
      if (!name || !subdomain || !ownerEmail || !ownerPassword) {
        return error(res, 'Name, subdomain, owner email, and owner password are required.', 400);
      }

      // Check if subdomain is already taken
      const clinics = await SuperAdminModel.getClinics({ search: subdomain });
      const duplicateSub = clinics.some(c => c.subdomain.toLowerCase() === subdomain.toLowerCase());
      if (duplicateSub) {
        return error(res, 'Subdomain is already in use.', 400);
      }

      // Create clinic
      const clinicId = await SuperAdminModel.createClinic({ name, subdomain, custom_domain, logo_url, branding_color, website_theme });

      // Create owner user
      const ownerId = await AdminModel.create({
        clinic_id: clinicId,
        name: ownerName || 'Clinic Owner',
        email: ownerEmail,
        password: ownerPassword,
        role: 'owner'
      });

      // Create trial subscription
      await SuperAdminModel.updateSubscription(clinicId, 1, 'trialing', 30); // 30 day free trial

      // Trigger Onboarding Welcome Email (non-blocking)
      const EmailService = require('../../services/emailService');
      EmailService.sendWelcomeEmail(ownerName || 'Clinic Owner', ownerEmail, ownerPassword, subdomain).catch(err => {
        console.error('Failed to send onboarding welcome email:', err.message);
      });

      return created(res, { clinicId, ownerId }, 'Clinic and Owner user created successfully');
    } catch (err) { next(err); }
  },

  async updateClinic(req, res, next) {
    try {
      const { id } = req.params;
      const data = req.body;

      const updated = await SuperAdminModel.updateClinic(id, data);
      if (!updated) return error(res, 'Clinic not found or no changes made.', 404);

      // If branding_color or website_theme are in data, update clinic settings table too
      const ClinicSettingModel = require('../../models/clinic/clinicSettingModel');
      const settingsUpdates = {};
      if (data.branding_color) {
        settingsUpdates['primary_color'] = data.branding_color;
      }
      if (data.website_theme || data.theme) {
        settingsUpdates['website_theme'] = data.website_theme || data.theme;
      }
      if (Object.keys(settingsUpdates).length > 0) {
        await ClinicSettingModel.updateSettings(id, settingsUpdates);
      }

      return success(res, null, 'Clinic updated successfully');
    } catch (err) { next(err); }
  },

  async deleteClinic(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await SuperAdminModel.deleteClinic(id);
      if (!deleted) return error(res, 'Clinic not found.', 404);

      return success(res, null, 'Clinic deleted successfully');
    } catch (err) { next(err); }
  },

  // 3. Plans
  async getPlans(req, res, next) {
    try {
      const plans = await SuperAdminModel.getPlans();
      return success(res, plans);
    } catch (err) { next(err); }
  },

  async createPlan(req, res, next) {
    try {
      const { name, price, billing_cycle, features } = req.body;
      if (!name || price === undefined) return error(res, 'Name and price are required.', 400);

      const planId = await SuperAdminModel.createPlan({ name, price, billing_cycle, features });
      return created(res, { planId }, 'Subscription plan created successfully');
    } catch (err) { next(err); }
  },

  async updateClinicSubscription(req, res, next) {
    try {
      const { clinicId, planId, status, durationDays } = req.body;
      if (!clinicId || !planId) return error(res, 'Clinic ID and Plan ID are required.', 400);

      await SuperAdminModel.updateSubscription(clinicId, planId, status || 'active', durationDays || 30);
      return success(res, null, 'Clinic subscription updated successfully');
    } catch (err) { next(err); }
  },

  // 4. Support Tickets
  async getTickets(req, res, next) {
    try {
      const tickets = await SuperAdminModel.getTickets();
      return success(res, tickets);
    } catch (err) { next(err); }
  },

  async replyTicket(req, res, next) {
    try {
      const { id } = req.params;
      const { reply } = req.body;
      if (!reply) return error(res, 'Reply text is required.', 400);

      const successReply = await SuperAdminModel.replyTicket(id, reply);
      if (!successReply) return error(res, 'Ticket not found.', 404);

      return success(res, null, 'Ticket resolved and reply sent successfully');
    } catch (err) { next(err); }
  },

  // 5. System Health Status
  async getSystemHealth(req, res, next) {
    try {
      const os = require('os');
      const freeMem = os.freemem();
      const totalMem = os.totalmem();
      const usageMem = totalMem - freeMem;

      // Simple CPU usage
      const cpus = os.cpus();

      // Database ping test
      const { pool } = require('../../config/db');
      let dbStatus = 'disconnected';
      try {
        await pool.query('SELECT 1');
        dbStatus = 'connected';
      } catch (e) {
        dbStatus = 'error';
      }

      return success(res, {
        server: {
          uptime: os.uptime(),
          platform: os.platform(),
          architecture: os.arch(),
          cpuCount: cpus.length,
          memory: {
            totalGB: parseFloat((totalMem / (1024 ** 3)).toFixed(2)),
            usedGB: parseFloat((usageMem / (1024 ** 3)).toFixed(2)),
            freeGB: parseFloat((freeMem / (1024 ** 3)).toFixed(2)),
            percentUsed: parseFloat(((usageMem / totalMem) * 100).toFixed(2))
          }
        },
        database: {
          status: dbStatus
        },
        process: {
          uptime: process.uptime(),
          memoryUsage: {
            rssMB: parseFloat((process.memoryUsage().rss / (1024 ** 2)).toFixed(2)),
            heapUsedMB: parseFloat((process.memoryUsage().heapUsed / (1024 ** 2)).toFixed(2))
          }
        }
      });
    } catch (err) { next(err); }
  },

  // 6. Audit & Logs
  async getAuditLogs(req, res, next) {
    try {
      const { limit = 100 } = req.query;
      const logs = await SuperAdminModel.getAuditLogs(limit);
      return success(res, logs);
    } catch (err) { next(err); }
  },

  // 7. Payments list
  async getPayments(req, res, next) {
    try {
      const payments = await SuperAdminModel.getPayments();
      return success(res, payments);
    } catch (err) { next(err); }
  },

  // 8. Platform settings
  async getSettings(req, res, next) {
    try {
      const SettingModel = require('../../models/settingModel');
      const settings = await SettingModel.getAll();
      return success(res, settings);
    } catch (err) { next(err); }
  },

  async updateSettings(req, res, next) {
    try {
      const SettingModel = require('../../models/settingModel');
      await SettingModel.updateBulk(req.body);
      const settings = await SettingModel.getAll();
      return success(res, settings, 'Platform settings updated successfully');
    } catch (err) { next(err); }
  },

  async getClinicSettings(req, res, next) {
    try {
      const { id } = req.params;
      const ClinicSettingModel = require('../../models/clinic/clinicSettingModel');
      const settings = await ClinicSettingModel.getSettings(id);
      return success(res, settings);
    } catch (err) { next(err); }
  },

  async updateClinicSettings(req, res, next) {
    try {
      const { id } = req.params;
      const ClinicSettingModel = require('../../models/clinic/clinicSettingModel');
      await ClinicSettingModel.updateSettings(id, req.body);
      const settings = await ClinicSettingModel.getSettings(id);
      return success(res, settings, 'Clinic settings updated successfully');
    } catch (err) { next(err); }
  },

  // 9. Super Admin BI AI insights conversational query
  async askPlatformAi(req, res, next) {
    try {
      const { question } = req.body;
      if (!question) {
        return error(res, 'Question is required.', 400);
      }
      const superAdminAiService = require('../../ai/services/superAdminAiService');
      const answer = await superAdminAiService.ask({ question });
      return success(res, { answer });
    } catch (err) { next(err); }
  },

  // 10. Broadcast System Announcement/Notification to all Clinic Dashboards
  async broadcastNotification(req, res, next) {
    try {
      const { title, message } = req.body;
      if (!title || !message) {
        return error(res, 'Title and message are required.', 400);
      }

      const { pool } = require('../../config/db');

      // Write to system_notifications table with clinic_id = NULL (representing global/all clinics)
      const [result] = await pool.query(
        `INSERT INTO system_notifications (clinic_id, title, message, is_read) 
         VALUES (NULL, ?, ?, 0)`,
        [title, message]
      );

      // Emit Socket.IO event system-wide
      const SocketService = require('../../services/socketService');
      const broadcastPayload = {
        id: result.insertId,
        clinic_id: null,
        title,
        message,
        is_read: 0,
        created_at: new Date()
      };
      
      try {
        SocketService.emitNotification(broadcastPayload);
      } catch (wsErr) {
        console.warn('Socket broadcast warning:', wsErr.message);
      }

      // Log in audit log
      await pool.query(
        `INSERT INTO audit_logs (clinic_id, user_id, action_type, description, ip_address) 
         VALUES (NULL, ?, 'BROADCAST_ANNOUNCEMENT', ?, ?)`,
        [req.user?.id || null, `Super Admin broadcasted system announcement: "${title}"`, req.ip || '127.0.0.1']
      );

      return success(res, { broadcastId: result.insertId }, 'System-wide announcement broadcasted successfully');
    } catch (err) { next(err); }
  },

  // 11. Get global platform WhatsApp statistics
  async getGlobalWhatsAppStats(req, res, next) {
    try {
      const { pool } = require('../../config/db');

      // 1. Fetch connected clinics status
      const [connectedClinics] = await pool.query(`
        SELECT a.clinic_id, c.name as clinic_name, a.display_name, a.api_status, a.webhook_status, a.updated_at
        FROM whatsapp_accounts a
        JOIN clinics c ON a.clinic_id = c.id
      `);

      // 2. Fetch aggregate stats
      const [msgStats] = await pool.query(`
        SELECT status, direction, COUNT(*) as count
        FROM whatsapp_messages
        GROUP BY status, direction
      `);

      let totalOutbound = 0;
      let totalInbound = 0;
      let sent = 0;
      let delivered = 0;
      let read = 0;
      let failed = 0;

      msgStats.forEach(r => {
        if (r.direction === 'inbound') {
          totalInbound += r.count;
        } else {
          totalOutbound += r.count;
          if (r.status === 'sent') sent += r.count;
          else if (r.status === 'delivered') delivered += r.count;
          else if (r.status === 'read') read += r.count;
          else if (r.status === 'failed') failed += r.count;
        }
      });

      const totalOut = sent + delivered + read + failed;
      const successRate = totalOut > 0 ? parseFloat((((sent + delivered + read) / totalOut) * 100).toFixed(1)) : 100.0;

      // 3. Fetch daily messages
      const [dailyVolume] = await pool.query(`
        SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, COUNT(*) as count
        FROM whatsapp_messages
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
        ORDER BY date ASC
      `);

      return success(res, {
        connectedClinics,
        stats: {
          totalInbound,
          totalOutbound: totalOut,
          sent,
          delivered,
          read,
          failed,
          successRatePercent: successRate
        },
        dailyVolume
      });
    } catch (err) { next(err); }
  },

  // 12. List all platform subscription plans
  async getSubscriptionPlans(req, res, next) {
    try {
      const { pool } = require('../../config/db');
      const [rows] = await pool.query('SELECT * FROM subscription_plans ORDER BY price ASC');
      return success(res, rows);
    } catch (err) { next(err); }
  },

  // 13. Create or Edit subscription plans
  async saveSubscriptionPlan(req, res, next) {
    try {
      const { pool } = require('../../config/db');
      const { id, name, price, billing_cycle, features_json } = req.body;

      if (!name || price === undefined) {
        return error(res, 'Plan name and price are required', 400);
      }

      const featuresString = typeof features_json === 'string' 
        ? features_json 
        : JSON.stringify(features_json || {});

      if (id) {
        await pool.query(
          `UPDATE subscription_plans 
           SET name = ?, price = ?, billing_cycle = ?, features_json = ? 
           WHERE id = ?`,
          [name, price, billing_cycle || 'monthly', featuresString, id]
        );
        return success(res, null, 'Plan updated successfully');
      } else {
        const [result] = await pool.query(
          `INSERT INTO subscription_plans (name, price, billing_cycle, features_json) 
           VALUES (?, ?, ?, ?)`,
          [name, price, billing_cycle || 'monthly', featuresString]
        );
        return success(res, { planId: result.insertId }, 'Plan created successfully');
      }
    } catch (err) { next(err); }
  },

  // 14. Update clinic subscription (Trial extend, suspend, reactivate, cancel)
  async updateSubscriptionStatus(req, res, next) {
    try {
      const { pool } = require('../../config/db');
      const { clinicId, action, daysToExtend, status, planId } = req.body;

      if (!clinicId) return error(res, 'Clinic ID is required', 400);

      const [existing] = await pool.query('SELECT * FROM subscriptions WHERE clinic_id = ?', [clinicId]);
      if (existing.length === 0) return error(res, 'Clinic subscription record not found', 404);

      const currentSub = existing[0];
      let newStatus = status || currentSub.status;
      let newEnd = currentSub.current_period_end;
      let newPlanId = planId || currentSub.plan_id;

      if (action === 'extend_trial') {
        newStatus = 'trialing';
        // Extend current trial end by X days
        const baseDate = currentSub.trial_end ? new Date(currentSub.trial_end) : new Date();
        baseDate.setDate(baseDate.getDate() + parseInt(daysToExtend || 7));
        newEnd = baseDate;
        
        await pool.query(
          `UPDATE subscriptions 
           SET trial_end = ?, status = 'trialing', updated_at = NOW() 
           WHERE clinic_id = ?`,
          [newEnd, clinicId]
        );
      } 
      else if (action === 'suspend') {
        newStatus = 'suspended';
        await pool.query(
          `UPDATE subscriptions SET status = 'suspended', updated_at = NOW() WHERE clinic_id = ?`,
          [clinicId]
        );
      } 
      else if (action === 'reactivate') {
        newStatus = 'active';
        await pool.query(
          `UPDATE subscriptions SET status = 'active', updated_at = NOW() WHERE clinic_id = ?`,
          [clinicId]
        );
      } 
      else if (action === 'change_plan') {
        await pool.query(
          `UPDATE subscriptions SET plan_id = ?, status = 'active', updated_at = NOW() WHERE clinic_id = ?`,
          [newPlanId, clinicId]
        );
      }

      // Log the modification in subscription_logs
      await pool.query(
        `INSERT INTO subscription_logs (clinic_id, user_id, action_type, old_plan_id, new_plan_id, description) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          clinicId, 
          req.user?.id || null, 
          action.toUpperCase(), 
          currentSub.plan_id, 
          newPlanId, 
          `Operator action: "${action}". Status changed from "${currentSub.status}" to "${newStatus}"`
        ]
      );

      return success(res, null, 'Subscription updated successfully');
    } catch (err) { next(err); }
  },

  // 15. Get global revenue statistics and reports (MRR, ARR, forecasts, CSV exports)
  async getGlobalRevenueReport(req, res, next) {
    try {
      const { pool } = require('../../config/db');

      // 1. Calculate MRR & ARR from active subscriptions
      const [subs] = await pool.query(`
        SELECT s.clinic_id, p.price, p.billing_cycle, s.status
        FROM subscriptions s
        JOIN subscription_plans p ON s.plan_id = p.id
        WHERE s.status IN ('active', 'reactivated')
      `);

      let mrr = 0.00;
      subs.forEach(s => {
        const price = parseFloat(s.price);
        if (s.billing_cycle === 'yearly' || s.billing_cycle === 'annual') {
          mrr += price / 12;
        } else if (s.billing_cycle === 'quarterly') {
          mrr += price / 3;
        } else {
          mrr += price;
        }
      });

      const arr = mrr * 12;
      const forecast = mrr * 1.15; // 15% growth forecast

      // 2. Counts of clinics by status
      const [statusCounts] = await pool.query(`
        SELECT status, COUNT(*) as count 
        FROM subscriptions 
        GROUP BY status
      `);

      // 3. Top plans metrics
      const [topPlans] = await pool.query(`
        SELECT p.name, COUNT(s.id) as active_count
        FROM subscriptions s
        JOIN subscription_plans p ON s.plan_id = p.id
        GROUP BY p.name
        ORDER BY active_count DESC
      `);

      // 4. Usage summaries (AI requests, WhatsApp, Emails, Storage)
      const [[usageSummary]] = await pool.query(`
        SELECT 
          SUM(ai_requests_count) as total_ai,
          SUM(whatsapp_messages_count) as total_whatsapp,
          SUM(emails_count) as total_emails,
          SUM(storage_bytes) as total_storage
        FROM feature_usage
      `);

      // 5. Total invoices billing history list
      const [invoices] = await pool.query(`
        SELECT i.*, c.name as clinic_name
        FROM invoices i
        JOIN clinics c ON i.clinic_id = c.id
        ORDER BY i.id DESC
      `);

      return success(res, {
        mrr: parseFloat(mrr.toFixed(2)),
        arr: parseFloat(arr.toFixed(2)),
        forecast: parseFloat(forecast.toFixed(2)),
        statusCounts,
        topPlans,
        usageSummary: usageSummary || { total_ai: 0, total_whatsapp: 0, total_emails: 0, total_storage: 0 },
        invoices
      });
    } catch (err) { next(err); }
  },

  // 16. Server monitoring stats
  async getMonitoringStats(req, res, next) {
    try {
      const { pool } = require('../../config/db');
      const os = require('os');

      // CPU and memory usage info
      const freeMemBytes = os.freemem();
      const totalMemBytes = os.totalmem();
      const usedMemBytes = totalMemBytes - freeMemBytes;
      const memUsagePercent = parseFloat(((usedMemBytes / totalMemBytes) * 100).toFixed(1));

      const loadAvg = os.loadavg();
      const cpusCount = os.cpus().length;

      // Active counts
      const [[{ clinicsCount }]] = await pool.query('SELECT COUNT(*) as clinicsCount FROM clinics');
      const [[{ usersCount }]] = await pool.query('SELECT COUNT(*) as usersCount FROM clinic_users');
      const [[{ apptsCount }]] = await pool.query('SELECT COUNT(*) as apptsCount FROM appointments');

      // Database health status
      let dbHealthy = false;
      try {
        const [testRes] = await pool.query('SELECT 1');
        if (testRes) dbHealthy = true;
      } catch (e) {
        dbHealthy = false;
      }

      return success(res, {
        server: {
          platform: os.platform(),
          uptimeHours: parseFloat((os.uptime() / 3600).toFixed(1)),
          cpusCount,
          loadAvg1m: loadAvg[0],
          memory: {
            totalGB: parseFloat((totalMemBytes / (1024 * 1024 * 1024)).toFixed(1)),
            usedGB: parseFloat((usedMemBytes / (1024 * 1024 * 1024)).toFixed(1)),
            usagePercent: memUsagePercent
          }
        },
        database: {
          healthy: dbHealthy,
          clinicsCount,
          usersCount,
          apptsCount
        },
        avgApiResponseTimeMs: 45 // Sandbox static average measure
      }, 'Server health and monitoring telemetry resolved.');
    } catch (err) { next(err); }
  }
};

module.exports = SuperAdminController;
