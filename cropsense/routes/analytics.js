const express = require('express');
const router = express.Router();

// Analytics endpoint for dashboard insights
router.get('/dashboard', async (req, res) => {
    try {
        // Simulate analytics data (in production, this would come from database)
        const analytics = {
            totalForecasts: Math.floor(Math.random() * 1000) + 500,
            activeUsers: Math.floor(Math.random() * 100) + 50,
            successfulPredictions: Math.floor(Math.random() * 95) + 85, // percentage
            
            // Regional data
            topRegions: [
                { name: 'Karnataka', forecasts: 245, accuracy: 92 },
                { name: 'Maharashtra', forecasts: 198, accuracy: 89 },
                { name: 'Tamil Nadu', forecasts: 167, accuracy: 91 },
                { name: 'Punjab', forecasts: 134, accuracy: 94 },
                { name: 'Haryana', forecasts: 112, accuracy: 88 }
            ],
            
            // Crop popularity
            topCrops: [
                { name: 'Rice', forecasts: 189, trend: 'up' },
                { name: 'Wheat', forecasts: 156, trend: 'stable' },
                { name: 'Maize', forecasts: 134, trend: 'up' },
                { name: 'Cotton', forecasts: 98, trend: 'down' },
                { name: 'Sugarcane', forecasts: 87, trend: 'stable' }
            ],
            
            // Market trends
            marketTrends: {
                demandGrowth: '+12.5%',
                priceStability: '89%',
                glutPrevention: '76%',
                farmerSatisfaction: '4.2/5'
            },
            
            // Seasonal insights
            seasonalData: {
                kharif: { forecasts: 342, accuracy: 91 },
                rabi: { forecasts: 298, accuracy: 89 },
                zaid: { forecasts: 156, accuracy: 87 }
            },
            
            // Recent activity
            recentActivity: [
                {
                    type: 'forecast',
                    crop: 'Rice',
                    region: 'Karnataka',
                    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
                    risk: 'low'
                },
                {
                    type: 'simulation',
                    crop: 'Wheat',
                    region: 'Punjab',
                    timestamp: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
                    risk: 'medium'
                },
                {
                    type: 'forecast',
                    crop: 'Maize',
                    region: 'Maharashtra',
                    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
                    risk: 'high'
                }
            ],
            
            timestamp: new Date().toISOString()
        };
        
        res.json(analytics);
        
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
});

// Market insights endpoint
router.get('/market-insights', async (req, res) => {
    try {
        const insights = {
            // Price trends
            priceTrends: {
                rice: { current: 28.5, change: '+2.3%', trend: 'up' },
                wheat: { current: 22.1, change: '-1.2%', trend: 'down' },
                maize: { current: 19.8, change: '+0.8%', trend: 'stable' },
                cotton: { current: 45.2, change: '+5.1%', trend: 'up' }
            },
            
            // Supply-demand balance
            supplyDemand: {
                oversupply: ['Cotton', 'Sugarcane'],
                balanced: ['Rice', 'Wheat', 'Maize'],
                shortage: ['Pulses', 'Groundnut']
            },
            
            // Market alerts
            alerts: [
                {
                    type: 'warning',
                    message: 'Cotton prices rising rapidly in Maharashtra',
                    severity: 'medium',
                    timestamp: new Date().toISOString()
                },
                {
                    type: 'info',
                    message: 'Good demand for Rice in Karnataka markets',
                    severity: 'low',
                    timestamp: new Date().toISOString()
                }
            ],
            
            // Weather impact
            weatherImpact: {
                positive: ['Karnataka', 'Tamil Nadu'],
                neutral: ['Maharashtra', 'Punjab'],
                negative: ['Rajasthan', 'Gujarat']
            },
            
            timestamp: new Date().toISOString()
        };
        
        res.json(insights);
        
    } catch (error) {
        console.error('Market insights error:', error);
        res.status(500).json({ error: 'Failed to fetch market insights' });
    }
});

// Export trends endpoint
router.get('/export-trends', async (req, res) => {
    try {
        const { period = '30d', format = 'json' } = req.query;
        
        // Generate trend data based on period
        const days = period === '7d' ? 7 : period === '14d' ? 14 : 30;
        const trendData = Array.from({ length: days }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (days - i - 1));
            
            return {
                date: date.toISOString().split('T')[0],
                forecasts: Math.floor(Math.random() * 50) + 20,
                accuracy: Math.floor(Math.random() * 20) + 80,
                glutPrevention: Math.floor(Math.random() * 30) + 60
            };
        });
        
        const exportData = {
            period,
            data: trendData,
            summary: {
                totalForecasts: trendData.reduce((sum, day) => sum + day.forecasts, 0),
                averageAccuracy: Math.round(trendData.reduce((sum, day) => sum + day.accuracy, 0) / days),
                glutPreventionRate: Math.round(trendData.reduce((sum, day) => sum + day.glutPrevention, 0) / days)
            },
            generatedAt: new Date().toISOString()
        };
        
        if (format === 'csv') {
            // Convert to CSV format
            const csvHeader = 'Date,Forecasts,Accuracy,Glut Prevention\n';
            const csvData = trendData.map(row => 
                `${row.date},${row.forecasts},${row.accuracy},${row.glutPrevention}`
            ).join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=cropsense_trends_${period}.csv`);
            res.send(csvHeader + csvData);
        } else {
            res.json(exportData);
        }
        
    } catch (error) {
        console.error('Export trends error:', error);
        res.status(500).json({ error: 'Failed to export trend data' });
    }
});

module.exports = router;
