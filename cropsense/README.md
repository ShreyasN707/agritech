# 🌾 CropSense - AI-Driven Crop Advisory Platform

CropSense is a production-ready, AI-powered crop advisory platform that predicts local market demand to prevent crop gluts and maximize farmer income. Built with Node.js, Express, and modern web technologies.

## 🎯 Features

- **AI-Powered Forecasting**: Uses Google Gemini AI to predict crop demand and market trends
- **Market Heatmap**: Interactive map showing demand levels across different markets
- **Scenario Simulator**: Test different planting strategies and quantities
- **Offline Support**: Cached forecasts available when offline
- **Export Functionality**: Download forecasts as JSON or PDF
- **Responsive Design**: Mobile-first design that works on all devices
- **Real-time Charts**: Interactive demand and price trend visualization

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Google Gemini API key (optional - app works with mock data)

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd cropsense
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
   
   > **Note**: The app works without an API key using intelligent mock data

4. **Start the application:**
   ```bash
   npm start
   ```

5. **Open your browser:**
   ```
   http://localhost:3000
   ```

## 🛠️ Development

### Development Mode
```bash
npm run dev
```
Uses nodemon for automatic restarts on file changes.

### Project Structure
```
cropsense/
├── server.js              # Express server setup
├── package.json           # Dependencies and scripts
├── routes/
│   └── forecast.js        # API routes for forecasting
├── public/
│   ├── index.html         # Main HTML file
│   ├── app.js            # Frontend JavaScript
│   ├── styles/
│   │   └── main.css      # Responsive CSS styles
│   └── assets/           # Static assets (if any)
├── .env                  # Environment configuration
└── README.md            # This file
```

## 📊 API Endpoints

### POST `/api/forecast`
Get crop demand forecast and market analysis.

**Request Body:**
```json
{
  "crop": "Rice",
  "district": "Karnataka",
  "season": "Kharif",
  "quantity": 100
}
```

**Response:**
```json
{
  "demandTrend": {
    "7day": [65, 67, 70, 68, 72, 75, 73],
    "14day": [...],
    "30day": [...]
  },
  "priceTrend": {
    "7day": [25, 26, 27, 26, 28, 29, 28],
    "14day": [...],
    "30day": [...]
  },
  "glutRisk": "medium",
  "recommendations": {
    "sowingTime": "...",
    "sellingTime": "...",
    "marketStrategy": "...",
    "actions": ["..."]
  },
  "markets": [...],
  "metadata": {...}
}
```

### POST `/api/simulate`
Run scenario simulation for different crop strategies.

**Request Body:**
```json
{
  "crop": "Rice",
  "district": "Karnataka", 
  "season": "Kharif",
  "quantity": 200,
  "marketChoice": "Bangalore APMC"
}
```

### GET `/health`
Health check endpoint for monitoring.

## 🎨 User Interface

### Dashboard
- **Crop Selection**: Choose from 11+ major crops
- **Location**: Select from 8+ major agricultural states
- **Season**: Kharif, Rabi, or Zaid seasons
- **Quantity**: Planned cultivation quantity

### Forecast Results
- **Summary Cards**: Overview of forecast and risk assessment
- **Interactive Charts**: 7/14/30-day demand and price trends
- **Market Heatmap**: Geographic visualization of market demand
- **AI Recommendations**: Actionable insights for optimal farming

### Scenario Simulator
- **What-if Analysis**: Test different quantities and market choices
- **Impact Prediction**: See how changes affect demand and profitability
- **Alternative Strategies**: Get suggestions for optimization

## 🌐 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3000
GEMINI_API_KEY=your_production_api_key
```

### Deploy to Render
1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy with build command: `npm install`
4. Start command: `npm start`

### Deploy to Railway
1. Connect repository to Railway
2. Set environment variables
3. Railway will auto-detect Node.js and deploy

### Deploy to Heroku
```bash
# Install Heroku CLI and login
heroku create your-app-name
heroku config:set GEMINI_API_KEY=your_api_key
git push heroku main
```

### Docker Deployment (Optional)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔧 Configuration

### Gemini AI Setup
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to your `.env` file
4. Restart the application

### Customizing Crops and Regions
Edit the options in `public/index.html`:
```html
<select id="crop-select">
  <option value="YourCrop">Your Crop</option>
</select>
```

Add market data in `routes/forecast.js`:
```javascript
const SAMPLE_MARKETS = {
  'YourState': [
    { name: 'Market Name', lat: 12.34, lng: 56.78, demand: 'high' }
  ]
};
```

## 📱 Mobile Support

CropSense is built with a mobile-first approach:
- **Responsive Grid**: Adapts to all screen sizes
- **Touch-Friendly**: Large buttons and touch targets
- **Offline Capable**: Works without internet connection
- **Fast Loading**: Optimized assets and lazy loading

## 🔒 Security Features

- **Helmet.js**: Security headers and XSS protection
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Sanitizes all user inputs
- **CORS**: Configurable cross-origin requests
- **Environment Variables**: Secure API key management

## 🧪 Testing

### Manual Testing Checklist
- [ ] Form submission with valid data
- [ ] Chart period switching (7/14/30 days)
- [ ] Map marker interactions
- [ ] Scenario simulation
- [ ] Export functionality (JSON/PDF)
- [ ] Offline mode with cached data
- [ ] Mobile responsiveness
- [ ] Error handling

### API Testing
```bash
# Test forecast endpoint
curl -X POST http://localhost:3000/api/forecast \
  -H "Content-Type: application/json" \
  -d '{"crop":"Rice","district":"Karnataka","season":"Kharif","quantity":100}'

# Test health endpoint
curl http://localhost:3000/health
```

## 🎯 Acceptance Criteria ✅

- [x] **Input & Forecast**: Crop/district/season input → AI forecast received
- [x] **Visualization**: Trend charts and heatmap render correctly  
- [x] **Simulation**: Real-time scenario updates with predicted outcomes
- [x] **Export**: JSON/PDF export functionality working
- [x] **Offline**: Last forecast available via localStorage
- [x] **Responsive**: Mobile-first design with accessibility features
- [x] **Production Ready**: Deployable with npm install && npm start

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Common Issues

**Q: App shows "mock data" warning**
A: Add your Gemini API key to the `.env` file

**Q: Charts not displaying**
A: Ensure Chart.js is loading properly and check browser console

**Q: Map not showing**
A: Check internet connection for Leaflet.js and map tiles

**Q: Export not working**
A: Ensure jsPDF library is loaded for PDF export

### Getting Help

- Check the browser console for error messages
- Verify all environment variables are set correctly
- Ensure Node.js version is 16 or higher
- Test API endpoints directly using curl or Postman

## 🔮 Future Enhancements

- **Weather Integration**: Real-time weather data correlation
- **Market Price API**: Live market price feeds
- **User Accounts**: Save and track multiple forecasts
- **SMS Alerts**: Market condition notifications
- **Multi-language**: Regional language support
- **Advanced Analytics**: Machine learning model improvements

---

**Built with ❤️ for farmers by the CropSense team**

🌾 *Empowering agriculture through AI-driven insights*
