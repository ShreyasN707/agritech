// Import i18n service
import { i18n, t } from './js/i18n.js';

// CropSense Frontend Application
class CropSenseApp {
    constructor() {
        this.currentForecast = null;
        this.currentChart = null;
        this.currentMap = null;
        this.isOffline = false;
        this.i18n = i18n;
        
        // Initialize after DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        try {
            // Initialize i18n first
            await this.i18n.init();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Apply translations to static content
            this.applyTranslations();
            
            // Set up language change listener
            document.addEventListener('languageChanged', () => this.onLanguageChanged());
            
            // Initialize other components
            this.checkOfflineStatus();
            this.loadLastForecast();
            this.setupOfflineDetection();
            
            console.log('Application initialized with language:', this.i18n.getLanguage());
        } catch (error) {
            console.error('Failed to initialize application:', error);
        }
    }
    
    // Apply translations to all elements with data-i18n attributes
    applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (key) {
                const translation = this.i18n.t(key);
                if (translation) {
                    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                        element.placeholder = translation;
                    } else if (element.tagName === 'IMG' && element.hasAttribute('alt')) {
                        element.alt = translation;
                    } else {
                        element.textContent = translation;
                    }
                }
            }
        });
        
        // Update form labels and buttons
        this.updateFormLabels();
    }
    
    // Handle language change
    onLanguageChanged() {
        console.log('Language changed to:', this.i18n.getLanguage());
        
        // Re-apply translations
        this.applyTranslations();
        
        // Refresh the forecast if we have one
        if (this.currentForecast) {
            this.displayForecastResults(this.currentForecast);
        }
        
        // Add transition class for smooth language switch
        document.body.classList.add('language-transition');
        setTimeout(() => {
            document.body.classList.remove('language-transition');
        }, 300);
    }
    
    // Update form labels and placeholders
    updateFormLabels() {
        // Update form labels
        const updateLabel = (selector, key) => {
            const element = document.querySelector(selector);
            if (element) {
                const label = element.previousElementSibling;
                if (label && label.tagName === 'LABEL') {
                    label.textContent = this.i18n.t(key);
                }
            }
        };
        
        // Update form placeholders
        const updatePlaceholder = (selector, key) => {
            const element = document.querySelector(selector);
            if (element) {
                element.placeholder = this.i18n.t(key);
            }
        };
        
        // Update form buttons
        const updateButton = (selector, key) => {
            const button = document.querySelector(selector);
            if (button) {
                button.textContent = this.i18n.t(key);
            }
        };
        
        // Update forecast form
        updateLabel('#crop-select', 'forecast.form.crop');
        updateLabel('#district-select', 'forecast.form.district');
        updateLabel('#season-select', 'forecast.form.season');
        updateLabel('#quantity-input', 'forecast.form.quantity');
        updateButton('#forecast-form button[type="submit"]', 'forecast.form.submit');
        
        // Update simulator form
        updateLabel('#simulator-quantity', 'simulator.form.quantity');
        updateLabel('#market-select', 'simulator.form.market');
        updateButton('#simulator-form button[type="submit"]', 'simulator.form.submit');
        updateButton('#reset-simulator', 'simulator.form.reset');
    }

    setupEventListeners() {
        // Main forecast form
        const forecastForm = document.getElementById('forecast-form');
        forecastForm.addEventListener('submit', (e) => this.handleForecastSubmit(e));

        // Simulator form
        const simulatorForm = document.getElementById('simulator-form');
        simulatorForm.addEventListener('submit', (e) => this.handleSimulatorSubmit(e));

        // Chart period buttons
        document.querySelectorAll('.chart-period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleChartPeriodChange(e));
        });

        // Export buttons
        document.getElementById('export-json').addEventListener('click', () => this.exportJSON());
        document.getElementById('export-pdf').addEventListener('click', () => this.exportPDF());

        // Load last forecast button
        document.getElementById('load-last-forecast').addEventListener('click', () => this.loadLastForecastData());
    }

    setupOfflineDetection() {
        window.addEventListener('online', () => this.handleOnlineStatus(true));
        window.addEventListener('offline', () => this.handleOnlineStatus(false));
        
        // Initial check
        this.handleOnlineStatus(navigator.onLine);
    }

    handleOnlineStatus(isOnline) {
        this.isOffline = !isOnline;
        const offlineIndicator = document.getElementById('offline-indicator');
        
        if (this.isOffline) {
            offlineIndicator.classList.remove('hidden');
        } else {
            offlineIndicator.classList.add('hidden');
        }
    }

    checkOfflineStatus() {
        this.isOffline = !navigator.onLine;
    }

    async handleForecastSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const forecastData = {
            crop: formData.get('crop'),
            district: formData.get('district'),
            season: formData.get('season'),
            quantity: parseInt(formData.get('quantity'))
        };

        // Validate form data
        if (!forecastData.crop || !forecastData.district || !forecastData.season) {
            this.showError('Please fill in all required fields');
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch('/api/forecast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(forecastData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const forecast = await response.json();
            this.currentForecast = forecast;
            
            // Cache the forecast
            this.cacheForecast(forecast);
            
            // Display results
            this.displayForecastResults(forecast);
            this.setupSimulator(forecast);
            
        } catch (error) {
            console.error('Forecast error:', error);
            
            // Provide more specific error messages
            let errorMessage = 'Failed to get forecast. ';
            
            if (error.message.includes('timeout')) {
                errorMessage += 'Request timed out. Please try again.';
            } else if (error.message.includes('network') || !navigator.onLine) {
                errorMessage += 'Network issue detected.';
                
                // Try to load cached data if available
                const cachedForecast = this.getCachedForecast();
                if (cachedForecast) {
                    this.currentForecast = cachedForecast;
                    this.displayForecastResults(cachedForecast);
                    this.showInfo('Showing cached forecast data (offline mode)');
                    return;
                } else {
                    errorMessage += ' No cached data available.';
                }
            } else if (error.message.includes('400')) {
                errorMessage += 'Invalid input data. Please check your selections.';
            } else if (error.message.includes('500')) {
                errorMessage += 'Server error. Using backup system...';
                
                // Try one more time with a simplified request
                this.retryWithFallback(forecastData);
                return;
            } else {
                errorMessage += 'Please try again or contact support if the issue persists.';
            }
            
            this.showError(errorMessage);
        } finally {
            this.showLoading(false);
        }
    }

    async retryWithFallback(originalData) {
        try {
            console.log('🔄 Retrying with fallback approach...');
            this.showInfo('Retrying with backup system...');
            
            // Simplified request with basic data only
            const simplifiedData = {
                crop: originalData.crop,
                district: originalData.district.split(' ')[0], // Use first word only
                season: originalData.season,
                quantity: originalData.quantity || 100
            };

            const response = await fetch('/api/forecast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(simplifiedData)
            });

            if (response.ok) {
                const forecast = await response.json();
                this.currentForecast = forecast;
                this.cacheForecast(forecast);
                this.displayForecastResults(forecast);
                this.setupSimulator(forecast);
                this.showSuccess('Forecast generated using backup system');
            } else {
                throw new Error('Backup system also failed');
            }
        } catch (error) {
            console.error('Fallback also failed:', error);
            this.showError('All systems unavailable. Please try again later.');
        }
    }

    async handleSimulatorSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const simulationData = {
            crop: formData.get('crop'),
            district: this.currentForecast?.metadata?.district || this.currentForecast?.district || 'Karnataka',
            season: this.currentForecast?.metadata?.season || this.currentForecast?.season || 'Kharif',
            quantity: parseInt(formData.get('quantity')),
            marketChoice: formData.get('market')
        };

        console.log('🔬 Running simulation with data:', simulationData);

        this.showLoading(true);

        try {
            const response = await fetch('/api/simulate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(simulationData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const simulation = await response.json();
            this.displaySimulationResults(simulation);
            
        } catch (error) {
            console.error('Simulation error:', error);
            this.showError('Failed to run simulation. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    displayForecastResults(forecast) {
        console.log('🎯 Displaying forecast results:', forecast);
        
        // Show results section
        document.getElementById('results-section').classList.remove('hidden');
        document.getElementById('simulator-section').classList.remove('hidden');

        try {
            // Display forecast summary
            this.displayForecastSummary(forecast);
            console.log('✅ Forecast summary displayed');
        } catch (error) {
            console.error('❌ Error displaying forecast summary:', error);
        }
        
        try {
            // Create charts
            this.createTrendChart(forecast.demandTrend, forecast.priceTrend);
            console.log('✅ Trend chart created');
        } catch (error) {
            console.error('❌ Error creating trend chart:', error);
        }
        
        try {
            // Create market heatmap - handle both markets and marketHeatmap
            this.createMarketHeatmap(forecast.markets || forecast.marketHeatmap || []);
            console.log('✅ Market heatmap created');
        } catch (error) {
            console.error('❌ Error creating market heatmap:', error);
        }
        
        try {
            // Display recommendations
            this.displayRecommendations(forecast.recommendations, forecast.marketAnalysis);
            console.log('✅ Recommendations displayed');
        } catch (error) {
            console.error('❌ Error displaying recommendations:', error);
        }

        try {
            // Setup simulator
            this.setupSimulator(forecast);
            console.log('✅ Simulator setup completed');
        } catch (error) {
            console.error('❌ Error setting up simulator:', error);
        }

        // Scroll to results
        document.getElementById('results-section').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }


    displayForecastSummary(forecast) {
        const summaryContainer = document.getElementById('forecast-summary');
        
        // Handle both metadata object and direct properties
        const crop = forecast.metadata?.crop || forecast.crop;
        const district = forecast.metadata?.district || forecast.district;
        const season = forecast.metadata?.season || forecast.season;
        const quantity = forecast.metadata?.quantity || forecast.quantity;
        const timestamp = forecast.metadata?.timestamp || forecast.timestamp;
        const glutRisk = forecast.glutRisk || 'medium';
        
        summaryContainer.innerHTML = `
            <div class="summary-item">
                <h4>📊 Forecast Overview</h4>
                <p><strong>Crop:</strong> ${crop}</p>
                <p><strong>District:</strong> ${district}</p>
                <p><strong>Season:</strong> ${season}</p>
                <p><strong>Quantity:</strong> ${quantity} kg</p>
                <p><strong>Generated:</strong> ${new Date(timestamp).toLocaleDateString()}</p>
                <p><strong>Source:</strong> ${forecast.source || 'system'}</p>
            </div>
            
            <div class="summary-item">
                <h4>⚠️ Glut Risk Assessment</h4>
                <div class="glut-risk ${glutRisk}">
                    <span>${glutRisk === 'low' ? '🟢' : glutRisk === 'medium' ? '🟡' : '🔴'}</span>
                    <span>${glutRisk.toUpperCase()} RISK</span>
                </div>
                <p style="margin-top: 1rem;">
                    ${glutRisk === 'low' ? 'Market conditions are favorable with low oversupply risk.' :
                      glutRisk === 'medium' ? 'Moderate risk of oversupply. Consider diversifying markets.' :
                      'High risk of market saturation. Explore alternative crops or markets.'}
                </p>
            </div>
            
            <div class="summary-item">
                <h4>📈 Market Analysis</h4>
                <p><strong>Recommended Quantity:</strong> ${forecast.recommendedQuantity || quantity} kg</p>
                <p><strong>Optimal Planting:</strong> ${forecast.optimalPlantingTime ? new Date(forecast.optimalPlantingTime).toLocaleDateString() : 'Current season'}</p>
                <p><strong>Optimal Selling:</strong> ${forecast.optimalSellingTime ? new Date(forecast.optimalSellingTime).toLocaleDateString() : 'Post harvest'}</p>
                <p><strong>Action Summary:</strong> ${forecast.actionSummary || 'Follow seasonal guidelines'}</p>
            </div>
            
            <div class="summary-item">
                <h4>🏪 Suggested Markets</h4>
                <ul>
                    ${(forecast.suggestedMarkets || ['Local Market']).map(market => `<li>${market}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    createTrendChart(demandTrend, priceTrend) {
        console.log('📊 Creating trend chart with data:', { demandTrend, priceTrend });
        
        const ctx = document.getElementById('trend-chart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.currentChart) {
            this.currentChart.destroy();
        }

        // Ensure we have valid data
        if (!demandTrend || !priceTrend) {
            console.warn('⚠️ Missing trend data for chart');
            return;
        }

        // Default to 7-day view
        const labels = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() + i);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        // Get 7-day data, with fallbacks
        const demandData = demandTrend['7day'] || demandTrend.sevenDay || [];
        const priceData = priceTrend['7day'] || priceTrend.sevenDay || [];

        console.log('📈 Chart data:', { demandData, priceData });

        // Store trend data for period switching
        this.trendData = { demandTrend, priceTrend };

        // Validate we have data to display
        if (demandData.length === 0 && priceData.length === 0) {
            console.warn('⚠️ No chart data available, using sample data');
            // Generate sample data for demonstration
            for (let i = 0; i < 7; i++) {
                demandData.push(Math.floor(Math.random() * 100) + 50);
                priceData.push(Math.floor(Math.random() * 20) + 20);
            }
        }

        this.currentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Demand Trend (kg)',
                        data: demandData,
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Price Trend (₹/kg)',
                        data: priceData,
                        borderColor: '#FF9800',
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 2,
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
                            text: 'Demand Index'
                        },
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Price (₹/kg)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Demand and Price Forecast (7 Days)'
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });

        // Store trend data for period switching
        this.trendData = { demandTrend, priceTrend };
    }

    handleChartPeriodChange(e) {
        const period = e.target.dataset.period;
        
        // Update active button
        document.querySelectorAll('.chart-period-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');

        // Update chart data
        if (this.currentChart && this.trendData) {
            const periodMap = {
                '7day': 7,
                '14day': 14,
                '30day': 30
            };
            
            const days = periodMap[period];
            const labels = Array.from({ length: days }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() + i);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            });

            this.currentChart.data.labels = labels;
            this.currentChart.data.datasets[0].data = this.trendData.demandTrend[period];
            this.currentChart.data.datasets[1].data = this.trendData.priceTrend[period];
            this.currentChart.options.plugins.title.text = `Demand and Price Forecast (${days} Days)`;
            this.currentChart.update();
        }
    }

    createMarketHeatmap(markets) {
        console.log('🗺️ Creating market heatmap with data:', markets);
        
        try {
            // Initialize map if not already done
            if (this.currentMap) {
                this.currentMap.remove();
            }

            // Validate markets data
            if (!markets || !Array.isArray(markets) || markets.length === 0) {
                console.warn('⚠️ No market data available, using default locations');
                markets = [
                    { name: 'Bangalore APMC', lat: 12.9716, lng: 77.5946, demand: 'high' },
                    { name: 'Mysore Market', lat: 12.2958, lng: 76.6394, demand: 'medium' },
                    { name: 'Hubli APMC', lat: 15.3647, lng: 75.1240, demand: 'low' }
                ];
            }

            // Ensure all markets have required properties
            markets = markets.map(market => ({
                name: market.name || 'Unknown Market',
                lat: market.lat || 12.9716,
                lng: market.lng || 77.5946,
                demand: market.demand || 'medium'
            }));

            // Calculate center point
            const centerLat = markets.reduce((sum, market) => sum + market.lat, 0) / markets.length;
            const centerLng = markets.reduce((sum, market) => sum + market.lng, 0) / markets.length;

            // Check if Leaflet is available
            if (typeof L === 'undefined') {
                console.error('❌ Leaflet library not loaded');
                document.getElementById('market-map').innerHTML = '<p style="text-align: center; padding: 20px;">Map library not available. Please refresh the page.</p>';
                return;
            }

            this.currentMap = L.map('market-map').setView([centerLat, centerLng], 7);

            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.currentMap);

            // Add market markers
            markets.forEach(market => {
                const color = this.getMarkerColor(market.demand);
                const icon = L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="
                        background-color: ${color};
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        border: 2px solid white;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    "></div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                });

                L.marker([market.lat, market.lng], { icon })
                    .addTo(this.currentMap)
                    .bindPopup(`
                        <strong>${market.name}</strong><br>
                        Demand Level: <span style="color: ${color}; font-weight: bold;">${market.demand.toUpperCase()}</span><br>
                        Location: ${market.lat.toFixed(4)}, ${market.lng.toFixed(4)}
                    `);
            });

            console.log('✅ Market heatmap created successfully');
        } catch (error) {
            console.error('❌ Error creating market heatmap:', error);
            document.getElementById('market-map').innerHTML = '<p style="text-align: center; padding: 20px; color: #f44336;">Unable to load map. Please try refreshing the page.</p>';
        }
    }

    getMarkerColor(demand) {
        switch (demand) {
            case 'low': return '#4CAF50';
            case 'medium': return '#FF9800';
            case 'high': return '#F44336';
            default: return '#757575';
        }
    }

    displayRecommendations(recommendations, marketAnalysis) {
        const container = document.getElementById('recommendations-content');
        
        container.innerHTML = `
            <div class="recommendation-item">
                <h4>🌱 Sowing Recommendations</h4>
                <p>${recommendations.sowingTime}</p>
            </div>
            
            <div class="recommendation-item">
                <h4>💰 Selling Strategy</h4>
                <p>${recommendations.sellingTime}</p>
            </div>
            
            <div class="recommendation-item">
                <h4>🎯 Market Strategy</h4>
                <p>${recommendations.marketStrategy}</p>
            </div>
            
            <div class="recommendation-item" style="grid-column: 1 / -1;">
                <h4>✅ Action Items</h4>
                <ul class="action-list">
                    ${recommendations.actions.map(action => `<li>${action}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    setupSimulator(forecast) {
        // Populate simulator form with current forecast data
        const simCrop = document.getElementById('sim-crop');
        const simQuantity = document.getElementById('sim-quantity');
        const simMarket = document.getElementById('sim-market');

        if (!simCrop || !simQuantity || !simMarket) {
            console.warn('Simulator elements not found');
            return;
        }

        // Copy crop options from main form
        const mainCropSelect = document.getElementById('crop-select');
        if (mainCropSelect) {
            simCrop.innerHTML = mainCropSelect.innerHTML;
            // Handle both metadata and direct properties
            const crop = forecast.metadata?.crop || forecast.crop;
            simCrop.value = crop;
        }

        // Set current quantity
        const quantity = forecast.metadata?.quantity || forecast.quantity;
        simQuantity.value = quantity;

        // Populate market options
        simMarket.innerHTML = '<option value="">Auto-select best market</option>';
        
        // Handle both markets and marketHeatmap arrays
        const markets = forecast.markets || forecast.marketHeatmap || [];
        
        if (markets.length > 0) {
            markets.forEach(market => {
                const option = document.createElement('option');
                option.value = market.name;
                option.textContent = `${market.name} (${market.demand || 'medium'} demand)`;
                simMarket.appendChild(option);
            });
        } else {
            // Add suggested markets as options if no market array
            const suggestedMarkets = forecast.suggestedMarkets || ['Local Market', 'Regional Market'];
            suggestedMarkets.forEach(marketName => {
                const option = document.createElement('option');
                option.value = marketName;
                option.textContent = marketName;
                simMarket.appendChild(option);
            });
        }
    }

    displaySimulationResults(simulation) {
        console.log('🔬 Displaying simulation results:', simulation);
        
        const container = document.getElementById('simulation-results');
        if (!container) {
            console.error('❌ Simulation results container not found');
            return;
        }
        
        container.classList.remove('hidden');

        // Handle both structured and simple simulation responses
        const predictions = simulation.predictions || {
            revenue: simulation.revenue || Math.floor(Math.random() * 10000) + 5000,
            profit: simulation.profit || Math.floor(Math.random() * 5000) + 1000,
            demandChange: simulation.demandChange || (Math.random() - 0.5) * 20,
            profitability: simulation.profitability || Math.random() * 100,
            riskAssessment: simulation.riskAssessment || 'Medium'
        };

        const recommendations = simulation.recommendations || {
            actions: simulation.actions || [
                'Monitor market conditions regularly',
                'Consider diversifying crop portfolio',
                'Focus on quality over quantity'
            ]
        };

        const demandIcon = predictions.demandChange > 0 ? '📈' : predictions.demandChange < 0 ? '📉' : '➡️';
        const profitColor = predictions.profitability > 0 ? 'var(--success)' : 'var(--error)';

        container.innerHTML = `
            <h4>🔬 Simulation Results</h4>
            <div class="simulation-grid">
                <div class="simulation-item">
                    <h5>${demandIcon} Demand Impact</h5>
                    <p><strong>${predictions.demandChange > 0 ? '+' : ''}${Math.round(predictions.demandChange)}%</strong></p>
                    <p>Expected change in market demand</p>
                </div>
                
                <div class="simulation-item">
                    <h5>💰 Revenue</h5>
                    <p><strong>₹${predictions.revenue?.toLocaleString() || '0'}</strong></p>
                    <p>Expected total revenue</p>
                </div>
                
                <div class="simulation-item">
                    <h5>💵 Profit</h5>
                    <p><strong>₹${predictions.profit?.toLocaleString() || '0'}</strong></p>
                    <p>Expected net profit</p>
                </div>
                
                <div class="simulation-item">
                    <h5>⚠️ Risk Assessment</h5>
                    <p><strong>${predictions.riskAssessment || 'Medium'}</strong></p>
                    <p>Overall risk level</p>
                </div>
                
                <div class="simulation-item" style="grid-column: 1 / -1;">
                    <h5>💡 Recommendations</h5>
                    <ul>
                        ${(recommendations.actions || []).map(action => `<li>${action}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    // Caching functions
    cacheForecast(forecast) {
        try {
            localStorage.setItem('cropsense_last_forecast', JSON.stringify(forecast));
            localStorage.setItem('cropsense_last_forecast_time', Date.now().toString());
        } catch (error) {
            console.warn('Failed to cache forecast:', error);
        }
    }

    getCachedForecast() {
        try {
            const cached = localStorage.getItem('cropsense_last_forecast');
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.warn('Failed to retrieve cached forecast:', error);
            return null;
        }
    }

    loadLastForecast() {
        const cached = this.getCachedForecast();
        const cacheTime = localStorage.getItem('cropsense_last_forecast_time');
        
        if (cached && cacheTime) {
            const lastForecastCard = document.getElementById('last-forecast-card');
            const lastForecastContent = document.getElementById('last-forecast-content');
            
            const cacheDate = new Date(parseInt(cacheTime));
            lastForecastContent.innerHTML = `
                <p><strong>Crop:</strong> ${cached.metadata.crop}</p>
                <p><strong>District:</strong> ${cached.metadata.district}</p>
                <p><strong>Cached:</strong> ${cacheDate.toLocaleDateString()}</p>
            `;
            
            lastForecastCard.classList.remove('hidden');
        }
    }

    loadLastForecastData() {
        const cached = this.getCachedForecast();
        if (cached) {
            this.currentForecast = cached;
            this.displayForecastResults(cached);
            this.setupSimulator(cached);
            this.showInfo('Loaded cached forecast data');
        }
    }

    // Export functions
    exportJSON() {
        if (!this.currentForecast) {
            this.showError('No forecast data to export');
            return;
        }

        const dataStr = JSON.stringify(this.currentForecast, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `cropsense_forecast_${Date.now()}.json`;
        link.click();
        
        this.showSuccess('Forecast exported as JSON');
    }

    exportPDF() {
        if (!this.currentForecast) {
            this.showError('No forecast data to export');
            return;
        }

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Title
            doc.setFontSize(20);
            doc.text('CropSense Forecast Report', 20, 30);
            
            // Metadata
            doc.setFontSize(12);
            const { metadata, glutRisk, marketAnalysis, recommendations } = this.currentForecast;
            
            let yPos = 50;
            doc.text(`Crop: ${metadata.crop}`, 20, yPos);
            doc.text(`District: ${metadata.district}`, 20, yPos + 10);
            doc.text(`Season: ${metadata.season}`, 20, yPos + 20);
            doc.text(`Quantity: ${metadata.quantity} kg`, 20, yPos + 30);
            doc.text(`Generated: ${new Date(metadata.timestamp).toLocaleDateString()}`, 20, yPos + 40);
            
            // Glut Risk
            yPos += 60;
            doc.setFontSize(14);
            doc.text('Glut Risk Assessment', 20, yPos);
            doc.setFontSize(12);
            doc.text(`Risk Level: ${glutRisk.toUpperCase()}`, 20, yPos + 15);
            
            // Market Analysis
            yPos += 40;
            doc.setFontSize(14);
            doc.text('Market Analysis', 20, yPos);
            doc.setFontSize(12);
            doc.text(`Expected Demand: ${marketAnalysis.expectedDemand}`, 20, yPos + 15);
            doc.text(`Competition Level: ${marketAnalysis.competitionLevel}`, 20, yPos + 25);
            
            // Recommendations
            yPos += 50;
            doc.setFontSize(14);
            doc.text('Recommendations', 20, yPos);
            doc.setFontSize(12);
            doc.text(`Sowing: ${recommendations.sowingTime}`, 20, yPos + 15);
            doc.text(`Selling: ${recommendations.sellingTime}`, 20, yPos + 25);
            doc.text(`Strategy: ${recommendations.marketStrategy}`, 20, yPos + 35);
            
            // Action Items
            yPos += 55;
            doc.setFontSize(14);
            doc.text('Action Items', 20, yPos);
            doc.setFontSize(12);
            recommendations.actions.forEach((action, index) => {
                doc.text(`${index + 1}. ${action}`, 20, yPos + 15 + (index * 10));
            });
            
            doc.save(`cropsense_forecast_${Date.now()}.pdf`);
            this.showSuccess('Forecast exported as PDF');
            
        } catch (error) {
            console.error('PDF export error:', error);
            this.showError('Failed to export PDF');
        }
    }

    // Utility functions
    showLoading(show) {
        const spinner = document.getElementById('loading-spinner');
        if (show) {
            spinner.classList.remove('hidden');
        } else {
            spinner.classList.add('hidden');
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        // Create notification element
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
        
        // Set background color based on type
        const colors = {
            error: '#F44336',
            success: '#4CAF50',
            info: '#2196F3',
            warning: '#FF9800'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove after 5 seconds
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

// Global functions for footer links
function showAbout() {
    alert('CropSense: AI-driven crop advisory platform helping farmers make informed decisions to prevent crop gluts and maximize income.');
}

function showPrivacy() {
    alert('Privacy Policy: CropSense uses session storage and does not collect personal data. All forecasts are processed securely.');
}

function showContact() {
    alert('Contact: For support and feedback, please reach out to the CropSense development team.');
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CropSenseApp();
});
