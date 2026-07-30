// Simple in-memory thread storage for WhatsApp conversation history
// Keyed by patient's phone number, stores arrays of message objects
const memoryMap = new Map();
const TTL = 30 * 60 * 1000; // 30 minutes active session

const whatsappMemory = {
  getMessages: (phoneNumber) => {
    const thread = memoryMap.get(phoneNumber);
    if (!thread) return [];

    // Check expiration
    if (Date.now() - thread.lastUpdated > TTL) {
      memoryMap.delete(phoneNumber);
      return [];
    }
    return thread.messages;
  },

  addMessage: (phoneNumber, role, content) => {
    let thread = memoryMap.get(phoneNumber);
    if (!thread) {
      thread = {
        messages: [],
        lastUpdated: Date.now()
      };
    }

    thread.messages.push({ role, content });
    
    // Limit thread size to last 20 messages to save memory
    if (thread.messages.length > 20) {
      thread.messages.shift();
    }

    thread.lastUpdated = Date.now();
    memoryMap.set(phoneNumber, thread);
  },

  clear: (phoneNumber) => {
    memoryMap.delete(phoneNumber);
  }
};

module.exports = whatsappMemory;
