const axios = require('axios');

const test = async () => {
  try {
    console.log('Logging in as super admin...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'super@dentist-choice.com',
      password: 'superadmin123',
      remember: true
    });
    const token = loginRes.data.data.token;
    console.log('Super Admin login successful!');

    const headers = { Authorization: `Bearer ${token}` };

    console.log('Testing super admin KPIs...');
    const kpiRes = await axios.get('http://localhost:5000/api/super-admin/dashboard/kpis', { headers });
    console.log('KPIs success!', kpiRes.data.success, kpiRes.data.data);

    console.log('Testing health check...');
    const healthRes = await axios.get('http://localhost:5000/api/super-admin/health', { headers });
    console.log('Health check success!', healthRes.data.success, healthRes.data.data);

    console.log('All super admin endpoints verified successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
};

test();
