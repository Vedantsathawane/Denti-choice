const router = require('express').Router();
const ContactController = require('../controllers/contactController');
const authMiddleware = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const { contactValidator, replyValidator } = require('../validators');

// Public
router.post('/', contactValidator, validate, ContactController.create);

// Admin routes
router.post('/all', authMiddleware, ContactController.getAll);
router.post('/by-id', authMiddleware, ContactController.getById);
router.patch('/read', authMiddleware, ContactController.markAsRead);
router.post('/reply', authMiddleware, replyValidator, validate, ContactController.reply);
router.delete('/delete', authMiddleware, ContactController.delete);

module.exports = router;
