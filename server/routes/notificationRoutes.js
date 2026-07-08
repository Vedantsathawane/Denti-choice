const router = require('express').Router();
const NotificationController = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/all', authMiddleware, NotificationController.getAll);
router.post('/unread-count', authMiddleware, NotificationController.getUnreadCount);
router.patch('/read', authMiddleware, NotificationController.markAsRead);
router.patch('/read-all', authMiddleware, NotificationController.markAllAsRead);
router.delete('/delete', authMiddleware, NotificationController.delete);

module.exports = router;
