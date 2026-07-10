const { getIO } = require('../config/socket');
const logger = require('../utils/logger');

const SocketService = {
  /**
   * Emit appointment booked event
   */
  emitAppointmentBooked(appointment) {
    try {
      const io = getIO();
      io.emit('appointment:booked', {
        doctorId: appointment.doctor_id,
        date: appointment.appointment_date,
        time: appointment.appointment_time,
        appointment
      });
      io.to('dashboard').emit('dashboard:update', { type: 'new_appointment' });
      logger.info(`Socket: appointment:booked emitted for appointment #${appointment.id}`);
    } catch (error) {
      logger.error('Socket emit error (appointment:booked)', error);
    }
  },

  /**
   * Emit slot update (when a slot is booked or freed)
   */
  emitSlotUpdate(doctorId, date, bookedSlots) {
    try {
      const io = getIO();
      io.emit('slots:updated', { doctorId, date, bookedSlots });
      logger.info(`Socket: slots:updated emitted for doctor ${doctorId} on ${date}`);
    } catch (error) {
      logger.error('Socket emit error (slots:updated)', error);
    }
  },

  /**
   * Emit appointment status change
   */
  emitStatusChange(appointment) {
    try {
      const io = getIO();
      io.emit('appointment:statusChanged', {
        appointmentId: appointment.id,
        status: appointment.status,
        doctorId: appointment.doctor_id,
        date: appointment.appointment_date,
        time: appointment.appointment_time
      });
      io.to('dashboard').emit('dashboard:update', { type: 'status_change' });
    } catch (error) {
      logger.error('Socket emit error (appointment:statusChanged)', error);
    }
  },

  /**
   * Emit notification
   */
  emitNotification(notification) {
    try {
      const io = getIO();
      io.to('dashboard').emit('notification:new', notification);
    } catch (error) {
      logger.error('Socket emit error (notification:new)', error);
    }
  },

  /**
   * Emit new message notification
   */
  emitNewMessage(message) {
    try {
      const io = getIO();
      io.to('dashboard').emit('message:new', message);
    } catch (error) {
      logger.error('Socket emit error (message:new)', error);
    }
  },

  /**
   * Emit dashboard stats update
   */
  emitDashboardUpdate(data = {}) {
    try {
      const io = getIO();
      io.to('dashboard').emit('dashboard:update', data);
    } catch (error) {
      logger.error('Socket emit error (dashboard:update)', error);
    }
  },

  /**
   * Emit doctors list updated event
   */
  emitDoctorsUpdated() {
    try {
      const io = getIO();
      io.emit('doctors:updated');
      logger.info('Socket: doctors:updated emitted');
    } catch (error) {
      logger.error('Socket emit error (doctors:updated)', error);
    }
  }
};

module.exports = SocketService;
