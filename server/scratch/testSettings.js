const { pool } = require('../config/db');
const ClinicSettingModel = require('../models/clinic/clinicSettingModel');

async function test() {
  try {
    const [clinics] = await pool.query("SELECT id, name, subdomain FROM clinics");
    console.log("Clinics list:", clinics);

    for (const c of clinics) {
      console.log(`Fetching settings for clinic ID ${c.id} (${c.name}):`);
      const settings = await ClinicSettingModel.getSettings(c.id);
      console.log(`Success! Setting count:`, Object.keys(settings).length);
    }
    process.exit(0);
  } catch (err) {
    console.error("Caught error:", err);
    process.exit(1);
  }
}

test();
