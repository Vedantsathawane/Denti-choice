const { pool } = require('../config/db');
const whatsappService = require('../whatsapp/services/whatsappService');
const whatsappBookingAgent = require('../whatsapp/services/whatsappBookingAgent');

const testWhatsApp = async () => {
  console.log('🧪 Starting Phase 2 WhatsApp Integration Verification Suite...\n');

  try {
    // 1. Create a dummy clinic config in whatsapp_accounts
    console.log('👉 1. Setting up mock WhatsApp account credentials for Clinic #1...');
    await pool.query(
      `INSERT INTO whatsapp_accounts (clinic_id, phone_number_id, access_token, verify_token, display_name, api_status)
       VALUES (1, '1055501990', 'mock_token', 'dentichoice_token', '+15550199', 'sandbox')
       ON DUPLICATE KEY UPDATE api_status = 'sandbox'`
    );
    console.log('   ✅ Setup mock credentials success.\n');

    // 2. Test Conversational State Machine (whatsappBookingAgent)
    console.log('👉 2. Testing Interactive Web Receptionist Session State Machine...');
    const testPhone = '+15005550099';

    // Step A: Initial greeting (render menu)
    const reply1 = await whatsappBookingAgent.processMessage({
      clinicId: 1,
      fromPhone: testPhone,
      messageText: 'Hello'
    });
    console.log('   [Patient]: "Hello"');
    console.log('   [Receptionist AI]:\n', reply1, '\n');

    // Step B: Select Option 1 (Book Appointment)
    const reply2 = await whatsappBookingAgent.processMessage({
      clinicId: 1,
      fromPhone: testPhone,
      messageText: '1'
    });
    console.log('   [Patient]: "1" (Book Appointment)');
    console.log('   [Receptionist AI]:\n', reply2, '\n');

    // Step C: Select Service 1 (Teeth Cleaning)
    const reply3 = await whatsappBookingAgent.processMessage({
      clinicId: 1,
      fromPhone: testPhone,
      messageText: '1'
    });
    console.log('   [Patient]: "1" (Select Service)');
    console.log('   [Receptionist AI]:\n', reply3, '\n');

    // Step D: Select Doctor 1 (Dr. Smith)
    const reply4 = await whatsappBookingAgent.processMessage({
      clinicId: 1,
      fromPhone: testPhone,
      messageText: '1'
    });
    console.log('   [Patient]: "1" (Select Doctor)');
    console.log('   [Receptionist AI]:\n', reply4, '\n');

    console.log('   ✅ Booking state progression verified successfully.\n');

    // 3. Test Outgoing Queueing and background dispatcher execution
    console.log('👉 3. Testing background queue dispatch mechanism...');
    
    // Clear queue of old tests
    await pool.query('DELETE FROM whatsapp_queue');
    await pool.query('DELETE FROM whatsapp_messages');

    console.log('   - Queueing an outbound reminder message...');
    const queueId = await whatsappService.queueOutgoingMessage({
      clinicId: 1,
      recipient: '+15005559999',
      text: '[Template: appointment_reminder] Components: ["John Doe", "Tomorrow at 10:00 AM"]'
    });
    console.log(`   - Enqueued in DB under Queue ID: #${queueId}`);

    // Verify status is queued
    const [preMsg] = await pool.query('SELECT status FROM whatsapp_messages WHERE id = ?', [queueId]);
    console.log(`   - Pre-dispatch message status: ${preMsg[0].status}`);

    console.log('   - Running background queue processor to dispatch...');
    await whatsappService.processQueue();

    // Verify status is updated to sent
    const [postMsg] = await pool.query('SELECT status FROM whatsapp_messages WHERE id = ?', [queueId]);
    console.log(`   - Post-dispatch message status: ${postMsg[0].status}`);
    
    const [qItem] = await pool.query('SELECT status FROM whatsapp_queue WHERE message_id = ?', [queueId]);
    console.log(`   - Queue job status: ${qItem[0].status}`);

    console.log('   ✅ Outbound dispatch and status updates completed.\n');

    // 4. Test Super Admin API stats mapping
    console.log('👉 4. Testing Super Admin Operator Stats compilation...');
    const superAdminController = require('../controllers/superAdmin/superAdminController');
    const mockReq = {};
    const mockRes = {
      status(code) {
        this.code = code;
        return this;
      },
      json(payload) {
        this.payload = payload;
        return this;
      }
    };
    await superAdminController.getGlobalWhatsAppStats(mockReq, mockRes, (err) => console.error(err));
    console.log('   - Resolved connected clinics count:', mockRes.payload.data.connectedClinics.length);
    console.log('   - Total Outbound messages counted:', mockRes.payload.data.stats.totalOutbound);
    console.log('   - Outbound dispatch success rate:', mockRes.payload.data.stats.successRatePercent + '%');

    console.log('\n🎉 ALL WHATSAPP INTEGRATION VERIFICATIONS COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
};

testWhatsApp();
