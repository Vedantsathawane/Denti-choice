const { pool } = require('../config/db');
const logger = require('../utils/logger');
const NotificationServiceUpgrade = require('./notificationService');

const ReminderService = {
  /**
   * Fetch appointments due for 24-hour reminders
   */
  async getDue24hReminders() {
    const query = `
      SELECT a.*, 
             p.full_name as patient_name, p.email as patient_email, p.phone as patient_phone,
             d.name as doctor_name, d.email as doctor_email,
             s.name as service_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN services s ON a.service_id = s.id
      WHERE a.status IN ('pending', 'confirmed')
        AND a.reminder_24h_sent = 0
        AND CONCAT(a.appointment_date, ' ', a.appointment_time) > NOW()
        AND TIMESTAMPDIFF(MINUTE, NOW(), CONCAT(a.appointment_date, ' ', a.appointment_time)) BETWEEN 1380 AND 1500
    `;
    const [rows] = await pool.query(query);
    return rows;
  },

  /**
   * Fetch appointments due for 2-hour reminders
   */
  async getDue2hReminders() {
    const query = `
      SELECT a.*, 
             p.full_name as patient_name, p.email as patient_email, p.phone as patient_phone,
             d.name as doctor_name, d.email as doctor_email,
             s.name as service_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN services s ON a.service_id = s.id
      WHERE a.status IN ('pending', 'confirmed')
        AND a.reminder_2h_sent = 0
        AND CONCAT(a.appointment_date, ' ', a.appointment_time) > NOW()
        AND TIMESTAMPDIFF(MINUTE, NOW(), CONCAT(a.appointment_date, ' ', a.appointment_time)) BETWEEN 90 AND 150
    `;
    const [rows] = await pool.query(query);
    return rows;
  },

  /**
   * Fetch appointments due for 30-minute reminders
   */
  async getDue30mReminders() {
    const query = `
      SELECT a.*, 
             p.full_name as patient_name, p.email as patient_email, p.phone as patient_phone,
             d.name as doctor_name, d.email as doctor_email,
             s.name as service_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN services s ON a.service_id = s.id
      WHERE a.status IN ('pending', 'confirmed')
        AND a.reminder_30m_sent = 0
        AND CONCAT(a.appointment_date, ' ', a.appointment_time) > NOW()
        AND TIMESTAMPDIFF(MINUTE, NOW(), CONCAT(a.appointment_date, ' ', a.appointment_time)) BETWEEN 15 AND 45
    `;
    const [rows] = await pool.query(query);
    return rows;
  },

  /**
   * Dispatch reminder alerts based on stage
   */
  async sendStagedReminder(appointment, stage) {
    const clinicId = appointment.clinic_id || 1;
    const patientEmail = appointment.patient_email || appointment.email;
    const patientPhone = appointment.patient_phone || appointment.phone;
    const patientName = appointment.patient_name || appointment.full_name;
    const doctorName = appointment.doctor_name || 'Staff';
    const dateStr = appointment.appointment_date;
    const timeStr = appointment.appointment_time;

    const data = {
      patient_name: patientName,
      clinic_name: appointment.clinic_name || 'Denti-Choice Clinic',
      doctor_name: doctorName,
      service_name: appointment.service_name || 'Treatment',
      appointment_date: dateStr,
      appointment_time: timeStr,
      clinic_address: '123 Smile Street, Suite A',
      review_link: `http://denti-choice.com/review?clinic_id=${clinicId}`
    };

    // Trigger Multi-channel dispatches via our notification service (non-blocking)
    NotificationServiceUpgrade.triggerEvent(
      clinicId,
      appointment.patient_id,
      patientEmail,
      patientPhone,
      'reminder',
      data
    );

    // Mark as sent in DB
    const colSent = `reminder_${stage}_sent`;
    const colSentAt = `reminder_${stage}_sent_at`;
    await pool.query(
      `UPDATE appointments SET ${colSent} = 1, ${colSentAt} = NOW() WHERE id = ?`,
      [appointment.id]
    );

    logger.info(`Staged reminder (${stage}) successfully processed for appointment #${appointment.id}`);
  },

  /**
   * Scan and trigger reminders
   */
  async sendAllPendingReminders() {
    logger.info('Scanning for pending staged reminders...');
    let sentCount = 0;
    let failedCount = 0;

    try {
      // 1. Process 24h reminders
      const due24h = await this.getDue24hReminders();
      for (const appt of due24h) {
        try {
          await this.sendStagedReminder(appt, '24h');
          sentCount++;
        } catch (e) {
          logger.error(`Error sending 24h reminder for appointment #${appt.id}:`, e.message);
          failedCount++;
        }
      }

      // 2. Process 2h reminders
      const due2h = await this.getDue2hReminders();
      for (const appt of due2h) {
        try {
          await this.sendStagedReminder(appt, '2h');
          sentCount++;
        } catch (e) {
          logger.error(`Error sending 2h reminder for appointment #${appt.id}:`, e.message);
          failedCount++;
        }
      }

      // 3. Process 30m reminders
      const due30m = await this.getDue30mReminders();
      for (const appt of due30m) {
        try {
          await this.sendStagedReminder(appt, '30m');
          sentCount++;
        } catch (e) {
          logger.error(`Error sending 30m reminder for appointment #${appt.id}:`, e.message);
          failedCount++;
        }
      }
    } catch (error) {
      logger.error('Error running scan for staged reminders:', error.message);
    }

    return {
      totalFound: sentCount + failedCount,
      sentCount,
      failedCount
    };
  }
};

module.exports = ReminderService;
