const { pool } = require('../../config/db');
const { emailAssistantPrompt } = require('../prompts/prompts');
const { generateAiText } = require('./openAiService');

const messagingService = {
  // 1. Review & Follow-up Generator
  generateReviewRequest: async ({ clinicId, patientName, doctorName }) => {
    try {
      let clinicName = 'Denti-Choice';
      const [clinicRows] = await pool.query('SELECT name FROM clinics WHERE id = ?', [clinicId]);
      if (clinicRows.length > 0) {
        clinicName = clinicRows[0].name;
      }

      const system = emailAssistantPrompt(clinicName);
      const prompt = `Draft a review request message asking the patient "${patientName}" to share feedback about their visit with "${doctorName}". Keep it friendly, clear, and include a placeholder link like [Review Link].`;

      const response = await generateAiText({
        clinicId,
        system,
        prompt,
        responseFormat: 'text'
      });

      return response;
    } catch (error) {
      console.error('messagingService review generate error:', error);
      throw error;
    }
  },

  // 2. AI Email Assistant
  generateEmail: async ({ clinicId, type, patientName, details }) => {
    try {
      let clinicName = 'Denti-Choice';
      const [clinicRows] = await pool.query('SELECT name FROM clinics WHERE id = ?', [clinicId]);
      if (clinicRows.length > 0) {
        clinicName = clinicRows[0].name;
      }

      const system = emailAssistantPrompt(clinicName);
      const prompt = `
Generate a professional email of type: "${type}".
- **Patient Name**: ${patientName}
- **Details**: ${JSON.stringify(details)}

Provide the response in clean, premium HTML format suitable for sending.
`;

      const response = await generateAiText({
        clinicId,
        system,
        prompt,
        responseFormat: 'text'
      });

      return response;
    } catch (error) {
      console.error('messagingService email helper error:', error);
      throw error;
    }
  },

  // 3. AI Notification Sentiment & Urgency Analyzer
  analyzeContactMessage: async ({ clinicId, contactId, name, messageText }) => {
    try {
      // Analyze text for urgency keywords or using mock heuristics if no LLM key
      const lowerText = messageText.toLowerCase();
      const emergencyKeywords = ['pain', 'hurt', 'bleeding', 'emergency', 'broken', 'accident', 'swelling', 'swollen', 'severe', 'ache', 'help'];
      const hasUrgentKeyword = emergencyKeywords.some(keyword => lowerText.includes(keyword));

      let sentiment = 'neutral';
      let isUrgent = hasUrgentKeyword ? 1 : 0;
      let urgencyReason = hasUrgentKeyword ? 'Urgent dental symptom detected.' : '';

      // Use AI if available
      try {
        const aiAnalysis = await generateAiText({
          clinicId,
          system: 'You are a patient message analyzer. Classify the message sentiment as positive, neutral, or negative, and specify if it requires immediate/urgent action (isUrgent: true/false). Return JSON format only: {"sentiment": "...", "isUrgent": true/false, "reason": "..."}',
          prompt: `Analyze this contact message from ${name}: "${messageText}"`,
          responseFormat: 'json'
        });

        const parsed = typeof aiAnalysis === 'string' ? JSON.parse(aiAnalysis) : aiAnalysis;
        sentiment = parsed.sentiment || sentiment;
        isUrgent = parsed.isUrgent ? 1 : isUrgent;
        urgencyReason = parsed.reason || urgencyReason;
      } catch (e) {
        // Fallback to keyword scanner
      }

      // If urgent, write alert notification to database
      if (isUrgent) {
        const title = `🚨 Urgent Query from ${name}`;
        const notificationMsg = `Urgency flagged by AI: "${urgencyReason || 'Pain/emergency mentioned.'}" message: "${messageText.substring(0, 100)}..."`;
        
        await pool.query(
          `INSERT INTO notifications (type, title, message, data) 
           VALUES ('alert', ?, ?, ?)`,
          [title, notificationMsg, JSON.stringify({ contactId, sentiment, clinicId })]
        );
      }

      // Optional: Update contact message entry if we wanted to (but instructions say DO NOT change existing schemas, so we just log and push to notifications)
      return {
        sentiment,
        isUrgent: !!isUrgent,
        urgencyReason
      };
    } catch (error) {
      console.error('messagingService contact message analysis error:', error);
      return { sentiment: 'neutral', isUrgent: false, error: error.message };
    }
  }
};

module.exports = messagingService;
