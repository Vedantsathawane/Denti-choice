const NotificationModel = require('../models/notificationModel');
const { success, error, paginated } = require('../utils/apiResponse');

const NotificationController = {
  async getAll(req, res, next) {
    try {
      const { is_read, type, page = 1, limit = 20 } = { ...req.query, ...req.body };
      const filters = { page: parseInt(page), limit: parseInt(limit) };
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
      await NotificationModel.markAsRead(id);
      return success(res, null, 'Notification marked as read');
    } catch (err) { next(err); }
  },

  async markAllAsRead(req, res, next) {
    try {
      await NotificationModel.markAllAsRead();
      return success(res, null, 'All notifications marked as read');
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      const id = req.body.id || req.params.id;
      const deleted = await NotificationModel.delete(id);
      if (!deleted) return error(res, 'Notification not found.', 404);
      return success(res, null, 'Notification deleted');
    } catch (err) { next(err); }
  },

  async getUnreadCount(req, res, next) {
    try {
      const count = await NotificationModel.getUnreadCount();
      return success(res, { count });
    } catch (err) { next(err); }
  }
};

module.exports = NotificationController;
