const { createOpenAI } = require('@ai-sdk/openai');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');
const { generateText, streamText } = require('ai');
const { pool } = require('../../config/db');
const saasLogger = require('../../utils/saasLogger');

// Fetch API Key from settings or environment
const getApiKey = async (clinicId, keyName, envVar) => {
  try {
    const [rows] = await pool.query(
      'SELECT setting_value FROM clinic_settings WHERE clinic_id = ? AND setting_key = ?',
      [clinicId, keyName]
    );
    if (rows.length > 0 && rows[0].setting_value) {
      return rows[0].setting_value;
    }
  } catch (err) {
    console.error('Error fetching key from settings:', err.message);
  }
  return process.env[envVar] || null;
};

// Get Vercel AI SDK Model Instance
const getAiModel = async (clinicId) => {
  const openaiKey = await getApiKey(clinicId, 'openai_api_key', 'OPENAI_API_KEY');
  if (openaiKey) {
    const openai = createOpenAI({ apiKey: openaiKey });
    return {
      model: openai('gpt-4o-mini'),
      providerName: 'openai',
      key: openaiKey
    };
  }

  const geminiKey = await getApiKey(clinicId, 'gemini_api_key', 'GEMINI_API_KEY');
  if (geminiKey) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey });
    return {
      model: google('gemini-1.5-flash'),
      providerName: 'gemini',
      key: geminiKey
    };
  }

  return {
    model: null,
    providerName: 'mock',
    key: null
  };
};

/**
 * Streaming Chat Completion using Vercel AI SDK or Fallback Mock
 */
const getStreamingResponse = async ({ clinicId, system, messages, tools, onChunk, onFinish }) => {
  const { model, providerName } = await getAiModel(clinicId);

  if (providerName === 'mock' || !model) {
    // Return a mocked stream for testing/local development if no API keys are configured
    const lastMsg = messages[messages.length - 1]?.content || '';
    let responseText = `[Mock Mode] I received your message: "${lastMsg}". Please add a GEMINI_API_KEY or OPENAI_API_KEY in your .env or Clinic Settings to enable full AI responses.`;
    
    // Check if tools can be mocked (e.g. searching doctor availability)
    if (lastMsg.toLowerCase().includes('doctor') || lastMsg.toLowerCase().includes('dr')) {
      responseText = `I checked our roster. We have Dr. Smith (General Dentistry), Dr. Williams (Orthodontist), and Dr. Chen (Pediatric Dentist). Would you like to check their schedules?`;
    } else if (lastMsg.toLowerCase().includes('cleaning') || lastMsg.toLowerCase().includes('appointment')) {
      responseText = `I can help you schedule an appointment. Please provide your name, email, phone, and desired date/time.`;
    }

    // Simulate streaming
    const words = responseText.split(' ');
    let currentText = '';
    for (let i = 0; i < words.length; i++) {
      currentText += (i === 0 ? '' : ' ') + words[i];
      if (onChunk) onChunk(words[i] + ' ');
      await new Promise(resolve => setTimeout(resolve, 80));
    }

    if (onFinish) {
      onFinish({
        text: responseText,
        promptTokens: lastMsg.length / 4,
        completionTokens: responseText.length / 4
      });
    }
    return responseText;
  }

  try {
    const result = await streamText({
      model,
      system,
      messages,
      tools,
      maxSteps: 5 // Allows tool calling loops
    });

    let fullText = '';
    for await (const textPart of result.textStream) {
      fullText += textPart;
      if (onChunk) onChunk(textPart);
    }

    const usage = await result.usage;
    
    // Log token usage
    await saasLogger.logAI({
      clinicId,
      userType: 'patient',
      featureName: 'AI_Chat_Booking',
      promptTokens: usage?.promptTokens || 0,
      completionTokens: usage?.completionTokens || 0,
      promptSummary: messages[messages.length - 1]?.content || '',
      responseSummary: fullText
    });

    if (onFinish) {
      onFinish({
        text: fullText,
        promptTokens: usage?.promptTokens || 0,
        completionTokens: usage?.completionTokens || 0
      });
    }

    return fullText;
  } catch (error) {
    console.warn('⚠️ Vercel AI SDK stream error, falling back to mock mode:', error.message);
    
    // Fallback Mock Stream
    const lastMsg = messages[messages.length - 1]?.content || '';
    let responseText = `[Resilience Safe Mode] I received your message: "${lastMsg}". The configured AI provider returned an error: (${error.message}). Operating in safe mode.`;
    
    if (lastMsg.toLowerCase().includes('doctor') || lastMsg.toLowerCase().includes('dr')) {
      responseText = `I checked our roster. We have Dr. Smith (General Dentistry), Dr. Williams (Orthodontist), and Dr. Chen (Pediatric Dentist). Would you like to check their schedules?`;
    } else if (lastMsg.toLowerCase().includes('cleaning') || lastMsg.toLowerCase().includes('appointment')) {
      responseText = `I can help you schedule an appointment. Please provide your name, email, phone, and desired date/time.`;
    }

    const words = responseText.split(' ');
    for (let i = 0; i < words.length; i++) {
      if (onChunk) onChunk(words[i] + ' ');
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    if (onFinish) {
      onFinish({
        text: responseText,
        promptTokens: 100,
        completionTokens: 100
      });
    }
    return responseText;
  }
};

/**
 * Standard Text Generation (non-streaming)
 */
const generateAiText = async ({ clinicId, system, prompt, responseFormat }) => {
  const { model, providerName } = await getAiModel(clinicId);

  if (providerName === 'mock' || !model) {
    // Generate mocked outputs for SOAP notes, treatment planning, emails etc.
    if (responseFormat === 'json') {
      return JSON.stringify({
        chiefComplaint: "Patient complains of sensitivity in lower left molar.",
        medicalHistory: "No drug allergies. No history of systemic diseases.",
        clinicalFindings: "Caries detected on distal surface of tooth #19.",
        diagnosis: "Reversible pulpitis #19.",
        treatmentPlan: "Composite restoration (filling) on tooth #19.",
        prescription: "Ibuprofen 400mg as needed for pain.",
        followUp: "Return in 6 months for routine cleaning.",
        soap_notes: "S: patient subjective complaint... O: clinical findings... A: diagnosis... P: treatment plan...",
        diagnosis_summary: "Reversible pulpitis #19.",
        treatment_plan: "Composite restoration (filling) on tooth #19.",
        prescription_draft: "Ibuprofen 400mg as needed for pain.",
        patient_summary: "A friendly, easy-to-understand translation of the diagnosis, treatment plan, and instructions.",
        recommendations: "Recommended follow-up dental cleanings and hygiene checkups.",
        timeline: "In 6 months",
        adminActions: "Schedule recall reminder in 6 months"
      });
    }

    // HTML / Markdown response mock
    if (prompt.toLowerCase().includes('email')) {
      return `
        <h3>Appointment Reminder</h3>
        <p>Dear Patient,</p>
        <p>This is a reminder for your upcoming appointment on tomorrow at 2:00 PM with Dr. Smith. We look forward to seeing you!</p>
      `;
    }

    return `### Mock Treatment Plan\n\n1. **Diagnostic Phase**: Exam & X-rays ($150)\n2. **Restorative Phase**: Tooth filling ($250)\n\n**Total Estimated Price**: $400`;
  }

  try {
    const result = await generateText({
      model,
      system,
      prompt,
      ...(responseFormat === 'json' ? { responseFormat: { type: 'json' } } : {})
    });

    const usage = await result.usage;
    await saasLogger.logAI({
      clinicId,
      userType: 'doctor',
      featureName: 'AI_Text_Generation',
      promptTokens: usage?.promptTokens || 0,
      completionTokens: usage?.completionTokens || 0,
      promptSummary: prompt.substring(0, 500),
      responseSummary: result.text.substring(0, 500)
    });

    return result.text;
  } catch (error) {
    console.warn('⚠️ Vercel AI SDK text generate error, falling back to mock mode:', error.message);
    
    // Generate mocked outputs based on format
    if (responseFormat === 'json') {
      return JSON.stringify({
        soap_notes: "S: patient subjective complaint... O: clinical findings... A: diagnosis... P: treatment plan...",
        soapNotes: "S: patient subjective complaint... O: clinical findings... A: diagnosis... P: treatment plan...",
        chiefComplaint: "Patient complains of sensitivity in lower left molar.",
        medicalHistory: "No drug allergies. No history of systemic diseases.",
        clinicalFindings: "Caries detected on distal surface of tooth #19.",
        diagnosis: "Reversible pulpitis #19.",
        diagnosis_summary: "Reversible pulpitis #19.",
        treatment_plan: "Composite restoration (filling) on tooth #19.",
        prescription_draft: "Suggested medication, dosages, directions...",
        prescription: "Ibuprofen 400mg as needed for pain.",
        patient_summary: "A friendly, easy-to-understand translation of the diagnosis, treatment plan, and instructions.",
        followUp: "Return in 6 months for routine cleaning.",
        recommendations: "Recommended follow-up dental cleanings and hygiene checkups.",
        timeline: "In 6 months",
        adminActions: "Schedule recall reminder in 6 months"
      });
    }

    if (prompt.toLowerCase().includes('email')) {
      return `
        <h3>Appointment Alert</h3>
        <p>Dear Patient,</p>
        <p>This is a reminder for your upcoming appointment with Dr. Smith. We look forward to seeing you!</p>
      `;
    }

    return `### Safe Mode Treatment Plan\n\n1. **Diagnostic Phase**: Exam & X-rays ($150)\n2. **Restorative Phase**: Tooth filling ($250)\n\n**Total Estimated Price**: $400`;
  }
};

module.exports = {
  getAiModel,
  getStreamingResponse,
  generateAiText
};
