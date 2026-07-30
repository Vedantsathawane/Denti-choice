const PatientModel = require('../models/patientModel');
const AppointmentModel = require('../models/appointmentModel');
const EmailService = require('./emailService');
const SocketService = require('./socketService');
const NotificationService = require('./notificationService');
const NotificationCenterService = require('./notificationCenterService');
const logger = require('../utils/logger');

const AppointmentService = {
  /**
   * Book a new appointment with full workflow:
   * 1. Create/find patient
   * 2. Create appointment with transaction-based double-booking prevention
   * 3. Send notifications (email, whatsapp, socket)
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

    // 4. Send emails & multi-channel notifications (non-blocking)
    EmailService.sendAdminNotification(appointment).catch(e => logger.error('Email error', e));
    EmailService.sendDoctorNewPatient(appointment).catch(e => logger.error('Email error', e));

    const NotificationServiceUpgrade = require('./notificationService');
    NotificationServiceUpgrade.triggerEvent(
      appointment.clinic_id || 1,
      appointment.patient_id,
      appointment.patient_email || appointment.email,
      appointment.patient_phone || appointment.phone,
      'created',
      {
        patient_name: appointment.patient_name || appointment.full_name,
        clinic_name: appointment.clinic_name || 'Denti-Choice Clinic',
        doctor_name: appointment.doctor_name || 'Staff',
        service_name: appointment.service_name || 'Treatment',
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        clinic_address: '123 Smile Street, Suite A',
        review_link: `http://denti-choice.com/review?clinic_id=${appointment.clinic_id}`
      }
    );

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

    // Send appropriate emails & multi-channel notifications based on status
    let eventType = 'confirmed';
    if (status === 'cancelled') {
      eventType = 'cancelled';
      appointment.cancellation_reason = reason;
      // Free up the slot
      const bookedSlots = await AppointmentModel.getBookedSlots(appointment.doctor_id, appointment.appointment_date);
      SocketService.emitSlotUpdate(appointment.doctor_id, appointment.appointment_date, bookedSlots);
    } else if (status === 'completed') {
      eventType = 'completed';
    }

    // Trigger central notifications (WhatsApp, Email, Dashboard)
    const NotificationServiceUpgrade = require('./notificationService');
    NotificationServiceUpgrade.triggerEvent(
      appointment.clinic_id || 1,
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
        cancellation_reason: reason,
        review_link: `http://denti-choice.com/review?clinic_id=${appointment.clinic_id}`
      }
    );

    // Emit status change
    appointment.status = status;
    SocketService.emitStatusChange(appointment);

    // Create legacy notification log
    NotificationService.appointmentStatusChanged(appointment, status).catch(e => logger.error('Notification error', e));

    return appointment;
  }
};

module.exports = AppointmentService;
