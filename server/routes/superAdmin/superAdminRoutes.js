const router = require('express').Router();
const SuperAdminController = require('../../controllers/superAdmin/superAdminController');
const authMiddleware = require('../../middlewares/authMiddleware');
const roleMiddleware = require('../../middlewares/roleMiddleware');

// Protect all super admin routes to only super_admin role
router.use(authMiddleware, roleMiddleware(['super_admin']));

// Dashboard metrics & status
router.get('/dashboard/kpis', SuperAdminController.getDashboardKpis);
router.get('/health', SuperAdminController.getSystemHealth);
router.get('/logs', SuperAdminController.getAuditLogs);

// Clinic Management
router.get('/clinics', SuperAdminController.getClinics);
router.post('/clinics', SuperAdminController.createClinic);
router.put('/clinics/:id', SuperAdminController.updateClinic);
router.delete('/clinics/:id', SuperAdminController.deleteClinic);
router.get('/clinics/:id/settings', SuperAdminController.getClinicSettings);
router.put('/clinics/:id/settings', SuperAdminController.updateClinicSettings);

// Subscriptions & Plans
router.get('/plans', SuperAdminController.getPlans);
router.post('/plans', SuperAdminController.createPlan);
router.post('/subscriptions/update', SuperAdminController.updateClinicSubscription);

// Helpdesk/Tickets
router.get('/tickets', SuperAdminController.getTickets);
router.post('/tickets/:id/reply', SuperAdminController.replyTicket);

// Payments list
router.get('/payments', SuperAdminController.getPayments);

// Platform settings
router.get('/settings', SuperAdminController.getSettings);
router.put('/settings', SuperAdminController.updateSettings);

// AI & Announcements Broadcast endpoints
router.post('/ai/insights', SuperAdminController.askPlatformAi);
router.post('/notifications/broadcast', SuperAdminController.broadcastNotification);

// Global WhatsApp stats
router.get('/whatsapp/stats', SuperAdminController.getGlobalWhatsAppStats);

// Subscription & Billing operators routes
router.get('/plans', SuperAdminController.getSubscriptionPlans);
router.post('/plans', SuperAdminController.saveSubscriptionPlan);
router.post('/subscriptions/update', SuperAdminController.updateSubscriptionStatus);
router.get('/billing/revenue-report', SuperAdminController.getGlobalRevenueReport);
router.get('/performance/monitoring', SuperAdminController.getMonitoringStats);

module.exports = router;
