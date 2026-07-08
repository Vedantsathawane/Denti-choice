const router = require('express').Router();
const DashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/stats', authMiddleware, DashboardController.getStats);
router.post('/recent', authMiddleware, DashboardController.getRecent);
router.post('/chart-data', authMiddleware, DashboardController.getChartData);

module.exports = router;
