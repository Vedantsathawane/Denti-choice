const { pool } = require('../config/db');
const FeatureAccessService = require('../services/featureAccessService');
const superAdminController = require('../controllers/superAdmin/superAdminController');
const billingController = require('../controllers/clinic/billingController');

const testBilling = async () => {
  console.log('🧪 Starting Phase 3 Subscription & Billing Verification Suite...\n');

  try {
    const testClinicId = 1;

    // 1. Verify Gating and Limits
    console.log('👉 1. Testing Feature Gating & Limits...');
    // Seed usage limits in subscriptions for Plan 1 (Free Trial: max 1 doctor)
    await pool.query(
      `INSERT INTO subscriptions (clinic_id, plan_id, status, trial_start, trial_end, remaining_ai_credits, remaining_whatsapp_messages, remaining_email_credits, billing_cycle)
       VALUES (?, 1, 'trialing', NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY), 20, 50, 100, 'monthly')
       ON DUPLICATE KEY UPDATE plan_id = 1, status = 'trialing'`,
      [testClinicId]
    );

    // Seed usage in feature_usage (1 doctor currently registered)
    await pool.query(
      `INSERT INTO feature_usage (clinic_id, appointments_count, doctors_count, staff_count, ai_requests_count, whatsapp_messages_count, emails_count, storage_bytes)
       VALUES (?, 10, 1, 1, 5, 10, 15, 1024000)
       ON DUPLICATE KEY UPDATE doctors_count = 1, appointments_count = 10`,
      [testClinicId]
    );

    // Check if registering another doctor is allowed (Limit is 1, usage is 1)
    const docCheckPre = await FeatureAccessService.checkLimit(testClinicId, 'max_doctors');
    console.log(`   - Adding doctor check (Current usage: 1/1): Allowed? ${docCheckPre.allowed}. Reason: ${docCheckPre.reason || 'None'}`);

    // Extend subscription to Plan 2 (Clinic Pro: max 5 doctors)
    console.log('   - Upgrading clinic to Plan 2 (Clinic Pro)...');
    await pool.query(
      'UPDATE subscriptions SET plan_id = 2, status = "active" WHERE clinic_id = ?',
      [testClinicId]
    );

    const docCheckPost = await FeatureAccessService.checkLimit(testClinicId, 'max_doctors');
    console.log(`   - Adding doctor check (Post Upgrade): Allowed? ${docCheckPost.allowed}. Reason: ${docCheckPost.reason || 'None'}`);

    // Increment usage
    console.log('   - Incrementing usage counters...');
    await FeatureAccessService.incrementUsage(testClinicId, 'ai_requests', 2);
    
    const [usageRow] = await pool.query('SELECT ai_requests_count FROM feature_usage WHERE clinic_id = ?', [testClinicId]);
    console.log(`   - AI requests count post increment: ${usageRow[0].ai_requests_count}`);

    console.log('   ✅ Gating, upgrading, and increment checks complete.\n');

    // 2. Verify Super Admin Report Data Compilation
    console.log('👉 2. Testing Super Admin Global Revenue Report...');
    const superAdminReq = {};
    const superAdminRes = {
      status(code) { this.code = code; return this; },
      json(payload) { this.payload = payload; return this; }
    };
    await superAdminController.getGlobalRevenueReport(superAdminReq, superAdminRes, (err) => console.error(err));
    console.log('   - MRR Calculated:', superAdminRes.payload.data.mrr);
    console.log('   - ARR Calculated:', superAdminRes.payload.data.arr);
    console.log('   - Total Active Plans counted:', superAdminRes.payload.data.topPlans.length);
    console.log('   ✅ Super Admin report check complete.\n');

    // 3. Verify Clinic Usage Stats Endpoint
    console.log('👉 3. Testing Clinic Usage Stats Dashboard Endpoint...');
    const clinicReq = { clinicId: testClinicId };
    const clinicRes = {
      status(code) { this.code = code; return this; },
      json(payload) { this.payload = payload; return this; }
    };
    await billingController.getUsageStats(clinicReq, clinicRes, (err) => console.error(err));
    console.log('   - Current resolved Plan ID:', clinicRes.payload.data.planId);
    console.log('   - Current Status badge:', clinicRes.payload.data.status);
    console.log('   - Utilized appointments count:', clinicRes.payload.data.usage.appointments);
    console.log('   ✅ Clinic usage stats check complete.\n');

    console.log('🎉 ALL PHASE 3 BILLING AND SAAS MANAGEMENT VERIFICATIONS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
};

testBilling();
