require('dotenv').config();
const { bookingAgent } = require('./ai/services/bookingAgent');

async function test() {
  console.log('Testing booking agent chat directly with "book appointment" request...');
  try {
    const response = await bookingAgent.chat({
      clinicId: 1,
      messages: [{ role: 'user', content: 'book appointment' }],
      onChunk: (chunk) => process.stdout.write(chunk),
      onFinish: (finish) => console.log('\nFinished:', finish)
    });
    console.log('\nSuccess response:', response);
  } catch (error) {
    console.error('\nCaught error in test:', error);
  }
}

test().then(() => process.exit(0));
