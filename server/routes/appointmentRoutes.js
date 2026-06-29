const router = require('express').Router();
const AppointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const { appointmentValidator, statusValidator } = require('../validators');

// Public
router.post('/', appointmentValidator, validate, AppointmentController.book);
router.get('/slots', AppointmentController.getSlots);

// Admin only
router.get('/', authMiddleware, AppointmentController.getAll);
router.get('/today', authMiddleware, AppointmentController.getToday);
router.get('/:id', authMiddleware, AppointmentController.getById);
router.put('/:id', authMiddleware, AppointmentController.update);
router.patch('/:id/status', authMiddleware, statusValidator, validate, AppointmentController.updateStatus);
router.delete('/:id', authMiddleware, AppointmentController.delete);

module.exports = router;
