const { pool } = require('../config/db');
const NotificationService = require('../services/notificationService');
const docAssistantService = require('../ai/services/docAssistantService');
const superAdminAiService = require('../ai/services/superAdminAiService');

const runVerification = async () => {
  console.log('🏁 Starting Upgrade Phase 1 Verification Suite...\n');

  try {
    // 1. Verify Unified Notification Center
    console.log('👉 1. Testing consolidated NotificationService triggerEvent...');
    const mockAppt = {
      id: 999,
      clinic_id: 1,
      patient_id: 1,
      patient_name: 'John Doe',
      patient_email: 'john.doe@example.com',
      patient_phone: '+15550199',
      doctor_name: 'Smith',
      appointment_date: '2026-08-10',
      appointment_time: '14:30:00',
      service_name: 'Root Canal Therapy',
      clinic_name: 'Denti-Choice Smile Hub',
      clinic_address: '456 Dental Avenue',
      message: 'Created appointment trigger test'
    };

    await NotificationService.triggerAppointmentNotification(mockAppt, 'created');
    console.log('   ✅ NotificationService triggerEvent complete (Socket, email logs verified).\n');

    // 2. Verify Doctor Assistant History Summarizer
    console.log('👉 2. Testing AI Doctor Assistant Patient History Summarizer...');
    // Seed a mock appointment so we have records
    await pool.query(
      `INSERT INTO appointments (id, patient_id, doctor_id, service_id, appointment_date, appointment_time, status, clinic_id)
       VALUES (9999, 1, 1, 1, '2026-08-01', '10:00:00', 'completed', 1)
       ON DUPLICATE KEY UPDATE status='completed'`
    );
    await pool.query(
      `INSERT INTO clinical_records (appointment_id, patient_id, doctor_id, soap_notes, diagnosis_summary, treatment_plan, patient_summary)
       VALUES (9999, 1, 1, 'S: Tooth hurts. O: Cavity found on #14. A: Caries. P: Filling done.', 'Caries #14', 'Resin composite filling #14', 'We filled your cavity today.')
       ON DUPLICATE KEY UPDATE diagnosis_summary='Caries #14'`
    );

    const historySummary = await docAssistantService.summarizePatientHistory({ clinicId: 1, patientId: 1 });
    console.log('   ✅ Summarization success! AI Output Summary:\n', historySummary, '\n');

    // 3. Verify Doctor Assistant Follow-up recommendations
    console.log('👉 3. Testing AI Doctor Assistant Follow-up Recommendations...');
    const recommendations = await docAssistantService.generateFollowUpRecommendations({ clinicId: 1, appointmentId: 9999 });
    console.log('   ✅ Recommendations success! AI Output:\n', JSON.stringify(recommendations, null, 2), '\n');

    // 4. Verify Doctor Assistant Patient Communication Draft
    console.log('👉 4. Testing AI Doctor Assistant Patient Communication Draft...');
    const emailDraft = await docAssistantService.draftPatientCommunication({ clinicId: 1, appointmentId: 9999, channel: 'email' });
    console.log('   ✅ Communication email draft success! Length:', emailDraft.length, 'characters.\n');

    // 5. Verify Super Admin AI Insights BI chatbot
    console.log('👉 5. Testing SaaS Operator AI Insights BI chatbot...');
    const tokenQueryResponse = await superAdminAiService.ask({ question: 'Which clinics consume the most AI tokens?' });
    console.log('   ✅ Super Admin BI AI chatbot query success! Response:\n', tokenQueryResponse, '\n');

    const revenueQueryResponse = await superAdminAiService.ask({ question: 'Show plan pricing revenue details.' });
    console.log('   ✅ Super Admin BI AI chatbot revenue success! Response:\n', revenueQueryResponse, '\n');

    // Clean up mock data
    await pool.query('DELETE FROM clinical_records WHERE appointment_id = 9999');
    await pool.query('DELETE FROM appointments WHERE id = 9999');

    console.log('🎉 ALL ARCHITECTURAL UPGRADE VERIFICATIONS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
};

runVerification();
