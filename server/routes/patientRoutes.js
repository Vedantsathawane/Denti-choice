const router = require('express').Router();
const PatientController = require('../controllers/patientController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, PatientController.getAll);
router.get('/:id', authMiddleware, PatientController.getById);

module.exports = router;
