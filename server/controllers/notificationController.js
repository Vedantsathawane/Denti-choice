const NotificationModel = require('../models/notificationModel');
const { success, error, paginated } = require('../utils/apiResponse');

const NotificationController = {
  async getAll(req, res, next) {
    try {
      const clinicId = req.clinicId || 1;
      const { is_read, type, page = 1, limit = 20 } = { ...req.query, ...req.body };
      const filters = { clinic_id: clinicId, page: parseInt(page), limit: parseInt(limit) };
      if (is_read !== undefined) filters.is_read = parseInt(is_read);
      if (type) filters.type = type;
      const [notifications, total] = await Promise.all([
        NotificationModel.findAll(filters),
        NotificationModel.count(filters)
      ]);
      return paginated(res, notifications, total, page, limit);
    } catch (err) { next(err); }
  },

  async markAsRead(req, res, next) {
    try {
      const id = req.body.id || req.params.id;
      const clinicId = req.clinicId || 1;
      const { pool } = require('../config/db');
      await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND clinic_id = ?', [id, clinicId]);
      return success(res, null, 'Notification marked as read');
    } catch (err) { next(err); }
  },

  async markAllAsRead(req, res, next) {
    try {
      const clinicId = req.clinicId || 1;
      await NotificationModel.markAllAsRead(clinicId);
      return success(res, null, 'All notifications marked as read');
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      const id = req.body.id || req.params.id;
      const clinicId = req.clinicId || 1;
      const { pool } = require('../config/db');
      const [result] = await pool.query('DELETE FROM notifications WHERE id = ? AND clinic_id = ?', [id, clinicId]);
      if (result.affectedRows === 0) return error(res, 'Notification not found.', 404);
      return success(res, null, 'Notification deleted');
    } catch (err) { next(err); }
  },

  async getUnreadCount(req, res, next) {
    try {
      const clinicId = req.clinicId || 1;
      const count = await NotificationModel.getUnreadCount(clinicId);
      return success(res, { count });
    } catch (err) { next(err); }
  },

  /**
   * GET /history - Fetch multi-tenant notification logs history
   */
  async getHistory(req, res, next) {
    try {
      const clinicId = req.clinicId || 1;
      const { page = 1, limit = 50 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { pool } = require('../config/db');
      const [rows] = await pool.query(
        `SELECT * FROM notification_history 
         WHERE clinic_id = ? 
         ORDER BY id DESC 
         LIMIT ? OFFSET ?`,
        [clinicId, parseInt(limit), parseInt(offset)]
      );

      const [[{ total }]] = await pool.query(
        'SELECT COUNT(*) as total FROM notification_history WHERE clinic_id = ?',
        [clinicId]
      );

      return success(res, {
        data: rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }, 'Notification history loaded');
    } catch (err) { next(err); }
  },

  /**
   * POST /retry - Retry a failed notification
   */
  async retry(req, res, next) {
    try {
      const { id } = req.body;
      if (!id) return error(res, 'Notification ID is required', 400);

      const NotificationService = require('../services/notificationService');
      const result = await NotificationService.retryFailedNotification(id);

      if (result.success) {
        return success(res, result, 'Notification retried successfully');
      } else {
        return error(res, 'Failed to retry notification: ' + result.error, 500);
      }
    } catch (err) { next(err); }
  },

  /**
   * POST /test-whatsapp - Send test WhatsApp message
   */
  async testWhatsApp(req, res, next) {
    try {
      const clinicId = req.clinicId || 1;
      const { phone, template, parameters } = req.body;
      if (!phone || !template) {
        return error(res, 'Phone and template name are required', 400);
      }

      const WhatsAppService = require('../services/whatsappService');
      const result = await WhatsAppService.sendTemplateMessage({
        clinicId,
        recipient: phone,
        templateName: template,
        parameters: parameters || []
      });

      return success(res, result, 'Test WhatsApp template message queued');
    } catch (err) { next(err); }
  },

  /**
   * GET /whatsapp/webhook - Challenge token verification
   */
  async handleWhatsAppVerify(req, res, next) {
    try {
      const WhatsAppService = require('../services/whatsappService');
      const challenge = await WhatsAppService.verifyWebhook(req.query);
      return res.status(200).send(challenge);
    } catch (err) {
      return res.status(403).send(err.message);
    }
  },

  /**
   * POST /whatsapp/webhook - Process incoming messages
   */
  async handleWhatsAppMessage(req, res, next) {
    try {
      const WhatsAppService = require('../services/whatsappService');
      const result = await WhatsAppService.handleIncomingWebhook(req.body);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
};

module.exports = NotificationController;
