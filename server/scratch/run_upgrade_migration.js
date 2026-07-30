const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const { pool } = require('../config/db');

async function runMigration() {
  console.log('Reading migration SQL file...');
  const sqlPath = path.join(__dirname, '..', 'database', 'saas_notif_upgrade.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  // Split SQL commands on semicolon (crude but works for standard schemas)
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

  console.log(`Executing ${statements.length} SQL statements...`);
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await pool.query(stmt);
      console.log(`  [OK] Statement #${i + 1}`);
    } catch (err) {
      if (err.message.includes('Duplicate column name')) {
        console.log(`  [SKIP] Statement #${i + 1} (Duplicate column name - already migrated)`);
      } else if (err.message.includes('already exists')) {
        console.log(`  [SKIP] Statement #${i + 1} (Table already exists - already migrated)`);
      } else {
        console.error(`  [ERROR] Statement #${i + 1} failed:`, err.message);
        throw err;
      }
    }
  }

  console.log('Migration finished successfully.');
  await pool.end();
}

runMigration().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
