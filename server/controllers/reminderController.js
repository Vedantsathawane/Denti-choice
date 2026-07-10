const ReminderService = require('../services/reminderService');
const { success, error } = require('../utils/apiResponse');

const ReminderController = {
  async getUpcoming(req, res, next) {
    try {
      const appointments = await ReminderService.getUpcomingReminders();
      return success(res, appointments, 'Upcoming appointments fetched successfully');
    } catch (err) {
      next(err);
    }
  },

  async getPending(req, res, next) {
    try {
      const appointments = await ReminderService.getPendingReminders();
      return success(res, appointments, 'Pending (due) reminders fetched successfully');
    } catch (err) {
      next(err);
    }
  },

  async send(req, res, next) {
    try {
      const id = req.body.id || req.query.id;
      if (!id) {
        return error(res, 'Appointment ID is required.', 400);
      }
      const result = await ReminderService.sendReminder(id);
      
      if (!result.success) {
        if (result.status === 'not_found') {
          return error(res, result.message, 404);
        }
        if (result.status === 'already_sent' || result.status === 'cancelled' || result.status === 'completed' || result.status === 'invalid_status') {
          return error(res, result.message, 400);
        }
        return error(res, result.message, 500);
      }

      return success(res, null, result.message);
    } catch (err) {
      next(err);
    }
  },

  async sendAll(req, res, next) {
    try {
      const result = await ReminderService.sendAllPendingReminders();
      return success(res, result, `Processed ${result.totalFound} reminders. Sent: ${result.sentCount}, Failed: ${result.failedCount}`);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = ReminderController;
