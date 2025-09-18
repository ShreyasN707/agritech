// API Testing Script for CropSense
const http = require('http');
const https = require('https');

class CropSenseAPITester {
    constructor(baseUrl = 'http://localhost:3000') {
        this.baseUrl = baseUrl;
        this.testResults = [];
    }

    async runAllTests() {
        console.log('🧪 Starting CropSense API Tests...\n');
        
        const tests = [
            { name: 'Health Check', test: () => this.testHealthCheck() },
            { name: 'Forecast API', test: () => this.testForecastAPI() },
            { name: 'Simulation API', test: () => this.testSimulationAPI() },
            { name: 'Analytics Dashboard', test: () => this.testAnalyticsDashboard() },
            { name: 'Market Insights', test: () => this.testMarketInsights() },
            { name: 'Export Trends', test: () => this.testExportTrends() },
            { name: 'Static Files', test: () => this.testStaticFiles() }
        ];

        for (const test of tests) {
            try {
                console.log(`📋 Testing: ${test.name}`);
                await test.test();
                this.logResult(test.name, 'PASS', '✅');
            } catch (error) {
                this.logResult(test.name, 'FAIL', '❌', error.message);
            }
        }

        this.printSummary();
    }

    async testHealthCheck() {
        const response = await this.makeRequest('/health');
        if (response.status !== 'OK') {
            throw new Error('Health check failed');
        }
    }

    async testForecastAPI() {
        const payload = {
            crop: 'Rice',
            district: 'Karnataka',
            season: 'Kharif',
            quantity: 100
        };

        const response = await this.makeRequest('/api/forecast', 'POST', payload);
        
        if (!response.demandTrend || !response.priceTrend || !response.glutRisk) {
            throw new Error('Invalid forecast response structure');
        }

        if (!['low', 'medium', 'high'].includes(response.glutRisk)) {
            throw new Error('Invalid glut risk value');
        }
    }

    async testSimulationAPI() {
        const payload = {
            crop: 'Wheat',
            district: 'Punjab',
            season: 'Rabi',
            quantity: 200,
            marketChoice: 'Local Market'
        };

        const response = await this.makeRequest('/api/simulate', 'POST', payload);
        
        if (!response.predictions || !response.recommendations) {
            throw new Error('Invalid simulation response structure');
        }
    }

    async testAnalyticsDashboard() {
        const response = await this.makeRequest('/api/analytics/dashboard');
        
        if (!response.totalForecasts || !response.activeUsers || !response.topRegions) {
            throw new Error('Invalid analytics dashboard response');
        }

        if (!Array.isArray(response.topRegions) || response.topRegions.length === 0) {
            throw new Error('Top regions data is missing or invalid');
        }
    }

    async testMarketInsights() {
        const response = await this.makeRequest('/api/analytics/market-insights');
        
        if (!response.priceTrends || !response.supplyDemand || !response.alerts) {
            throw new Error('Invalid market insights response');
        }
    }

    async testExportTrends() {
        // Test JSON export
        const jsonResponse = await this.makeRequest('/api/analytics/export-trends?period=7d&format=json');
        
        if (!jsonResponse.data || !Array.isArray(jsonResponse.data)) {
            throw new Error('Invalid export trends JSON response');
        }

        // Test CSV export
        const csvResponse = await this.makeRawRequest('/api/analytics/export-trends?period=7d&format=csv');
        
        if (!csvResponse.includes('Date,Forecasts,Accuracy')) {
            throw new Error('Invalid export trends CSV response');
        }
    }

    async testStaticFiles() {
        const staticFiles = [
            '/',
            '/index.html',
            '/analytics.html',
            '/styles/main.css',
            '/app.js',
            '/analytics.js'
        ];

        for (const file of staticFiles) {
            const response = await this.makeRawRequest(file);
            if (!response || response.length === 0) {
                throw new Error(`Static file ${file} not accessible`);
            }
        }
    }

    makeRequest(path, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.baseUrl);
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => {
                    body += chunk;
                });
                res.on('end', () => {
                    try {
                        if (res.statusCode >= 400) {
                            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                            return;
                        }
                        
                        const jsonData = JSON.parse(body);
                        resolve(jsonData);
                    } catch (error) {
                        reject(new Error(`Failed to parse JSON: ${error.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Request failed: ${error.message}`));
            });

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    makeRawRequest(path) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.baseUrl);
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: 'GET'
            };

            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => {
                    body += chunk;
                });
                res.on('end', () => {
                    if (res.statusCode >= 400) {
                        reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                        return;
                    }
                    resolve(body);
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Request failed: ${error.message}`));
            });

            req.end();
        });
    }

    logResult(testName, status, icon, error = null) {
        const result = {
            test: testName,
            status: status,
            icon: icon,
            error: error,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.push(result);
        
        if (error) {
            console.log(`  ${icon} ${status}: ${error}`);
        } else {
            console.log(`  ${icon} ${status}`);
        }
        console.log('');
    }

    printSummary() {
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const total = this.testResults.length;

        console.log('📊 Test Summary');
        console.log('================');
        console.log(`Total Tests: ${total}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📈 Success Rate: ${Math.round((passed / total) * 100)}%`);
        
        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(r => r.status === 'FAIL')
                .forEach(r => {
                    console.log(`  • ${r.test}: ${r.error}`);
                });
        }

        console.log('\n🎯 Test completed at:', new Date().toLocaleString());
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new CropSenseAPITester();
    tester.runAllTests().catch(console.error);
}

module.exports = CropSenseAPITester;
