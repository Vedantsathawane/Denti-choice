const { pool } = require('../config/db');
const logger = require('../utils/logger');
const SettingModel = require('../models/settingModel');

const BillingService = {
  /**
   * Get billing keys config
   */
  async getKeys() {
    return {
      stripePublishableKey: await SettingModel.get('stripe_publishable_key') || process.env.STRIPE_PUBLISHABLE_KEY,
      stripeSecretKey: await SettingModel.get('stripe_secret_key') || process.env.STRIPE_SECRET_KEY,
      razorpayKeyId: await SettingModel.get('razorpay_key_id') || process.env.RAZORPAY_KEY_ID,
      razorpayKeySecret: await SettingModel.get('razorpay_key_secret') || process.env.RAZORPAY_KEY_SECRET,
      useSandbox: (await SettingModel.get('billing_use_sandbox') || process.env.BILLING_USE_SANDBOX || 'true') === 'true'
    };
  },

  /**
   * Validate a coupon code and return discount
   */
  async validateCoupon(code) {
    if (!code) return { valid: false, discountPercent: 0 };
    try {
      const [rows] = await pool.query(
        'SELECT * FROM coupons WHERE code = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > NOW())',
        [code.toUpperCase()]
      );
      if (rows.length === 0) {
        return { valid: false, discountPercent: 0, message: 'Invalid or expired coupon code' };
      }
      return { valid: true, discountPercent: parseFloat(rows[0].discount_percent), code: rows[0].code };
    } catch (err) {
      logger.error('Failed to validate coupon:', err.message);
      return { valid: false, discountPercent: 0, message: 'Server validation error' };
    }
  },

  /**
   * Create Checkout Session / Order for Stripe or Razorpay
   */
  async createCheckoutSession({ clinicId, planId, couponCode = null, gateway = 'stripe' }) {
    // 1. Get plan details
    const [plans] = await pool.query('SELECT * FROM subscription_plans WHERE id = ?', [planId]);
    if (plans.length === 0) {
      throw new Error('Subscription plan not found');
    }
    const plan = plans[0];
    let price = parseFloat(plan.price);

    // 2. Validate Coupon if any
    let discount = 0;
    if (couponCode) {
      const couponVal = await this.validateCoupon(couponCode);
      if (couponVal.valid) {
        discount = price * (couponVal.discountPercent / 100);
        price = Math.max(0, price - discount);
      }
    }

    // 3. Compute standard 18% GST (Goods and Services Tax)
    const gstPercent = 18.00;
    const gstAmount = price * (gstPercent / 100);
    const totalAmount = price + gstAmount;

    // 4. Retrieve credentials
    const keys = await this.getKeys();

    // 5. If sandbox mode, return a mocked checkout session response
    if (keys.useSandbox || (gateway === 'stripe' && !keys.stripeSecretKey) || (gateway === 'razorpay' && !keys.razorpayKeyId)) {
      const sessionId = `mock_session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      logger.info(`[BILLING SANDBOX] Mock Checkout created for Clinic #${clinicId}, Plan #${planId}, Gateway: ${gateway}. Total: $${totalAmount.toFixed(2)}`);
      
      return {
        success: true,
        gateway: `${gateway}_mock_sandbox`,
        sessionId,
        planName: plan.name,
        price,
        discount,
        gstAmount,
        totalAmount,
        checkoutUrl: `/api/billing/mock-checkout-portal?session_id=${sessionId}&clinic_id=${clinicId}&plan_id=${planId}&amount=${totalAmount}&method=${gateway}`
      };
    }

    // Production Driver integrations
    if (gateway === 'stripe') {
      const stripe = require('stripe')(keys.stripeSecretKey);
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Denti-Choice SaaS - ${plan.name} Plan`,
                description: `Billing cycle: ${plan.billing_cycle}`,
              },
              unit_amount: Math.round(totalAmount * 100), // in cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/billing`,
        metadata: {
          clinicId: String(clinicId),
          planId: String(planId),
          couponCode
        }
      });

      return {
        success: true,
        gateway: 'stripe',
        sessionId: session.id,
        checkoutUrl: session.url,
        totalAmount
      };
    } 
    else if (gateway === 'razorpay') {
      const Razorpay = require('razorpay');
      const instance = new Razorpay({
        key_id: keys.razorpayKeyId,
        key_secret: keys.razorpayKeySecret,
      });

      const order = await instance.orders.create({
        amount: Math.round(totalAmount * 100), // in paisa/cents equivalent
        currency: 'INR',
        receipt: `receipt_clinic_${clinicId}_${Date.now()}`,
        notes: {
          clinicId: String(clinicId),
          planId: String(planId),
          couponCode
        }
      });

      return {
        success: true,
        gateway: 'razorpay',
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        totalAmount
      };
    }

    throw new Error('Unsupported payment gateway');
  },

  /**
   * Finalize a successful payment and generate an invoice record
   */
  async processPaymentSuccess({ clinicId, planId, amount, transactionId, paymentMethod }) {
    const gstPercent = 18.00;
    const priceBeforeGst = parseFloat(amount) / (1 + gstPercent / 100);
    const gstAmount = parseFloat(amount) - priceBeforeGst;

    const invoiceNum = `INV-${Date.now()}-${String(clinicId).padStart(4, '0')}`;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Create Invoice record
      await connection.query(
        `INSERT INTO invoices (clinic_id, invoice_number, amount, gst_amount, gst_percent, status, payment_method) 
         VALUES (?, ?, ?, ?, ?, 'paid', ?)`,
        [clinicId, invoiceNum, priceBeforeGst, gstAmount, gstPercent, paymentMethod]
      );

      // 2. Insert transaction records into payments
      const [paymentRes] = await connection.query(
        `INSERT INTO payments (clinic_id, amount, status, payment_method, transaction_id) 
         VALUES (?, ?, 'completed', ?, ?)`,
        [clinicId, amount, paymentMethod, transactionId]
      );

      // 3. Update subscription status
      const durationDays = planId === 3 ? 365 : 30; // Enterprise: yearly, others: monthly
      
      const [existing] = await connection.query('SELECT id FROM subscriptions WHERE clinic_id = ?', [clinicId]);
      if (existing.length > 0) {
        await connection.query(
          `UPDATE subscriptions 
           SET plan_id = ?, status = 'active', current_period_end = DATE_ADD(NOW(), INTERVAL ? DAY), updated_at = NOW() 
           WHERE clinic_id = ?`,
          [planId, durationDays, clinicId]
        );
      } else {
        await connection.query(
          `INSERT INTO subscriptions (clinic_id, plan_id, status, current_period_end) 
           VALUES (?, ?, 'active', DATE_ADD(NOW(), INTERVAL ? DAY))`,
          [clinicId, planId, durationDays]
        );
      }

      await connection.commit();
      logger.info(`Successful subscription payment processed. Invoice ${invoiceNum} generated for Clinic ID ${clinicId}`);

      // Trigger payment success notification (non-blocking)
      try {
        const [ownerRows] = await connection.query(
          'SELECT name, email, phone FROM users WHERE clinic_id = ? AND role = "owner" LIMIT 1',
          [clinicId]
        );
        const owner = ownerRows[0] || { name: 'Clinic Owner', email: 'owner@dentist.com', phone: '1234567890' };
        const [clinicRows] = await connection.query('SELECT name FROM clinics WHERE id = ?', [clinicId]);
        const clinicName = clinicRows[0]?.name || 'Denti-Choice Clinic';

        const NotificationServiceUpgrade = require('./notificationService');
        NotificationServiceUpgrade.triggerEvent(
          clinicId,
          null,
          owner.email,
          owner.phone,
          'payment',
          {
            patient_name: owner.name,
            clinic_name: clinicName,
            invoice_number: invoiceNum,
            amount: priceBeforeGst,
            gst_amount: gstAmount,
            transaction_id: transactionId
          }
        );
      } catch (notifErr) {
        logger.error('Failed to trigger payment success notifications:', notifErr.message);
      }

      return { success: true, invoiceNumber: invoiceNum, paymentId: paymentRes.insertId };
    } catch (err) {
      await connection.rollback();
      logger.error('Failed to process payment success:', err.message);
      throw err;
    } finally {
      connection.release();
    }
  },

  /**
   * Render Printable Invoice HTML
   */
  async renderInvoiceHtml(invoiceId) {
    const [rows] = await pool.query(
      `SELECT i.*, c.name as clinic_name, c.subdomain 
       FROM invoices i
       JOIN clinics c ON i.clinic_id = c.id
       WHERE i.id = ?`,
      [invoiceId]
    );

    if (rows.length === 0) throw new Error('Invoice not found');
    const inv = rows[0];

    const amountNum = parseFloat(inv.amount);
    const gstNum = parseFloat(inv.gst_amount);
    const totalNum = amountNum + gstNum;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${inv.invoice_number}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; margin: 0; padding: 40px; background: #fff; }
          .invoice-box { max-width: 800px; margin: auto; border: 1px solid #eee; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,.05); }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0066ff; padding-bottom: 20px; }
          .title { font-size: 28px; font-weight: bold; color: #0066ff; }
          .details { margin-top: 30px; display: flex; justify-content: space-between; }
          .details div { font-size: 14px; line-height: 1.5; }
          .table { width: 100%; border-collapse: collapse; margin-top: 40px; }
          .table th { background: #f8fafc; padding: 12px; font-size: 13px; text-transform: uppercase; color: #64748b; text-align: left; border-bottom: 1px solid #e2e8f0; }
          .table td { padding: 15px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          .totals { margin-top: 30px; width: 300px; margin-left: auto; font-size: 14px; }
          .totals div { display: flex; justify-content: space-between; padding: 8px 0; }
          .totals .grand-total { font-weight: bold; font-size: 16px; border-top: 2px solid #0066ff; padding-top: 12px; color: #0066ff; }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <span class="title">INVOICE</span>
            <div style="text-align: right;">
              <strong style="color: #0066ff;">Denti-Choice SaaS Platform</strong><br/>
              invoice@dentichoice.com
            </div>
          </div>
          <div class="details">
            <div>
              <strong>Billed To:</strong><br/>
              ${inv.clinic_name}<br/>
              Domain: ${inv.subdomain}.dentist-choice.com
            </div>
            <div style="text-align: right;">
              <strong>Invoice #:</strong> ${inv.invoice_number}<br/>
              <strong>Date:</strong> ${new Date(inv.created_at).toLocaleDateString()}<br/>
              <strong>Payment Status:</strong> <span style="text-transform: uppercase; font-weight: bold; color: green;">${inv.status}</span>
            </div>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Denti-Choice Dentist Booking SaaS Subscription Billing (1 Cycle)</td>
                <td style="text-align: right;">$${amountNum.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <div class="totals">
            <div>
              <span>Subtotal:</span>
              <span>$${amountNum.toFixed(2)}</span>
            </div>
            <div>
              <span>GST Tax (${inv.gst_percent}%):</span>
              <span>$${gstNum.toFixed(2)}</span>
            </div>
            <div class="grand-total">
              <span>Total Paid:</span>
              <span>$${totalNum.toFixed(2)}</span>
            </div>
          </div>
          <div style="margin-top: 60px; font-size: 11px; text-align: center; color: #94a3b8;">
            Thank you for subscribing to Denti-Choice. For billing inquiries, contact invoice@dentichoice.com
          </div>
        </div>
      </body>
      </html>
    `;
  }
};

module.exports = BillingService;
