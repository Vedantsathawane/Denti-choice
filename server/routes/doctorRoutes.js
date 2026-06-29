const router = require('express').Router();
const DoctorController = require('../controllers/doctorController');
const authMiddleware = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { doctorValidator } = require('../validators');

// Public
router.get('/', DoctorController.getAll);
router.get('/:id', DoctorController.getById);

// Admin only
router.post('/', authMiddleware, upload.single('image'), doctorValidator, validate, DoctorController.create);
router.put('/:id', authMiddleware, upload.single('image'), DoctorController.update);
router.delete('/:id', authMiddleware, DoctorController.delete);

module.exports = router;
