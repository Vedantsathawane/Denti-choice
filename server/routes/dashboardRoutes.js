const router = require('express').Router();
const DashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/stats', authMiddleware, DashboardController.getStats);
router.get('/recent', authMiddleware, DashboardController.getRecent);
router.get('/chart-data', authMiddleware, DashboardController.getChartData);

module.exports = router;
