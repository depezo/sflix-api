const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://sflix2.to';

async function testTrendingSections() {
  try {
    console.log('Récupération de la page d\'accueil...\n');
    
    const response = await axios.get(`${BASE_URL}/home`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // Rechercher toutes les sections block_area
    console.log('=== SECTIONS TROUVÉES ===\n');
    
    $('.block_area').each((index, element) => {
      const $block = $(element);
      
      // Chercher le titre de la section
      const title = $block.find('.block-header h2, .cat-heading, h2, h3').first().text().trim() ||
                    $block.find('.title').first().text().trim() ||
                    $block.prev('h2').text().trim() ||
                    $block.find('[class*="heading"]').first().text().trim();
      
      // Compter les items
      const itemCount = $block.find('.flw-item').length;
      
      // Obtenir quelques exemples
      const examples = [];
      $block.find('.flw-item').slice(0, 3).each((i, item) => {
        const $item = $(item);
        const link = $item.find('a').first().attr('href') || '';
        const name = $item.find('.film-name, .title, h3').first().text().trim();
        const type = link.includes('/tv/') ? 'TV' : link.includes('/movie/') ? 'Movie' : 'Unknown';
        examples.push({ name, type });
      });
      
      console.log(`Section ${index + 1}: "${title || 'Sans titre'}"`);
      console.log(`  - ${itemCount} items trouvés`);
      if (examples.length > 0) {
        console.log('  - Exemples:');
        examples.forEach(ex => {
          console.log(`    • ${ex.name} (${ex.type})`);
        });
      }
      
      // Vérifier les classes et IDs
      const classes = $block.attr('class') || '';
      const id = $block.attr('id') || '';
      if (id) console.log(`  - ID: ${id}`);
      if (classes) console.log(`  - Classes: ${classes}`);
      
      console.log('');
    });
    
    // Méthode alternative: chercher par texte
    console.log('\n=== RECHERCHE PAR TEXTE ===\n');
    
    // Chercher les éléments contenant "Trending"
    const trendingHeaders = [];
    $('h2, h3, .heading, .title').each((i, elem) => {
      const text = $(elem).text();
      if (text.toLowerCase().includes('trending')) {
        trendingHeaders.push({
          text: text.trim(),
          tag: elem.name,
          class: $(elem).attr('class') || ''
        });
      }
    });
    
    console.log('Headers avec "Trending":');
    trendingHeaders.forEach(h => {
      console.log(`  - "${h.text}" (${h.tag}, class: ${h.class})`);
      
      // Trouver le conteneur parent et compter les items
      const parent = $(`:contains("${h.text}")`).closest('.block_area, .section, .container').first();
      if (parent.length) {
        const items = parent.find('.flw-item');
        console.log(`    → ${items.length} items dans le conteneur`);
        
        // Vérifier le type des premiers items
        const types = {};
        items.slice(0, 10).each((i, item) => {
          const link = $(item).find('a').first().attr('href') || '';
          const type = link.includes('/tv/') ? 'TV' : link.includes('/movie/') ? 'Movie' : 'Unknown';
          types[type] = (types[type] || 0) + 1;
        });
        console.log('    → Types:', JSON.stringify(types));
      }
    });
    
    // Méthode par index
    console.log('\n=== ANALYSE PAR INDEX ===\n');
    
    const blocks = $('.block_area');
    console.log(`Total de ${blocks.length} blocks trouvés\n`);
    
    blocks.each((index, block) => {
      const $block = $(block);
      const items = $block.find('.flw-item');
      
      if (items.length > 0) {
        // Analyser les 5 premiers items
        const types = { Movie: 0, TV: 0, Unknown: 0 };
        items.slice(0, 5).each((i, item) => {
          const link = $(item).find('a').first().attr('href') || '';
          if (link.includes('/tv/')) types.TV++;
          else if (link.includes('/movie/')) types.Movie++;
          else types.Unknown++;
        });
        
        console.log(`Block ${index}: ${types.Movie} Movies, ${types.TV} TV`);
        
        // Si c'est majoritairement des TV shows
        if (types.TV > types.Movie) {
          console.log('  → Probablement section TV/Series');
          
          // Afficher quelques exemples
          items.slice(0, 3).each((i, item) => {
            const name = $(item).find('.film-name, .title').first().text().trim();
            console.log(`    • ${name}`);
          });
        }
      }
    });
    
  } catch (error) {
    console.error('Erreur:', error.message);
  }
}

testTrendingSections();
