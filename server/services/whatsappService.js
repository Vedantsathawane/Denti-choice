const axios = require('axios');
const crypto = require('crypto');
const { pool } = require('../config/db');
const logger = require('../utils/logger');
const SettingModel = require('../models/settingModel');

const WhatsAppService = {
  /**
   * Resolve credentials
   */
  async getCredentials(clinicId) {
    // Check clinic-specific settings first
    let clinicSettings = {};
    if (clinicId) {
      try {
        const ClinicSettingModel = require('../models/clinic/clinicSettingModel');
        clinicSettings = await ClinicSettingModel.getSettings(clinicId);
      } catch (err) {
        logger.error('Failed to fetch clinic settings for WhatsApp:', err.message);
      }
    }

    // Check database settings first, fallback to env variables
    const token = clinicSettings.whatsapp_access_token || await SettingModel.get('whatsapp_access_token') || process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = clinicSettings.whatsapp_phone_number_id || await SettingModel.get('whatsapp_phone_number_id') || process.env.WHATSAPP_PHONE_NUMBER_ID;
    const verifyToken = clinicSettings.whatsapp_verify_token || await SettingModel.get('whatsapp_verify_token') || process.env.WHATSAPP_VERIFY_TOKEN;
    const apiVersion = clinicSettings.whatsapp_api_version || await SettingModel.get('whatsapp_api_version') || process.env.WHATSAPP_API_VERSION || 'v18.0';
    const webhookSecret = clinicSettings.whatsapp_webhook_secret || await SettingModel.get('whatsapp_webhook_secret') || process.env.WHATSAPP_WEBHOOK_SECRET;
    const useSandbox = (clinicSettings.whatsapp_use_sandbox !== undefined && clinicSettings.whatsapp_use_sandbox !== null)
      ? String(clinicSettings.whatsapp_use_sandbox) === 'true'
      : (await SettingModel.get('whatsapp_use_sandbox') || process.env.WHATSAPP_USE_SANDBOX || 'true') === 'true';

    return { token, phoneId, verifyToken, apiVersion, webhookSecret, useSandbox };
  },

  /**
   * Send WhatsApp Template Message using Meta Cloud API
   */
  async sendTemplateMessage({ clinicId, recipient, templateName, languageCode = 'en_US', parameters = [] }) {
    const creds = await this.getCredentials(clinicId);
    
    // Format recipient phone number to E.164 (remove non-digits)
    const formattedRecipient = recipient.replace(/\D/g, '');

    // Format Meta parameter structures
    const formattedComponents = parameters.map(p => {
      if (p.type === 'text') return { type: 'text', text: p.text };
      return p;
    });

    const payload = {
      messaging_product: 'whatsapp',
      to: formattedRecipient,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components: formattedComponents.length > 0 ? [{ type: 'body', parameters: formattedComponents }] : []
      }
    };

    // Database Outbound log mapping
    const dbLog = async (dir, body, response) => {
      try {
        await pool.query(
          `INSERT INTO whatsapp_conversations (clinic_id, phone_number, message_direction, message_body, provider_response) 
           VALUES (?, ?, ?, ?, ?)`,
          [clinicId, formattedRecipient, dir, body, JSON.stringify(response)]
        );
      } catch (err) {
        logger.error('Failed to log WhatsApp conversation:', err.message);
      }
    };

    // If sandbox mode is ON or no token is provided, log sandbox mock response
    if (creds.useSandbox || !creds.token || !creds.phoneId) {
      const mockResponse = {
        messaging_product: 'whatsapp',
        contacts: [{ input: formattedRecipient, wa_id: formattedRecipient }],
        messages: [{ id: `wamid.mock_${Date.now()}_${Math.random().toString(36).substring(7)}` }]
      };
      
      logger.info(`[WHATSAPP SANDBOX] Outbound Template "${templateName}" sent to ${formattedRecipient}`);
      await dbLog('outbound', `Template: ${templateName}. Params: ${JSON.stringify(parameters)}`, mockResponse);
      return { success: true, response: mockResponse };
    }

    // Call Meta Graph API
    try {
      const url = `https://graph.facebook.com/${creds.apiVersion}/${creds.phoneId}/messages`;
      const res = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${creds.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      await dbLog('outbound', `Template: ${templateName}. Params: ${JSON.stringify(parameters)}`, res.data);
      return { success: true, response: res.data };
    } catch (err) {
      const errResponse = err.response ? err.response.data : { message: err.message };
      logger.error('Meta WhatsApp Cloud API error:', JSON.stringify(errResponse));
      await dbLog('outbound', `FAILED Template: ${templateName}`, errResponse);
      throw new Error(errResponse.error?.message || err.message);
    }
  },

  /**
   * Verify Webhook challenge token
   */
  async verifyWebhook(query) {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    const creds = await this.getCredentials();
    if (mode && token) {
      if (mode === 'subscribe' && token === creds.verifyToken) {
        logger.info('WhatsApp Webhook successfully verified.');
        return challenge;
      }
    }
    throw new Error('Verification token mismatch');
  },

  /**
   * Validate SHA256 signature payload
   */
  validateSignature(req) {
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) return false;

    const creds = this.getCredentials(); // Sync fallback or async resolving logic
    // Usually the secret key is webhook secret parameter
    const secret = process.env.WHATSAPP_WEBHOOK_SECRET || 'fallback_secret';
    
    const elements = signature.split('=');
    const signatureHash = elements[1];

    const expectedHash = crypto
      .createHmac('sha256', secret)
      .update(req.rawBody || JSON.stringify(req.body))
      .digest('hex');

    return signatureHash === expectedHash;
  },

  /**
   * Process incoming Webhook Payload
   */
  async handleIncomingWebhook(payload) {
    const entry = payload.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value || !value.messages) return { status: 'ignored' };

    const message = value.messages[0];
    const contact = value.contacts?.[0];
    const fromPhone = message.from;
    const bodyText = message.text?.body || message.button?.text || '';

    // Search clinic resolved by phone metadata, default to ID 1
    const [clinics] = await pool.query('SELECT id FROM clinics WHERE id = 1');
    const clinicId = clinics.length > 0 ? clinics[0].id : 1;

    try {
      // 1. Log inbound message in SQL
      await pool.query(
        `INSERT INTO whatsapp_conversations (clinic_id, phone_number, message_direction, message_body, provider_response) 
         VALUES (?, ?, 'inbound', ?, ?)`,
        [clinicId, fromPhone, bodyText, JSON.stringify(payload)]
      );
      
      logger.info(`[WHATSAPP INBOUND] Message from ${fromPhone}: "${bodyText}"`);
      return { status: 'processed', from: fromPhone, body: bodyText, clinicId };
    } catch (err) {
      logger.error('Failed to process incoming webhook message:', err.message);
      throw err;
    }
  }
};

module.exports = WhatsAppService;
