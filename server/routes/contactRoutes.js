const router = require('express').Router();
const ContactController = require('../controllers/contactController');
const authMiddleware = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const { contactValidator, replyValidator } = require('../validators');

// Public
router.post('/', contactValidator, validate, ContactController.create);

// Admin
router.get('/', authMiddleware, ContactController.getAll);
router.get('/:id', authMiddleware, ContactController.getById);
router.patch('/:id/read', authMiddleware, ContactController.markAsRead);
router.post('/:id/reply', authMiddleware, replyValidator, validate, ContactController.reply);
router.delete('/:id', authMiddleware, ContactController.delete);

module.exports = router;
