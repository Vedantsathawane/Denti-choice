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
  }
};

module.exports = docAssistantService;
