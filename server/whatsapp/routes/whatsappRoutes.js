const router = require('express').Router();
const whatsappController = require('../controllers/whatsappController');
const authMiddleware = require('../../middlewares/authMiddleware');
const roleMiddleware = require('../../middlewares/roleMiddleware');

// Public Webhook Handlers (No Auth required for Meta Webhooks)
router.get('/webhook', whatsappController.verifyWebhook);
router.post('/webhook', whatsappController.handleIncomingWebhook);

// Protected Admin/Operator APIs
router.use(authMiddleware);

router.get('/status', whatsappController.getConnectionStatus);
router.post('/settings', whatsappController.saveConnectionSettings);
router.get('/logs', whatsappController.getLogs);
router.post('/send', whatsappController.sendManualMessage);
router.get('/templates', whatsappController.getTemplates);
router.post('/templates', whatsappController.saveTemplate);
router.post('/broadcast', whatsappController.broadcastTemplate);
router.get('/queue', whatsappController.getQueue);
router.post('/queue/process', whatsappController.triggerQueueProcess);

module.exports = router;
