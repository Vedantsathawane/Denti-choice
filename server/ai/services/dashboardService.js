const tools = require('../tools/tools');
const { generateAiText } = require('./openAiService');
const { dashboardAssistantPrompt } = require('../prompts/prompts');

const dashboardService = {
  ask: async ({ clinicId, question }) => {
    try {
      // 1. Identify which metric is requested using simple classification, or fallback to general LLM
      const lowerQ = question.toLowerCase();
      let queryType = null;

      if (lowerQ.includes('today') || lowerQ.includes('now')) {
        queryType = 'appointments_today';
      } else if (lowerQ.includes('revenue') || lowerQ.includes('earn') || lowerQ.includes('income')) {
        queryType = 'revenue_this_month';
      } else if (lowerQ.includes('cancel') || lowerQ.includes('drop')) {
        queryType = 'cancellations';
      } else if (lowerQ.includes('popular') || lowerQ.includes('common') || lowerQ.includes('frequent')) {
        queryType = 'popular_treatment';
      } else if (lowerQ.includes('doctor') || lowerQ.includes('performance') || lowerQ.includes('physician')) {
        queryType = 'doctor_performance';
      } else if (lowerQ.includes('cost') || lowerQ.includes('average') || lowerQ.includes('price') || lowerQ.includes('fee')) {
        queryType = 'average_treatment_cost';
      }

      let dataSummary = '';
      if (queryType) {
        // Execute the database query tool directly
        const result = await tools.queryDashboardStats.execute({ queryType }, { clinicId });
        dataSummary = JSON.stringify(result);
      } else {
        // Fallback or run all counts to give a full summary
        const todayCount = await tools.queryDashboardStats.execute({ queryType: 'appointments_today' }, { clinicId });
        const revenue = await tools.queryDashboardStats.execute({ queryType: 'revenue_this_month' }, { clinicId });
        dataSummary = `General clinic stats - Today's appointments: ${todayCount.total || 0}. Revenue: $${revenue.revenue || 0}.`;
      }

      // 2. Format result with LLM into professional operations voice
      const system = dashboardAssistantPrompt();
      const prompt = `
The administrator asked: "${question}"
Here is the raw data retrieved from our clinic database:
${dataSummary}

Summarize this information in a professional, polite response. Explain the numbers clearly.
`;

      const response = await generateAiText({
        clinicId,
        system,
        prompt,
        responseFormat: 'text'
      });

      return response;
    } catch (error) {
      console.error('dashboardService operations question error:', error);
      throw error;
    }
  }
};

module.exports = dashboardService;
