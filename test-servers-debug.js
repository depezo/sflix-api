const puppeteer = require('puppeteer');

async function testServersDebug() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1366, height: 768 }
  });

  try {
    const page = await browser.newPage();
    
    // Configuration
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    const seriesId = 'free-foundation-hd-72427';
    const seasonNumber = 1;
    const episodeNumber = 1;
    
    console.log('=== TEST DE RÉCUPÉRATION DES SERVEURS AVEC NAVIGATION PROGRESSIVE ===\n');
    
    // Étape 1: Aller à la page de la série
    console.log(`1. Navigation vers https://sflix2.to/tv/${seriesId}`);
    try {
      await page.goto(`https://sflix2.to/tv/${seriesId}`, { 
        waitUntil: 'domcontentloaded', 
        timeout: 60000 
      });
    } catch (navError) {
      console.log('   - Erreur de navigation, essai avec waitUntil: load');
      await page.goto(`https://sflix2.to/tv/${seriesId}`, { 
        waitUntil: 'load', 
        timeout: 60000 
      });
    }
    await new Promise(r => setTimeout(r, 3000));
    
    console.log('   - Page chargée, URL actuelle:', page.url());
    
    // Étape 2: Ouvrir le sélecteur de saisons
    console.log('\n2. Recherche du dropdown des saisons...');
    const seasonDropdownSelectors = [
      '.btn-season',
      '.season-dropdown',
      '.dropdown-toggle',
      '.slt-seasons-content',
      '.ss-head'
    ];
    
    let dropdownFound = false;
    for (const sel of seasonDropdownSelectors) {
      const elem = await page.$(sel);
      if (elem) {
        console.log(`   - Dropdown trouvé avec sélecteur: ${sel}`);
        await elem.click();
        await new Promise(r => setTimeout(r, 1000));
        dropdownFound = true;
        break;
      }
    }
    
    if (!dropdownFound) {
      console.log('   - Aucun dropdown trouvé');
    }
    
    // Étape 3: Cliquer sur la saison
    console.log(`\n3. Sélection de la saison ${seasonNumber}...`);
    const seasonSelectors = [
      `a:contains("Season ${seasonNumber}")`,
      `button:contains("Season ${seasonNumber}")`,
      `[data-season="${seasonNumber}"]`,
      `.ss-item`
    ];
    
    let seasonClicked = false;
    
    // Essayer d'abord les sélecteurs CSS
    for (const sel of [`[data-season="${seasonNumber}"]`, '.ss-item']) {
      try {
        const elem = await page.$(sel);
        if (elem) {
          const text = await elem.evaluate(el => el.textContent);
          if (text && text.includes(`Season ${seasonNumber}`)) {
            console.log(`   - Clic sur la saison avec sélecteur: ${sel}`);
            await elem.click();
            await new Promise(r => setTimeout(r, 1500));
            seasonClicked = true;
            break;
          }
        }
      } catch (e) {}
    }
    
    // Si pas trouvé, chercher par texte
    if (!seasonClicked) {
      const elements = await page.$$('a, button, [data-season]');
      for (const elem of elements) {
        const text = await elem.evaluate(el => el.textContent || '');
        if (text.trim() === `Season ${seasonNumber}`) {
          console.log(`   - Clic sur la saison trouvée par texte`);
          await elem.click();
          await new Promise(r => setTimeout(r, 1500));
          seasonClicked = true;
          break;
        }
      }
    }
    
    if (!seasonClicked) {
      console.log('   - Impossible de cliquer sur la saison');
    }
    
    // Étape 4: Cliquer sur l'épisode
    console.log(`\n4. Sélection de l'épisode ${episodeNumber}...`);
    const episodeSelectors = [
      '.eps-item',
      '.episode-item',
      '.ep-item',
      '[data-episode]',
      '.episode',
      'a[href*="/episode-"]'
    ];
    
    let episodeClicked = false;
    for (const sel of episodeSelectors) {
      const elements = await page.$$(sel);
      console.log(`   - ${elements.length} éléments trouvés avec ${sel}`);
      
      for (const elem of elements) {
        const href = await elem.evaluate(el => el.getAttribute('href') || '');
        const text = await elem.evaluate(el => el.textContent || '');
        const dataEp = await elem.evaluate(el => el.getAttribute('data-episode') || '');
        
        // Vérifier si c'est le bon épisode
        if (href.includes(`/episode-${episodeNumber}`) || 
            text.includes(`Episode ${episodeNumber}`) ||
            dataEp === String(episodeNumber) ||
            text.trim() === String(episodeNumber)) {
          console.log(`   - Clic sur l'épisode trouvé`);
          await elem.click();
          await new Promise(r => setTimeout(r, 3000));
          episodeClicked = true;
          break;
        }
      }
      if (episodeClicked) break;
    }
    
    if (!episodeClicked) {
      console.log('   - Impossible de cliquer sur l\'épisode');
    }
    
    // Étape 5: Attendre et vérifier l'URL
    console.log('\n5. Vérification de la navigation...');
    const currentUrl = page.url();
    console.log(`   - URL actuelle: ${currentUrl}`);
    
    // Étape 6: Chercher les serveurs
    console.log('\n6. Recherche des serveurs...');
    
    // Attendre un peu plus pour le chargement dynamique
    await new Promise(r =\u003e setTimeout(r, 3000));
    
    // Essayer de cliquer sur un onglet "Servers" si présent
    const serverTabSelectors = [
      'a[href="#servers"]',
      '.nav-tabs a:contains("Server")',
      'button:contains("Server")',
      '.servers-tab'
    ];
    
    for (const sel of serverTabSelectors) {
      try {
        const elem = await page.$(sel);
        if (elem) {
          console.log(`   - Onglet serveurs trouvé: ${sel}`);
          await elem.click();
          await new Promise(r =\u003e setTimeout(r, 1000));
          break;
        }
      } catch (e) {}
    }
    
    // Extraire les serveurs
    const serversData = await page.evaluate(() => {
      const results = {
        servers: [],
        containers: {},
        debug: {}
      };
      
      // Sélecteurs de serveurs
      const serverSelectors = [
        '.link-item[data-id]',
        '.btn-play[data-id]',
        'a.link-item',
        '.server-item',
        '.item.server',
        '[data-server]',
        '.nav-link[data-id]',
        '.btn-server'
      ];
      
      // Chercher les serveurs
      const allServers = [];
      for (const sel of serverSelectors) {
        const elements = document.querySelectorAll(sel);
        if (elements.length > 0) {
          results.debug[sel] = elements.length;
          elements.forEach(el => {
            const text = (el.textContent || '').trim();
            const id = el.getAttribute('data-id') || el.getAttribute('data-server') || el.getAttribute('id') || '';
            const href = el.getAttribute('href') || '';
            
            if (text && !text.match(/share|download|trailer|comment/i)) {
              allServers.push({
                selector: sel,
                text: text,
                id: id,
                href: href,
                tagName: el.tagName
              });
            }
          });
        }
      }
      
      // Dédupliquer
      const seen = new Set();
      for (const srv of allServers) {
        const key = `${srv.text}|${srv.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.servers.push(srv);
        }
      }
      
      // Vérifier les conteneurs
      const containerSelectors = [
        '.film-servers',
        '.link-list',
        '#servers-list',
        '.list-server',
        '.server-list',
        '.watching_player-servers'
      ];
      
      for (const sel of containerSelectors) {
        const elem = document.querySelector(sel);
        if (elem) {
          results.containers[sel] = {
            exists: true,
            childCount: elem.children.length,
            innerHTML: elem.innerHTML.substring(0, 200)
          };
        }
      }
      
      return results;
    });
    
    console.log('\n7. Résultats:');
    console.log(`   - Serveurs trouvés: ${serversData.servers.length}`);
    
    if (serversData.servers.length > 0) {
      console.log('\n   Liste des serveurs:');
      serversData.servers.forEach(srv => {
        console.log(`   • ${srv.text} (id: ${srv.id}, selector: ${srv.selector})`);
      });
    }
    
    console.log('\n   Debug - Éléments trouvés par sélecteur:');
    for (const [sel, count] of Object.entries(serversData.debug)) {
      if (count > 0) {
        console.log(`   - ${sel}: ${count} éléments`);
      }
    }
    
    console.log('\n   Conteneurs présents:');
    for (const [sel, data] of Object.entries(serversData.containers)) {
      console.log(`   - ${sel}: ${data.childCount} enfants`);
      if (data.innerHTML) {
        console.log(`     HTML: ${data.innerHTML.substring(0, 100)}...`);
      }
    }
    
    // Prendre une capture d'écran
    await page.screenshot({ path: 'debug-servers.png', fullPage: false });
    console.log('\n8. Capture d\'écran sauvegardée: debug-servers.png');
    
    // Attendre avant de fermer pour observer
    console.log('\nAppuyez sur Ctrl+C pour fermer le navigateur...');
    await new Promise(r =\u003e setTimeout(r, 30000));
    
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await browser.close();
  }
}

testServersDebug();
