const router = require('express').Router();
const PatientController = require('../controllers/patientController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/all', authMiddleware, PatientController.getAll);
router.post('/by-id', authMiddleware, PatientController.getById);

module.exports = router;
