const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const { pool } = require('../config/db');
const NotificationService = require('../services/notificationService');
const WhatsAppService = require('../services/whatsappService');

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

async function runTest() {
  console.log('====================================================');
  console.log('SaaS NOTIFICATION SYSTEM AUDIT & INTEGRATION TEST');
  console.log('====================================================\n');

  let testLogId = null;

  try {
    // Force set verify token for hermetic E2E checking
    process.env.WHATSAPP_VERIFY_TOKEN = 'test_verify_token';

    // 1. Webhook GET Token Verification Challenge
    console.log('1. Testing Webhook Verification GET challenge...');
    const verifyParams = {
      'hub.mode': 'subscribe',
      'hub.verify_token': 'test_verify_token',
      'hub.challenge': 'CHALLENGE_ACCEPTED_XYZ'
    };

    // Temporarily update Setting Model defaults or environment context
    const verifiedChallenge = await WhatsAppService.verifyWebhook(verifyParams);
    assert(verifiedChallenge === 'CHALLENGE_ACCEPTED_XYZ', 'Challenge token successfully validated');
    console.log('GET Verification Webhook check passed.\n');

    // 2. Webhook POST Message Reception & Logs
    console.log('2. Testing Inbound Webhook POST processing...');
    const inboundPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: '999999',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: { display_phone_number: '16505551111', phone_number_id: '123456789' },
            contacts: [{ profile: { name: 'E2E Tester' }, wa_id: '919876543210' }],
            messages: [{
              from: '919876543210',
              id: 'wamid.HBgLOTE5ODc2NTQzMjEwFQIAERgSRTI0RDk0Q...',
              timestamp: '1678999999',
              text: { body: '1 Confirm' },
              type: 'text'
            }]
          },
          field: 'messages'
        }]
      }]
    };

    const webhookResult = await WhatsAppService.handleIncomingWebhook(inboundPayload);
    assert(webhookResult.status === 'processed', 'Webhook payload parsed successfully');
    assert(webhookResult.from === '919876543210', 'Sender phone parsed correctly');
    assert(webhookResult.body === '1 Confirm', 'Message body text matching input payload');

    // Verify record logged in database
    const [waLogs] = await pool.query(
      'SELECT * FROM whatsapp_conversations WHERE phone_number = ? ORDER BY id DESC LIMIT 1',
      ['919876543210']
    );
    assert(waLogs.length > 0, 'Conversation logged inside database whatsapp_conversations table');
    console.log('POST Webhook reception check passed.\n');

    // 3. Trigger Test WhatsApp Message Dispatch
    console.log('3. Testing Outbound WhatsApp Template Dispatch...');
    const sendResult = await WhatsAppService.sendTemplateMessage({
      clinicId: 1,
      recipient: '919876543210',
      templateName: 'appointment_confirmation',
      parameters: [
        { type: 'text', text: 'E2E Patient' },
        { type: 'text', text: 'Denti-Choice' },
        { type: 'text', text: 'Dr. Test' },
        { type: 'text', text: 'Cleaning' },
        { type: 'text', text: '2026-08-01' },
        { type: 'text', text: '10:00 AM' },
        { type: 'text', text: '123 Test St' }
      ]
    });

    assert(sendResult.success === true, 'Outbound mock WhatsApp template successfully queued');
    console.log('Outbound template check passed.\n');

    // 4. Verification of Failures Retry Logic
    console.log('4. Testing Failed Notification Logging & Retry Actions...');
    
    // Manually insert a failed log record
    const [failRes] = await pool.query(
      `INSERT INTO notification_history (clinic_id, recipient, channel, type, title, message, status, sent_time) 
       VALUES (1, 'patient@failtest.com', 'email', 'reminder', 'Failed Title', 'Failed message body', 'failed', NOW())`
    );
    testLogId = failRes.insertId;

    // Run retry execution
    const retryResult = await NotificationService.retryFailedNotification(testLogId);
    assert(retryResult.success === true, 'Retry action processed without connection crashes');
    
    // Check status in DB updated to retry_success
    const [retriedRows] = await pool.query('SELECT status FROM notification_history WHERE id = ?', [testLogId]);
    assert(retriedRows[0].status === 'retry_success', 'Audit log status updated to retry_success');
    console.log('Failures retry verification passed.\n');

    console.log('====================================================');
    console.log('ALL NOTIFICATION INTEGRATION AUDIT TESTS PASSED');
    console.log('====================================================');

  } catch (error) {
    console.error('\nNOTIFICATION INTEGRATION SUITE FAILURE:', error.message);
    process.exit(1);
  } finally {
    // Cleanup E2E conversation records
    console.log('\nCleaning up E2E notification test logs...');
    await pool.query("DELETE FROM whatsapp_conversations WHERE phone_number = '919876543210'");
    if (testLogId) {
      await pool.query('DELETE FROM notification_history WHERE id = ? OR recipient = ?', [testLogId, 'patient@failtest.com']);
    }
    await pool.end();
    console.log('Database connection pool closed safely.');
  }
}

runTest();
