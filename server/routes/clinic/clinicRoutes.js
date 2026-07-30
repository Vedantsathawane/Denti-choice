const router = require('express').Router();
const ClinicDoctorController = require('../../controllers/clinic/clinicDoctorController');
const ClinicAppointmentController = require('../../controllers/clinic/clinicAppointmentController');
const ClinicPatientController = require('../../controllers/clinic/clinicPatientController');
const ClinicServiceController = require('../../controllers/clinic/clinicServiceController');
const ClinicSettingController = require('../../controllers/clinic/clinicSettingController');

const authMiddleware = require('../../middlewares/authMiddleware');
const { tenantMiddleware } = require('../../middlewares/tenantMiddleware');
const { checkLimit } = require('../../middlewares/planLimitsMiddleware');
const upload = require('../../middlewares/uploadMiddleware');

// Mount general auth check and tenant identification globally on clinic routes
router.use(authMiddleware, tenantMiddleware);

// Doctor management
router.get('/doctors', ClinicDoctorController.getAll);
router.get('/doctors/:id', ClinicDoctorController.getById);
router.post('/doctors', checkLimit('doctors'), upload.single('image'), ClinicDoctorController.create);
router.put('/doctors/:id', upload.single('image'), ClinicDoctorController.update);
router.delete('/doctors/:id', ClinicDoctorController.delete);

// Appointment management
router.get('/appointments', ClinicAppointmentController.getAll);
router.get('/appointments/:id', ClinicAppointmentController.getById);
router.post('/appointments', checkLimit('appointments'), ClinicAppointmentController.create);
router.put('/appointments/:id', ClinicAppointmentController.update);
router.delete('/appointments/:id', ClinicAppointmentController.delete);

// Patient management
router.get('/patients', ClinicPatientController.getAll);
router.get('/patients/:id', ClinicPatientController.getById);
router.post('/patients', ClinicPatientController.create);
router.put('/patients/:id', ClinicPatientController.update);
router.delete('/patients/:id', ClinicPatientController.delete);

// Service management
router.get('/services', ClinicServiceController.getAll);
router.get('/services/:id', ClinicServiceController.getById);
router.post('/services', upload.single('image'), ClinicServiceController.create);
router.put('/services/:id', upload.single('image'), ClinicServiceController.update);
router.delete('/services/:id', ClinicServiceController.delete);

// Settings
router.get('/settings', ClinicSettingController.getSettings);
router.put('/settings', ClinicSettingController.updateSettings);

module.exports = router;
