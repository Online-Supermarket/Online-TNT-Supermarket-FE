const fs = require('fs');
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8081,
  path: '/auth/token',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    const token = JSON.parse(data).token;
    
    const apiReq = http.request({
      hostname: 'localhost',
      port: 8080,
      path: '/api/order/reports/sales',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    }, (apiRes) => {
      let apiData = '';
      apiRes.on('data', d => apiData += d);
      apiRes.on('end', () => {
        try {
          const json = JSON.parse(apiData);
          console.log(JSON.stringify(json.orders.find(o => o.id.startsWith('a34980c4'))));
        } catch(e) {
          console.log('Error parsing JSON:', apiData.slice(0, 100));
        }
      });
    });
    apiReq.end();
  });
});
req.write(JSON.stringify({ email: 'admin@marketflow.local', password: 'Password123!' }));
req.end();
