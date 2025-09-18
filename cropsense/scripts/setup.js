#!/usr/bin/env node

// CropSense Setup Script
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CropSenseSetup {
    constructor() {
        this.projectRoot = path.join(__dirname, '..');
        this.envFile = path.join(this.projectRoot, '.env');
    }

    async run() {
        console.log('🌾 Welcome to CropSense Setup!\n');
        
        try {
            await this.checkNodeVersion();
            await this.checkDependencies();
            await this.setupEnvironment();
            await this.verifySetup();
            this.showCompletionMessage();
        } catch (error) {
            console.error('❌ Setup failed:', error.message);
            process.exit(1);
        }
    }

    async checkNodeVersion() {
        console.log('📋 Checking Node.js version...');
        
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
        
        if (majorVersion < 16) {
            throw new Error(`Node.js 16+ required. Current version: ${nodeVersion}`);
        }
        
        console.log(`✅ Node.js ${nodeVersion} detected\n`);
    }

    async checkDependencies() {
        console.log('📦 Checking dependencies...');
        
        const packageJsonPath = path.join(this.projectRoot, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            throw new Error('package.json not found');
        }

        const nodeModulesPath = path.join(this.projectRoot, 'node_modules');
        if (!fs.existsSync(nodeModulesPath)) {
            console.log('📥 Installing dependencies...');
            try {
                execSync('npm install', { 
                    cwd: this.projectRoot, 
                    stdio: 'inherit' 
                });
            } catch (error) {
                throw new Error('Failed to install dependencies');
            }
        }
        
        console.log('✅ Dependencies ready\n');
    }

    async setupEnvironment() {
        console.log('⚙️ Setting up environment...');
        
        if (!fs.existsSync(this.envFile)) {
            const envTemplate = `# CropSense Environment Configuration
PORT=3000
NODE_ENV=development

# Gemini AI Configuration (Optional)
# Get your API key from: https://makersuite.google.com/app/apikey
# GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Additional API Keys
# WEATHER_API_KEY=your_weather_api_key_here
# MARKET_DATA_API_KEY=your_market_data_api_key_here
`;
            
            fs.writeFileSync(this.envFile, envTemplate);
            console.log('✅ Created .env file');
        } else {
            console.log('✅ Environment file exists');
        }
        
        console.log('');
    }

    async verifySetup() {
        console.log('🔍 Verifying setup...');
        
        // Check required files
        const requiredFiles = [
            'server.js',
            'package.json',
            'public/index.html',
            'public/app.js',
            'public/styles/main.css',
            'routes/forecast.js'
        ];

        for (const file of requiredFiles) {
            const filePath = path.join(this.projectRoot, file);
            if (!fs.existsSync(filePath)) {
                throw new Error(`Required file missing: ${file}`);
            }
        }

        console.log('✅ All required files present');
        
        // Test server startup (quick check)
        try {
            const serverPath = path.join(this.projectRoot, 'server.js');
            const serverContent = fs.readFileSync(serverPath, 'utf8');
            if (!serverContent.includes('express')) {
                throw new Error('Server configuration appears invalid');
            }
            console.log('✅ Server configuration valid');
        } catch (error) {
            throw new Error('Server verification failed');
        }
        
        console.log('');
    }

    showCompletionMessage() {
        console.log('🎉 Setup Complete!\n');
        
        console.log('📋 Next Steps:');
        console.log('1. (Optional) Add your Gemini API key to .env file');
        console.log('2. Start the development server: npm run dev');
        console.log('3. Open your browser: http://localhost:3000');
        console.log('4. Run tests: npm test\n');
        
        console.log('🚀 Quick Commands:');
        console.log('• Development: npm run dev');
        console.log('• Production: npm start');
        console.log('• Testing: npm test');
        console.log('• Analytics: http://localhost:3000/analytics.html\n');
        
        console.log('📚 Documentation:');
        console.log('• README.md - Complete user guide');
        console.log('• DEPLOYMENT.md - Deployment instructions');
        console.log('• API docs available at /health endpoint\n');
        
        console.log('🌾 Happy farming with CropSense!');
    }
}

// Run setup if this file is executed directly
if (require.main === module) {
    const setup = new CropSenseSetup();
    setup.run().catch(console.error);
}

module.exports = CropSenseSetup;
