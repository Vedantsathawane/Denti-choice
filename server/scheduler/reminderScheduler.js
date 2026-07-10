const cron = require('node-cron');
const ReminderService = require('../services/reminderService');
const logger = require('../utils/logger');

const startScheduler = () => {
  logger.info('Reminder Scheduler Started');
  
  // Run every minute for automated real-time reminder processing: '* * * * *'
  cron.schedule('* * * * *', async () => {
    logger.info('Running cron job: Check and send due appointment reminders');
    try {
      const result = await ReminderService.sendAllPendingReminders();
      logger.info(`Cron job completed. Total found: ${result.totalFound}, Sent: ${result.sentCount}, Failed: ${result.failedCount}`);
    } catch (error) {
      logger.error('Error occurred during cron job reminder check', error);
    }
  });
};

module.exports = { startScheduler };
