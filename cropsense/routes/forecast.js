const express = require('express');
const router = express.Router();

// Debug: Check if service exists
console.log('📋 Loading forecast routes...');
try {
    const geminiAI = require('../services/gemini-ai');
    console.log('✅ Gemini AI service loaded successfully');
} catch (error) {
    console.error('❌ Failed to load Gemini AI service:', error.message);
}

const geminiAI = require('../services/gemini-ai');

// Sample market data for demonstration (in production, this would come from real APIs)
const SAMPLE_MARKETS = {
  'Karnataka': [
    { name: 'Bangalore APMC', lat: 12.9716, lng: 77.5946, demand: 'high' },
    { name: 'Mysore Market', lat: 12.2958, lng: 76.6394, demand: 'medium' },
    { name: 'Hubli APMC', lat: 15.3647, lng: 75.1240, demand: 'low' },
    { name: 'Mangalore Market', lat: 12.9141, lng: 74.8560, demand: 'high' }
  ],
  'Maharashtra': [
    { name: 'Mumbai APMC', lat: 19.0760, lng: 72.8777, demand: 'high' },
    { name: 'Pune Market', lat: 18.5204, lng: 73.8567, demand: 'medium' },
    { name: 'Nashik APMC', lat: 19.9975, lng: 73.7898, demand: 'low' },
    { name: 'Nagpur Market', lat: 21.1458, lng: 79.0882, demand: 'medium' }
  ],
  'Tamil Nadu': [
    { name: 'Chennai Koyambedu', lat: 13.0827, lng: 80.2707, demand: 'high' },
    { name: 'Coimbatore Market', lat: 11.0168, lng: 76.9558, demand: 'medium' },
    { name: 'Madurai APMC', lat: 9.9252, lng: 78.1198, demand: 'low' },
    { name: 'Salem Market', lat: 11.6643, lng: 78.1460, demand: 'medium' }
  ]
};

// Forecast endpoint using enhanced Gemini AI service
router.post('/forecast', async (req, res) => {
  try {
    const { crop, district, season, quantity = 100 } = req.body;

    // Validate input
    if (!crop || !district || !season) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['crop', 'district', 'season']
      });
    }

    console.log(`📊 Processing forecast request: ${crop} in ${district} (${season} season)`);

    // Check if geminiAI service is available
    if (!geminiAI) {
      throw new Error('Gemini AI service not available');
    }

    // Use the enhanced Gemini AI service
    const forecastData = await geminiAI.generateForecast({
      crop,
      district,
      season,
      quantity
    });

    // Add additional market data for compatibility
    const markets = SAMPLE_MARKETS[district] || SAMPLE_MARKETS['Karnataka'];
    forecastData.markets = markets;

    console.log(`✅ Forecast generated successfully for ${crop}`);
    res.json(forecastData);

  } catch (error) {
    console.error('❌ Forecast API error:', error);
    
    // Provide fallback with mock data
    try {
      console.log('🔄 Attempting fallback with mock data...');
      const mockForecast = generateMockForecast(
        req.body.crop || 'Rice',
        req.body.district || 'Karnataka', 
        req.body.season || 'Kharif',
        req.body.quantity || 100
      );
      
      res.json({
        ...mockForecast,
        warning: 'Using fallback data due to service error',
        error_details: error.message
      });
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
      res.status(500).json({
        error: 'Failed to generate forecast',
        message: error.message,
        fallback_error: fallbackError.message
      });
    }
  }
});

// Scenario simulation endpoint using enhanced Gemini AI service
router.post('/simulate', async (req, res) => {
  try {
    const { crop, district, season, quantity, marketChoice } = req.body;

    if (!crop || !district || !season || !quantity) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['crop', 'district', 'season', 'quantity']
      });
    }

    console.log(`🔬 Processing simulation request: ${quantity}kg ${crop} in ${district}`);

    // Use the enhanced Gemini AI service for simulation
    const simulationData = await geminiAI.generateSimulation({
      crop,
      district,
      season,
      quantity,
      marketChoice
    });

    console.log(`✅ Simulation generated successfully for ${crop}`);
    res.json(simulationData);

  } catch (error) {
    console.error('❌ Simulation API error:', error);
    res.status(500).json({ 
      error: 'Simulation failed',
      message: error.message 
    });
  }
});

// Helper function to generate mock forecast data
function generateMockForecast(crop, district, season, quantity) {
  const basePrice = Math.random() * 30 + 15; // Random base price
  const demandBase = Math.random() * 50 + 50; // Random demand base
  
  // Generate trend data
  const generate7Day = (base, variance = 10) => 
    Array.from({ length: 7 }, (_, i) => Math.round(base + (Math.random() - 0.5) * variance + i * 2));
  
  const generate14Day = (base, variance = 15) => 
    Array.from({ length: 14 }, (_, i) => Math.round(base + (Math.random() - 0.5) * variance + i * 1.5));
  
  const generate30Day = (base, variance = 20) => 
    Array.from({ length: 30 }, (_, i) => Math.round(base + (Math.random() - 0.5) * variance + i));

  const glutRisks = ['low', 'medium', 'high'];
  const glutRisk = glutRisks[Math.floor(Math.random() * glutRisks.length)];

  return {
    demandTrend: {
      '7day': generate7Day(demandBase, 8),
      '14day': generate14Day(demandBase, 12),
      '30day': generate30Day(demandBase, 15)
    },
    priceTrend: {
      '7day': generate7Day(basePrice, 3),
      '14day': generate14Day(basePrice, 5),
      '30day': generate30Day(basePrice, 7)
    },
    glutRisk,
    recommendations: {
      sowingTime: `Optimal sowing for ${crop} in ${district} is 2-3 weeks into ${season} season`,
      sellingTime: `Best selling window is 45-60 days after harvest`,
      marketStrategy: `Focus on ${glutRisk === 'low' ? 'local markets' : 'diversified regional markets'}`,
      actions: [
        `Plant ${quantity}kg of ${crop} in phases`,
        `Monitor weather patterns closely`,
        `Establish contracts with 2-3 buyers`,
        `Consider value-addition if glut risk is high`
      ]
    },
    marketAnalysis: {
      expectedDemand: `${Math.round((Math.random() - 0.5) * 40)}%`,
      competitionLevel: glutRisk === 'high' ? 'high' : glutRisk === 'medium' ? 'medium' : 'low',
      seasonalFactors: `${season} season typically shows ${glutRisk === 'low' ? 'stable' : 'volatile'} pricing for ${crop}`
    },
    markets: SAMPLE_MARKETS[district] || SAMPLE_MARKETS['Karnataka'],
    metadata: {
      crop,
      district,
      season,
      quantity,
      timestamp: new Date().toISOString(),
      source: 'mock-data'
    }
  };
}

module.exports = router;
