const router = require('express').Router();
const NotificationController = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, NotificationController.getAll);
router.get('/unread-count', authMiddleware, NotificationController.getUnreadCount);
router.patch('/:id/read', authMiddleware, NotificationController.markAsRead);
router.patch('/read-all', authMiddleware, NotificationController.markAllAsRead);
router.delete('/:id', authMiddleware, NotificationController.delete);

module.exports = router;
