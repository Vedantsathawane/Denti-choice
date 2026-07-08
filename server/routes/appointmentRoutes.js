const router = require('express').Router();
const AppointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const { appointmentValidator, statusValidator } = require('../validators');

// Public routes
router.post('/', appointmentValidator, validate, AppointmentController.book);
router.get('/slots', AppointmentController.getSlots);

// Admin routes
router.post('/all', authMiddleware, AppointmentController.getAll);
router.post('/today', authMiddleware, AppointmentController.getToday);
router.post('/by-id', authMiddleware, AppointmentController.getById);
router.put('/update', authMiddleware, AppointmentController.update);
router.patch('/update-status', authMiddleware, statusValidator, validate, AppointmentController.updateStatus);
router.delete('/delete', authMiddleware, AppointmentController.delete);

module.exports = router;
