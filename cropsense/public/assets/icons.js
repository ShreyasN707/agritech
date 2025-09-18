// Icon utilities for CropSense
const CropIcons = {
    // Crop type icons
    crops: {
        'Rice': '🌾',
        'Wheat': '🌾',
        'Maize': '🌽',
        'Sugarcane': '🎋',
        'Cotton': '🌿',
        'Soybean': '🫘',
        'Groundnut': '🥜',
        'Pulses': '🫛',
        'Tomato': '🍅',
        'Onion': '🧅',
        'Potato': '🥔'
    },
    
    // Weather icons
    weather: {
        'sunny': '☀️',
        'cloudy': '☁️',
        'rainy': '🌧️',
        'stormy': '⛈️',
        'hot': '🌡️',
        'cold': '❄️'
    },
    
    // Market status icons
    market: {
        'high': '🟢',
        'medium': '🟡',
        'low': '🔴',
        'trending_up': '📈',
        'trending_down': '📉',
        'stable': '➡️'
    },
    
    // Action icons
    actions: {
        'plant': '🌱',
        'harvest': '🚜',
        'sell': '💰',
        'store': '🏪',
        'transport': '🚛',
        'process': '⚙️'
    }
};

// Get icon for crop type
function getCropIcon(cropName) {
    return CropIcons.crops[cropName] || '🌾';
}

// Get weather icon
function getWeatherIcon(condition) {
    return CropIcons.weather[condition] || '☀️';
}

// Get market status icon
function getMarketIcon(status) {
    return CropIcons.market[status] || '🟡';
}

// Get action icon
function getActionIcon(action) {
    return CropIcons.actions[action] || '✅';
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CropIcons, getCropIcon, getWeatherIcon, getMarketIcon, getActionIcon };
}
