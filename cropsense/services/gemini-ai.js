// Enhanced Gemini AI Service for CropSense
const { GoogleGenAI } = require('@google/genai');

class GeminiAIService {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        this.ai = null;
        this.isAvailable = false;

        this.init();
    }

    init() {
        if (this.apiKey) {
            try {
                this.ai = new GoogleGenAI({
                    apiKey: this.apiKey,
                });
                this.isAvailable = true;
                console.log('✅ Gemini AI service initialized successfully');
            } catch (error) {
                console.warn('⚠️ Gemini AI initialization failed:', error.message);
                this.isAvailable = false;
            }
        } else {
            console.warn('⚠️ GEMINI_API_KEY not found. Using mock data.');
            this.isAvailable = false;
        }
    }

    async generateForecast(inputData) {
        console.log('🔍 Generating forecast for:', inputData);

        if (!this.isAvailable) {
            console.log('📊 Using mock forecast data (Gemini AI not available)');
            return this.generateMockForecast(inputData);
        }

        try {
            const config = {
                thinkingConfig: {
                    thinkingBudget: 1000,  // Reduced for faster responses
                },
                systemInstruction: [
                    {
                        text: "You are CropSense AI. Respond with ONLY valid JSON, no extra text. Generate a quick crop forecast with these exact keys: forecast_trend (array of 7 objects with date, expected_demand_kg, expected_price_per_kg), glut_risk ('Low'/'Medium'/'High'), optimal_planting_time (YYYY-MM-DD), optimal_selling_time (YYYY-MM-DD), recommended_quantity_kg (number), suggested_markets (array of 2-3 market names), action_summary (brief practical advice). Use realistic Indian market data. Be fast and concise."
                    }
                ],
            };

            const model = 'gemini-2.5-pro';
            const inputText = JSON.stringify({
                crop: inputData.crop,
                district: inputData.district,
                season: inputData.season,
                quantity: inputData.quantity || 100,
                scenario: inputData.scenario || 'standard'
            });

            const contents = [
                {
                    role: 'user',
                    parts: [
                        {
                            text: inputText,
                        },
                    ],
                },
            ];

            console.log('🤖 Generating AI forecast for:', inputText);

            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('AI request timeout after 15 seconds')), 15000);
            });

            const aiPromise = (async () => {
                const response = await this.ai.models.generateContentStream({
                    model,
                    config,
                    contents,
                });

                let fullResponse = '';
                for await (const chunk of response) {
                    if (chunk.text) {
                        fullResponse += chunk.text;
                    }
                }
                return fullResponse;
            })();

            const fullResponse = await Promise.race([aiPromise, timeoutPromise]);

            console.log('📊 Raw AI response:', fullResponse);

            // Parse the JSON response
            const cleanedResponse = this.cleanJsonResponse(fullResponse);
            const forecastData = JSON.parse(cleanedResponse);

            // Validate the response structure
            this.validateForecastData(forecastData);

            console.log('✅ AI forecast generated successfully');
            return this.formatForecastResponse(forecastData, inputData);

        } catch (error) {
            console.error('❌ Gemini AI forecast error:', error.message);
            console.log('📊 Falling back to mock forecast data');

            // Always return mock data on error to ensure the app works
            return this.generateMockForecast(inputData);
        }
    }

    cleanJsonResponse(response) {
        // Remove any markdown formatting or extra text
        let cleaned = response.trim();

        // Remove markdown code blocks
        cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '');

        // Find the JSON object (starts with { and ends with })
        const startIndex = cleaned.indexOf('{');
        const lastIndex = cleaned.lastIndexOf('}');

        if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
            cleaned = cleaned.substring(startIndex, lastIndex + 1);
        }

        return cleaned;
    }

    validateForecastData(data) {
        // Basic validation of AI response structure
        const requiredFields = ['forecast_trend', 'glut_risk'];
        
        for (const field of requiredFields) {
            if (!data[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        if (!Array.isArray(data.forecast_trend) || data.forecast_trend.length === 0) {
            throw new Error('forecast_trend must be a non-empty array');
        }

        if (!['Low', 'Medium', 'High'].includes(data.glut_risk)) {
            throw new Error('glut_risk must be Low, Medium, or High');
        }
    }


    formatForecastResponse(aiData, inputData) {
        // Convert AI response to CropSense format
        const demandTrend = {
            '7day': aiData.forecast_trend.slice(0, 7).map(item => item.expected_demand_kg),
            '14day': aiData.forecast_trend.slice(0, 14).map(item => item.expected_demand_kg),
            '30day': aiData.forecast_trend.map(item => item.expected_demand_kg)
        };

        const priceTrend = {
            '7day': aiData.forecast_trend.slice(0, 7).map(item => item.expected_price_per_kg),
            '14day': aiData.forecast_trend.slice(0, 14).map(item => item.expected_price_per_kg),
            '30day': aiData.forecast_trend.map(item => item.expected_price_per_kg)
        };

        return {
            success: true,
            crop: inputData.crop,
            district: inputData.district,
            season: inputData.season,
            quantity: inputData.quantity,
            demandTrend: demandTrend,
            priceTrend: priceTrend,
            glutRisk: aiData.glut_risk.toLowerCase(),
            optimalPlantingTime: aiData.optimal_planting_time,
            optimalSellingTime: aiData.optimal_selling_time,
            recommendedQuantity: aiData.recommended_quantity_kg,
            suggestedMarkets: aiData.suggested_markets,
            actionSummary: aiData.action_summary,
            recommendations: {
                sowingTime: `Optimal sowing for ${inputData.crop} in ${inputData.district} is ${new Date(aiData.optimal_planting_time).toLocaleDateString()}`,
                sellingTime: `Best selling window is ${new Date(aiData.optimal_selling_time).toLocaleDateString()}`,
                marketStrategy: aiData.action_summary,
                actions: [
                    `🌱 Optimal planting time: ${new Date(aiData.optimal_planting_time).toLocaleDateString()}`,
                    `💰 Best selling period: ${new Date(aiData.optimal_selling_time).toLocaleDateString()}`,
                    `📊 Recommended quantity: ${aiData.recommended_quantity_kg} kg`,
                    `🏪 Suggested markets: ${aiData.suggested_markets.join(', ')}`,
                    `⚠️ Glut risk: ${aiData.glut_risk}`
                ]
            },
            markets: this.generateMarketHeatmap(aiData.suggested_markets),
            marketHeatmap: this.generateMarketHeatmap(aiData.suggested_markets),
            metadata: {
                crop: inputData.crop,
                district: inputData.district,
                season: inputData.season,
                quantity: inputData.quantity,
                timestamp: new Date().toISOString(),
                source: 'gemini-ai'
            },
            timestamp: new Date().toISOString(),
            source: 'gemini-ai'
        };
    }

    generateMarketHeatmap(suggestedMarkets) {
        // Generate market heatmap data based on suggested markets
        const marketData = [];
        const baseCoordinates = {
            'KR Market': [12.9716, 77.5946],
            'Yeshwantpur Market': [13.0283, 77.5546],
            'Bangalore Central Market': [12.9716, 77.5946],
            'Mysore Market': [12.2958, 76.6394],
            'Hubli Market': [15.3647, 75.1240],
            'Mangalore Market': [12.9141, 74.8560]
        };

        suggestedMarkets.forEach((market, index) => {
            const coords = baseCoordinates[market] || [12.9716 + (Math.random() - 0.5) * 2, 77.5946 + (Math.random() - 0.5) * 2];
            marketData.push({
                name: market,
                lat: coords[0],
                lng: coords[1],
                demand: 'high',
                price: 25 + Math.random() * 15,
                risk: index === 0 ? 'low' : 'medium'
            });
        });

        return marketData;
    }

    generateMockForecast(inputData) {
        console.log('🚀 Generating fast mock forecast...');

        // Quick crop data lookup
        const crops = {
            'Rice': { basePrice: 25, volatility: 0.1, demandMultiplier: 1.2 },
            'Wheat': { basePrice: 22, volatility: 0.08, demandMultiplier: 1.1 },
            'Maize': { basePrice: 18, volatility: 0.12, demandMultiplier: 1.0 },
            'Cotton': { basePrice: 45, volatility: 0.15, demandMultiplier: 0.9 },
            'Sugarcane': { basePrice: 3, volatility: 0.05, demandMultiplier: 1.3 },
            'Tomato': { basePrice: 35, volatility: 0.2, demandMultiplier: 1.1 },
            'Onion': { basePrice: 20, volatility: 0.18, demandMultiplier: 1.0 },
            'Potato': { basePrice: 15, volatility: 0.12, demandMultiplier: 1.1 }
        };

        const cropData = crops[inputData.crop] || crops['Rice'];
        const baseQuantity = inputData.quantity || 100;

        // Generate optimized trend data (only what we need)
        const demandTrend = { '7day': [], '14day': [], '30day': [] };
        const priceTrend = { '7day': [], '14day': [], '30day': [] };

        // Pre-calculate base values
        const baseDemand = Math.round(baseQuantity * cropData.demandMultiplier);
        const basePrice = cropData.basePrice;

        // Generate 30 days efficiently
        for (let i = 0; i < 30; i++) {
            const dayFactor = 1 + (Math.sin(i / 7) * 0.1);
            const randomFactor = 1 + (Math.random() - 0.5) * cropData.volatility;

            const demand = Math.round(baseDemand * dayFactor * randomFactor);
            const price = Math.round(basePrice * randomFactor * 100) / 100;

            demandTrend['30day'].push(demand);
            priceTrend['30day'].push(price);

            if (i < 14) {
                demandTrend['14day'].push(demand);
                priceTrend['14day'].push(price);
            }
            if (i < 7) {
                demandTrend['7day'].push(demand);
                priceTrend['7day'].push(price);
            }
        }

        // Determine glut risk based on quantity vs average demand
        const avgDemand = demandTrend['30day'].reduce((a, b) => a + b, 0) / 30;
        let glutRisk = 'low';
        if (baseQuantity > avgDemand * 1.5) glutRisk = 'high';
        else if (baseQuantity > avgDemand * 1.2) glutRisk = 'medium';

        // Generate market suggestions based on district
        const marketsByDistrict = {
            'Karnataka': ['KR Market', 'Yeshwantpur Market', 'Bangalore Central Market'],
            'Maharashtra': ['Crawford Market', 'Pune Market', 'Nashik Market'],
            'Tamil Nadu': ['Koyambedu Market', 'Chennai Central Market', 'Coimbatore Market'],
            'Punjab': ['Ludhiana Market', 'Amritsar Market', 'Jalandhar Market'],
            'Haryana': ['Gurgaon Market', 'Faridabad Market', 'Panipat Market']
        };

        const suggestedMarkets = marketsByDistrict[inputData.district] ||
            marketsByDistrict['Karnataka'];

        const today = new Date();
        const plantingDate = new Date(today);
        plantingDate.setDate(today.getDate() + 7);

        const sellingDate = new Date(plantingDate);
        sellingDate.setDate(plantingDate.getDate() + 90); // 3 months growing period

        return {
            success: true,
            crop: inputData.crop,
            district: inputData.district,
            season: inputData.season,
            quantity: baseQuantity,
            demandTrend: demandTrend,
            priceTrend: priceTrend,
            glutRisk: glutRisk,
            optimalPlantingTime: plantingDate.toISOString().split('T')[0],
            optimalSellingTime: sellingDate.toISOString().split('T')[0],
            recommendedQuantity: Math.round(avgDemand * 0.9),
            suggestedMarkets: suggestedMarkets,
            actionSummary: `Plant ${Math.round(avgDemand * 0.9)} kg of ${inputData.crop}. Sell at ${suggestedMarkets.slice(0, 2).join(' and ')} markets around ${sellingDate.toLocaleDateString()} to minimize glut risk.`,
            recommendations: [
                `🌱 Start planting around ${plantingDate.toLocaleDateString()}`,
                `💰 Best selling period: ${sellingDate.toLocaleDateString()}`,
                `📊 Recommended quantity: ${Math.round(avgDemand * 0.9)} kg`,
                `🏪 Focus on ${suggestedMarkets.slice(0, 2).join(' and ')} markets`,
                `⚠️ Glut risk: ${glutRisk.charAt(0).toUpperCase() + glutRisk.slice(1)}`
            ],
            marketHeatmap: this.generateMarketHeatmap(suggestedMarkets),
            timestamp: new Date().toISOString(),
            source: 'mock-data'
        };
    }

    async generateSimulation(inputData) {
        // Use the same forecast generation but with scenario-specific adjustments
        const baseInput = {
            ...inputData,
            scenario: 'simulation'
        };

        const forecast = await this.generateForecast(baseInput);

        // Add simulation-specific data
        return {
            ...forecast,
            simulationType: 'scenario-analysis',
            marketChoice: inputData.marketChoice || 'Local Market',
            predictions: {
                revenue: this.calculateRevenue(forecast, inputData),
                profit: this.calculateProfit(forecast, inputData),
                riskAssessment: this.assessRisk(forecast, inputData)
            }
        };
    }

    calculateRevenue(forecast, inputData) {
        const avgPrice = forecast.priceTrend['30day'].reduce((a, b) => a + b, 0) / 30;
        const quantity = inputData.quantity || forecast.recommendedQuantity;
        return Math.round(avgPrice * quantity);
    }

    calculateProfit(forecast, inputData) {
        const revenue = this.calculateRevenue(forecast, inputData);
        const costs = (inputData.quantity || forecast.recommendedQuantity) * 10; // Estimated cost per kg
        return Math.round(revenue - costs);
    }

    assessRisk(forecast, inputData) {
        const riskFactors = {
            glutRisk: forecast.glutRisk,
            marketVolatility: this.calculateVolatility(forecast.priceTrend['30day']),
            seasonalFactor: inputData.season === 'Kharif' ? 'medium' : 'low'
        };

        return riskFactors;
    }

    calculateVolatility(prices) {
        const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
        const variance = prices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / prices.length;
        const stdDev = Math.sqrt(variance);
        const volatility = stdDev / mean;

        if (volatility > 0.15) return 'high';
        if (volatility > 0.08) return 'medium';
        return 'low';
    }
}

module.exports = new GeminiAIService();
