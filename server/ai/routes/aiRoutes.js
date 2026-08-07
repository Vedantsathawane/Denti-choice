const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { tenantMiddleware } = require('../../middlewares/tenantMiddleware');
const authMiddleware = require('../../middlewares/authMiddleware');
const { checkLimit } = require('../../middlewares/planLimitsMiddleware');
const { validateBody } = require('../../middlewares/tenantSecurity');
const aiValidator = require('../../validators/aiValidator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /jpeg|jpg|png|pdf/i;
    const isExtMatched = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const isMimeMatched = allowedExtensions.test(file.mimetype);
    if (isExtMatched && isMimeMatched) {
      return cb(null, true);
    }
    cb(new Error('Only PDFs, PNGs, and JPGs are supported.'));
  }
});

// Public AI Routes (AI booking chat for patients)
router.post(
  '/booking/chat', 
  tenantMiddleware, 
  checkLimit('ai'),
  validateBody(aiValidator.bookingChatSchema), 
  aiController.handleBookingChat
);

// WhatsApp Webhook Endpoints (Public access for Facebook servers)
router.get('/whatsapp/webhook', tenantMiddleware, aiController.handleWhatsAppVerify);
router.post(
  '/whatsapp/webhook', 
  tenantMiddleware, 
  // Custom parsing checks inside controllers validate WhatsApp payload directly
  aiController.handleWhatsAppMessage
);

// Protected AI Routes (requires staff authentication & resolves clinic)
const { tenantIsolationGuard } = require('../../middlewares/tenantSecurity');
router.use(authMiddleware, tenantMiddleware, tenantIsolationGuard, checkLimit('ai'));

router.post(
  '/doctor/chart', 
  validateBody(aiValidator.soapChartSchema), 
  aiController.handleSoapChart
);
router.get('/doctor/chart/:appointmentId', aiController.handleGetSoapChart);
router.put('/doctor/chart/:id', aiController.handleUpdateSoapChart);
router.post('/doctor/upload', upload.single('file'), aiController.handleDoctorUpload);

// New Doctor Dashboard AI endpoints
router.get('/doctor/history/:patientId', aiController.handlePatientHistory);
router.get('/doctor/followup/:appointmentId', aiController.handleFollowUpRecommendations);
router.post('/doctor/communication', aiController.handlePatientCommunication);

router.post(
  '/treatment/plan', 
  validateBody(aiValidator.treatmentPlanSchema), 
  aiController.handleTreatmentPlan
);
router.post(
  '/dashboard/ask', 
  validateBody(aiValidator.dashboardAskSchema), 
  aiController.handleDashboardAsk
);
router.post(
  '/review/generate', 
  validateBody(aiValidator.reviewGenerateSchema), 
  aiController.handleReviewGenerate
);
router.post(
  '/email/generate', 
  validateBody(aiValidator.emailGenerateSchema), 
  aiController.handleEmailGenerate
);
router.post(
  '/whatsapp/generate', 
  validateBody(aiValidator.emailGenerateSchema), 
  aiController.handleWhatsAppGenerate
);
router.post(
  '/notification/analyze', 
  validateBody(aiValidator.notificationAnalyzeSchema), 
  aiController.handleNotificationAnalyze
);
router.get('/analytics/predict', aiController.handleAnalyticsPredict);

module.exports = router;
