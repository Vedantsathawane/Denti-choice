const AppointmentModel = require('../models/appointmentModel');
const DoctorModel = require('../models/doctorModel');
const ServiceModel = require('../models/serviceModel');
const ContactModel = require('../models/contactModel');
const NotificationModel = require('../models/notificationModel');
const { success } = require('../utils/apiResponse');

const DashboardController = {
  async getStats(req, res, next) {
    try {
      const [
        appointmentCounts,
        todayCount,
        doctorCount,
        serviceCount,
        unreadMessages
      ] = await Promise.all([
        AppointmentModel.getStatusCounts(),
        AppointmentModel.getTodayCount(),
        DoctorModel.getActiveCount(),
        ServiceModel.getActiveCount(),
        ContactModel.getUnreadCount()
      ]);

      return success(res, {
        appointments: appointmentCounts,
        todayAppointments: todayCount,
        doctors: doctorCount,
        services: serviceCount,
        unreadMessages
      });
    } catch (err) { next(err); }
  },

  async getRecent(req, res, next) {
    try {
      const [recent, today] = await Promise.all([
        AppointmentModel.findAll({ limit: 5, sort: 'a.created_at', order: 'desc' }),
        AppointmentModel.getToday()
      ]);
      return success(res, { recent, today });
    } catch (err) { next(err); }
  },

  async getChartData(req, res, next) {
    try {
      const year = req.query.year || new Date().getFullYear();
      const [monthly, popular] = await Promise.all([
        AppointmentModel.getMonthlyStats(year),
        ServiceModel.getPopular()
      ]);
      return success(res, { monthly, popular });
    } catch (err) { next(err); }
  }
};

module.exports = DashboardController;
