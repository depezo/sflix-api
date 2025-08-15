const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cheerio = require('cheerio');

puppeteer.use(StealthPlugin());

const BASE_URL = 'https://sflix2.to';

async function testServersAdvanced() {
  let browser = null;
  let page = null;
  
  try {
    console.log('Démarrage du test avancé des serveurs...\n');
    
    browser = await puppeteer.launch({
      headless: false, // Mode visible pour debug
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--window-size=1920,1080'
      ]
    });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Activer les logs de la console du navigateur
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console Error:', msg.text());
      }
    });
    
    // Intercepter les requêtes réseau
    await page.setRequestInterception(true);
    let serverRequests = [];
    
    page.on('request', req => {
      const url = req.url();
      // Capturer les requêtes potentielles aux serveurs
      if (url.includes('ajax') || url.includes('server') || url.includes('embed') || url.includes('source')) {
        serverRequests.push({
          url: url,
          method: req.method(),
          type: req.resourceType()
        });
      }
      req.continue();
    });
    
    // Méthode 1: Navigation directe vers la page de la série
    console.log('Étape 1: Navigation vers la page de la série...');
    await page.goto(`${BASE_URL}/tv/free-foundation-hd-72427`, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    console.log('URL actuelle:', page.url());
    await page.screenshot({ path: 'debug-step1.png' });
    
    // Attendre un peu
    await new Promise(r => setTimeout(r, 2000));
    
    // Chercher et cliquer sur la saison 1
    console.log('\nÉtape 2: Recherche de la saison 1...');
    
    // Essayer plusieurs sélecteurs pour la saison
    const seasonSelectors = [
      'button:contains("Season 1")',
      'a:contains("Season 1")',
      '[data-season="1"]',
      '.ss-item:contains("Season 1")',
      '.dropdown-toggle'
    ];
    
    let seasonFound = false;
    for (const selector of seasonSelectors) {
      try {
        const elem = await page.$(selector);
        if (elem) {
          console.log(`Trouvé avec sélecteur: ${selector}`);
          await elem.click();
          await new Promise(r => setTimeout(r, 1500));
          seasonFound = true;
          break;
        }
      } catch {}
    }
    
    if (!seasonFound) {
      console.log('Saison non trouvée via sélecteurs, recherche dans le DOM...');
      
      // Recherche plus large
      const links = await page.$$eval('a, button', elements => {
        return elements.map(e => ({
          text: e.textContent.trim(),
          href: e.href || '',
          class: e.className || '',
          id: e.id || ''
        }));
      });
      
      const seasonLink = links.find(l => l.text.includes('Season 1'));
      if (seasonLink) {
        console.log('Trouvé:', seasonLink);
      }
    }
    
    await page.screenshot({ path: 'debug-step2.png' });
    
    // Chercher et cliquer sur l'épisode 1
    console.log('\nÉtape 3: Recherche de l\'épisode 1...');
    
    const episodeSelectors = [
      '[data-episode="1"]',
      'a[href*="episode-1"]',
      '.eps-item:first-child',
      '.episode-item:first-child'
    ];
    
    let episodeFound = false;
    for (const selector of episodeSelectors) {
      try {
        const elem = await page.$(selector);
        if (elem) {
          console.log(`Épisode trouvé avec: ${selector}`);
          await elem.click();
          await new Promise(r => setTimeout(r, 2000));
          episodeFound = true;
          break;
        }
      } catch {}
    }
    
    if (!episodeFound) {
      console.log('Épisode non trouvé, tentative de navigation directe...');
      // Essayer l'URL directe
      await page.goto(`${BASE_URL}/tv/free-foundation-hd-72427/free-foundation-hd-72427-season-1/free-foundation-hd-72427-season-1-episode-1`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
    }
    
    console.log('URL après navigation:', page.url());
    await page.screenshot({ path: 'debug-step3.png' });
    
    // Attendre le chargement complet
    await new Promise(r => setTimeout(r, 3000));
    
    // Analyse du DOM pour les serveurs
    console.log('\nÉtape 4: Analyse du DOM pour les serveurs...');
    
    const pageAnalysis = await page.evaluate(() => {
      // Récupérer tous les éléments potentiellement liés aux serveurs
      const analysis = {
        iframes: [],
        dataAttributes: [],
        linksWithServer: [],
        buttonsWithServer: [],
        elementsWithServerClass: [],
        scripts: []
      };
      
      // Iframes
      document.querySelectorAll('iframe').forEach(iframe => {
        analysis.iframes.push({
          src: iframe.src,
          id: iframe.id,
          class: iframe.className
        });
      });
      
      // Elements avec data-* attributes
      document.querySelectorAll('[data-id], [data-server], [data-link], [data-type]').forEach(elem => {
        analysis.dataAttributes.push({
          tag: elem.tagName,
          text: elem.textContent.trim().substring(0, 50),
          dataId: elem.getAttribute('data-id'),
          dataServer: elem.getAttribute('data-server'),
          dataLink: elem.getAttribute('data-link'),
          dataType: elem.getAttribute('data-type'),
          class: elem.className
        });
      });
      
      // Liens contenant "server"
      document.querySelectorAll('a').forEach(link => {
        if (link.textContent.toLowerCase().includes('server') || 
            link.href.includes('server')) {
          analysis.linksWithServer.push({
            text: link.textContent.trim(),
            href: link.href,
            class: link.className
          });
        }
      });
      
      // Boutons contenant "server"
      document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent.toLowerCase().includes('server')) {
          analysis.buttonsWithServer.push({
            text: btn.textContent.trim(),
            class: btn.className,
            onclick: btn.onclick ? 'has onclick' : 'no onclick'
          });
        }
      });
      
      // Elements avec classe contenant "server"
      document.querySelectorAll('[class*="server"]').forEach(elem => {
        analysis.elementsWithServerClass.push({
          tag: elem.tagName,
          class: elem.className,
          text: elem.textContent.trim().substring(0, 50)
        });
      });
      
      // Scripts inline
      document.querySelectorAll('script').forEach(script => {
        const content = script.innerHTML;
        if (content && (content.includes('server') || content.includes('embed'))) {
          analysis.scripts.push(content.substring(0, 200));
        }
      });
      
      return analysis;
    });
    
    // Afficher l'analyse
    console.log('\n=== ANALYSE DU DOM ===');
    console.log('Iframes trouvés:', pageAnalysis.iframes.length);
    if (pageAnalysis.iframes.length > 0) {
      pageAnalysis.iframes.forEach(iframe => {
        console.log('  -', iframe);
      });
    }
    
    console.log('\nÉléments avec data-* attributes:', pageAnalysis.dataAttributes.length);
    if (pageAnalysis.dataAttributes.length > 0) {
      pageAnalysis.dataAttributes.slice(0, 10).forEach(elem => {
        console.log('  -', elem);
      });
    }
    
    console.log('\nLiens avec "server":', pageAnalysis.linksWithServer.length);
    if (pageAnalysis.linksWithServer.length > 0) {
      pageAnalysis.linksWithServer.forEach(link => {
        console.log('  -', link);
      });
    }
    
    console.log('\nBoutons avec "server":', pageAnalysis.buttonsWithServer.length);
    if (pageAnalysis.buttonsWithServer.length > 0) {
      pageAnalysis.buttonsWithServer.forEach(btn => {
        console.log('  -', btn);
      });
    }
    
    console.log('\nÉléments avec classe "server":', pageAnalysis.elementsWithServerClass.length);
    if (pageAnalysis.elementsWithServerClass.length > 0) {
      pageAnalysis.elementsWithServerClass.slice(0, 10).forEach(elem => {
        console.log('  -', elem);
      });
    }
    
    console.log('\n=== REQUÊTES RÉSEAU INTERCEPTÉES ===');
    console.log('Total:', serverRequests.length);
    serverRequests.slice(-10).forEach(req => {
      console.log(`  - ${req.method} ${req.type}: ${req.url.substring(0, 100)}`);
    });
    
    // Sauvegarder le HTML complet pour analyse
    const fullHtml = await page.content();
    const fs = require('fs');
    fs.writeFileSync('debug-page.html', fullHtml);
    console.log('\nHTML complet sauvegardé dans debug-page.html');
    
    // Capture finale
    await page.screenshot({ path: 'debug-final.png', fullPage: true });
    console.log('Captures d\'écran sauvegardées: debug-step1.png, debug-step2.png, debug-step3.png, debug-final.png');
    
  } catch (error) {
    console.error('Erreur:', error.message);
    console.error(error.stack);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testServersAdvanced();
