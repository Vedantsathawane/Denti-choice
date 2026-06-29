const NotificationModel = require('../models/notificationModel');
const SocketService = require('./socketService');

const NotificationService = {
  async create(type, title, message, data = null) {
    const id = await NotificationModel.create({ type, title, message, data });
    const notification = { id, type, title, message, data, is_read: 0, created_at: new Date() };
    SocketService.emitNotification(notification);
    return id;
  },

  async appointmentBooked(appointment) {
    return this.create(
      'appointment',
      'New Appointment Booked',
      `${appointment.patient_name} booked an appointment with Dr. ${appointment.doctor_name} on ${appointment.appointment_date}`,
      { appointment_id: appointment.id }
    );
  },

  async appointmentStatusChanged(appointment, newStatus) {
    return this.create(
      'appointment',
      `Appointment ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
      `Appointment #APT-${String(appointment.id).padStart(5, '0')} for ${appointment.patient_name} has been ${newStatus}`,
      { appointment_id: appointment.id, status: newStatus }
    );
  },

  async newContactMessage(contact) {
    return this.create(
      'message',
      'New Contact Message',
      `New message from ${contact.name}: ${contact.subject || 'No subject'}`,
      { contact_id: contact.id }
    );
  }
};

module.exports = NotificationService;
