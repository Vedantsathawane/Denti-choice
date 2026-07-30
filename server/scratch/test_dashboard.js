const axios = require('axios');

const test = async () => {
  try {
    console.log('Logging in to get token...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@dentichoice.com',
      password: 'Admin@123',
      remember: true
    });
    const token = loginRes.data.data.token;
    console.log('Login successful! Token acquired.');

    const headers = { Authorization: `Bearer ${token}` };

    console.log('Testing getStats...');
    const statsRes = await axios.post('http://localhost:5000/api/dashboard/stats', {}, { headers });
    console.log('getStats success!', statsRes.data.success, statsRes.data.data);

    console.log('Testing getRecent...');
    const recentRes = await axios.post('http://localhost:5000/api/dashboard/recent', {}, { headers });
    console.log('getRecent success!', recentRes.data.success, recentRes.data.data);

    console.log('Testing getChartData...');
    const chartRes = await axios.post('http://localhost:5000/api/dashboard/chart-data', { year: 2026 }, { headers });
    console.log('getChartData success!', chartRes.data.success, chartRes.data.data);

    console.log('All dashboard endpoints verified successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
};

test();
