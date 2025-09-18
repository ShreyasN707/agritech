# 🚀 CropSense Deployment Guide

This guide provides step-by-step instructions for deploying CropSense to various cloud platforms.

## 📋 Pre-Deployment Checklist

- [ ] All dependencies installed (`npm install`)
- [ ] Application tested locally (`npm test`)
- [ ] Environment variables configured
- [ ] Gemini API key obtained (optional)
- [ ] Git repository initialized
- [ ] Code committed to version control

## 🌐 Platform-Specific Deployment

### 1. Render.com (Recommended)

**Advantages:** Free tier, automatic HTTPS, easy GitHub integration

**Steps:**
1. Push your code to GitHub
2. Visit [render.com](https://render.com) and sign up
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure settings:
   - **Name:** `cropsense-app`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`
6. Add environment variables:
   - `NODE_ENV`: `production`
   - `GEMINI_API_KEY`: `your_api_key_here`
7. Click "Create Web Service"

**Configuration File:** `render.yaml` (already included)

---

### 2. Railway

**Advantages:** Simple deployment, automatic scaling, generous free tier

**Steps:**
1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Initialize project: `railway init`
4. Deploy: `railway up`
5. Set environment variables:
   ```bash
   railway variables set NODE_ENV=production
   railway variables set GEMINI_API_KEY=your_api_key_here
   ```

**Configuration File:** `railway.json` (already included)

---

### 3. Heroku

**Advantages:** Mature platform, extensive add-ons

**Steps:**
1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create your-app-name`
4. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set GEMINI_API_KEY=your_api_key_here
   ```
5. Deploy: `git push heroku main`

**Additional Files Needed:**
```json
// Procfile
web: npm start
```

---

### 4. Vercel

**Advantages:** Excellent for static sites, serverless functions

**Steps:**
1. Install Vercel CLI: `npm install -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel`
4. Set environment variables in Vercel dashboard

**Configuration File:**
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ]
}
```

---

### 5. DigitalOcean App Platform

**Advantages:** Predictable pricing, good performance

**Steps:**
1. Visit DigitalOcean App Platform
2. Create new app from GitHub repository
3. Configure build settings:
   - **Build Command:** `npm install`
   - **Run Command:** `npm start`
4. Set environment variables in dashboard

---

### 6. Docker Deployment

**Advantages:** Consistent environment, easy scaling

**Prerequisites:** Docker installed

**Steps:**
1. Build image: `docker build -t cropsense .`
2. Run container: `docker run -p 3000:3000 -e GEMINI_API_KEY=your_key cropsense`

**Docker Compose:**
```bash
# Start with Docker Compose
docker-compose up -d

# With production profile (includes nginx)
docker-compose --profile production up -d
```

**Files Included:**
- `Dockerfile`
- `docker-compose.yml`
- `healthcheck.js`

---

## 🔧 Environment Variables

### Required Variables
```env
NODE_ENV=production
PORT=3000
```

### Optional Variables
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Platform-Specific Setup

**Render:**
- Set in dashboard under "Environment" tab

**Railway:**
```bash
railway variables set VARIABLE_NAME=value
```

**Heroku:**
```bash
heroku config:set VARIABLE_NAME=value
```

**Vercel:**
- Set in dashboard under "Settings" → "Environment Variables"

---

## 🔍 Health Checks

All platforms support health checks using the `/health` endpoint:

```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "CropSense API"
}
```

---

## 📊 Monitoring & Logging

### Built-in Monitoring
- Health check endpoint: `/health`
- Error handling middleware
- Request logging
- Performance metrics

### Platform Monitoring
- **Render:** Built-in logs and metrics
- **Railway:** Deployment logs and metrics
- **Heroku:** Heroku Metrics (paid)
- **Vercel:** Analytics dashboard

### Custom Monitoring
Add monitoring services:
- **Sentry** for error tracking
- **LogRocket** for user sessions
- **New Relic** for APM

---

## 🔒 Security Considerations

### Production Security
- [x] Helmet.js for security headers
- [x] Rate limiting implemented
- [x] CORS configured
- [x] Input validation
- [x] Environment variables for secrets

### SSL/HTTPS
- **Render:** Automatic HTTPS
- **Railway:** Automatic HTTPS
- **Heroku:** Automatic HTTPS
- **Vercel:** Automatic HTTPS

### API Key Security
- Never commit API keys to version control
- Use environment variables
- Rotate keys regularly
- Monitor API usage

---

## 🚀 Performance Optimization

### Built-in Optimizations
- [x] Compression middleware
- [x] Static file caching
- [x] Efficient API responses
- [x] Client-side caching (localStorage)

### Additional Optimizations
- **CDN:** Use platform CDN for static assets
- **Caching:** Implement Redis for API caching
- **Database:** Add database for persistent storage
- **Load Balancing:** Scale horizontally

---

## 🧪 Testing in Production

### Smoke Tests
```bash
# Test health endpoint
curl https://your-app.com/health

# Test forecast API
curl -X POST https://your-app.com/api/forecast \
  -H "Content-Type: application/json" \
  -d '{"crop":"Rice","district":"Karnataka","season":"Kharif","quantity":100}'
```

### Automated Testing
```bash
# Run API tests against production
npm test -- --baseUrl=https://your-app.com
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        # Platform-specific deployment steps
```

---

## 📈 Scaling Considerations

### Horizontal Scaling
- Multiple server instances
- Load balancer configuration
- Session management
- Database clustering

### Vertical Scaling
- Increase server resources
- Optimize memory usage
- Database optimization
- Caching strategies

---

## 🆘 Troubleshooting

### Common Issues

**Issue:** App won't start
**Solution:** Check environment variables and logs

**Issue:** API returns 500 errors
**Solution:** Verify Gemini API key and network connectivity

**Issue:** Static files not loading
**Solution:** Check build process and file paths

**Issue:** High memory usage
**Solution:** Implement caching and optimize data structures

### Platform-Specific Issues

**Render:**
- Check build logs for errors
- Verify environment variables
- Monitor resource usage

**Railway:**
- Check deployment logs
- Verify railway.json configuration
- Monitor service health

**Heroku:**
- Check dyno logs: `heroku logs --tail`
- Verify Procfile
- Monitor dyno usage

---

## 📞 Support

### Documentation
- [API Documentation](README.md#api-endpoints)
- [User Guide](README.md#user-interface)
- [Development Setup](README.md#development)

### Community
- GitHub Issues for bug reports
- Discussions for feature requests
- Wiki for community guides

### Professional Support
- Custom deployment assistance
- Performance optimization
- Feature development
- Training and consultation

---

**🌾 Happy Farming with CropSense!**

*Last updated: 2024-01-01*
