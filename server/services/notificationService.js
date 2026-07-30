const { pool } = require('../config/db');
const logger = require('../utils/logger');
const WhatsAppService = require('./whatsappService');
const NotificationTemplates = require('./notificationTemplates');
const SocketService = require('./socketService');

const NotificationService = {
  /**
   * Send notification across a specified channel and log detailed audit history
   */
  async send({ clinicId, patientId = null, recipient, channel, type, title, message, data }) {
    // Resolve title and message from templates if not explicitly passed
    let titleStr = title || '';
    let messageStr = message || '';

    if (!titleStr || !messageStr) {
      try {
        const { subject } = NotificationTemplates.getEmailTemplate(type, data || {});
        const { templateName } = NotificationTemplates.getWhatsAppParams(type, data || {});
        titleStr = subject || templateName || 'System Alert';
        messageStr = (data && data.message) || `Notification trigger: ${type}`;
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
      // 2. Dispatch
      if (channel === 'email') {
        const { subject, html } = NotificationTemplates.getEmailTemplate(type, data);

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
            clinic_email: settingsMap.clinic_email || settingsMap.clinicEmail
          };
        } catch (err) {
          logger.error('Failed to load clinic email settings in notification service:', err.message);
        }

        const brevoKey = process.env.BREVO_API_KEY;
        const resendKey = process.env.RESEND_API_KEY;
        const fromName = settings.clinic_name || process.env.SMTP_FROM_NAME || 'Denti-Choice Notifications';
        const fromEmail = settings.clinic_email || process.env.SMTP_FROM_EMAIL || settings.smtp_user || process.env.SMTP_USER || 'notifications@dentichoice.com';

        if (brevoKey) {
          const axios = require('axios');
          const info = await axios.post('https://api.brevo.com/v3/smtp/email', {
            sender: { name: fromName, email: fromEmail },
            to: [{ email: recipient }],
            subject: subject,
            htmlContent: html
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
            subject: subject,
            html: html
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
            subject: subject,
            text: data.message || subject,
            html: html
          });
          responseData = info;
          finalStatus = 'delivered';
        }
      } 
      else if (channel === 'whatsapp') {
        const { templateName, parameters } = NotificationTemplates.getWhatsAppParams(type, data);
        
        const res = await WhatsAppService.sendTemplateMessage({
          clinicId,
          recipient,
          templateName,
          parameters
        });

        responseData = res.response;
        finalStatus = 'delivered';
      } 
      else if (channel === 'socket') {
        // Socket updates for dashboards
        const socketPayload = {
          type: type === 'payment' ? 'payment' : 'appointment',
          payload: { ...data, timestamp: new Date() }
        };

        // Broadcast to admin/doctor dashboard channel
        SocketService.emitToClinic(clinicId, 'notification:new', socketPayload);
        responseData = { status: 'broadcasted' };
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
   * Trigger multi-channel alerts (Email, WhatsApp, Dashboard Socket) for an event
   */
  async triggerEvent(clinicId, patientId, recipientEmail, recipientPhone, type, data) {
    // Wrap triggers in try-catch to guarantee notification failures never block business workflows
    try {
      // 1. Email notification
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

      // 2. WhatsApp notification
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

      // 3. Socket Dashboard update
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

    // Read associated clinic name, doctor name details to rebuild data
    // Fetch details dynamically based on recipient details or general parameters
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
      // Clear original failed status record
      await pool.query("UPDATE notification_history SET status = 'retry_success' WHERE id = ?", [id]);
    }

    return result;
  }
};

module.exports = NotificationService;
