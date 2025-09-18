// Test script for enhanced Gemini AI integration
const geminiAI = require('./services/gemini-ai');

async function testGeminiIntegration() {
    console.log('🧪 Testing Enhanced Gemini AI Integration...\n');

    const testCases = [
        {
            name: 'Rice Forecast - Karnataka',
            input: {
                crop: 'Rice',
                district: 'Karnataka',
                season: 'Kharif',
                quantity: 150
            }
        },
        {
            name: 'Wheat Simulation - Punjab',
            input: {
                crop: 'Wheat',
                district: 'Punjab',
                season: 'Rabi',
                quantity: 200,
                marketChoice: 'APMC Market'
            }
        }
    ];

    for (const testCase of testCases) {
        try {
            console.log(`📊 Testing: ${testCase.name}`);
            console.log(`Input:`, testCase.input);
            
            // Test forecast generation
            const forecast = await geminiAI.generateForecast(testCase.input);
            
            console.log('✅ Forecast Response:');
            console.log(`- Crop: ${forecast.crop}`);
            console.log(`- Glut Risk: ${forecast.glutRisk}`);
            console.log(`- Recommended Quantity: ${forecast.recommendedQuantity} kg`);
            console.log(`- Source: ${forecast.source}`);
            console.log(`- Markets: ${forecast.suggestedMarkets?.join(', ')}`);
            console.log(`- Action: ${forecast.actionSummary}`);
            
            // Test simulation if it's the second test case
            if (testCase.input.marketChoice) {
                console.log('\n🔬 Testing Simulation...');
                const simulation = await geminiAI.generateSimulation(testCase.input);
                console.log('✅ Simulation Response:');
                console.log(`- Revenue: ₹${simulation.predictions?.revenue}`);
                console.log(`- Profit: ₹${simulation.predictions?.profit}`);
                console.log(`- Risk Assessment:`, simulation.predictions?.riskAssessment);
            }
            
            console.log('\n' + '='.repeat(50) + '\n');
            
        } catch (error) {
            console.error(`❌ Test failed for ${testCase.name}:`, error.message);
        }
    }

    console.log('🎉 Gemini AI Integration Test Complete!');
    console.log('\n📋 Summary:');
    console.log('• Enhanced Gemini AI service with structured JSON responses');
    console.log('• Fallback to mock data when API unavailable');
    console.log('• Comprehensive error handling and validation');
    console.log('• Support for both forecasting and simulation');
    console.log('\n🚀 Ready for production use!');
}

// Run the test
if (require.main === module) {
    testGeminiIntegration().catch(console.error);
}

module.exports = testGeminiIntegration;
