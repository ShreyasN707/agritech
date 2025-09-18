// CropSense Analytics Dashboard
class AnalyticsDashboard {
    constructor() {
        this.charts = {};
        this.currentPeriod = '30d';
        this.analyticsData = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadAnalyticsData();
        this.setupAutoRefresh();
    }

    setupEventListeners() {
        // Chart period buttons
        document.querySelectorAll('.chart-period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handlePeriodChange(e));
        });

        // Export buttons
        document.getElementById('export-analytics-json').addEventListener('click', () => this.exportJSON());
        document.getElementById('export-analytics-csv').addEventListener('click', () => this.exportCSV());
        document.getElementById('export-analytics-pdf').addEventListener('click', () => this.exportPDF());
    }

    async loadAnalyticsData() {
        try {
            this.showLoading(true);
            
            // Load dashboard analytics
            console.log('Loading analytics data...');
            
            const dashboardResponse = await fetch('/api/analytics/dashboard');
            if (!dashboardResponse.ok) {
                throw new Error(`Dashboard API failed: ${dashboardResponse.status}`);
            }
            const dashboardData = await dashboardResponse.json();
            
            const insightsResponse = await fetch('/api/analytics/market-insights');
            if (!insightsResponse.ok) {
                throw new Error(`Market insights API failed: ${insightsResponse.status}`);
            }
            const marketInsights = await insightsResponse.json();
            
            this.analyticsData = { ...dashboardData, marketInsights };
            
            console.log('Analytics data loaded successfully:', this.analyticsData);
            
            // Update UI
            this.updateOverviewCards(dashboardData);
            this.createCharts(dashboardData);
            this.updateInsights(dashboardData, marketInsights);
            
        } catch (error) {
            console.error('Failed to load analytics:', error);
            this.showError(`Failed to load analytics data: ${error.message}`);
            
            // Load with mock data as fallback
            this.loadMockData();
        } finally {
            this.showLoading(false);
        }
    }

    loadMockData() {
        console.log('Loading mock analytics data...');
        
        const mockDashboardData = {
            totalForecasts: 1247,
            activeUsers: 89,
            successfulPredictions: 92,
            topRegions: [
                { name: 'Karnataka', forecasts: 245, accuracy: 92 },
                { name: 'Maharashtra', forecasts: 198, accuracy: 89 },
                { name: 'Tamil Nadu', forecasts: 167, accuracy: 91 },
                { name: 'Punjab', forecasts: 134, accuracy: 94 },
                { name: 'Haryana', forecasts: 112, accuracy: 88 }
            ],
            topCrops: [
                { name: 'Rice', forecasts: 189, trend: 'up' },
                { name: 'Wheat', forecasts: 156, trend: 'stable' },
                { name: 'Maize', forecasts: 134, trend: 'up' },
                { name: 'Cotton', forecasts: 98, trend: 'down' },
                { name: 'Sugarcane', forecasts: 87, trend: 'stable' }
            ],
            marketTrends: {
                demandGrowth: '+12.5%',
                priceStability: '89%',
                glutPrevention: '76%',
                farmerSatisfaction: '4.2/5'
            },
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
                }
            ]
        };

        const mockMarketInsights = {
            alerts: [
                {
                    type: 'info',
                    message: 'Good demand for Rice in Karnataka markets',
                    severity: 'low',
                    timestamp: new Date().toISOString()
                }
            ]
        };

        this.analyticsData = { ...mockDashboardData, marketInsights: mockMarketInsights };
        
        // Update UI with mock data
        this.updateOverviewCards(mockDashboardData);
        this.createCharts(mockDashboardData);
        this.updateInsights(mockDashboardData, mockMarketInsights);
        
        this.showInfo('Using demo analytics data');
    }

    updateOverviewCards(data) {
        document.getElementById('total-forecasts').textContent = data.totalForecasts.toLocaleString();
        document.getElementById('active-users').textContent = data.activeUsers.toLocaleString();
        document.getElementById('prediction-accuracy').textContent = `${data.successfulPredictions}%`;
        document.getElementById('glut-prevention').textContent = `${data.marketTrends.glutPrevention}`;
    }

    createCharts(data) {
        this.createRegionalChart(data.topRegions);
        this.createCropChart(data.topCrops);
        this.createTrendsChart();
    }

    createRegionalChart(regions) {
        const ctx = document.getElementById('regional-chart').getContext('2d');
        
        if (this.charts.regional) {
            this.charts.regional.destroy();
        }

        this.charts.regional = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: regions.map(r => r.name),
                datasets: [
                    {
                        label: 'Forecasts',
                        data: regions.map(r => r.forecasts),
                        backgroundColor: 'rgba(76, 175, 80, 0.8)',
                        borderColor: 'rgba(76, 175, 80, 1)',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Accuracy (%)',
                        data: regions.map(r => r.accuracy),
                        backgroundColor: 'rgba(33, 150, 243, 0.8)',
                        borderColor: 'rgba(33, 150, 243, 1)',
                        borderWidth: 1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 1.8,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Number of Forecasts'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Accuracy (%)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                        min: 80,
                        max: 100
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Regional Performance Metrics'
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
    }

    createCropChart(crops) {
        const ctx = document.getElementById('crop-chart').getContext('2d');
        
        if (this.charts.crop) {
            this.charts.crop.destroy();
        }

        const trendColors = crops.map(crop => {
            switch(crop.trend) {
                case 'up': return 'rgba(76, 175, 80, 0.8)';
                case 'down': return 'rgba(244, 67, 54, 0.8)';
                default: return 'rgba(255, 152, 0, 0.8)';
            }
        });

        this.charts.crop = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: crops.map(c => `${getCropIcon(c.name)} ${c.name}`),
                datasets: [{
                    data: crops.map(c => c.forecasts),
                    backgroundColor: trendColors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 1.2,
                plugins: {
                    title: {
                        display: true,
                        text: 'Crop Forecast Distribution'
                    },
                    legend: {
                        display: true,
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const crop = crops[context.dataIndex];
                                const trendIcon = crop.trend === 'up' ? '📈' : crop.trend === 'down' ? '📉' : '➡️';
                                return `${context.label}: ${context.parsed} forecasts ${trendIcon}`;
                            }
                        }
                    }
                }
            }
        });
    }

    async createTrendsChart() {
        try {
            const response = await fetch(`/api/analytics/export-trends?period=${this.currentPeriod}&format=json`);
            const trendsData = await response.json();
            
            const ctx = document.getElementById('trends-chart').getContext('2d');
            
            if (this.charts.trends) {
                this.charts.trends.destroy();
            }

            this.charts.trends = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: trendsData.data.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                    datasets: [
                        {
                            label: 'Daily Forecasts',
                            data: trendsData.data.map(d => d.forecasts),
                            borderColor: 'rgba(76, 175, 80, 1)',
                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                            tension: 0.4,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Accuracy (%)',
                            data: trendsData.data.map(d => d.accuracy),
                            borderColor: 'rgba(33, 150, 243, 1)',
                            backgroundColor: 'rgba(33, 150, 243, 0.1)',
                            tension: 0.4,
                            yAxisID: 'y1'
                        },
                        {
                            label: 'Glut Prevention (%)',
                            data: trendsData.data.map(d => d.glutPrevention),
                            borderColor: 'rgba(255, 152, 0, 1)',
                            backgroundColor: 'rgba(255, 152, 0, 0.1)',
                            tension: 0.4,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    aspectRatio: 2.5,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    scales: {
                        x: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Date'
                            }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Number of Forecasts'
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: 'Percentage (%)'
                            },
                            grid: {
                                drawOnChartArea: false,
                            },
                            min: 0,
                            max: 100
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: `Performance Trends (${this.currentPeriod.toUpperCase()})`
                        },
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    }
                }
            });
            
        } catch (error) {
            console.error('Failed to load trends data:', error);
        }
    }

    updateInsights(dashboardData, marketInsights) {
        this.updateMarketAlerts(marketInsights.alerts);
        this.updateTopRegions(dashboardData.topRegions);
        this.updateRecentActivity(dashboardData.recentActivity);
    }

    updateMarketAlerts(alerts) {
        const container = document.getElementById('market-alerts');
        
        if (!alerts || alerts.length === 0) {
            container.innerHTML = '<p class="text-center">No active alerts</p>';
            return;
        }

        container.innerHTML = alerts.map(alert => {
            const icon = alert.type === 'warning' ? '⚠️' : alert.type === 'error' ? '🚨' : 'ℹ️';
            const timeAgo = this.getTimeAgo(new Date(alert.timestamp));
            
            return `
                <div class="alert-item ${alert.type}">
                    <div class="alert-icon">${icon}</div>
                    <div class="alert-content">
                        <h5>${alert.type.charAt(0).toUpperCase() + alert.type.slice(1)} Alert</h5>
                        <p>${alert.message}</p>
                        <div class="alert-time">${timeAgo}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateTopRegions(regions) {
        const container = document.getElementById('top-regions');
        
        container.innerHTML = regions.map((region, index) => `
            <div class="ranking-item">
                <div class="ranking-position">${index + 1}</div>
                <div class="ranking-info">
                    <h5>${region.name}</h5>
                    <p>${region.forecasts} forecasts</p>
                </div>
                <div class="ranking-score">${region.accuracy}%</div>
            </div>
        `).join('');
    }

    updateRecentActivity(activities) {
        const container = document.getElementById('recent-activity');
        
        container.innerHTML = activities.map(activity => {
            const icon = activity.type === 'forecast' ? '📊' : '🔬';
            const timeAgo = this.getTimeAgo(new Date(activity.timestamp));
            const riskColor = activity.risk === 'low' ? '🟢' : activity.risk === 'medium' ? '🟡' : '🔴';
            
            return `
                <div class="activity-item">
                    <div class="activity-icon">${icon}</div>
                    <div class="activity-content">
                        <h5>${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} - ${activity.crop}</h5>
                        <p>${activity.region} • Risk: ${riskColor} ${activity.risk}</p>
                    </div>
                    <div class="activity-time">${timeAgo}</div>
                </div>
            `;
        }).join('');
    }

    handlePeriodChange(e) {
        const period = e.target.dataset.period;
        this.currentPeriod = period;
        
        // Update active button
        document.querySelectorAll('.chart-period-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
        
        // Recreate trends chart
        this.createTrendsChart();
    }

    async exportJSON() {
        try {
            const period = document.getElementById('export-period').value;
            const response = await fetch(`/api/analytics/export-trends?period=${period}&format=json`);
            const data = await response.json();
            
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `cropsense_analytics_${period}_${Date.now()}.json`;
            link.click();
            
            this.showSuccess('Analytics data exported as JSON');
            
        } catch (error) {
            console.error('Export error:', error);
            this.showError('Failed to export JSON data');
        }
    }

    async exportCSV() {
        try {
            const period = document.getElementById('export-period').value;
            const response = await fetch(`/api/analytics/export-trends?period=${period}&format=csv`);
            const csvData = await response.text();
            
            const dataBlob = new Blob([csvData], { type: 'text/csv' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `cropsense_analytics_${period}_${Date.now()}.csv`;
            link.click();
            
            this.showSuccess('Analytics data exported as CSV');
            
        } catch (error) {
            console.error('Export error:', error);
            this.showError('Failed to export CSV data');
        }
    }

    exportPDF() {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Title
            doc.setFontSize(20);
            doc.text('CropSense Analytics Report', 20, 30);
            
            // Date
            doc.setFontSize(12);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
            
            // Overview Stats
            let yPos = 65;
            doc.setFontSize(16);
            doc.text('Overview Statistics', 20, yPos);
            
            yPos += 20;
            doc.setFontSize(12);
            if (this.analyticsData) {
                doc.text(`Total Forecasts: ${this.analyticsData.totalForecasts}`, 20, yPos);
                doc.text(`Active Users: ${this.analyticsData.activeUsers}`, 20, yPos + 10);
                doc.text(`Prediction Accuracy: ${this.analyticsData.successfulPredictions}%`, 20, yPos + 20);
                doc.text(`Glut Prevention Rate: ${this.analyticsData.marketTrends.glutPrevention}`, 20, yPos + 30);
            }
            
            // Top Regions
            yPos += 60;
            doc.setFontSize(16);
            doc.text('Top Performing Regions', 20, yPos);
            
            yPos += 20;
            doc.setFontSize(12);
            if (this.analyticsData && this.analyticsData.topRegions) {
                this.analyticsData.topRegions.slice(0, 5).forEach((region, index) => {
                    doc.text(`${index + 1}. ${region.name} - ${region.forecasts} forecasts (${region.accuracy}% accuracy)`, 20, yPos + (index * 10));
                });
            }
            
            // Market Trends
            yPos += 80;
            doc.setFontSize(16);
            doc.text('Market Trends', 20, yPos);
            
            yPos += 20;
            doc.setFontSize(12);
            if (this.analyticsData && this.analyticsData.marketTrends) {
                const trends = this.analyticsData.marketTrends;
                doc.text(`Demand Growth: ${trends.demandGrowth}`, 20, yPos);
                doc.text(`Price Stability: ${trends.priceStability}`, 20, yPos + 10);
                doc.text(`Farmer Satisfaction: ${trends.farmerSatisfaction}`, 20, yPos + 20);
            }
            
            doc.save(`cropsense_analytics_report_${Date.now()}.pdf`);
            this.showSuccess('Analytics report exported as PDF');
            
        } catch (error) {
            console.error('PDF export error:', error);
            this.showError('Failed to export PDF report');
        }
    }

    setupAutoRefresh() {
        // Refresh data every 5 minutes
        setInterval(() => {
            this.loadAnalyticsData();
        }, 5 * 60 * 1000);
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    }

    showLoading(show) {
        // Add loading states to charts
        const chartContainers = document.querySelectorAll('.chart-card canvas');
        chartContainers.forEach(canvas => {
            const container = canvas.parentElement;
            if (show) {
                container.classList.add('loading-chart');
            } else {
                container.classList.remove('loading-chart');
            }
        });
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        // Reuse notification system from main app
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1001;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        const colors = {
            error: '#F44336',
            success: '#4CAF50',
            info: '#2196F3',
            warning: '#FF9800'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
}

// Initialize analytics dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AnalyticsDashboard();
});
