const router = require('express').Router();
const ServiceController = require('../controllers/serviceController');
const authMiddleware = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { serviceValidator } = require('../validators');

router.post('/all', ServiceController.getAll);
router.post('/by-id', ServiceController.getById);
router.post('/', authMiddleware, upload.single('image'), serviceValidator, validate, ServiceController.create);
router.put('/update', authMiddleware, upload.single('image'), ServiceController.update);
router.delete('/delete', authMiddleware, ServiceController.delete);

module.exports = router;
