const ContactModel = require('../models/contactModel');
const EmailService = require('../services/emailService');
const NotificationService = require('../services/notificationService');
const SocketService = require('../services/socketService');
const { success, created, error, paginated } = require('../utils/apiResponse');

const ContactController = {
  async getAll(req, res, next) {
    try {
      const { search, is_read, page = 1, limit = 10 } = { ...req.query, ...req.body };
      const filters = { search, page: parseInt(page), limit: parseInt(limit) };
      if (is_read !== undefined) filters.is_read = parseInt(is_read);
      const [messages, total] = await Promise.all([
        ContactModel.findAll(filters),
        ContactModel.count(filters)
      ]);
      return paginated(res, messages, total, page, limit);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const id = req.body.id || req.params.id;
      const message = await ContactModel.findById(id);
      if (!message) return error(res, 'Message not found.', 404);
      return success(res, message);
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const id = await ContactModel.create(req.body);
      const message = await ContactModel.findById(id);

      // Create notification and emit socket event
      NotificationService.newContactMessage(message).catch(() => {});
      SocketService.emitNewMessage(message);

      return created(res, message, 'Message sent successfully! We will get back to you soon.');
    } catch (err) { next(err); }
  },

  async markAsRead(req, res, next) {
    try {
      const id = req.body.id || req.params.id;
      await ContactModel.markAsRead(id);
      return success(res, null, 'Marked as read');
    } catch (err) { next(err); }
  },

  async reply(req, res, next) {
    try {
      const id = req.body.id || req.params.id;
      const message = await ContactModel.findById(id);
      if (!message) return error(res, 'Message not found.', 404);

      await ContactModel.reply(id, req.body.reply);

      // Send reply email
      EmailService.sendContactReply(message, req.body.reply).catch(() => {});

      return success(res, null, 'Reply sent successfully');
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      const id = req.body.id || req.params.id;
      const deleted = await ContactModel.delete(id);
      if (!deleted) return error(res, 'Message not found.', 404);
      return success(res, null, 'Message deleted successfully');
    } catch (err) { next(err); }
  }
};

module.exports = ContactController;
