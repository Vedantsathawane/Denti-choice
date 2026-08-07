const { createGoogleGenerativeAI } = require('@ai-sdk/google');
const { generateText } = require('ai');
require('dotenv').config();

const test = async () => {
  const geminiKey = process.env.GEMINI_API_KEY;
  console.log('Testing Key:', geminiKey);
  const google = createGoogleGenerativeAI({ apiKey: geminiKey });
  
  try {
    console.log('Trying gemini-1.5-flash...');
    const result = await generateText({
      model: google('gemini-1.5-flash'),
      prompt: 'Hello'
    });
    console.log('Result:', result.text);
  } catch (err) {
    console.error('Error with gemini-1.5-flash:', err.message);
  }

  try {
    console.log('Trying gemini-1.5-pro...');
    const result = await generateText({
      model: google('gemini-1.5-pro'),
      prompt: 'Hello'
    });
    console.log('Result:', result.text);
  } catch (err) {
    console.error('Error with gemini-1.5-pro:', err.message);
  }
};

test();
