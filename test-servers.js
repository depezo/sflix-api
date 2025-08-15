const scraper = require('./scraper');

async function testServers() {
  console.log('Test de récupération des serveurs pour Foundation S1E1...\n');
  
  try {
    const result = await scraper.getEpisodeServers('free-foundation-hd-72427', '1', '1');
    
    console.log('=== RÉSULTAT ===');
    console.log('Nombre de serveurs trouvés:', result.servers.length);
    
    if (result.servers.length > 0) {
      console.log('\n=== SERVEURS ===');
      result.servers.forEach((server, index) => {
        console.log(`${index + 1}. ${server.name}`);
        console.log(`   ID: ${server.id || 'N/A'}`);
        console.log(`   Type: ${server.type || 'N/A'}`);
        console.log(`   Element: ${server.element}`);
        console.log(`   Link: ${server.link || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('\nAucun serveur trouvé!');
      
      // Afficher les conteneurs pour debug
      console.log('\n=== DEBUG: CONTENEURS ===');
      if (result.containersDump) {
        result.containersDump.forEach(container => {
          if (container.present) {
            console.log(`✓ ${container.sel} (${container.length} caractères)`);
            if (container.preview) {
              console.log(`  Preview: ${container.preview.substring(0, 200)}...`);
            }
          } else {
            console.log(`✗ ${container.sel} (non trouvé)`);
          }
        });
      }
      
      // Afficher un aperçu du contenu de la page
      if (result.pageContent) {
        console.log('\n=== DEBUG: APERÇU DE LA PAGE ===');
        console.log(result.pageContent.substring(0, 500));
      }
    }
    
    if (result.iframe) {
      console.log('\n=== IFRAME ===');
      console.log('URL:', result.iframe);
    }
    
    if (result.error) {
      console.log('\n=== ERREUR ===');
      console.log(result.error);
    }
    
  } catch (error) {
    console.error('Erreur lors du test:', error.message);
    console.error(error.stack);
  }
  
  // Fermer le navigateur
  const browserManager = require('./browser');
  await browserManager.closeBrowser();
  process.exit(0);
}

testServers();
