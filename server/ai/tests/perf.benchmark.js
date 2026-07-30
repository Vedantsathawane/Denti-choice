const axios = require('axios');
const http = require('http');

// Set Max sockets high to avoid local bottlenecks
http.globalAgent.maxSockets = 500;

const BASE_URL = 'http://localhost:5000/api';

async function runScenario(usersCount) {
  console.log(`\n🚀 Simulating ${usersCount} concurrent users calling Denti-Choice API...`);
  
  const promises = [];
  const start = Date.now();
  
  let successCount = 0;
  let failCount = 0;
  const responseTimes = [];

  for (let i = 0; i < usersCount; i++) {
    const singleRequest = async () => {
      const reqStart = Date.now();
      try {
        // Query health endpoint (lightweight check)
        const res = await axios.get(`${BASE_URL}/health`, { timeout: 3000 });
        if (res.status === 200) {
          successCount++;
          responseTimes.push(Date.now() - reqStart);
        } else {
          failCount++;
        }
      } catch (err) {
        failCount++;
      }
    };
    promises.push(singleRequest());
  }

  await Promise.all(promises);
  
  const totalTime = Date.now() - start;
  responseTimes.sort((a, b) => a - b);
  
  const avg = responseTimes.reduce((a, b) => a + b, 0) / (responseTimes.length || 1);
  const p95Idx = Math.floor(responseTimes.length * 0.95);
  const p95 = responseTimes[p95Idx] || 0;

  console.log(`📊 Results for ${usersCount} Users:`);
  console.log(`   - Success: ${successCount}`);
  console.log(`   - Failed: ${failCount}`);
  console.log(`   - Total Duration: ${totalTime}ms`);
  console.log(`   - Avg Response Time: ${avg.toFixed(2)}ms`);
  console.log(`   - P95 Response Time: ${p95.toFixed(2)}ms`);

  return { usersCount, successCount, failCount, avg, p95 };
}

async function startBenchmark() {
  console.log('🧪 Starting Denti-Choice QA & Performance benchmark...');
  
  try {
    const runs = [10, 25, 50, 100];
    const results = [];
    
    for (const users of runs) {
      const res = await runScenario(users);
      results.push(res);
      // Brief pause between runs
      await new Promise(r => setTimeout(r, 1000));
    }
    
    console.log('\n🎉 PERFORMANCE BENCHMARK SUITE COMPLETED SUCCESSFULLY.');
  } catch (error) {
    console.error('Benchmark failed. Is the server running?', error.message);
  }
}

// Start benchmark runs
startBenchmark();
