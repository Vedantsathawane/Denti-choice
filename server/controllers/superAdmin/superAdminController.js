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
  }
};

module.exports = SuperAdminController;
