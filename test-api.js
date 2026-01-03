// Test script for AI Studio API endpoint
import https from 'https';

const data = JSON.stringify({
    category: 'Kitchenware',
    image: ''
});

const options = {
    hostname: 'shadow-granule.vercel.app',
    port: 443,
    path: '/api/generate-studio',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log('🚀 Testing AI Studio API...');
console.log('📡 Endpoint:', `https://${options.hostname}${options.path}`);

const req = https.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode}`);

    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });

    res.on('end', () => {
        console.log('\n📦 Response:');
        try {
            const json = JSON.parse(body);
            console.log(JSON.stringify(json, null, 2));

            if (json.method_used) {
                console.log('\n✅ Method used:', json.method_used);
            }
            if (json.error_message) {
                console.log('⚠️ Error:', json.error_message);
            }
        } catch (e) {
            console.log('Raw response:', body);
        }
    });
});

req.on('error', (e) => {
    console.error('❌ Request error:', e.message);
});

req.write(data);
req.end();
