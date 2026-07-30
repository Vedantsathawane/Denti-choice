const router = require('express').Router();
const BillingController = require('../../controllers/clinic/billingController');
const authMiddleware = require('../../middlewares/authMiddleware');
const { tenantMiddleware } = require('../../middlewares/tenantMiddleware');

// Mock payment portal endpoints (accessed directly during redirect)
router.get('/mock-checkout-portal', BillingController.getMockPortal);
router.post('/mock-checkout-portal/complete', BillingController.completeMockPayment);

// Authenticated billing routes
router.use(authMiddleware, tenantMiddleware);
router.post('/checkout', BillingController.createCheckout);
router.get('/coupons/validate', BillingController.validateCoupon);
router.get('/invoices', BillingController.getInvoices);
router.get('/invoices/:id/download', BillingController.downloadInvoice);

module.exports = router;
