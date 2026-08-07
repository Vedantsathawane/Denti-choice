const crypto = require('crypto');
const { pool } = require('../../config/db');
const whatsappService = require('../services/whatsappService');
const whatsappBookingAgent = require('../services/whatsappBookingAgent');
const SocketService = require('../../services/socketService');
const logger = require('../../utils/logger');
const { success, error } = require('../../utils/apiResponse');

const whatsappController = {
  /**
   * Meta Handshake Webhook Verification (GET)
   */
  async verifyWebhook(req, res) {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      if (mode && token) {
        // Resolve verify token from environment (or check if matching configured clinic verify token)
        const localVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'dentichoice_token';
        if (mode === 'subscribe' && token === localVerifyToken) {
          logger.info('✅ WhatsApp Webhook verified by Meta handshake.');
          return res.status(200).send(challenge);
        }
      }
      return res.status(403).json({ success: false, message: 'Forbidden' });
    } catch (err) {
      logger.error('WhatsApp verify webhook error:', err.message);
      return res.status(500).send('Internal Error');
    }
  },

  /**
   * Process Incoming WhatsApp Webhook Events (POST)
   */
  async handleIncomingWebhook(req, res) {
    try {
      const body = req.body;
      const signature = req.headers['x-hub-signature-256'];

      // Webhook payload audit logging
      await pool.query(
        'INSERT INTO whatsapp_webhooks (event_type, payload) VALUES (?, ?)',
        [body.object || 'unknown', JSON.stringify(body)]
      );

      // Validate webhook structure
      if (body.object && body.entry && body.entry[0].changes && body.entry[0].changes[0].value) {
        const val = body.entry[0].changes[0].value;
        
        // 1. Resolve tenant clinic mapping by Meta display_phone_number
        let clinicId = 1; // Fallback default
        const displayPhone = val.metadata?.display_phone_number;
        if (displayPhone) {
          const cleanedDisplayPhone = displayPhone.replace(/\D/g, '');
          const [acc] = await pool.query(
            `SELECT clinic_id FROM whatsapp_accounts 
             WHERE phone_number_id = ? OR REPLACE(display_name, '+', '') = ?`,
            [cleanedDisplayPhone, cleanedDisplayPhone]
          );
          if (acc.length > 0) {
            clinicId = acc[0].clinic_id;
          }
        }

        // 2. Handle Status Webhook (delivered, read, failed)
        if (val.statuses && val.statuses.length > 0) {
          const statusObj = val.statuses[0];
          const messageId = statusObj.id;
          const status = statusObj.status; // sent, delivered, read, failed
          
          await pool.query(
            'UPDATE whatsapp_messages SET status = ? WHERE message_id = ?',
            [status, messageId]
          );

          // Broadcast status change to clinic dashboard
          SocketService.emitToClinic(clinicId, 'whatsapp:status_updated', { messageId, status });
          return res.status(200).send('EVENT_RECEIVED');
        }

        // 3. Handle Incoming Message Webhook
        if (val.messages && val.messages.length > 0) {
          const msgVal = val.messages[0];
          const fromPhone = msgVal.from;
          const profileName = val.contacts?.[0]?.profile?.name || 'Patient';

          let messageText = '';
          if (msgVal.type === 'text') {
            messageText = msgVal.text?.body || '';
          } else if (msgVal.type === 'interactive') {
            const interactive = msgVal.interactive;
            messageText = interactive.button_reply?.title || interactive.list_reply?.title || '';
          } else if (msgVal.type === 'button') {
            messageText = msgVal.button?.text || '';
          } else if (msgVal.type === 'location' && msgVal.location) {
            messageText = `[Location Shared - Lat: ${msgVal.location.latitude}, Lng: ${msgVal.location.longitude}]`;
          }

          if (messageText) {
            // Log inbound message in history ledger
            await whatsappService.logMessage({
              clinicId,
              phoneNumber: fromPhone,
              direction: 'inbound',
              message_text: messageText,
              status: 'delivered',
              message_id: msgVal.id
            });

            // Emit to Dashboard socket real-time update
            const livePayload = {
              clinic_id: clinicId,
              phone_number: fromPhone,
              direction: 'inbound',
              message_text: messageText,
              status: 'delivered',
              profileName,
              created_at: new Date()
            };
            SocketService.emitToClinic(clinicId, 'whatsapp:message_received', livePayload);

            // Execute virtual receptionist booking agent flow
            const agentReply = await whatsappBookingAgent.processMessage({
              clinicId,
              fromPhone,
              messageText
            });

            // Send chatbot reply back to patient
            await whatsappService.sendTextMessage({
              clinicId,
              recipient: fromPhone,
              text: agentReply
            });
          }
        }
      }

      return res.status(200).send('EVENT_RECEIVED');
    } catch (err) {
      logger.error('Error handling incoming WhatsApp webhook:', err.message);
      return res.status(200).send('EVENT_RECEIVED'); // Always reply 200 to Meta to avoid retries
    }
  },

  /**
   * Get clinic credentials/connection status
   */
  async getConnectionStatus(req, res, next) {
    try {
      const clinicId = req.user.clinic_id || 1;
      const creds = await whatsappService.getCredentials(clinicId);

      const [rows] = await pool.query('SELECT * FROM whatsapp_accounts WHERE clinic_id = ?', [clinicId]);
      const account = rows[0] || null;

      const stats = await whatsappService.getDeliveryStats(clinicId);

      return success(res, {
        connected: !!account,
        phoneId: creds.phoneId,
        useSandbox: creds.useSandbox,
        webhookStatus: account?.webhook_status || 'inactive',
        apiStatus: account?.api_status || 'inactive',
        displayName: account?.display_name || 'Not Configured',
        stats
      });
    } catch (err) { next(err); }
  },

  /**
   * Save clinic WhatsApp account connection settings
   */
  async saveConnectionSettings(req, res, next) {
    try {
      const clinicId = req.user.clinic_id || 1;
      const { phone_number_id, access_token, verify_token, webhook_secret, display_name, api_status } = req.body;

      const [existing] = await pool.query('SELECT id FROM whatsapp_accounts WHERE clinic_id = ?', [clinicId]);
      
      if (existing.length > 0) {
        await pool.query(
          `UPDATE whatsapp_accounts 
           SET phone_number_id = ?, access_token = ?, verify_token = ?, webhook_secret = ?, display_name = ?, api_status = ?, webhook_status = 'active'
           WHERE clinic_id = ?`,
          [phone_number_id, access_token, verify_token || 'dentichoice_token', webhook_secret || null, display_name || null, api_status || 'sandbox', clinicId]
        );
      } else {
        await pool.query(
          `INSERT INTO whatsapp_accounts (clinic_id, phone_number_id, access_token, verify_token, webhook_secret, display_name, api_status, webhook_status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
          [clinicId, phone_number_id, access_token, verify_token || 'dentichoice_token', webhook_secret || null, display_name || null, api_status || 'sandbox']
        );
      }

      // Also sync into main clinic_settings
      await pool.query(
        `INSERT INTO clinic_settings (clinic_id, setting_key, setting_value) 
         VALUES (?, 'whatsapp_phone_number_id', ?), (?, 'whatsapp_access_token', ?), (?, 'whatsapp_use_sandbox', ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [clinicId, phone_number_id, clinicId, access_token, clinicId, String(api_status === 'sandbox')]
      );

      return success(res, null, 'WhatsApp credentials updated successfully');
    } catch (err) { next(err); }
  },

  /**
   * Get WhatsApp conversation logs
   */
  async getLogs(req, res, next) {
    try {
      const clinicId = req.user.clinic_id || 1;
      const logs = await whatsappService.getLogs(clinicId, 50);
      return success(res, logs);
    } catch (err) { next(err); }
  },

  /**
   * Send Manual Message from Admin Dashboard
   */
  async sendManualMessage(req, res, next) {
    try {
      const clinicId = req.user.clinic_id || 1;
      const { recipient, text } = req.body;

      if (!recipient || !text) {
        return error(res, 'Recipient phone and text are required', 400);
      }

      const result = await whatsappService.sendTextMessage({ clinicId, recipient, text });
      return success(res, result, 'Message dispatched successfully');
    } catch (err) { next(err); }
  },

  /**
   * Fetch templates manager configuration
   */
  async getTemplates(req, res, next) {
    try {
      const clinicId = req.user.clinic_id || 1;
      const [rows] = await pool.query('SELECT * FROM whatsapp_templates WHERE clinic_id = ?', [clinicId]);
      return success(res, rows);
    } catch (err) { next(err); }
  },

  /**
   * Update/Create Template details
   */
  async saveTemplate(req, res, next) {
    try {
      const clinicId = req.user.clinic_id || 1;
      const { template_name, category, language_code, body_text } = req.body;

      if (!template_name || !body_text) {
        return error(res, 'Template name and body text are required', 400);
      }

      await pool.query(
        `INSERT INTO whatsapp_templates (clinic_id, template_name, category, language_code, body_text, status) 
         VALUES (?, ?, ?, ?, ?, 'approved') 
         ON DUPLICATE KEY UPDATE category = VALUES(category), language_code = VALUES(language_code), body_text = VALUES(body_text)`,
        [clinicId, template_name, category || 'utility', language_code || 'en_US', body_text]
      );

      return success(res, null, 'WhatsApp template configured successfully');
    } catch (err) { next(err); }
  },

  /**
   * Broadcast Template Alert to patient contacts list
   */
  async broadcastTemplate(req, res, next) {
    try {
      const clinicId = req.user.clinic_id || 1;
      const { templateName, recipients, parameters } = req.body;

      if (!templateName || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return error(res, 'Template name and recipients array are required', 400);
      }

      const queuedIds = [];
      for (const phone of recipients) {
        const id = await whatsappService.queueOutgoingMessage({
          clinicId,
          recipient: phone,
          text: null,
          templateName,
          parameters: parameters || []
        });
        queuedIds.push(id);
      }

      return success(res, { queuedIds }, `Enqueued ${recipients.length} broadcast templates in retry queue.`);
    } catch (err) { next(err); }
  },

  /**
   * Fetch background queue items
   */
  async getQueue(req, res, next) {
    try {
      const clinicId = req.user.clinic_id || 1;
      const [rows] = await pool.query(
        `SELECT q.id as queue_id, q.retry_count, q.status as queue_status, q.run_at, m.* 
         FROM whatsapp_queue q
         JOIN whatsapp_messages m ON q.message_id = m.id
         WHERE q.clinic_id = ? 
         ORDER BY q.id DESC 
         LIMIT 50`,
        [clinicId]
      );
      return success(res, rows);
    } catch (err) { next(err); }
  },

  /**
   * Run background queue process immediately
   */
  async triggerQueueProcess(req, res, next) {
    try {
      await whatsappService.processQueue();
      return success(res, null, 'Background queue processing triggered successfully');
    } catch (err) { next(err); }
  }
};

module.exports = whatsappController;
