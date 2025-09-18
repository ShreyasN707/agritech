// Quick test for forecast improvements
const http = require('http');

async function testForecast() {
    console.log('🧪 Testing improved forecast system...');
    
    const testData = JSON.stringify({
        crop: 'Rice',
        district: 'Karnataka',
        season: 'Kharif',
        quantity: 100
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/forecast',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(testData)
        },
        timeout: 10000 // 10 second timeout
    };

    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const endTime = Date.now();
                const responseTime = endTime - startTime;
                
                console.log(`⏱️ Response time: ${responseTime}ms`);
                
                if (res.statusCode === 200) {
                    try {
                        const result = JSON.parse(data);
                        console.log('✅ Forecast successful!');
                        console.log(`📊 Crop: ${result.crop}`);
                        console.log(`🎯 Glut Risk: ${result.glutRisk}`);
                        console.log(`📈 Demand Trend (7-day): ${result.demandTrend?.['7day']?.length || 0} data points`);
                        console.log(`💰 Price Trend (7-day): ${result.priceTrend?.['7day']?.length || 0} data points`);
                        console.log(`🏪 Markets: ${result.suggestedMarkets?.length || result.markets?.length || 0} markets`);
                        console.log(`📝 Source: ${result.source || 'unknown'}`);
                        
                        if (responseTime < 5000) {
                            console.log('🚀 Response time is good (< 5 seconds)');
                        } else if (responseTime < 10000) {
                            console.log('⚠️ Response time is acceptable (< 10 seconds)');
                        } else {
                            console.log('🐌 Response time is slow (> 10 seconds)');
                        }
                        
                        resolve(result);
                    } catch (error) {
                        reject(new Error(`Failed to parse response: ${error.message}`));
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(new Error(`Request failed: ${error.message}`));
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timed out after 10 seconds'));
        });

        req.write(testData);
        req.end();
    });
}

// Run the test
testForecast()
    .then(() => {
        console.log('\n🎉 Test completed successfully!');
        console.log('\n📋 Improvements implemented:');
        console.log('• ⚡ Optimized Gemini AI system instructions');
        console.log('• ⏱️ Added 15-second timeout to prevent hanging');
        console.log('• 🔄 Enhanced error handling with fallback systems');
        console.log('• 🚀 Faster mock data generation');
        console.log('• 📱 Better user feedback messages');
        console.log('• 🛡️ Multiple retry mechanisms');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Test failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('• Check if server is running: npm start');
        console.log('• Verify port 3000 is not blocked');
        console.log('• Check server logs for errors');
        process.exit(1);
    });
