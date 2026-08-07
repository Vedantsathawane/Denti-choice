const { pool } = require('../../config/db');
const { generateAiText } = require('./openAiService');

const superAdminAiService = {
  ask: async ({ question }) => {
    try {
      const lowerQ = question.toLowerCase();

      // Gather global statistics context dynamically
      const [[{ total_clinics }]] = await pool.query('SELECT COUNT(*) as total_clinics FROM clinics');
      const [[{ active_clinics }]] = await pool.query('SELECT COUNT(*) as active_clinics FROM clinics WHERE is_active = 1');
      const [[{ open_tickets }]] = await pool.query("SELECT COUNT(*) as open_tickets FROM support_tickets WHERE status = 'open'");
      const [[{ total_tokens }]] = await pool.query('SELECT SUM(prompt_tokens + completion_tokens) as total_tokens FROM ai_logs');

      // 1. Determine query intent and execute relevant database analysis
      let dataSummary = `General SaaS Platform status: ${total_clinics} total clinics (${active_clinics} active). Support queue tickets pending: ${open_tickets}. AI system tokens used: ${total_tokens || 0}.`;
      let detailSummary = '';

      if (lowerQ.includes('highest appointment') || lowerQ.includes('busy') || lowerQ.includes('most active')) {
        const [rows] = await pool.query(`
          SELECT c.name, COUNT(a.id) as count
          FROM appointments a
          JOIN clinics c ON a.clinic_id = c.id
          GROUP BY c.id
          ORDER BY count DESC
          LIMIT 5
        `);
        detailSummary = `Clinics with highest appointment volumes:\n` + rows.map(r => `- ${r.name}: ${r.count} appointments`).join('\n');
      } 
      else if (lowerQ.includes('revenue') || lowerQ.includes('mrr') || lowerQ.includes('subscription') || lowerQ.includes('most profitable') || lowerQ.includes('plan')) {
        const [rows] = await pool.query(`
          SELECT p.name, COUNT(s.id) as active_subscriptions, SUM(p.price) as estimated_mrr
          FROM subscriptions s
          JOIN subscription_plans p ON s.plan_id = p.id
          WHERE s.status = 'active'
          GROUP BY p.id
          ORDER BY estimated_mrr DESC
        `);
        const [completedPayments] = await pool.query("SELECT SUM(amount) as total FROM payments WHERE status = 'completed'");
        detailSummary = `Revenue Analysis per Subscription Plan:\n` + 
          rows.map(r => `- ${r.name} Plan: ${r.active_subscriptions} active subscriptions, Estimated Monthly Revenue: $${parseFloat(r.estimated_mrr || 0).toFixed(2)}`).join('\n') +
          `\nTotal completed payments received platform-wide: $${parseFloat(completedPayments[0]?.total || 0).toFixed(2)}`;
      } 
      else if (lowerQ.includes('low activity') || lowerQ.includes('inactive') || lowerQ.includes('attention')) {
        const [rows] = await pool.query(`
          SELECT c.name, COUNT(a.id) as count
          FROM clinics c
          LEFT JOIN appointments a ON c.id = a.clinic_id AND a.appointment_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          GROUP BY c.id
          ORDER BY count ASC
          LIMIT 5
        `);
        detailSummary = `Clinics with lowest activity (appointments in last 30 days):\n` + rows.map(r => `- ${r.name}: ${r.count} appointments`).join('\n');
      } 
      else if (lowerQ.includes('token') || lowerQ.includes('ai') || lowerQ.includes('gemini') || lowerQ.includes('openai') || lowerQ.includes('cost')) {
        const [rows] = await pool.query(`
          SELECT c.name, COUNT(l.id) as requests, SUM(l.prompt_tokens + l.completion_tokens) as total_tokens
          FROM clinics c
          JOIN ai_logs l ON c.id = l.clinic_id
          GROUP BY c.id
          ORDER BY total_tokens DESC
          LIMIT 5
        `);
        detailSummary = `Clinics with highest AI token consumption:\n` + rows.map(r => `- ${r.name}: ${r.requests} requests, ${r.total_tokens || 0} tokens used`).join('\n');
      }

      // 2. Pass statistics context to Gemini to construct the BI Analyst response
      const system = `
You are the SaaS Platform Business Intelligence Assistant for Dentist-Choice.
Your target audience is the platform operator/owner (Super Admin).
Your job is to translate complex MySQL metrics, revenue tables, and system usage figures into high-level, actionable operations summaries.

Guidelines:
- Maintain a highly professional, clinical, data-driven operator voice.
- Focus on business success metrics (MRR, churn, activity, system costs).
- Do not disclose individual patient names or patient-level data.
- State recommendations clearly where appropriate.
`;

      const prompt = `
The platform owner asked: "${question}"

System KPIs:
${dataSummary}

Detailed Query Results:
${detailSummary || 'No specific sub-reports triggered. Answer based on general system metrics above.'}
`;

      // Use system-wide clinicId = 1 (default fallback) for Super Admin AI requests logging
      const response = await generateAiText({
        clinicId: 1,
        system,
        prompt,
        responseFormat: 'text'
      });

      return response;
    } catch (error) {
      console.error('superAdminAiService querying failed:', error);
      throw error;
    }
  }
};

module.exports = superAdminAiService;
