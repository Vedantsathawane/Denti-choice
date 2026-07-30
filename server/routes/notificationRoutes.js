const router = require('express').Router();
const NotificationController = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authMiddleware');
const { tenantMiddleware } = require('../middlewares/tenantMiddleware');

// Webhook endpoints (Unauthenticated)
router.get('/whatsapp/webhook', NotificationController.handleWhatsAppVerify);
router.post('/whatsapp/webhook', NotificationController.handleWhatsAppMessage);

// Authenticated routes
router.use(authMiddleware, tenantMiddleware);
router.post('/all', NotificationController.getAll);
router.post('/unread-count', NotificationController.getUnreadCount);
router.patch('/read', NotificationController.markAsRead);
router.patch('/read-all', NotificationController.markAllAsRead);
router.delete('/delete', NotificationController.delete);
router.get('/history', NotificationController.getHistory);
router.post('/retry', NotificationController.retry);
router.post('/test-whatsapp', NotificationController.testWhatsApp);

module.exports = router;
