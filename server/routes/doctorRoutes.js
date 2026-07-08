const router = require('express').Router();
const DoctorController = require('../controllers/doctorController');
const authMiddleware = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { doctorValidator } = require('../validators');

// Public
router.post('/all', DoctorController.getAll);
router.post('/by-id', DoctorController.getById);

// Admin only
router.post('/', authMiddleware, upload.single('image'), doctorValidator, validate, DoctorController.create);
router.put('/update', authMiddleware, upload.single('image'), DoctorController.update);
router.delete('/delete', authMiddleware, DoctorController.delete);

module.exports = router;
