// Puppeteer wrapper to handle both puppeteer and puppeteer-core
// This allows the code to work in both development (with puppeteer) and production (with puppeteer-core)

let puppeteer;

try {
  // Try to load regular puppeteer first (development)
  puppeteer = require('puppeteer');
  console.log('Using puppeteer with bundled Chromium');
} catch (error) {
  try {
    // Fall back to puppeteer-core (production/server)
    puppeteer = require('puppeteer-core');
    console.log('Using puppeteer-core (no bundled Chromium)');
  } catch (error2) {
    console.error('Neither puppeteer nor puppeteer-core is installed!');
    process.exit(1);
  }
}

// Export a launch function with appropriate configuration
module.exports = {
  puppeteer,
  
  async launch(options = {}) {
    const isProduction = process.env.NODE_ENV === 'production';
    const isPuppeteerCore = puppeteer.name === 'puppeteer-core';
    
    // Default options for memory-constrained environments
    const defaultOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--single-process', // Helps with memory constraints
        '--no-sandbox'
      ]
    };
    
    // If using puppeteer-core or in production, need to specify Chrome path
    if (isPuppeteerCore || isProduction) {
      // Try common Chrome/Chromium paths
      const possiblePaths = [
        process.env.CHROME_PATH,
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome',
        '/opt/google/chrome/chrome',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
      ].filter(Boolean);
      
      // Find first existing path
      const fs = require('fs');
      let executablePath = null;
      
      for (const path of possiblePaths) {
        if (fs.existsSync(path)) {
          executablePath = path;
          break;
        }
      }
      
      if (!executablePath) {
        console.error('Chrome/Chromium not found! Please install it or set CHROME_PATH environment variable.');
        console.error('Tried paths:', possiblePaths);
        throw new Error('Chrome executable not found');
      }
      
      defaultOptions.executablePath = executablePath;
      console.log('Using Chrome at:', executablePath);
    }
    
    // Merge with user options
    const finalOptions = { ...defaultOptions, ...options };
    
    return puppeteer.launch(finalOptions);
  }
};
