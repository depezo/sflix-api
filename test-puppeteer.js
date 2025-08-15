const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cheerio = require('cheerio');

// Utiliser le plugin stealth
puppeteer.use(StealthPlugin());

const BASE_URL = 'https://sflix2.to';

async function testTeenWolf() {
  let browser = null;
  let page = null;
  
  try {
    console.log('Lancement du navigateur...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    page = await browser.newPage();
    
    console.log('Navigation vers la page Teen Wolf...');
    await page.goto(`${BASE_URL}/tv/free-teen-wolf-hd-39467`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('Page chargée, attente du contenu...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Récupérer le contenu HTML
    const content = await page.content();
    const $ = cheerio.load(content);
    
    const seasons = [];
    
    // Chercher les saisons dans différentes structures
    console.log('Recherche des saisons...');
    
    // Stratégie 1: Chercher dans les boutons/liens de saisons
    const selectors = [
      '.ss-list .ss-item',
      '.slt-seasons-content .ssc-item',
      '.season-list .btn-season',
      '.dropdown-menu a[data-season]',
      '[data-season]',
      '.season-item',
      'button:contains("Season")',
      'a:contains("Season")'
    ];
    
    for (const selector of selectors) {
      console.log(`  Essai du sélecteur: ${selector}`);
      const elements = $(selector);
      console.log(`    Trouvé ${elements.length} éléments`);
      
      elements.each((index, element) => {
        const $elem = $(element);
        let seasonNumber = $elem.attr('data-season') || 
                          $elem.attr('data-id') ||
                          $elem.attr('value');
        
        if (!seasonNumber) {
          const text = $elem.text().trim();
          const match = text.match(/season\s*(\d+)/i) || text.match(/^(\d+)$/);
          if (match) {
            seasonNumber = match[1];
          }
        }
        
        if (seasonNumber) {
          const seasonNum = parseInt(seasonNumber);
          if (!seasons.find(s => s.seasonNumber === seasonNum) && seasonNum <= 20) {
            seasons.push({
              seasonNumber: seasonNum,
              seasonName: `Season ${seasonNum}`
            });
            console.log(`      Ajouté: Season ${seasonNum}`);
          }
        }
      });
    }
    
    // Afficher les résultats
    console.log('\nRésultats:');
    console.log(`Nombre de saisons trouvées: ${seasons.length}`);
    seasons.sort((a, b) => a.seasonNumber - b.seasonNumber);
    seasons.forEach(s => {
      console.log(`  - ${s.seasonName}`);
    });
    
    // Si aucune saison trouvée, afficher une partie du HTML pour debug
    if (seasons.length === 0) {
      console.log('\nAucune saison trouvée. Recherche de texte contenant "Season"...');
      const seasonTexts = [];
      $('*').each((i, elem) => {
        const text = $(elem).text();
        if (text && text.match(/Season \d+/i) && text.length < 100) {
          if (!seasonTexts.includes(text)) {
            seasonTexts.push(text);
          }
        }
      });
      console.log('Textes trouvés:', seasonTexts.slice(0, 10));
    }
    
  } catch (error) {
    console.error('Erreur:', error.message);
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

// Exécuter le test
testTeenWolf();
