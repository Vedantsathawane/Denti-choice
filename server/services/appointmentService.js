const PatientModel = require('../models/patientModel');
const AppointmentModel = require('../models/appointmentModel');
const EmailService = require('./emailService');
const SocketService = require('./socketService');
const NotificationService = require('./notificationService');
const logger = require('../utils/logger');

const AppointmentService = {
  /**
   * Book a new appointment with full workflow:
   * 1. Create/find patient
   * 2. Create appointment with transaction-based double-booking prevention
   * 3. Send emails (patient, admin, doctor)
   * 4. Emit Socket.IO events
   * 5. Create notification
   */
  async book(data) {
    // 1. Create or find patient
    const patientId = await PatientModel.findOrCreate({
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      age: data.age,
      gender: data.gender,
      address: data.address
    });

    // 2. Create appointment
    const result = await AppointmentModel.create({
      patient_id: patientId,
      doctor_id: data.doctor_id,
      service_id: data.service_id,
      appointment_date: data.appointment_date,
      appointment_time: data.appointment_time,
      message: data.message
    });

    if (result.error) {
      return result; // Return error (SLOT_TAKEN)
    }

    // 3. Get full appointment details
    const appointment = await AppointmentModel.findById(result.id);

    // 4. Send emails (non-blocking)
    // Disabled sendBookingConfirmation so patients only receive an email when their appointment is confirmed
    // EmailService.sendBookingConfirmation(appointment).catch(e => logger.error('Email error', e));
    EmailService.sendAdminNotification(appointment).catch(e => logger.error('Email error', e));
    EmailService.sendDoctorNewPatient(appointment).catch(e => logger.error('Email error', e));

    // 5. Emit Socket.IO events
    SocketService.emitAppointmentBooked(appointment);
    const bookedSlots = await AppointmentModel.getBookedSlots(data.doctor_id, data.appointment_date);
    SocketService.emitSlotUpdate(data.doctor_id, data.appointment_date, bookedSlots);

    // 6. Create notification
    NotificationService.appointmentBooked(appointment).catch(e => logger.error('Notification error', e));

    logger.appointment(`Appointment #${appointment.id} booked - Patient: ${appointment.patient_name}, Doctor: ${appointment.doctor_name}, Date: ${appointment.appointment_date}`);

    return appointment;
  },

  /**
   * Change appointment status with full workflow
   */
  async changeStatus(id, status, changedBy, reason = null) {
    const success = await AppointmentModel.updateStatus(id, status, changedBy, reason);
    if (!success) return false;

    const appointment = await AppointmentModel.findById(id);
    if (!appointment) return false;

    // Send appropriate emails based on status
    switch (status) {
      case 'confirmed':
        EmailService.sendAppointmentConfirmed(appointment).catch(e => logger.error('Email error', e));
        break;
      case 'cancelled':
        appointment.cancellation_reason = reason;
        EmailService.sendAppointmentCancelled(appointment).catch(e => logger.error('Email error', e));
        // Free up the slot
        const bookedSlots = await AppointmentModel.getBookedSlots(appointment.doctor_id, appointment.appointment_date);
        SocketService.emitSlotUpdate(appointment.doctor_id, appointment.appointment_date, bookedSlots);
        break;
      case 'completed':
        EmailService.sendAppointmentCompleted(appointment).catch(e => logger.error('Email error', e));
        break;
    }

    // Emit status change
    appointment.status = status;
    SocketService.emitStatusChange(appointment);

    // Create notification
    NotificationService.appointmentStatusChanged(appointment, status).catch(e => logger.error('Notification error', e));

    return appointment;
  }
};

module.exports = AppointmentService;
