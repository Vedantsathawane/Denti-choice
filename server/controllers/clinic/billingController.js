const BillingService = require('../../services/billingService');
const { success, error } = require('../../utils/apiResponse');
const { pool } = require('../../config/db');

const BillingController = {
  /**
   * Validate coupon code
   */
  async validateCoupon(req, res, next) {
    try {
      const { code } = req.query;
      if (!code) return error(res, 'Coupon code is required', 400);

      const result = await BillingService.validateCoupon(code);
      if (!result.valid) {
        return error(res, result.message, 400);
      }
      return success(res, result, 'Coupon validated successfully');
    } catch (err) { next(err); }
  },

  /**
   * Create subscription checkout session
   */
  async createCheckout(req, res, next) {
    try {
      const clinicId = req.clinicId || 1;
      const { planId, couponCode, gateway } = req.body;
      if (!planId) return error(res, 'Plan ID is required', 400);

      const session = await BillingService.createCheckoutSession({
        clinicId,
        planId,
        couponCode,
        gateway: gateway || 'stripe'
      });

      return success(res, session, 'Checkout session created successfully');
    } catch (err) { next(err); }
  },

  /**
   * Get all invoices for the current tenant clinic
   */
  async getInvoices(req, res, next) {
    try {
      const clinicId = req.clinicId || 1;
      const [rows] = await pool.query(
        'SELECT * FROM invoices WHERE clinic_id = ? ORDER BY id DESC',
        [clinicId]
      );
      return success(res, rows, 'Invoices history fetched');
    } catch (err) { next(err); }
  },

  /**
   * Render HTML invoice printable download view
   */
  async downloadInvoice(req, res, next) {
    try {
      const { id } = req.params;
      const clinicId = req.clinicId || 1;

      // Access restriction: verify clinic ownership unless super_admin
      const [invoiceRows] = await pool.query('SELECT clinic_id FROM invoices WHERE id = ?', [id]);
      if (invoiceRows.length === 0) return error(res, 'Invoice not found', 404);

      if (req.user.role !== 'super_admin' && invoiceRows[0].clinic_id !== clinicId) {
        return error(res, 'Forbidden. You do not own this invoice.', 403);
      }

      const html = await BillingService.renderInvoiceHtml(id);
      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    } catch (err) { next(err); }
  },

  /**
   * Render Mock Payment Simulator View
   */
  async getMockPortal(req, res, next) {
    try {
      const { session_id, clinic_id, plan_id, amount, method } = req.query;
      
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Mock Payment Gateway</title>
          <style>
            body { font-family: sans-serif; background: #f3f4f6; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); text-align: center; max-width: 400px; width: 100%; }
            h2 { color: #0066ff; margin-bottom: 8px; }
            .details { background: #f8fafc; padding: 15px; border-radius: 12px; font-size: 14px; margin: 20px 0; text-align: left; }
            .btn { display: inline-block; background: #10b981; color: white; border: none; padding: 12px 30px; font-weight: bold; border-radius: 999px; cursor: pointer; text-decoration: none; font-size: 14px; width: 100%; box-sizing: border-box; }
            .btn:hover { background: #059669; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Mock Gateway Portal</h2>
            <p style="color: #64748b; font-size: 13px;">Simulating a secure sandbox checkout</p>
            <div class="details">
              <strong>Session ID:</strong> <span style="font-family: monospace; font-size:12px;">${session_id}</span><br/>
              <strong>Clinic ID:</strong> ${clinic_id}<br/>
              <strong>Plan ID:</strong> ${plan_id}<br/>
              <strong>Amount:</strong> $${amount}<br/>
              <strong>Method:</strong> ${method}
            </div>
            <form action="/api/billing/mock-checkout-portal/complete" method="POST">
              <input type="hidden" name="sessionId" value="${session_id}"/>
              <input type="hidden" name="clinicId" value="${clinic_id}"/>
              <input type="hidden" name="planId" value="${plan_id}"/>
              <input type="hidden" name="amount" value="${amount}"/>
              <input type="hidden" name="method" value="${method}"/>
              <button type="submit" class="btn">Authorize & Complete Payment</button>
            </form>
          </div>
        </body>
        </html>
      `);
    } catch (err) { next(err); }
  },

  /**
   * Handle completion of mock payment checkout redirection
   */
  async completeMockPayment(req, res, next) {
    try {
      const { sessionId, clinicId, planId, amount, method } = req.body;

      await BillingService.processPaymentSuccess({
        clinicId: parseInt(clinicId),
        planId: parseInt(planId),
        amount: parseFloat(amount),
        transactionId: `TXN-${sessionId}`,
        paymentMethod: `${method}_sandbox`
      });

      // Redirect client back to the front-end dashboard
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/dashboard/settings?payment=success`);
    } catch (err) { next(err); }
  }
};

module.exports = BillingController;
