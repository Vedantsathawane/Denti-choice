const ClinicAppointmentModel = require('../../models/clinic/clinicAppointmentModel');
const { success, created, error, paginated } = require('../../utils/apiResponse');
const SocketService = require('../../services/socketService');

const ClinicAppointmentController = {
  async getAll(req, res, next) {
    try {
      const clinicId = req.clinicId || 1;
      const { status, doctor_id, date, from_date, to_date, search, page = 1, limit } = { ...req.query, ...req.body };
      const filters = { status, doctor_id, date, from_date, to_date, search, page: parseInt(page) };
      if (limit) filters.limit = parseInt(limit);

      const appointments = await ClinicAppointmentModel.findAll(clinicId, filters);

      if (limit) {
        const total = await ClinicAppointmentModel.count(clinicId, filters);
        return paginated(res, appointments, total, page, limit);
      }

      return success(res, appointments);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const clinicId = req.clinicId || 1;
      const id = req.body.id || req.params.id;
      const appointment = await ClinicAppointmentModel.findById(clinicId, id);
      if (!appointment) return error(res, 'Appointment not found.', 404);
      return success(res, appointment);
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const clinicId = req.clinicId || 1;
      const data = req.body;
      data.changed_by = req.user ? req.user.name : 'system';

      const id = await ClinicAppointmentModel.create(clinicId, data);
      const appointment = await ClinicAppointmentModel.findById(clinicId, id);

      // Emit sockets
      SocketService.emitAppointmentBooked(appointment);
      SocketService.emitSlotsUpdated(data.doctor_id, data.appointment_date);

      // Trigger doctor notification (non-blocking)
      const EmailService = require('../../services/emailService');
      EmailService.sendDoctorNewPatient(appointment).catch(e => console.error('Dashboard booking doctor email error', e));

      // Trigger patient notification based on creation status (non-blocking)
      const NotificationServiceUpgrade = require('../../services/notificationService');
      const eventType = appointment.status === 'confirmed' ? 'confirmed' : 'created';
      NotificationServiceUpgrade.triggerEvent(
        clinicId,
        appointment.patient_id,
        appointment.patient_email || appointment.email,
        appointment.patient_phone || appointment.phone,
        eventType,
        {
          patient_name: appointment.patient_name || appointment.full_name,
          clinic_name: appointment.clinic_name || 'Denti-Choice Clinic',
          doctor_name: appointment.doctor_name || 'Staff',
          service_name: appointment.service_name || 'Treatment',
          appointment_date: appointment.appointment_date,
          appointment_time: appointment.appointment_time,
          clinic_address: '123 Smile Street, Suite A',
          review_link: `http://denti-choice.com/review?clinic_id=${clinicId}`
        }
      ).catch(e => console.error('Dashboard booking patient notification error', e));

      return created(res, appointment, 'Appointment booked successfully');
    } catch (err) {
      if (err.message === 'SLOT_ALREADY_BOOKED') {
        return error(res, 'Timeslot is already booked. Please choose another slot.', 409);
      }
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const clinicId = req.clinicId || 1;
      const id = req.body.id || req.params.id;
      const data = req.body;
      data.changed_by = req.user ? req.user.name : 'system';

      await ClinicAppointmentModel.update(clinicId, id, data);
      const updated = await ClinicAppointmentModel.findById(clinicId, id);

      // Emit updates
      const SocketService = require('../../services/socketService');
      SocketService.emitSlotUpdate(updated.doctor_id, updated.appointment_date);

      // Trigger reschedule notification if date/time is changed
      if (data.appointment_date || data.appointment_time) {
        const NotificationServiceUpgrade = require('../../services/notificationService');
        NotificationServiceUpgrade.triggerEvent(
          clinicId,
          updated.patient_id,
          updated.patient_email || updated.email,
          updated.patient_phone || updated.phone,
          'rescheduled',
          {
            patient_name: updated.patient_name || updated.full_name,
            clinic_name: updated.clinic_name || 'Denti-Choice Clinic',
            doctor_name: updated.doctor_name || 'Staff',
            service_name: updated.service_name || 'Treatment',
            appointment_date: updated.appointment_date,
            appointment_time: updated.appointment_time,
            clinic_address: '123 Smile Street, Suite A',
            review_link: `http://denti-choice.com/review?clinic_id=${clinicId}`
          }
        );
      }

      return success(res, updated, 'Appointment updated successfully');
    } catch (err) {
      if (err.message === 'SLOT_ALREADY_BOOKED') {
        return error(res, 'Timeslot is already booked. Please choose another slot.', 409);
      }
      if (err.message === 'APPOINTMENT_NOT_FOUND') {
        return error(res, 'Appointment not found.', 404);
      }
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const clinicId = req.clinicId || 1;
      const id = req.body.id || req.params.id;
      const deleted = await ClinicAppointmentModel.delete(clinicId, id);
      if (!deleted) return error(res, 'Appointment not found.', 404);
      return success(res, null, 'Appointment deleted successfully');
    } catch (err) { next(err); }
  }
};

module.exports = ClinicAppointmentController;
