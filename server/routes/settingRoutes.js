const router = require('express').Router();
const SettingController = require('../controllers/settingController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', SettingController.getAll);
router.put('/', authMiddleware, SettingController.update);

module.exports = router;
