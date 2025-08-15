// Puppeteer configuration for different environments

const config = {
  development: {
    // Use bundled Chromium in development
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  },
  
  production: {
    // Use system Chrome/Chromium in production
    executablePath: process.env.CHROME_PATH || '/usr/bin/chromium-browser',
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // <- this one helps with memory
      '--disable-gpu'
    ]
  }
};

module.exports = config[process.env.NODE_ENV || 'development'];
