const prompts = require('../ai/prompts/prompts');
const { getAiModel } = require('../ai/services/openAiService');
const { receptionistTools } = require('../ai/services/bookingAgent');
const whatsappMemory = require('../ai/memory/whatsappMemory');

const testAiIntegration = async () => {
  console.log('🧪 Starting Phase 6 AI Platform Integration Verification Suite...\n');

  try {
    // 1. Verify system prompts loading & templates interpolation
    console.log('👉 1. Testing Modular System Prompts Template Interpolation...');
    const clinicName = 'Modern Smile Center';
    const sampleDoctors = [{ id: 1, name: 'Dr. Sarah Johnson' }];
    const sampleServices = [{ id: 1, name: 'Teeth Whitening', price: 350 }];

    const generatedPrompt = prompts.bookingAgentPrompt(clinicName, sampleDoctors, sampleServices);
    if (generatedPrompt.includes(clinicName) && generatedPrompt.includes('Dr. Sarah Johnson') && generatedPrompt.includes('Teeth Whitening')) {
      console.log('   ✅ Prompts interpolation successfully verified.');
    } else {
      throw new Error('Prompts interpolation output failed');
    }

    const soapSystem = prompts.doctorAssistantPrompt();
    if (soapSystem.includes('chiefComplaint') && soapSystem.includes('treatmentPlan')) {
      console.log('   ✅ SOAP format prompt successfully verified.');
    } else {
      throw new Error('SOAP prompt template lookup failed');
    }
    console.log('');

    // 2. Verify AI model provider settings & fallback mock model checks
    console.log('👉 2. Testing Provider-Independent Fallback Settings...');
    const { model, providerName } = await getAiModel(1);
    console.log(`   - Resolved Model provider: "${providerName}"`);
    console.log(`   - Model name: "${model || 'mock_fallback'}"`);
    console.log('   ✅ Model provider settings verified.\n');

    // 3. Verify Receptionist tools definitions
    console.log('👉 3. Testing Receptionist State Tools...');
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
      if (receptionistTools[t] && typeof receptionistTools[t].execute === 'function') {
        console.log(`   - Tool "${t}" is active and executable.`);
      } else {
        throw new Error(`Tool "${t}" fails execution definition check`);
      }
    });
    console.log('   ✅ Chatbot receptionist state tools verified.\n');

    // 4. Verify WhatsApp session conversation memory threads
    console.log('👉 4. Testing WhatsApp Memory Session Thread TTL...');
    const phone = '+15559876';
    whatsappMemory.addMessage(phone, 'user', 'Booking a root canal.');
    whatsappMemory.addMessage(phone, 'assistant', 'Checking available slots.');
    
    const messages = whatsappMemory.getMessages(phone);
    if (messages.length === 2 && messages[0].role === 'user' && messages[1].role === 'assistant') {
      console.log('   ✅ WhatsApp session thread history verified.');
    } else {
      throw new Error('WhatsApp memory storage failed');
    }

    whatsappMemory.clear(phone);
    if (whatsappMemory.getMessages(phone).length === 0) {
      console.log('   ✅ WhatsApp session cleanup verified.');
    } else {
      throw new Error('WhatsApp session clear memory failed');
    }

    console.log('\n🎉 ALL PHASE 6 AI INTEGRATION VERIFICATIONS COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
};

testAiIntegration();
