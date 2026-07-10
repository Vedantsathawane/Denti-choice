const router = require('express').Router();
const ReminderController = require('../controllers/reminderController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/upcoming', authMiddleware, ReminderController.getUpcoming);
router.get('/pending', authMiddleware, ReminderController.getPending);
router.post('/send', authMiddleware, ReminderController.send);
router.post('/send-all', authMiddleware, ReminderController.sendAll);

module.exports = router;
