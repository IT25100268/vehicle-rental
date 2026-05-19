import axios from 'axios';

const API = 'http://localhost:8080/api';

async function run() {
  try {
    console.log('Registering user...');
    const signupRes = await axios.post(`${API}/auth/signup`, {
      name: 'Script User',
      email: `scriptuser+${Date.now()}@example.com`,
      password: 'abc123'
    });
    console.log('Signup response:', signupRes.data);

    console.log('Logging in...');
    const loginRes = await axios.post(`${API}/auth/login`, {
      email: signupRes.data.email,
      password: 'abc123'
    });
    console.log('Login response:', loginRes.data);

    console.log('Test completed successfully.');
  } catch (err) {
    if (err.response) {
      console.error('Server responded with status', err.response.status, err.response.data);
    } else {
      console.error('Request error:', err.message);
    }
    process.exit(1);
  }
}

run();
