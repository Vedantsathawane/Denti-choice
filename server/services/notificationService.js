const { pool } = require('../config/db');
const logger = require('../utils/logger');
const WhatsAppService = require('./whatsappService');
const NotificationTemplates = require('./notificationTemplates');
const SocketService = require('./socketService');
const NotificationModel = require('../models/notificationModel');

const NotificationService = {
  /**
   * Consolidated Send method supporting customized detail payloads, template resolution, and history logging.
   */
  async send({ 
    clinicId, 
    patientId = null, 
    recipient, 
    channel, 
    type = 'system', 
    title, 
    message, 
    data = null, 
    templateData = {}, 
    emailDetails = {}, 
    whatsappDetails = {} 
  }) {
    // Resolve title and message from templates if not explicitly passed
    let titleStr = title || '';
    let messageStr = message || '';

    const payloadData = data || templateData || {};

    if (!titleStr || !messageStr) {
      try {
        const { subject } = NotificationTemplates.getEmailTemplate(type, payloadData);
        const { templateName } = NotificationTemplates.getWhatsAppParams(type, payloadData);
        titleStr = subject || templateName || 'System Alert';
        messageStr = (payloadData && payloadData.message) || `Notification trigger: ${type}`;
      } catch (tmplErr) {
        titleStr = title || 'System Notification';
        messageStr = message || `Alert of type: ${type}`;
      }
    }

    // 1. Log pending entry in notification_history
    let historyId = null;
    try {
      const [res] = await pool.query(
        `INSERT INTO notification_history (clinic_id, patient_id, recipient, channel, type, title, message, status, sent_time) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
        [clinicId, patientId, recipient || 'system', channel, type, titleStr, messageStr]
      );
      historyId = res.insertId;
    } catch (err) {
      logger.error('Failed to log pending notification:', err.message);
    }

    let responseData = null;
    let finalStatus = 'failed';

    try {
      // 2. Dispatch depending on the chosen channel
      if (channel === 'email') {
        const { subject, html } = NotificationTemplates.getEmailTemplate(type, payloadData);
        const emailHtml = emailDetails.html || html;
        const emailSubject = emailDetails.subject || titleStr || subject;

        // Resolve clinic-specific SMTP config
        let settings = {};
        try {
          const [rows] = await pool.query(
            'SELECT setting_key, setting_value FROM clinic_settings WHERE clinic_id = ?',
            [clinicId]
          );
          const settingsMap = {};
          rows.forEach(r => {
            settingsMap[r.setting_key] = r.setting_value;
          });
          settings = {
            smtp_host: settingsMap.smtp_host || settingsMap.smtpHost,
            smtp_port: settingsMap.smtp_port || settingsMap.smtpPort,
            smtp_user: settingsMap.smtp_user || settingsMap.smtpUser,
            smtp_pass: settingsMap.smtp_pass || settingsMap.smtpPass,
            clinic_name: settingsMap.clinic_name || settingsMap.clinicName,
            clinic_email: settingsMap.clinic_email || settingsMap.clinicEmail,
            email_provider: settingsMap.email_provider || settingsMap.emailProvider,
            email_api_key: settingsMap.email_api_key || settingsMap.emailApiKey
          };
        } catch (err) {
          logger.error('Failed to load clinic email settings in notification service:', err.message);
        }

        const brevoKey = settings.email_provider === 'brevo' && settings.email_api_key ? settings.email_api_key : process.env.BREVO_API_KEY;
        const resendKey = settings.email_provider === 'resend' && settings.email_api_key ? settings.email_api_key : process.env.RESEND_API_KEY;
        const fromName = settings.clinic_name || process.env.SMTP_FROM_NAME || 'Denti-Choice Notifications';
        let fromEmail = settings.clinic_email || process.env.SMTP_FROM_EMAIL || settings.smtp_user || process.env.SMTP_USER || 'notifications@dentichoice.com';

        if (resendKey && (fromEmail.includes('@gmail.com') || fromEmail.includes('@yahoo.com') || fromEmail.includes('@outlook.com'))) {
          fromEmail = 'onboarding@resend.dev';
        }

        if (brevoKey) {
          const axios = require('axios');
          const info = await axios.post('https://api.brevo.com/v3/smtp/email', {
            sender: { name: fromName, email: fromEmail },
            to: [{ email: recipient }],
            subject: emailSubject,
            htmlContent: emailHtml
          }, {
            headers: {
              'api-key': brevoKey,
              'Content-Type': 'application/json'
            }
          });
          responseData = { messageId: info.data?.messageId || 'brevo-http-send' };
          finalStatus = 'delivered';
        } else if (resendKey) {
          const axios = require('axios');
          const info = await axios.post('https://api.resend.com/emails', {
            from: `"${fromName}" <${fromEmail}>`,
            to: [recipient],
            subject: emailSubject,
            html: emailHtml
          }, {
            headers: {
              'Authorization': `Bearer ${resendKey}`,
              'Content-Type': 'application/json'
            }
          });
          responseData = { messageId: info.data?.id || 'resend-http-send' };
          finalStatus = 'delivered';
        } else {
          // Fallback to standard SMTP
          const { createTransporter } = require('../config/mailer');
          const transporter = createTransporter(settings);
          const info = await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: recipient,
            subject: emailSubject,
            text: messageStr,
            html: emailHtml
          });
          responseData = info;
          finalStatus = 'delivered';
        }
      } 
      else if (channel === 'whatsapp') {
        const { templateName, parameters } = NotificationTemplates.getWhatsAppParams(type, payloadData);
        
        const wTemplate = whatsappDetails.templateName || templateName;
        const wParams = whatsappDetails.parameters || parameters;

        const res = await WhatsAppService.sendTemplateMessage({
          clinicId,
          recipient,
          templateName: wTemplate,
          parameters: wParams
        });

        responseData = res.response;
        finalStatus = 'delivered';
      } 
      else if (channel === 'socket') {
        // Socket updates for dashboards
        const socketPayload = {
          id: historyId || Date.now(),
          clinic_id: clinicId,
          type: type === 'payment' ? 'payment' : (templateData.type || 'system'),
          title: titleStr,
          message: messageStr,
          data: payloadData || null,
          is_read: 0,
          created_at: new Date()
        };

        // Broadcast to admin/doctor dashboard channel
        SocketService.emitToClinic(clinicId, 'notification:new', socketPayload);
        SocketService.emitNotification(socketPayload);
        responseData = { status: 'broadcasted' };
        finalStatus = 'delivered';
      }
      else if (channel === 'sms' || channel === 'push') {
        logger.info(`[FUTURE READY] Notification channel: ${channel} mock-dispatched to ${recipient}: ${titleStr}`);
        responseData = { status: `mock_${channel}_delivered` };
        finalStatus = 'delivered';
      }

      // 3. Update database logs with delivery status and response data
      if (historyId) {
        await pool.query(
          `UPDATE notification_history 
           SET status = ?, provider_response = ?, delivery_time = NOW() 
           WHERE id = ?`,
          [finalStatus, JSON.stringify(responseData), historyId]
        );
      }
      return { success: true, historyId };
    } 
    catch (sendErr) {
      logger.error(`Notification delivery failed on channel ${channel}:`, sendErr.message);
      
      // Update database logs as failed
      if (historyId) {
        await pool.query(
          `UPDATE notification_history 
           SET status = 'failed', provider_response = ? 
           WHERE id = ?`,
          [JSON.stringify({ error: sendErr.message }), historyId]
        );
      }
      return { success: false, error: sendErr.message, historyId };
    }
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
        patientId: appointment.patient_id,
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
        patientId: appointment.patient_id,
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
      patientId: appointment.patient_id,
      recipient: 'dashboard',
      channel: 'socket',
      title: emailTitle,
      message: dashboardMessage,
      templateData: { type: 'appointment', payload: { appointment_id: appointment.id, status: eventType } }
    });
  },

  /**
   * Trigger multi-channel alerts (Email, WhatsApp, Dashboard Socket) for an event
   */
  async triggerEvent(clinicId, patientId, recipientEmail, recipientPhone, type, data) {
    try {
      if (recipientEmail) {
        this.send({
          clinicId,
          patientId,
          recipient: recipientEmail,
          channel: 'email',
          type,
          data
        }).catch(err => logger.error('Async email notification failed:', err.message));
      }

      if (recipientPhone) {
        this.send({
          clinicId,
          patientId,
          recipient: recipientPhone,
          channel: 'whatsapp',
          type,
          data
        }).catch(err => logger.error('Async whatsapp notification failed:', err.message));
      }

      this.send({
        clinicId,
        patientId,
        recipient: 'dashboard',
        channel: 'socket',
        type,
        data
      }).catch(err => logger.error('Async socket broadcast failed:', err.message));

    } catch (err) {
      logger.error('Error triggering event notification suite:', err.message);
    }
  },

  /**
   * Retry a failed notification log record
   */
  async retryFailedNotification(id) {
    const [rows] = await pool.query('SELECT * FROM notification_history WHERE id = ?', [id]);
    if (rows.length === 0) throw new Error('Notification log record not found');
    const log = rows[0];

    const [clinics] = await pool.query('SELECT name FROM clinics WHERE id = ?', [log.clinic_id]);
    const clinicName = clinics.length > 0 ? clinics[0].name : 'Denti-Choice Clinic';

    const mockData = {
      patient_name: 'Valued Patient',
      clinic_name: clinicName,
      doctor_name: 'Dental Specialist',
      service_name: 'Scheduled Treatment',
      appointment_date: 'Scheduled Date',
      appointment_time: 'Scheduled Time',
      invoice_number: `INV-RETRY-${id}`,
      amount: 100,
      gst_amount: 18,
      transaction_id: 'TXN-RETRY',
      message: log.title || 'Resending failed alert notification.'
    };

    logger.info(`Retrying failed notification ID #${id}...`);
    
    const result = await this.send({
      clinicId: log.clinic_id,
      patientId: log.patient_id,
      recipient: log.recipient,
      channel: log.channel,
      type: log.type,
      data: mockData
    });

    if (result.success) {
      await pool.query("UPDATE notification_history SET status = 'retry_success' WHERE id = ?", [id]);
    }

    return result;
  },

  async create(clinicId, type, title, message, data = null) {
    try {
      const id = await NotificationModel.create({ clinic_id: clinicId, type, title, message, data });
      const notification = { id, clinic_id: clinicId, type, title, message, data, is_read: 0, created_at: new Date() };
      SocketService.emitNotification(notification);
      return id;
    } catch (err) {
      logger.error('Failed to create in-app notification:', err.message);
    }
  },

  async appointmentBooked(appointment) {
    const clinicId = appointment.clinic_id || 1;
    return this.create(
      clinicId,
      'appointment',
      'New Appointment Booked',
      `${appointment.patient_name} booked an appointment with Dr. ${appointment.doctor_name} on ${appointment.appointment_date}`,
      { appointment_id: appointment.id }
    );
  },

  async appointmentStatusChanged(appointment, newStatus) {
    const clinicId = appointment.clinic_id || 1;
    return this.create(
      clinicId,
      'appointment',
      `Appointment ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
      `Appointment #APT-${String(appointment.id).padStart(5, '0')} for ${appointment.patient_name} has been ${newStatus}`,
      { appointment_id: appointment.id, status: newStatus }
    );
  },

  async newContactMessage(contact) {
    const clinicId = contact.clinic_id || 1;
    return this.create(
      clinicId,
      'message',
      'New Contact Message',
      `New message from ${contact.name}: ${contact.subject || 'No subject'}`,
      { contact_id: contact.id }
    );
  }
};

module.exports = NotificationService;
