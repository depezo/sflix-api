#!/bin/bash

echo "==================================="
echo "Sflix-API Server Setup Script"
echo "==================================="
echo ""

# Step 1: Clean up any previous installation attempts
echo "Step 1: Cleaning up..."
rm -rf node_modules package-lock.json
npm cache clean --force

# Step 2: Create .npmrc file to skip Chromium download
echo "Step 2: Creating .npmrc configuration..."
cat > .npmrc << 'EOF'
puppeteer_skip_chromium_download=true
puppeteer_skip_download=true
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_SKIP_DOWNLOAD=true
EOF

# Step 3: Set environment variables
echo "Step 3: Setting environment variables..."
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_SKIP_DOWNLOAD=true
export NODE_OPTIONS="--max-old-space-size=512"

# Step 4: Install dependencies without puppeteer first
echo "Step 4: Installing base dependencies..."
npm install axios cheerio cors express user-agents

# Step 5: Install puppeteer-extra packages
echo "Step 5: Installing puppeteer-extra packages..."
npm install puppeteer-extra puppeteer-extra-plugin-stealth

# Step 6: Try to install puppeteer-core instead of puppeteer
echo "Step 6: Installing puppeteer-core (lightweight version)..."
npm install puppeteer-core

echo ""
echo "==================================="
echo "Installation Complete!"
echo "==================================="
echo ""
echo "IMPORTANT NOTES:"
echo "1. Puppeteer-core was installed instead of puppeteer"
echo "2. You need to install Chromium/Chrome on your server:"
echo "   - Ubuntu/Debian: sudo apt-get install chromium-browser"
echo "   - CentOS/RHEL: sudo yum install chromium"
echo ""
echo "3. Update your code to use puppeteer-core:"
echo "   const puppeteer = require('puppeteer-core');"
echo "   const browser = await puppeteer.launch({"
echo "     executablePath: '/usr/bin/chromium-browser',"
echo "     args: ['--no-sandbox', '--disable-setuid-sandbox']"
echo "   });"
echo ""
