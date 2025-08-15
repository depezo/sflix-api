#!/bin/bash

echo "Installing sflix-api on server with memory constraints..."

# Set environment variables to skip Chromium download
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_SKIP_DOWNLOAD=true

# Clear npm cache
npm cache clean --force

# Install dependencies with reduced memory usage
NODE_OPTIONS="--max-old-space-size=512" npm install --no-optional

echo "Installation complete!"
echo ""
echo "IMPORTANT: Since Chromium was not downloaded, you need to either:"
echo "1. Install Chromium/Chrome on your server manually"
echo "2. Use puppeteer-core instead of puppeteer and point to an existing Chrome installation"
echo ""
echo "To use system Chrome, update your code to specify executablePath:"
echo "const browser = await puppeteer.launch({"
echo "  executablePath: '/usr/bin/chromium-browser', // or '/usr/bin/google-chrome'"
echo "  args: ['--no-sandbox', '--disable-setuid-sandbox']"
echo "});"
