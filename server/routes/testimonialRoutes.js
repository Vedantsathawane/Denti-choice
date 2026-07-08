const router = require('express').Router();
const TestimonialController = require('../controllers/testimonialController');
const authMiddleware = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { testimonialValidator } = require('../validators');

router.post('/all', TestimonialController.getAll);
router.post('/by-id', TestimonialController.getById);
router.post('/', authMiddleware, upload.single('patient_photo'), testimonialValidator, validate, TestimonialController.create);
router.put('/update', authMiddleware, upload.single('patient_photo'), TestimonialController.update);
router.patch('/visibility', authMiddleware, TestimonialController.toggleVisibility);
router.delete('/delete', authMiddleware, TestimonialController.delete);

module.exports = router;
