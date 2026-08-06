const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/bulk-update-stock',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const data = JSON.stringify({
  orgId: 'distributor-1', // Replace with your distributor org ID
  quantity: 1000,
  orgName: 'Distributor',
  orgType: 'distributor'
});

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log('Response:', body);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
