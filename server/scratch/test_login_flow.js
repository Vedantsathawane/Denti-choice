const axios = require('axios');

const test = async () => {
  try {
    console.log('Sending login request to backend...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@dentichoice.com',
      password: 'Admin@123',
      remember: true
    });
    console.log('Login successful! Token:', loginRes.data.data.token);

    const token = loginRes.data.data.token;
    console.log('Sending getMe request to backend...');
    const meRes = await axios.get('http://localhost:5000/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('getMe successful! User:', meRes.data.data);
  } catch (error) {
    console.error('Flow failed:', error.response ? error.response.data : error.message);
  }
};

test();
