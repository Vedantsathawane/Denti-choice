const dayjs = require('dayjs');

/**
 * Format date to readable string
 */
const formatDate = (date) => {
  return dayjs(date).format('MMMM D, YYYY');
};

/**
 * Format time from 24h to 12h
 */
const formatTime = (time) => {
  return dayjs(`2000-01-01 ${time}`).format('h:mm A');
};

/**
 * Available appointment time slots
 */
const TIME_SLOTS = [
  '09:00:00', '09:30:00', '10:00:00', '10:30:00',
  '11:00:00', '11:30:00', '12:00:00',
  '14:00:00', '14:30:00', '15:00:00', '15:30:00',
  '16:00:00', '16:30:00', '17:00:00'
];

/**
 * Generate a random string for unique identifiers
 */
const generateId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Sanitize string for safe display
 */
const sanitize = (str) => {
  if (!str) return '';
  return str.replace(/[<>&"']/g, (char) => {
    const escapeMap = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' };
    return escapeMap[char];
  });
};

/**
 * Parse JSON safely
 */
const parseJSON = (str, fallback = null) => {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

module.exports = { formatDate, formatTime, TIME_SLOTS, generateId, sanitize, parseJSON };
