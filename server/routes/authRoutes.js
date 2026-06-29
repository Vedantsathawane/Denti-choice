const router = require('express').Router();
const AuthController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { loginValidator, profileValidator, passwordValidator } = require('../validators');

router.post('/login', loginValidator, validate, AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', authMiddleware, AuthController.getMe);
router.put('/profile', authMiddleware, upload.single('avatar'), profileValidator, validate, AuthController.updateProfile);
router.put('/password', authMiddleware, passwordValidator, validate, AuthController.changePassword);

module.exports = router;
