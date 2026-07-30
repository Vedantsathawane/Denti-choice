const { pool } = require('../../config/db');
const { treatmentPlannerPrompt } = require('../prompts/prompts');
const { generateAiText } = require('./openAiService');

const treatmentService = {
  generatePlan: async ({ clinicId, diagnosis, severity, patientPreferences }) => {
    try {
      // Fetch clinic services to construct available procedures list
      const [serviceRows] = await pool.query(
        `SELECT s.name, s.price, s.duration 
         FROM services s
         JOIN clinic_services cs ON s.id = cs.service_id
         WHERE cs.clinic_id = ? AND s.is_active = 1`,
        [clinicId]
      );

      const availableServices = serviceRows.map(s => `${s.name} (Starts at $${s.price}, takes ${s.duration})`).join('\n');

      const system = treatmentPlannerPrompt();
      const prompt = `
Generate a dental treatment plan based on the following patient details:
- **Diagnosis**: ${diagnosis}
- **Severity**: ${severity}
- **Preferences / Constraints**: ${patientPreferences || 'None'}

Here is a list of services and starting prices offered by this clinic:
${availableServices}

Ensure the plan uses only appropriate procedures matching the clinic list if possible. Provide pricing estimates, phases/timeline, and a follow-up frequency.
`;

      const response = await generateAiText({
        clinicId,
        system,
        prompt,
        responseFormat: 'text' // Markdown format
      });

      return response;
    } catch (error) {
      console.error('treatmentService generation error:', error);
      throw error;
    }
  }
};

module.exports = treatmentService;
