const router = require('express').Router();
const ServiceController = require('../controllers/serviceController');
const authMiddleware = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { serviceValidator } = require('../validators');

router.get('/', ServiceController.getAll);
router.get('/:id', ServiceController.getById);
router.post('/', authMiddleware, upload.single('image'), serviceValidator, validate, ServiceController.create);
router.put('/:id', authMiddleware, upload.single('image'), ServiceController.update);
router.delete('/:id', authMiddleware, ServiceController.delete);

module.exports = router;
