const AppointmentModel = require('../models/appointmentModel');
const AppointmentService = require('../services/appointmentService');
const { success, error, paginated } = require('../utils/apiResponse');
const { TIME_SLOTS } = require('../utils/helpers');

const AppointmentController = {
  async getAll(req, res, next) {
    try {
      const { search, status, doctor_id, date, from_date, to_date, sort, order, page = 1, limit = 10 } = req.query;
      const filters = { search, status, doctor_id, date, from_date, to_date, sort, order, page: parseInt(page), limit: parseInt(limit) };

      const [appointments, total] = await Promise.all([
        AppointmentModel.findAll(filters),
        AppointmentModel.count(filters)
      ]);

      return paginated(res, appointments, total, page, limit);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const appointment = await AppointmentModel.findById(req.params.id);
      if (!appointment) return error(res, 'Appointment not found.', 404);
      return success(res, appointment);
    } catch (err) { next(err); }
  },

  /**
   * Book appointment - public endpoint
   */
  async book(req, res, next) {
    try {
      const result = await AppointmentService.book(req.body);

      if (result.error === 'SLOT_TAKEN') {
        return error(res, 'Slot Already Booked. Please choose a different time.', 409);
      }

      return success(res, result, 'Appointment booked successfully!', 201);
    } catch (err) { next(err); }
  },

  /**
   * Get available slots for a doctor on a date
   */
  async getSlots(req, res, next) {
    try {
      const { doctor_id, date } = req.query;
      if (!doctor_id || !date) {
        return error(res, 'doctor_id and date are required.', 400);
      }

      const bookedSlots = await AppointmentModel.getBookedSlots(doctor_id, date);
      const availableSlots = TIME_SLOTS.map(slot => ({
        time: slot,
        available: !bookedSlots.includes(slot)
      }));

      return success(res, { slots: availableSlots, bookedSlots });
    } catch (err) { next(err); }
  },

  /**
   * Update appointment status - admin only
   */
  async updateStatus(req, res, next) {
    try {
      const { status, reason } = req.body;
      const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];

      if (!validStatuses.includes(status)) {
        return error(res, 'Invalid status.', 400);
      }

      const result = await AppointmentService.changeStatus(
        req.params.id, status, req.user.name, reason
      );

      if (!result) return error(res, 'Appointment not found.', 404);
      return success(res, result, `Appointment ${status} successfully`);
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const appointment = await AppointmentModel.findById(req.params.id);
      if (!appointment) return error(res, 'Appointment not found.', 404);
      await AppointmentModel.update(req.params.id, req.body);
      const updated = await AppointmentModel.findById(req.params.id);
      return success(res, updated, 'Appointment updated successfully');
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      const deleted = await AppointmentModel.delete(req.params.id);
      if (!deleted) return error(res, 'Appointment not found.', 404);
      return success(res, null, 'Appointment deleted successfully');
    } catch (err) { next(err); }
  },

  async getToday(req, res, next) {
    try {
      const appointments = await AppointmentModel.getToday();
      return success(res, appointments);
    } catch (err) { next(err); }
  }
};

module.exports = AppointmentController;
