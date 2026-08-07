const { bookingAgent } = require('../services/bookingAgent');
const docAssistantService = require('../services/docAssistantService');
const treatmentService = require('../services/treatmentService');
const dashboardService = require('../services/dashboardService');
const analyticsService = require('../services/analyticsService');
const messagingService = require('../services/messagingService');
const ClinicalRecordModel = require('../../models/clinicalRecordModel');
const whatsappMemory = require('../memory/whatsappMemory');
const axios = require('axios');
const { pool } = require('../../config/db');

const aiController = {
  // 1. AI Booking Chatbot (supports streaming)
  handleBookingChat: async (req, res, next) => {
    try {
      const { messages } = req.body;
      const clinicId = req.clinicId || 1;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ success: false, message: 'Messages array is required.' });
      }

      // Set headers for streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      await bookingAgent.chat({
        clinicId,
        messages,
        onChunk: (chunk) => {
          res.write(chunk);
        },
        onFinish: () => {
          res.end();
        }
      });
    } catch (error) {
      console.error('Chat controller error:', error);
      // Write error chunk and close
      res.write('\n[Error occurred during processing stream]');
      res.end();
    }
  },

  // 2. SOAP Chart Notes Formatter & DB Seeder
  handleSoapChart: async (req, res, next) => {
    try {
      const { appointmentId, rawDictation, pdfUrl, xrayUrl } = req.body;
      const clinicId = req.clinicId || 1;

      if (!appointmentId) {
        return res.status(400).json({ success: false, message: 'appointmentId is required.' });
      }

      const chart = await docAssistantService.generateSoapChart({ 
        clinicId, 
        appointmentId: parseInt(appointmentId), 
        rawDictation, 
        pdfUrl, 
        xrayUrl 
      });
      res.json({ success: true, chart });
    } catch (error) {
      next(error);
    }
  },

  // 2.1 Fetch Clinical Chart by Appointment
  handleGetSoapChart: async (req, res, next) => {
    try {
      const { appointmentId } = req.params;
      const chart = await ClinicalRecordModel.findByAppointmentId(parseInt(appointmentId));
      
      if (!chart) {
        return res.status(404).json({ success: false, message: 'No clinical chart found for this appointment.' });
      }
      
      res.json({ success: true, chart });
    } catch (error) {
      next(error);
    }
  },

  // 2.2 Update/Edit Clinical Chart by Doctor (manual adjustments)
  handleUpdateSoapChart: async (req, res, next) => {
    try {
      const { id } = req.params;
      const success = await ClinicalRecordModel.update(parseInt(id), req.body);
      
      if (!success) {
        return res.status(400).json({ success: false, message: 'Failed to update clinical record, or no changes made.' });
      }
      
      res.json({ success: true, message: 'Clinical record successfully updated.' });
    } catch (error) {
      next(error);
    }
  },

  // 2.3 Upload PDF or X-rays
  handleDoctorUpload: async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
      }

      // Return absolute static file path URL to support SaaS multi-port resolutions
      const filePath = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      res.json({ 
        success: true, 
        filePath, 
        fileName: req.file.originalname,
        message: 'File successfully uploaded.' 
      });
    } catch (error) {
      next(error);
    }
  },

  // 3. AI Treatment Plan Generator
  handleTreatmentPlan: async (req, res, next) => {
    try {
      const { diagnosis, severity, patientPreferences } = req.body;
      const clinicId = req.clinicId || 1;

      if (!diagnosis || !severity) {
        return res.status(400).json({ success: false, message: 'Diagnosis and severity are required.' });
      }

      const plan = await treatmentService.generatePlan({
        clinicId,
        diagnosis,
        severity,
        patientPreferences
      });

      res.json({ success: true, plan });
    } catch (error) {
      next(error);
    }
  },

  // 4. AI Dashboard Assistant (Operational Q&A)
  handleDashboardAsk: async (req, res, next) => {
    try {
      const { question } = req.body;
      const clinicId = req.clinicId || 1;

      if (!question) {
        return res.status(400).json({ success: false, message: 'Question is required.' });
      }

      const answer = await dashboardService.ask({ clinicId, question });
      res.json({ success: true, answer });
    } catch (error) {
      next(error);
    }
  },

  // 5. AI Review Generator
  handleReviewGenerate: async (req, res, next) => {
    try {
      const { patientName, doctorName } = req.body;
      const clinicId = req.clinicId || 1;

      if (!patientName || !doctorName) {
        return res.status(400).json({ success: false, message: 'patientName and doctorName are required.' });
      }

      const message = await messagingService.generateReviewRequest({ clinicId, patientName, doctorName });
      res.json({ success: true, message });
    } catch (error) {
      next(error);
    }
  },

  // 6. AI Email Assistant
  handleEmailGenerate: async (req, res, next) => {
    try {
      const { type, patientName, details } = req.body;
      const clinicId = req.clinicId || 1;

      if (!type || !patientName) {
        return res.status(400).json({ success: false, message: 'Type and patientName are required.' });
      }

      const html = await messagingService.generateEmail({ clinicId, type, patientName, details });
      res.json({ success: true, html });
    } catch (error) {
      next(error);
    }
  },

  // 6.1 AI WhatsApp Assistant Reply Generator
  handleWhatsAppGenerate: async (req, res, next) => {
    try {
      const { type, patientName, details } = req.body;
      const clinicId = req.clinicId || 1;

      if (!type || !patientName) {
        return res.status(400).json({ success: false, message: 'Type and patientName are required.' });
      }

      const messageText = await messagingService.generateWhatsAppReply({ clinicId, type, patientName, details });
      res.json({ success: true, messageText });
    } catch (error) {
      next(error);
    }
  },

  // 7. AI Notification urgencies and sentiments
  handleNotificationAnalyze: async (req, res, next) => {
    try {
      const { contactId, name, message } = req.body;
      const clinicId = req.clinicId || 1;

      if (!name || !message) {
        return res.status(400).json({ success: false, message: 'Name and message are required.' });
      }

      const analysis = await messagingService.analyzeContactMessage({
        clinicId,
        contactId,
        name,
        messageText: message
      });

      res.json({ success: true, analysis });
    } catch (error) {
      next(error);
    }
  },

  // 8. AI Analytics (Revenue and busy day predictions)
  handleAnalyticsPredict: async (req, res, next) => {
    try {
      const clinicId = req.clinicId || 1;
      const predictions = await analyticsService.predict(clinicId);
      res.json({ success: true, predictions });
    } catch (error) {
      next(error);
    }
  },

  // 9. WhatsApp Webhook Verification (GET)
  handleWhatsAppVerify: (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
      const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'dentichoice_token';
      if (mode === 'subscribe' && token === verifyToken) {
        console.log('✅ WhatsApp Webhook verified successfully.');
        return res.status(200).send(challenge);
      }
    }
    res.sendStatus(403);
  },

  // 10. Incoming WhatsApp Message (POST)
  handleWhatsAppMessage: async (req, res, next) => {
    try {
      let clinicId = req.clinicId || 1;
      const body = req.body;

      // Extract clinic matching by WhatsApp phone recipient
      const displayPhone = body.entry?.[0]?.changes?.[0]?.value?.metadata?.display_phone_number;
      if (displayPhone) {
        const cleanedPhone = displayPhone.replace(/\D/g, '');
        const [settings] = await pool.query(
          `SELECT clinic_id FROM clinic_settings 
           WHERE setting_key = 'whatsappPhoneNumber' 
             AND REPLACE(setting_value, '+', '') = ?`,
          [cleanedPhone]
        );
        if (settings.length > 0) {
          clinicId = settings[0].clinic_id;
          console.log(`🎯 Resolved tenant clinicId: ${clinicId} matching phone: ${displayPhone}`);
        }
      }

      // Ensure WhatsApp payload is valid
      if (body.object && body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
        const messageVal = body.entry[0].changes[0].value.messages[0];
        const fromPhone = messageVal.from; // Patient's phone number
        const profileName = body.entry[0].changes[0].value.contacts?.[0]?.profile?.name || 'Patient';

        // Support standard text, interactive buttons, quick replies, or location messages
        let messageText = '';
        if (messageVal.type === 'text') {
          messageText = messageVal.text?.body || '';
        } else if (messageVal.type === 'interactive') {
          const interactive = messageVal.interactive;
          messageText = interactive.button_reply?.title || interactive.list_reply?.title || '';
        } else if (messageVal.type === 'button') {
          messageText = messageVal.button?.text || '';
        } else if (messageVal.type === 'location' && messageVal.location) {
          messageText = `[Location Shared - Latitude: ${messageVal.location.latitude}, Longitude: ${messageVal.location.longitude}]`;
        }

        if (!messageText) {
          return res.status(200).json({ success: true, message: 'Non-compatible message type skipped.' });
        }

        console.log(`💬 WhatsApp Msg Received from ${profileName} (${fromPhone}): "${messageText}"`);

        // Load thread history from memory
        const history = whatsappMemory.getMessages(fromPhone);
        
        // Push user message to memory
        whatsappMemory.addMessage(fromPhone, 'user', messageText);

        // Prepare message list for agent
        const messages = [...history, { role: 'user', content: messageText }];

        let responseText = '';
        
        // Call Booking Agent chat to handle request
        await bookingAgent.chat({
          clinicId,
          messages,
          onChunk: (chunk) => {
            responseText += chunk;
          },
          onFinish: async () => {
            // Push assistant message to memory
            whatsappMemory.addMessage(fromPhone, 'assistant', responseText);

            // Send back using WhatsApp Business Cloud API
            const token = process.env.WHATSAPP_ACCESS_TOKEN;
            const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

            if (token && phoneId) {
              try {
                await axios.post(
                  `https://graph.facebook.com/v19.0/${phoneId}/messages`,
                  {
                    messaging_product: 'whatsapp',
                    to: fromPhone,
                    type: 'text',
                    text: { body: responseText }
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  }
                );
                console.log(`📤 WhatsApp response sent successfully to ${fromPhone}`);
              } catch (apiErr) {
                console.error('WhatsApp Graph API call failed:', apiErr.response?.data || apiErr.message);
              }
            } else {
              // Simulated log for testing/local environment
              console.log(`📤 [Mock WhatsApp API] Sending to ${fromPhone}: "${responseText}"`);
              
              // Notify admins via clinic alerts dashboard
              await pool.query(
                `INSERT INTO notifications (type, title, message, data) 
                 VALUES ('alert', ?, ?, ?)`,
                [
                  `📲 WhatsApp Message from ${profileName}`,
                  `Patient (${fromPhone}): "${messageText}"\nAI Response: "${responseText.substring(0, 100)}..."`,
                  JSON.stringify({ fromPhone, patientName: profileName, clinicId })
                ]
              );
            }
          }
        });
      }

      res.status(200).json({ success: true, message: 'Message received.' });
    } catch (error) {
      console.error('WhatsApp handler error:', error);
      res.status(500).json({ success: false, message: 'Failed to process message.' });
    }
  },

  // 11. Handle Patient History Summary
  handlePatientHistory: async (req, res, next) => {
    try {
      const { patientId } = req.params;
      const clinicId = req.clinicId || 1;
      const summary = await docAssistantService.summarizePatientHistory({ clinicId, patientId: parseInt(patientId) });
      res.json({ success: true, summary });
    } catch (error) {
      next(error);
    }
  },

  // 12. Handle Follow-up and Admin suggestions
  handleFollowUpRecommendations: async (req, res, next) => {
    try {
      const { appointmentId } = req.params;
      const clinicId = req.clinicId || 1;
      const followup = await docAssistantService.generateFollowUpRecommendations({ clinicId, appointmentId: parseInt(appointmentId) });
      res.json({ success: true, followup });
    } catch (error) {
      next(error);
    }
  },

  // 13. Handle Patient Communication draft
  handlePatientCommunication: async (req, res, next) => {
    try {
      const { appointmentId, channel } = req.body;
      const clinicId = req.clinicId || 1;
      if (!appointmentId || !channel) {
        return res.status(400).json({ success: false, message: 'appointmentId and channel are required.' });
      }
      const draft = await docAssistantService.draftPatientCommunication({ clinicId, appointmentId: parseInt(appointmentId), channel });
      res.json({ success: true, draft });
    } catch (error) {
      next(error);
    }
  }
};


module.exports = aiController;
