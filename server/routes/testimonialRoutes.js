const router = require('express').Router();
const TestimonialController = require('../controllers/testimonialController');
const authMiddleware = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { testimonialValidator } = require('../validators');

router.get('/', TestimonialController.getAll);
router.get('/:id', TestimonialController.getById);
router.post('/', authMiddleware, upload.single('patient_photo'), testimonialValidator, validate, TestimonialController.create);
router.put('/:id', authMiddleware, upload.single('patient_photo'), TestimonialController.update);
router.patch('/:id/visibility', authMiddleware, TestimonialController.toggleVisibility);
router.delete('/:id', authMiddleware, TestimonialController.delete);

module.exports = router;
