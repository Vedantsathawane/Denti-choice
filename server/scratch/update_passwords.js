const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

const run = async () => {
  try {
    const superHash = await bcrypt.hash('superadmin123', 10);
    const ownerHash = await bcrypt.hash('Admin@123', 10);
    const adminHash = await bcrypt.hash('123456', 10);

    console.log('Generated hashes:');
    console.log('superadmin123 ->', superHash);
    console.log('Admin@123 ->', ownerHash);
    console.log('123456 ->', adminHash);

    console.log('Updating database passwords...');
    await pool.query('UPDATE clinic_users SET password = ? WHERE email = ?', [superHash, 'super@dentist-choice.com']);
    await pool.query('UPDATE clinic_users SET password = ? WHERE email = ?', [ownerHash, 'admin@dentichoice.com']);
    await pool.query('UPDATE clinic_users SET password = ? WHERE email = ?', [adminHash, 'ved@gmail.com']);

    // Let's also verify that the role for admin@dentichoice.com is set to owner so it gets redirected correctly!
    await pool.query('UPDATE clinic_users SET role = ? WHERE email = ?', ['owner', 'admin@dentichoice.com']);

    console.log('Successfully updated passwords and roles in database!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to update passwords:', error);
    process.exit(1);
  }
};

run();
