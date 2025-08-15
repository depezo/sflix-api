const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Navigation vers la série...');
  await page.goto('https://sflix2.to/tv/free-foundation-hd-72427', { waitUntil: 'domcontentloaded', timeout: 60000 });
  
  await new Promise(r => setTimeout(r, 5000));
  console.log('Page chargée');
  
  // Essayer de cliquer sur l'épisode directement via l'URL
  console.log('Navigation directe vers épisode...');
  await page.goto('https://sflix2.to/tv/free-foundation-hd-72427/season-1/episode-1', { waitUntil: 'domcontentloaded', timeout: 60000 });
  
  await new Promise(r => setTimeout(r, 5000));
  
  const servers = await page.evaluate(() => {
    const items = [];
    document.querySelectorAll('.link-item[data-id], a.link-item, .server-item').forEach(el => {
      items.push({
        text: el.textContent.trim(),
        id: el.getAttribute('data-id') || ''
      });
    });
    return items;
  });
  
  console.log('Serveurs trouvés:', servers.length);
  servers.forEach(s => console.log('  -', s.text, '(id:', s.id, ')'));
  
  await new Promise(r => setTimeout(r, 10000));
  await browser.close();
})();
