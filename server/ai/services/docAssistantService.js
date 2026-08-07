const { generateAiText } = require('./openAiService');
const ClinicalRecordModel = require('../../models/clinicalRecordModel');
const AppointmentModel = require('../../models/appointmentModel');

const docAssistantService = {
  generateSoapChart: async ({ clinicId, appointmentId, rawDictation, pdfUrl, xrayUrl }) => {
    try {
      // 1. Fetch appointment details (patient, doctor etc.)
      const appointment = await AppointmentModel.findById(appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found.');
      }

      // 2. Formulate Prompt
      const system = `
You are an expert Clinical Dental Assistant. Your task is to process a dentist's raw notes, dictated notes, or clinical references (including uploaded PDFs or X-rays references) and structure them into a formal medical record.

You must return your response in the following JSON format:
{
  "soap_notes": "S: patient subjective complaint... O: clinical findings... A: diagnosis... P: treatment plan...",
  "diagnosis_summary": "Professional diagnosis summary...",
  "treatment_plan": "Recommended procedures, timelines, phases...",
  "prescription_draft": "Suggested medication, dosages, directions...",
  "patient_summary": "A friendly, easy-to-understand translation of the diagnosis, treatment plan, and instructions for the patient to read."
}

Use correct dental terminology. Do not output anything else but the raw JSON.
`;

      const prompt = `
Generate a structured dental chart for:
- Patient Name: ${appointment.patient_name}
- Age/Gender: ${appointment.patient_age || 'N/A'} / ${appointment.patient_gender || 'N/A'}
- Dentist: Dr. ${appointment.doctor_name}
- Appointment Date: ${appointment.appointment_date}

Raw Notes / Audio Dictation:
"${rawDictation || 'None provided.'}"

Uploaded Attachments references:
- PDF Analysis: ${pdfUrl ? `Referenced PDF file at ${pdfUrl}` : 'None uploaded'}
- X-Ray File: ${xrayUrl ? `Referenced X-ray file at ${xrayUrl}` : 'None uploaded'}
`;

      const response = await generateAiText({
        clinicId,
        system,
        prompt,
        responseFormat: 'json'
      });

      // Parse JSON safely
      let parsed;
      try {
        parsed = typeof response === 'string' ? JSON.parse(response) : response;
      } catch (err) {
        parsed = {
          soap_notes: `Error formatting: ${response}`,
          diagnosis_summary: 'Parsing failed',
          treatment_plan: 'Parsing failed',
          prescription_draft: 'Parsing failed',
          patient_summary: 'Parsing failed'
        };
      }

      // 3. Upsert record in database
      const recordId = await ClinicalRecordModel.upsert({
        appointment_id: appointmentId,
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        raw_dictation: rawDictation,
        pdf_url: pdfUrl,
        xray_url: xrayUrl,
        soap_notes: parsed.soap_notes,
        diagnosis_summary: parsed.diagnosis_summary,
        treatment_plan: parsed.treatment_plan,
        prescription_draft: parsed.prescription_draft,
        patient_summary: parsed.patient_summary
      });

      return {
        id: recordId,
        appointment_id: appointmentId,
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        raw_dictation,
        pdf_url: pdfUrl,
        xray_url: xrayUrl,
        ...parsed
      };
    } catch (error) {
      console.error('docAssistantService SOAP generation error:', error);
      throw error;
    }
  },

  // 2. Summarize Patient History
  summarizePatientHistory: async ({ clinicId, patientId }) => {
    try {
      const { pool } = require('../../config/db');
      // Fetch historical appointments and clinical records
      const [records] = await pool.query(
        `SELECT a.appointment_date, a.status, cr.soap_notes, cr.diagnosis_summary, cr.treatment_plan
         FROM appointments a
         LEFT JOIN clinical_records cr ON a.id = cr.appointment_id
         WHERE a.patient_id = ? AND a.clinic_id = ?
         ORDER BY a.appointment_date DESC`,
        [patientId, clinicId]
      );

      if (records.length === 0) {
        return "No clinical history found for this patient.";
      }

      const historySummaryText = records.map(r => 
        `- Date: ${r.appointment_date} | Status: ${r.status}\n  Diagnosis: ${r.diagnosis_summary || 'N/A'}\n  Treatment: ${r.treatment_plan || 'N/A'}\n  Notes: ${r.soap_notes || 'N/A'}`
      ).join('\n\n');

      const system = `You are a clinical history summarizer. Your goal is to review a patient's historical dental visits and compose a brief, professional, bulleted summary of their dental history, recurring concerns, completed procedures, and current health trends. Keep it concise (150-200 words).`;
      const prompt = `Please summarize the following patient record history:\n\n${historySummaryText}`;

      return await generateAiText({
        clinicId,
        system,
        prompt,
        responseFormat: 'text'
      });
    } catch (error) {
      console.error('docAssistantService summarizePatientHistory error:', error);
      throw error;
    }
  },

  // 3. Generate Follow-up Recommendations & Administrative Actions
  generateFollowUpRecommendations: async ({ clinicId, appointmentId }) => {
    try {
      const record = await ClinicalRecordModel.findByAppointmentId(appointmentId);
      if (!record) {
        throw new Error('No clinical record found for this appointment.');
      }

      const system = `
You are a senior dental consultant. Based on the provided SOAP notes and treatment plan of a patient, generate:
1. Recommended follow-up treatments and procedures.
2. Timeline and frequency (e.g. check-up in 3 weeks).
3. Specific administrative actions (e.g., flag patient file, request insurance pre-authorization, schedule a specific recall campaign).

Format your response in a clear, professional JSON schema:
{
  "recommendations": "Follow-up recommendations text...",
  "timeline": "Timeline details...",
  "adminActions": "Suggested admin actions..."
}
Do not return any surrounding markdown block, output only valid JSON.
`;

      const prompt = `
Clinical Details:
SOAP Notes: ${record.soap_notes}
Diagnosis: ${record.diagnosis_summary}
Treatment Plan: ${record.treatment_plan}
`;

      const response = await generateAiText({
        clinicId,
        system,
        prompt,
        responseFormat: 'json'
      });

      try {
        return typeof response === 'string' ? JSON.parse(response) : response;
      } catch (err) {
        return {
          recommendations: response,
          timeline: 'Failed to parse',
          adminActions: 'Failed to parse'
        };
      }
    } catch (error) {
      console.error('docAssistantService generateFollowUpRecommendations error:', error);
      throw error;
    }
  },

  // 4. Draft Patient Communication (clinic emails & WhatsApp responses)
  draftPatientCommunication: async ({ clinicId, appointmentId, channel }) => {
    try {
      const record = await ClinicalRecordModel.findByAppointmentId(appointmentId);
      if (!record) {
        throw new Error('No clinical record found for this appointment.');
      }

      const appt = await AppointmentModel.findById(appointmentId);
      const recipientName = appt ? appt.patient_name : 'Patient';

      const system = `
You are a professional clinic coordinator. Based on the patient's dental diagnosis and treatment plan, draft a personalized follow-up message to the patient.
- If channel is 'email', provide a professional, highly detailed HTML email draft including friendly greeting, treatment details, follow-up instructions, and care policies.
- If channel is 'whatsapp', provide a concise, friendly, E.164-compatible text draft for WhatsApp with a clear call-to-action.

Return only the raw text response without surrounding JSON structure.
`;

      const prompt = `
Channel: ${channel}
Patient Name: ${recipientName}
Diagnosis: ${record.diagnosis_summary}
Treatment Summary: ${record.patient_summary || record.treatment_plan}
`;

      return await generateAiText({
        clinicId,
        system,
        prompt,
        responseFormat: 'text'
      });
    } catch (error) {
      console.error('docAssistantService draftPatientCommunication error:', error);
      throw error;
    }
  }
};

module.exports = docAssistantService;
