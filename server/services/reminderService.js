const AppointmentModel = require('../models/appointmentModel');
const EmailService = require('./emailService');
const logger = require('../utils/logger');
const { pool } = require('../config/db');

const ReminderService = {
  /**
   * Get all upcoming appointments eligible for reminders (future, not sent, pending/confirmed status, booked >= 2 hours in advance)
   */
  async getUpcomingReminders() {
    const query = `
      SELECT a.*, 
             p.full_name as patient_name, p.email as patient_email, p.phone as patient_phone,
             d.name as doctor_name, d.email as doctor_email, d.phone as doctor_phone,
             s.name as service_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN services s ON a.service_id = s.id
      WHERE a.status IN ('pending', 'confirmed')
        AND a.reminder_sent = 0
        AND CONCAT(a.appointment_date, ' ', a.appointment_time) > NOW()
        AND TIMESTAMPDIFF(MINUTE, a.created_at, CONCAT(a.appointment_date, ' ', a.appointment_time)) >= 120
      ORDER BY a.appointment_date ASC, a.appointment_time ASC
    `;
    const [rows] = await pool.query(query);
    return rows;
  },

  /**
   * Get all pending reminders that are currently due (time for sending is now or past, but they are not sent yet)
   */
  async getPendingReminders() {
    const query = `
      SELECT a.*, 
             p.full_name as patient_name, p.email as patient_email, p.phone as patient_phone,
             d.name as doctor_name, d.email as doctor_email, d.phone as doctor_phone,
             s.name as service_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN services s ON a.service_id = s.id
      WHERE a.status IN ('pending', 'confirmed')
        AND a.reminder_sent = 0
        AND CONCAT(a.appointment_date, ' ', a.appointment_time) > NOW()
        AND (
          (
            TIMESTAMPDIFF(HOUR, a.created_at, CONCAT(a.appointment_date, ' ', a.appointment_time)) >= 24
            AND NOW() >= TIMESTAMPADD(HOUR, -24, CONCAT(a.appointment_date, ' ', a.appointment_time))
          )
          OR
          (
            TIMESTAMPDIFF(HOUR, a.created_at, CONCAT(a.appointment_date, ' ', a.appointment_time)) < 24
            AND TIMESTAMPDIFF(MINUTE, a.created_at, CONCAT(a.appointment_date, ' ', a.appointment_time)) >= 120
            AND NOW() >= TIMESTAMPADD(HOUR, -2, CONCAT(a.appointment_date, ' ', a.appointment_time))
          )
        )
      ORDER BY a.appointment_date ASC, a.appointment_time ASC
    `;
    const [rows] = await pool.query(query);
    return rows;
  },

  /**
   * Send reminder for a specific appointment
   */
  async sendReminder(id) {
    const appointment = await AppointmentModel.findById(id);
    if (!appointment) {
      return { success: false, status: 'not_found', message: 'Appointment not found' };
    }

    if (appointment.reminder_sent) {
      logger.info(`Reminder for appointment #${id} skipped: already sent`);
      return { success: false, status: 'already_sent', message: 'Reminder already sent' };
    }

    if (appointment.status === 'cancelled') {
      logger.info(`Reminder for appointment #${id} skipped: Cancelled Appointment`);
      return { success: false, status: 'cancelled', message: 'Skipped (Cancelled Appointment)' };
    }

    if (appointment.status === 'completed') {
      logger.info(`Reminder for appointment #${id} skipped: Completed Appointment`);
      return { success: false, status: 'completed', message: 'Skipped (Completed Appointment)' };
    }

    if (appointment.status !== 'pending' && appointment.status !== 'confirmed') {
      return { success: false, status: 'invalid_status', message: `Cannot send reminder for status: ${appointment.status}` };
    }

    // Attempt sending email to patient (with retry once)
    let emailSent = false;
    let attempts = 0;
    while (attempts < 2 && !emailSent) {
      attempts++;
      try {
        emailSent = await EmailService.sendAppointmentReminder(appointment);
      } catch (err) {
        logger.error(`Error sending email attempt ${attempts} for appointment #${id}`, err);
      }
    }

    if (!emailSent) {
      logger.error(`Reminder email failed for appointment #${id} after 2 attempts`);
      return { success: false, status: 'failed', message: 'Reminder sending failed' };
    }

    // Mark as sent
    const now = new Date();
    await AppointmentModel.update(id, {
      reminder_sent: 1,
      reminder_sent_at: now
    });

    logger.appointment(`Reminder Email Sent successfully for appointment #${id}`);

    // Optional: Send reminder to doctor
    try {
      if (appointment.doctor_email) {
        await EmailService.sendDoctorReminder(appointment);
        logger.appointment(`Doctor reminder email sent for appointment #${id}`);
      }
    } catch (err) {
      logger.error(`Failed to send optional doctor reminder for appointment #${id}`, err);
    }

    return { success: true, status: 'sent', message: 'Reminder Sent Successfully' };
  },

  /**
   * Send all pending reminders that are currently due
   */
  async sendAllPendingReminders() {
    const dueAppointments = await this.getPendingReminders();
    logger.info(`Running sendAllPendingReminders: found ${dueAppointments.length} due appointments`);
    
    let sentCount = 0;
    let failedCount = 0;
    
    for (const appt of dueAppointments) {
      try {
        const result = await this.sendReminder(appt.id);
        if (result.success) {
          sentCount++;
        } else if (result.status === 'failed') {
          failedCount++;
        }
      } catch (error) {
        failedCount++;
        logger.error(`Error in sendAllPendingReminders for appointment #${appt.id}:`, error);
      }
    }

    return {
      totalFound: dueAppointments.length,
      sentCount,
      failedCount
    };
  }
};

module.exports = ReminderService;
