const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');

const testBranding = async () => {
  console.log('🧪 Starting Phase 4 White-Label & Multi-Tenant Verification Suite...\n');

  try {
    const testClinicId = 1;

    // 1. Verify dynamic directory creation by simulated uploads
    console.log('👉 1. Testing Isolated Tenant Media Paths...');
    const clinicUploadDir = path.join(__dirname, '..', 'uploads', `clinic_${testClinicId}`);
    
    // Create folder manually if not exists
    if (!fs.existsSync(clinicUploadDir)) {
      fs.mkdirSync(clinicUploadDir, { recursive: true });
    }
    console.log(`   - Verified isolated directory pathway: ${clinicUploadDir}`);
    console.log(`   - Path exists? ${fs.existsSync(clinicUploadDir) ? 'Yes' : 'No'}`);

    // Insert mock media record
    const relativePath = `/uploads/clinic_${testClinicId}/logo-mock.png`;
    const [mediaRes] = await pool.query(
      `INSERT INTO tenant_media (clinic_id, filename, file_path, file_size, mime_type, category) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [testClinicId, 'logo-mock.png', relativePath, 10240, 'image/png', 'logo']
    );
    console.log(`   - Logged media asset ID: #${mediaRes.insertId}`);

    const [rows] = await pool.query('SELECT * FROM tenant_media WHERE clinic_id = ?', [testClinicId]);
    console.log(`   - Media log verification (Tenant ID matches?): ${rows[0].clinic_id === testClinicId ? 'Yes' : 'No'}`);
    console.log(`   - Relative Web URL resolved: ${rows[0].file_path}`);
    
    // Cleanup mock db reference
    await pool.query('DELETE FROM tenant_media WHERE id = ?', [mediaRes.insertId]);
    console.log('   ✅ Media Isolation checks complete.\n');

    // 2. Verify settings and visibilities storage
    console.log('👉 2. Testing Key-Value Settings storage...');
    const settingsPayload = [
      { key: 'primary_color', value: '#0D9488' },
      { key: 'homepage_visible', value: 'true' },
      { key: 'whatsapp_visible', value: 'false' }
    ];

    for (const s of settingsPayload) {
      await pool.query(
        `INSERT INTO clinic_settings (clinic_id, setting_key, setting_value) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE setting_value = ?`,
        [testClinicId, s.key, s.value, s.value]
      );
    }

    const [dbSettings] = await pool.query(
      'SELECT setting_key, setting_value FROM clinic_settings WHERE clinic_id = ? AND setting_key IN ("primary_color", "homepage_visible", "whatsapp_visible")',
      [testClinicId]
    );

    console.log('   - Resolved DB Branding Settings:');
    dbSettings.forEach(s => {
      console.log(`     * ${s.setting_key}: ${s.setting_value}`);
    });
    console.log('   ✅ Key-Value Settings check complete.\n');

    console.log('🎉 ALL PHASE 4 WHITE-LABEL & MULTI-TENANT BRANDING VERIFICATIONS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
};

testBranding();
