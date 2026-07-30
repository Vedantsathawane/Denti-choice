const { pool } = require('../config/db');
const logger = require('../utils/logger');
const EmailService = require('./emailService');
const WhatsAppService = require('./whatsappService');
const SocketService = require('./socketService');

const NotificationCenterService = {
  /**
   * Send notification across a specified channel and log it in the database
   */
  async send({ clinicId, recipient, channel, title, message, templateData = {}, emailDetails = {}, whatsappDetails = {} }) {
    // 1. Insert pending status log into notification_history
    let historyId = null;
    try {
      const [res] = await pool.query(
        `INSERT INTO notification_history (clinic_id, recipient, channel, title, message, status) 
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [clinicId, recipient || 'system', channel, title, message]
      );
      historyId = res.insertId;
    } catch (dbErr) {
      logger.error('Failed to write initial notification history log:', dbErr.message);
    }

    let sendResult = { success: false, error: 'Unknown channel' };

    // 2. Dispatch depending on the chosen channel
    try {
      if (channel === 'email') {
        const mailOptions = {
          to: recipient,
          subject: title,
          html: emailDetails.html || `<p>${message}</p>`,
          text: message
        };
        
        // Use generic mail sender or helper
        const { createTransporter } = require('../config/mailer');
        const transporter = createTransporter();
        
        await transporter.sendMail({
          from: process.env.SMTP_FROM || '"Denti-Choice Notifications" <notifications@dentichoice.com>',
          to: recipient,
          subject: title,
          text: message,
          html: emailDetails.html || `<div style="padding:20px; font-family:sans-serif;"><h2>${title}</h2><p>${message}</p></div>`
        });

        sendResult = { success: true };
      } 
      else if (channel === 'whatsapp') {
        sendResult = await WhatsAppService.sendTemplateMessage({
          clinicId,
          recipient,
          templateName: whatsappDetails.templateName || 'generic_notification',
          languageCode: whatsappDetails.languageCode || 'en_US',
          parameters: whatsappDetails.parameters || [{ type: 'text', text: message }]
        });
      } 
      else if (channel === 'socket') {
        const payload = {
          id: historyId || Date.now(),
          clinic_id: clinicId,
          type: templateData.type || 'system',
          title,
          message,
          data: templateData.payload || null,
          is_read: 0,
          created_at: new Date()
        };
        SocketService.emitNotification(payload);
        sendResult = { success: true };
      } 
      else if (channel === 'sms' || channel === 'push') {
        // SMS & Push Placeholder (Future Ready)
        logger.info(`[FUTURE READY] Notification channel: ${channel} mock-dispatched to ${recipient}: ${title}`);
        sendResult = { success: true, message: `Mock ${channel} delivered` };
      }
    } catch (sendErr) {
      sendResult = { success: false, error: sendErr.message };
      logger.error(`Error sending notification via ${channel}:`, sendErr.message);
    }

    // 3. Update status in database
    if (historyId) {
      try {
        const finalStatus = sendResult.success ? 'delivered' : 'failed';
        const finalError = sendResult.success ? null : sendResult.error;
        await pool.query(
          'UPDATE notification_history SET status = ?, error_message = ? WHERE id = ?',
          [finalStatus, finalError, historyId]
        );
      } catch (updateErr) {
        logger.error('Failed to update final status in notification_history:', updateErr.message);
      }
    }

    return sendResult;
  },

  /**
   * Retrieve notification history logs for a specific clinic
   */
  async getHistory({ clinicId, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      `SELECT * FROM notification_history 
       WHERE clinic_id = ? 
       ORDER BY id DESC 
       LIMIT ? OFFSET ?`,
      [clinicId, parseInt(limit), parseInt(offset)]
    );

    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM notification_history WHERE clinic_id = ?',
      [clinicId]
    );

    return {
      data: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  /**
   * Get notification volume metrics per channel
   */
  async getMetrics(clinicId) {
    const [rows] = await pool.query(
      `SELECT channel, status, COUNT(*) as count 
       FROM notification_history 
       WHERE clinic_id = ? 
       GROUP BY channel, status`,
      [clinicId]
    );
    return rows;
  },

  /**
   * Mark a notification as read/viewed
   */
  async markAsRead(id) {
    const [res] = await pool.query(
      "UPDATE notification_history SET status = 'read' WHERE id = ?",
      [id]
    );
    return res.affectedRows > 0;
  },

  /**
   * Dispatch multi-channel notifications on appointment triggers (Created, Confirmed, Rescheduled, Cancelled, Completed)
   */
  async triggerAppointmentNotification(appointment, eventType) {
    const clinicId = appointment.clinic_id || 1;
    const patientEmail = appointment.patient_email || appointment.email;
    const patientPhone = appointment.patient_phone || appointment.phone;
    const patientName = appointment.patient_name || appointment.full_name;
    const doctorName = appointment.doctor_name || 'Staff';
    const dateStr = appointment.appointment_date;
    const timeStr = appointment.appointment_time;

    let emailTitle = '';
    let emailHtml = '';
    let whatsappTemplate = '';
    let whatsappParams = [];
    let dashboardMessage = '';

    switch (eventType) {
      case 'created':
        emailTitle = `Appointment Booked - Denti-Choice`;
        emailHtml = `
          <div style="font-family: sans-serif; padding: 20px; color: #002266;">
            <h2>Hi ${patientName},</h2>
            <p>Your appointment has been successfully booked with <strong>Dr. ${doctorName}</strong> for <strong>${dateStr}</strong> at <strong>${timeStr}</strong>.</p>
            <p>We will confirm your timeslot shortly.</p>
          </div>`;
        whatsappTemplate = 'appointment_confirmation';
        whatsappParams = [
          { type: 'text', text: patientName },
          { type: 'text', text: doctorName },
          { type: 'text', text: `${dateStr} ${timeStr}` }
        ];
        dashboardMessage = `${patientName} booked a new appointment with Dr. ${doctorName} on ${dateStr} at ${timeStr}`;
        break;

      case 'confirmed':
        emailTitle = `Appointment Confirmed - Denti-Choice`;
        emailHtml = `
          <div style="font-family: sans-serif; padding: 20px; color: #002266;">
            <h2>Hi ${patientName},</h2>
            <p>Your appointment with <strong>Dr. ${doctorName}</strong> on <strong>${dateStr}</strong> at <strong>${timeStr}</strong> has been <strong>confirmed</strong>.</p>
            <p>We look forward to seeing you!</p>
          </div>`;
        whatsappTemplate = 'appointment_confirmation';
        whatsappParams = [
          { type: 'text', text: patientName },
          { type: 'text', text: doctorName },
          { type: 'text', text: `${dateStr} ${timeStr}` }
        ];
        dashboardMessage = `Appointment for ${patientName} on ${dateStr} at ${timeStr} has been confirmed`;
        break;

      case 'rescheduled':
        emailTitle = `Appointment Rescheduled - Denti-Choice`;
        emailHtml = `
          <div style="font-family: sans-serif; padding: 20px; color: #002266;">
            <h2>Hi ${patientName},</h2>
            <p>Your appointment has been rescheduled. Your new slot is with <strong>Dr. ${doctorName}</strong> on <strong>${dateStr}</strong> at <strong>${timeStr}</strong>.</p>
          </div>`;
        whatsappTemplate = 'appointment_reschedule';
        whatsappParams = [
          { type: 'text', text: patientName },
          { type: 'text', text: doctorName },
          { type: 'text', text: `${dateStr} ${timeStr}` }
        ];
        dashboardMessage = `Appointment for ${patientName} has been rescheduled to ${dateStr} at ${timeStr}`;
        break;

      case 'cancelled':
        emailTitle = `Appointment Cancelled - Denti-Choice`;
        emailHtml = `
          <div style="font-family: sans-serif; padding: 20px; color: #002266;">
            <h2>Hi ${patientName},</h2>
            <p>Your appointment with <strong>Dr. ${doctorName}</strong> on <strong>${dateStr}</strong> has been cancelled.</p>
            ${appointment.cancellation_reason ? `<p><strong>Reason:</strong> ${appointment.cancellation_reason}</p>` : ''}
          </div>`;
        whatsappTemplate = 'appointment_cancellation';
        whatsappParams = [
          { type: 'text', text: patientName },
          { type: 'text', text: doctorName },
          { type: 'text', text: dateStr }
        ];
        dashboardMessage = `Appointment for ${patientName} on ${dateStr} has been cancelled`;
        break;

      case 'completed':
        emailTitle = `Thank you for your visit - Denti-Choice`;
        emailHtml = `
          <div style="font-family: sans-serif; padding: 20px; color: #002266;">
            <h2>Hi ${patientName},</h2>
            <p>Thank you for choosing us for your dental care. Your appointment with <strong>Dr. ${doctorName}</strong> is complete.</p>
            <p>We'd appreciate it if you could share a review of your experience.</p>
          </div>`;
        whatsappTemplate = 'review_request';
        whatsappParams = [
          { type: 'text', text: patientName },
          { type: 'text', text: doctorName }
        ];
        dashboardMessage = `Appointment for ${patientName} was completed successfully`;
        break;
    }

    // 1. Dispatch Email
    if (patientEmail) {
      await this.send({
        clinicId,
        recipient: patientEmail,
        channel: 'email',
        title: emailTitle,
        message: dashboardMessage,
        emailDetails: { html: emailHtml }
      });
    }

    // 2. Dispatch WhatsApp
    if (patientPhone) {
      await this.send({
        clinicId,
        recipient: patientPhone,
        channel: 'whatsapp',
        title: emailTitle,
        message: dashboardMessage,
        whatsappDetails: {
          templateName: whatsappTemplate,
          parameters: whatsappParams
        }
      });
    }

    // 3. Dispatch Socket.IO / Dashboard System Alert
    await this.send({
      clinicId,
      recipient: 'dashboard',
      channel: 'socket',
      title: emailTitle,
      message: dashboardMessage,
      templateData: { type: 'appointment', payload: { appointment_id: appointment.id, status: eventType } }
    });
  }
};

module.exports = NotificationCenterService;
