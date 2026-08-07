const axios = require('axios');
const { pool } = require('../../config/db');
const logger = require('../../utils/logger');

const whatsappService = {
  /**
   * Resolve clinic-specific WhatsApp account configurations.
   */
  async getCredentials(clinicId) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM whatsapp_accounts WHERE clinic_id = ? AND is_active = 1',
        [clinicId]
      );
      if (rows.length > 0) {
        const acc = rows[0];
        return {
          token: acc.access_token,
          phoneId: acc.phone_number_id,
          verifyToken: acc.verify_token,
          webhookSecret: acc.webhook_secret,
          useSandbox: String(acc.api_status) === 'sandbox' || !acc.access_token,
          apiStatus: acc.api_status
        };
      }
    } catch (err) {
      logger.error('Failed to query whatsapp credentials from DB:', err.message);
    }

    // Global settings fallback if no custom tenant account configured
    try {
      const [settings] = await pool.query(
        'SELECT setting_value FROM clinic_settings WHERE clinic_id = ? AND setting_key IN (?, ?, ?)',
        [clinicId, 'whatsapp_access_token', 'whatsapp_phone_number_id', 'whatsapp_use_sandbox']
      );
      // fallback mapping
    } catch (e) {}

    return {
      token: process.env.WHATSAPP_ACCESS_TOKEN || null,
      phoneId: process.env.WHATSAPP_PHONE_NUMBER_ID || null,
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'dentichoice_token',
      webhookSecret: process.env.WHATSAPP_WEBHOOK_SECRET || null,
      useSandbox: (process.env.WHATSAPP_USE_SANDBOX || 'true') === 'true',
      apiStatus: 'sandbox'
    };
  },

  /**
   * Log conversation in database ledger
   */
  async logMessage({ clinicId, phoneNumber, direction, messageText, status = 'sent', errorMessage = null, messageId = null }) {
    try {
      const [res] = await pool.query(
        `INSERT INTO whatsapp_messages (clinic_id, phone_number, direction, message_text, status, error_message, message_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [clinicId, phoneNumber, direction, messageText, status, errorMessage, messageId]
      );
      return res.insertId;
    } catch (err) {
      logger.error('Failed to log WhatsApp message in database:', err.message);
      return null;
    }
  },

  /**
   * Queue outgoing message to send in the background
   */
  async queueOutgoingMessage({ clinicId, recipient, text, templateName = null, parameters = [] }) {
    const cleanPhone = recipient.replace(/\D/g, '');
    const messageText = templateName 
      ? `[Template: ${templateName}] Params: ${JSON.stringify(parameters)}` 
      : text;

    const msgId = await this.logMessage({
      clinicId,
      phoneNumber: cleanPhone,
      direction: 'outbound',
      messageText: messageText,
      status: 'queued'
    });

    if (msgId) {
      await pool.query(
        `INSERT INTO whatsapp_queue (clinic_id, message_id, status) 
         VALUES (?, ?, 'pending')`,
        [clinicId, msgId]
      );
    }
    return msgId;
  },

  /**
   * Send WhatsApp Text Message (Graph API or Sandbox mock)
   */
  async sendTextMessage({ clinicId, recipient, text }) {
    const cleanPhone = recipient.replace(/\D/g, '');
    const creds = await this.getCredentials(clinicId);

    const payload = {
      messaging_product: 'whatsapp',
      to: cleanPhone,
      type: 'text',
      text: { body: text }
    };

    if (creds.useSandbox || !creds.token || !creds.phoneId) {
      const mockMsgId = `wamid.mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      logger.info(`[WHATSAPP SANDBOX OUTBOUND] Text sent to ${cleanPhone}: "${text}"`);
      await this.logMessage({
        clinicId,
        phoneNumber: cleanPhone,
        direction: 'outbound',
        messageText: text,
        status: 'sent',
        message_id: mockMsgId
      });
      return { success: true, messageId: mockMsgId };
    }

    try {
      const url = `https://graph.facebook.com/v19.0/${creds.phoneId}/messages`;
      const res = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${creds.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const resData = res.data;
      const metaMsgId = resData.messages?.[0]?.id || null;

      await this.logMessage({
        clinicId,
        phoneNumber: cleanPhone,
        direction: 'outbound',
        messageText: text,
        status: 'sent',
        message_id: metaMsgId
      });

      return { success: true, messageId: metaMsgId };
    } catch (err) {
      const errResponse = err.response ? err.response.data : { message: err.message };
      logger.error('WhatsApp send text failed:', JSON.stringify(errResponse));
      await this.logMessage({
        clinicId,
        phoneNumber: cleanPhone,
        direction: 'outbound',
        messageText: text,
        status: 'failed',
        errorMessage: errResponse.error?.message || err.message
      });
      throw new Error(errResponse.error?.message || err.message);
    }
  },

  /**
   * Send WhatsApp Template Message (Graph API or Sandbox mock)
   */
  async sendTemplateMessage({ clinicId, recipient, templateName, languageCode = 'en_US', parameters = [] }) {
    const cleanPhone = recipient.replace(/\D/g, '');
    const creds = await this.getCredentials(clinicId);

    const formattedParams = parameters.map(p => ({
      type: 'text',
      text: p.text || String(p)
    }));

    const payload = {
      messaging_product: 'whatsapp',
      to: cleanPhone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components: formattedParams.length > 0 ? [{ type: 'body', parameters: formattedParams }] : []
      }
    };

    const messageText = `[Template: ${templateName}] Components: ${JSON.stringify(parameters)}`;

    if (creds.useSandbox || !creds.token || !creds.phoneId) {
      const mockMsgId = `wamid.mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      logger.info(`[WHATSAPP SANDBOX OUTBOUND TEMPLATE] "${templateName}" sent to ${cleanPhone}`);
      await this.logMessage({
        clinicId,
        phoneNumber: cleanPhone,
        direction: 'outbound',
        messageText: messageText,
        status: 'sent',
        message_id: mockMsgId
      });
      return { success: true, messageId: mockMsgId };
    }

    try {
      const url = `https://graph.facebook.com/v19.0/${creds.phoneId}/messages`;
      const res = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${creds.token}`,
          'Content-Type': 'application/json'
        }
      });
      const resData = res.data;
      const metaMsgId = resData.messages?.[0]?.id || null;

      await this.logMessage({
        clinicId,
        phoneNumber: cleanPhone,
        direction: 'outbound',
        messageText: messageText,
        status: 'sent',
        message_id: metaMsgId
      });

      return { success: true, messageId: metaMsgId };
    } catch (err) {
      const errResponse = err.response ? err.response.data : { message: err.message };
      logger.error('WhatsApp send template failed:', JSON.stringify(errResponse));
      await this.logMessage({
        clinicId,
        phoneNumber: cleanPhone,
        direction: 'outbound',
        messageText: messageText,
        status: 'failed',
        errorMessage: errResponse.error?.message || err.message
      });
      throw new Error(errResponse.error?.message || err.message);
    }
  },

  /**
   * Process background queue - scans pending items, resolves type, dispatches, and updates states
   */
  async processQueue() {
    try {
      // Find pending items due
      const [queueItems] = await pool.query(
        `SELECT q.id as queue_id, q.retry_count, m.* 
         FROM whatsapp_queue q
         JOIN whatsapp_messages m ON q.message_id = m.id
         WHERE q.status IN ('pending', 'failed') AND q.run_at <= NOW() AND q.retry_count < 3
         LIMIT 20`
      );

      for (const item of queueItems) {
        await pool.query('UPDATE whatsapp_queue SET status = ? WHERE id = ?', ['processing', item.queue_id]);
        
        try {
          let sendResult;
          // Check if it is a template log format: [Template: name] Params: JSON
          if (item.message_text.startsWith('[Template:')) {
            const match = item.message_text.match(/\[Template:\s*([^\]]+)\]/);
            const templateName = match ? match[1] : 'appointment_reminder';
            
            // Extract components parameters JSON
            let params = [];
            try {
              const compMatch = item.message_text.match(/Components:\s*(.+)$/) || item.message_text.match(/Params:\s*(.+)$/);
              if (compMatch) params = JSON.parse(compMatch[1]);
            } catch (e) {}

            sendResult = await this.sendTemplateMessage({
              clinicId: item.clinic_id,
              recipient: item.phone_number,
              templateName,
              parameters: params
            });
          } else {
            sendResult = await this.sendTextMessage({
              clinicId: item.clinic_id,
              recipient: item.phone_number,
              text: item.message_text
            });
          }

          if (sendResult.success) {
            await pool.query(
              'UPDATE whatsapp_queue SET status = ? WHERE id = ?',
              ['completed', item.queue_id]
            );
            await pool.query(
              'UPDATE whatsapp_messages SET status = ?, message_id = ? WHERE id = ?',
              ['sent', sendResult.messageId, item.id]
            );
          }
        } catch (err) {
          logger.error(`Failed background queue send for queue ID #${item.queue_id}:`, err.message);
          const nextRetry = item.retry_count + 1;
          const status = nextRetry >= 3 ? 'dead_letter' : 'failed';
          
          await pool.query(
            `UPDATE whatsapp_queue 
             SET status = ?, retry_count = ?, run_at = DATE_ADD(NOW(), INTERVAL ? MINUTE) 
             WHERE id = ?`,
            [status, nextRetry, nextRetry * 5, item.queue_id]
          );
          
          await pool.query(
            'UPDATE whatsapp_messages SET status = ?, error_message = ? WHERE id = ?',
            ['failed', err.message, item.id]
          );
        }
      }
    } catch (error) {
      logger.error('WhatsApp background queue processing error:', error.message);
    }
  },

  /**
   * Fetch WhatsApp logs for a specific clinic
   */
  async getLogs(clinicId, limit = 100) {
    const [rows] = await pool.query(
      `SELECT * FROM whatsapp_messages 
       WHERE clinic_id = ? 
       ORDER BY id DESC 
       LIMIT ?`,
      [clinicId, parseInt(limit)]
    );
    return rows;
  },

  /**
   * Fetch WhatsApp delivery statistics
   */
  async getDeliveryStats(clinicId) {
    const [rows] = await pool.query(
      `SELECT status, COUNT(*) as count 
       FROM whatsapp_messages 
       WHERE clinic_id = ? AND direction = 'outbound'
       GROUP BY status`,
      [clinicId]
    );

    let sent = 0;
    let delivered = 0;
    let read = 0;
    let failed = 0;

    rows.forEach(r => {
      if (r.status === 'sent') sent += r.count;
      else if (r.status === 'delivered') delivered += r.count;
      else if (r.status === 'read') read += r.count;
      else if (r.status === 'failed') failed += r.count;
    });

    const total = sent + delivered + read + failed;
    const successRate = total > 0 ? parseFloat((((sent + delivered + read) / total) * 100).toFixed(1)) : 100.0;

    return {
      total,
      sent,
      delivered,
      read,
      failed,
      successRatePercent: successRate
    };
  }
};

module.exports = whatsappService;
