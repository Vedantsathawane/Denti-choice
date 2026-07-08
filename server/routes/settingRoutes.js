const router = require('express').Router();
const SettingController = require('../controllers/settingController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/all', SettingController.getAll);
router.put('/update', authMiddleware, SettingController.update);

module.exports = router;
