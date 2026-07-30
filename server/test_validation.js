const aiValidator = require('./validators/aiValidator');

try {
  const result = aiValidator.bookingChatSchema.parse({
    messages: [
      { role: 'assistant', content: 'Hello!' },
      { role: 'user', content: 'Who are the doctors?' }
    ]
  });
  console.log('Validation success:', result);
} catch (err) {
  console.error('Validation failed:', err.errors);
}
