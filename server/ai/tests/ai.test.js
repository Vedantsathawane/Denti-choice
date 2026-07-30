const assert = require('assert');
const { getDayName } = require('../tools/tools');
const prompts = require('../prompts/prompts');
const tenantMiddleware = require('../../middlewares/tenantMiddleware');

// Define tests
const runTests = async () => {
  console.log('🧪 Starting AI and SaaS Unit Tests...');

  try {
    // 1. Test prompts template loading
    console.log('   - Testing system prompts interpolation...');
    const clinicName = 'Test Smile Clinic';
    const sampleDoctors = [{ id: 1, name: 'Dr. Test' }];
    const sampleServices = [{ id: 1, name: 'Cleaning', price: 100 }];
    
    const generatedPrompt = prompts.bookingAgentPrompt(clinicName, sampleDoctors, sampleServices);
    assert.ok(generatedPrompt.includes(clinicName), 'Clinic name should be in the prompt');
    assert.ok(generatedPrompt.includes('Dr. Test'), 'Doctor details should be in the prompt');
    assert.ok(generatedPrompt.includes('Cleaning'), 'Service details should be in the prompt');
    console.log('   ✅ Prompts templates test passed.');

    // 2. Test SOAP prompt formatting
    console.log('   - Testing SOAP system prompts formatting...');
    const soapSystem = prompts.doctorAssistantPrompt();
    assert.ok(soapSystem.includes('chiefComplaint'), 'SOAP prompt should define chiefComplaint JSON field');
    assert.ok(soapSystem.includes('treatmentPlan'), 'SOAP prompt should define treatmentPlan JSON field');
    console.log('   ✅ SOAP prompt format test passed.');

    // 3. Test Email assistant formatting
    console.log('   - Testing email assistant prompts...');
    const emailPrompt = prompts.emailAssistantPrompt('Smile Center');
    assert.ok(emailPrompt.includes('Appointment Reminder'), 'Email assistant should cover Appointment Reminder');
    assert.ok(emailPrompt.includes('Review Request'), 'Email assistant should cover Review Request');
    console.log('   ✅ Email prompts test passed.');

    // 4. Test Mock logic resolution
    console.log('   - Testing AI Model provider fallback settings...');
    const { getAiModel } = require('../services/openAiService');
    
    // Backup keys
    const backupGemini = process.env.GEMINI_API_KEY;
    const backupOpenAI = process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    try {
      const { model, providerName } = await getAiModel(9999); // Clinic ID that doesn't exist
      assert.strictEqual(providerName, 'mock', 'Provider should fall back to mock when keys are missing');
      assert.strictEqual(model, null, 'Model should be null in mock mode');
    } finally {
      // Restore keys
      if (backupGemini !== undefined) process.env.GEMINI_API_KEY = backupGemini;
      if (backupOpenAI !== undefined) process.env.OPENAI_API_KEY = backupOpenAI;
    }
    console.log('   ✅ AI fallback resolver test passed.');

    // 5. Test Receptionist Tools List
    console.log('   - Testing AI Receptionist tools definitions...');
    const { receptionistTools } = require('../services/bookingAgent');
    const requiredTools = [
      'checkAvailability',
      'createPatient',
      'bookAppointment',
      'cancelAppointment',
      'rescheduleAppointment',
      'findDoctor',
      'listServices'
    ];
    requiredTools.forEach(t => {
      assert.ok(receptionistTools[t], `Tool "${t}" must be defined`);
      assert.strictEqual(typeof receptionistTools[t].execute, 'function', `Tool "${t}" must have an execute function`);
    });
    console.log('   ✅ Receptionist tools definition test passed.');

    // 6. Test WhatsApp thread conversation memory
    console.log('   - Testing WhatsApp session history storage and TTL memory...');
    const whatsappMemory = require('../memory/whatsappMemory');
    const testPhone = '+15550199';
    whatsappMemory.addMessage(testPhone, 'user', 'Hi, I want a teeth cleaning.');
    whatsappMemory.addMessage(testPhone, 'assistant', 'Sure! Let me check.');
    
    const messagesList = whatsappMemory.getMessages(testPhone);
    assert.strictEqual(messagesList.length, 2, 'Memory thread size must equal 2');
    assert.strictEqual(messagesList[0].role, 'user', 'First entry should be user');
    assert.strictEqual(messagesList[1].role, 'assistant', 'Second entry should be assistant');
    
    whatsappMemory.clear(testPhone);
    assert.strictEqual(whatsappMemory.getMessages(testPhone).length, 0, 'Memory should clear phone key');
    console.log('   ✅ WhatsApp session memory test passed.');

    console.log('\n🎉 ALL UNIT TESTS PASSED SUCCESSFULLY! (6/6 tests passed)\n');
  } catch (error) {
    console.error('❌ Unit test failed:', error);
    process.exit(1);
  }
};

runTests();
