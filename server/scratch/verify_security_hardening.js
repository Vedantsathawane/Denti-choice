const { tenantIsolationGuard, xssSanitizer } = require('../middlewares/tenantSecurity');

const testSecurityHardening = async () => {
  console.log('🧪 Starting Phase 7 Security Hardening & Isolation Verification Suite...\n');

  try {
    // 1. Verify Tenant Mismatch Rejection (BOLA/IDOR protection check)
    console.log('👉 1. Testing Tenant Isolation Guard (BOLA Protection)...');
    const mockReqMismatched = {
      user: { id: 10, clinic_id: 1, role: 'admin' },
      clinicId: 2, // Mismatched requested clinic ID!
      headers: {}
    };
    const mockRes = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      }
    };
    
    let guardPassed = false;
    tenantIsolationGuard(mockReqMismatched, mockRes, () => {
      guardPassed = true;
    });

    if (!guardPassed && mockRes.statusCode === 403) {
      console.log('   ✅ Mismatched tenant request correctly blocked with HTTP 403.');
      console.log(`   - Block message: "${mockRes.jsonData.message}"`);
    } else {
      throw new Error('Tenant isolation guard failed to block mismatched tenant request');
    }

    // Verify Super Admin Bypass
    const mockReqSuperAdmin = {
      user: { id: 2, clinic_id: 1, role: 'super_admin' },
      clinicId: 2, // Mismatched but allowed for super_admin operator
      headers: {}
    };
    let superAdminPassed = false;
    tenantIsolationGuard(mockReqSuperAdmin, mockRes, () => {
      superAdminPassed = true;
    });

    if (superAdminPassed) {
      console.log('   ✅ Super Admin bypassed tenant validation correctly.');
    } else {
      throw new Error('Super Admin was blocked by tenant isolation guard');
    }
    console.log('');

    // 2. Verify XSS escaping
    console.log('👉 2. Testing Cross-Site Scripting (XSS) Sanitizer...');
    const xssReq = {
      body: {
        comment: '<script>alert("hack")</script>',
        nested: {
          key: 'hello & welcome <script>'
        }
      }
    };

    xssSanitizer(xssReq, {}, () => {});
    console.log('   - Sanitized input comment:', xssReq.body.comment);
    console.log('   - Sanitized nested key:', xssReq.body.nested.key);

    if (xssReq.body.comment.includes('&lt;script&gt;') && xssReq.body.nested.key.includes('&amp;')) {
      console.log('   ✅ XSS sanitization patterns successfully verified.');
    } else {
      throw new Error('XSS sanitizer failed to encode special characters');
    }

    console.log('\n🎉 ALL PHASE 7 SECURITY HARDENING VERIFICATIONS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
};

testSecurityHardening();
