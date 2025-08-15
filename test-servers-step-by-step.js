const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cheerio = require('cheerio');

puppeteer.use(StealthPlugin());

const BASE_URL = 'https://sflix2.to';

async function testServersStepByStep() {
  let browser = null;
  let page = null;
  
  try {
    console.log('Test navigation progressive pour les serveurs...\n');
    
    browser = await puppeteer.launch({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--window-size=1920,1080'
      ]
    });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Étape 1: Page de la série
    console.log('Étape 1: Navigation vers la page de la série...');
    await page.goto(`${BASE_URL}/tv/free-foundation-hd-72427`, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    await new Promise(r => setTimeout(r, 2000));
    console.log('URL:', page.url());
    
    // Étape 2: Cliquer sur Season 1
    console.log('\nÉtape 2: Recherche et clic sur Season 1...');
    
    // D'abord chercher le dropdown si nécessaire
    const dropdownBtn = await page.$('.dropdown-toggle, .btn-season');
    if (dropdownBtn) {
      console.log('Dropdown trouvé, clic...');
      await dropdownBtn.click();
      await new Promise(r => setTimeout(r, 1000));
    }
    
    // Chercher le lien Season 1
    const seasonLink = await page.$('a[data-id="63913"], #ss-63913');
    if (seasonLink) {
      console.log('Lien Season 1 trouvé, clic...');
      await seasonLink.click();
      await new Promise(r => setTimeout(r, 2000));
    } else {
      console.log('Season 1 non trouvé, recherche alternative...');
      // Essayer de cliquer par texte
      await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        const seasonLink = links.find(l => l.textContent.includes('Season 1'));
        if (seasonLink) {
          console.log('Clic sur:', seasonLink.textContent);
          seasonLink.click();
        }
      });
      await new Promise(r => setTimeout(r, 2000));
    }
    
    console.log('URL après clic saison:', page.url());
    
    // Étape 3: Cliquer sur Episode 1
    console.log('\nÉtape 3: Recherche et clic sur Episode 1...');
    
    // Attendre que les épisodes se chargent
    await page.waitForSelector('.eps-item, .episode-item', { timeout: 5000 }).catch(() => {});
    
    // Cliquer sur le premier épisode
    const episode1 = await page.$('.eps-item:first-child, .episode-item:first-child, [data-id="1198894"]');
    if (episode1) {
      console.log('Episode 1 trouvé, clic...');
      await episode1.click();
      await new Promise(r => setTimeout(r, 3000));
    } else {
      console.log('Episode 1 non trouvé via sélecteur, tentative via evaluate...');
      await page.evaluate(() => {
        const episodes = document.querySelectorAll('.eps-item, .episode-item');
        if (episodes.length > 0) episodes[0].click();
      });
      await new Promise(r => setTimeout(r, 3000));
    }
    
    console.log('URL après clic épisode:', page.url());
    
    // Attendre le chargement complet
    await new Promise(r => setTimeout(r, 3000));
    
    // Étape 4: Analyser les serveurs
    console.log('\nÉtape 4: Recherche des serveurs...');
    
    const servers = await page.evaluate(() => {
      const serverElements = [];
      
      // Recherche spécifique pour SFlix
      const selectors = [
        '.link-item[data-id]',
        '.btn-play[data-id]',
        'a.link-item',
        '.btn-server'
      ];
      
      selectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            const text = el.textContent || '';
            const id = el.getAttribute('data-id');
            
            if (id && text) {
              // Extraire le nom du serveur
              let name = text.replace(/\s+/g, ' ').trim();
              if (name.toLowerCase().includes('server')) {
                const parts = name.split(/server/i);
                if (parts.length > 1) {
                  name = parts[1].trim();
                }
              }
              
              serverElements.push({
                name,
                id,
                class: el.className,
                tag: el.tagName,
                isActive: el.classList.contains('active')
              });
            }
          });
        } catch (e) {}
      });
      
      // Recherche plus large si rien trouvé
      if (serverElements.length === 0) {
        document.querySelectorAll('a, button').forEach(el => {
          const text = (el.textContent || '').toLowerCase();
          if (text.includes('upcloud') || text.includes('megacloud') || text.includes('akcloud') || 
              text.includes('vidcloud') || text.includes('streamtape') || text.includes('server')) {
            const id = el.getAttribute('data-id') || el.getAttribute('data-server') || '';
            if (!text.includes('episode') && !text.includes('season')) {
              serverElements.push({
                name: el.textContent.trim(),
                id,
                class: el.className,
                tag: el.tagName
              });
            }
          }
        });
      }
      
      return serverElements;
    });
    
    console.log('\n=== SERVEURS TROUVÉS ===');
    if (servers.length > 0) {
      servers.forEach((server, index) => {
        console.log(`${index + 1}. ${server.name}`);
        console.log(`   ID: ${server.id}`);
        console.log(`   Tag: ${server.tag}`);
        console.log(`   Class: ${server.class}`);
        if (server.isActive) console.log(`   *** ACTIF ***`);
        console.log('');
      });
    } else {
      console.log('Aucun serveur trouvé!');
      
      // Debug: afficher tout le contenu avec data-id
      const allDataIds = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('[data-id]')).map(el => ({
          text: el.textContent.trim().substring(0, 50),
          id: el.getAttribute('data-id'),
          tag: el.tagName,
          class: el.className
        }));
      });
      
      console.log('\n=== DEBUG: Tous les éléments avec data-id ===');
      allDataIds.slice(0, 20).forEach(el => {
        console.log(`- ${el.tag} [${el.id}]: ${el.text}`);
      });
    }
    
    // Récupérer l'iframe
    const iframe = await page.$eval('iframe#iframe-embed, iframe', el => el.src).catch(() => '');
    if (iframe) {
      console.log('\n=== IFRAME ===');
      console.log('URL:', iframe);
    }
    
    // Capture d'écran finale
    await page.screenshot({ path: 'servers-final.png' });
    console.log('\nCapture d\'écran sauvegardée: servers-final.png');
    
    // Attendre avant de fermer pour voir le résultat
    console.log('\nAppuyez sur Ctrl+C pour fermer le navigateur...');
    await new Promise(r => setTimeout(r, 30000));
    
  } catch (error) {
    console.error('Erreur:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testServersStepByStep();
