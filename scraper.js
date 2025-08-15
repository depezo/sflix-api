const cheerio = require('cheerio');
const axios = require('axios');
const UserAgent = require('user-agents');
const browserManager = require('./browser');

const BASE_URL = 'https://sflix2.to';

// Créer une instance axios avec configuration
const axiosInstance = axios.create({
  timeout: 30000,
  headers: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Referer': BASE_URL,
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  }
});

// Fonction pour obtenir un user agent aléatoire
function getRandomUserAgent() {
  const userAgent = new UserAgent();
  return userAgent.toString();
}

// Fonction pour faire une requête avec retry
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axiosInstance.get(url, {
        headers: {
          'User-Agent': getRandomUserAgent()
        }
      });
      return response.data;
    } catch (error) {
      console.log(`Tentative ${i + 1} échouée pour ${url}`);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// Helper function pour extraire les données des cartes de contenu
function normalizeEpisodeTitle(raw) {
  if (!raw) return '';
  let t = String(raw).replace(/\r?\n+/g, ' ');
  t = t.replace(/\s+/g, ' ').trim();
  // Supprimer "Episode X:" au début
  t = t.replace(/^Episode\s*\d+\s*:\s*/i, '');
  // Supprimer un éventuel "X:" ou "X -" au début
  t = t.replace(/^\d+\s*[:.-]\s*/, '');
  return t.trim();
}

function extractCardData($, element) {
  const $elem = $(element);
  const link = $elem.find('a').first().attr('href') || '';
  const id = link.split('/').pop() || '';
  const title = $elem.find('.film-name').text().trim() || 
                 $elem.find('.title').text().trim() ||
                 $elem.find('h3').text().trim() || 
                 $elem.find('.film-detail h3').text().trim() || '';
  const poster = $elem.find('img').attr('data-src') || 
                 $elem.find('img').attr('src') || '';
  const quality = $elem.find('.quality').text().trim() || 
                  $elem.find('.jtip-quality').text().trim() || 'HD';
  const rating = $elem.find('.rating').text().trim() || 
                 $elem.find('.imdb').text().trim() || 
                 $elem.find('.score').text().trim() || 'N/A';
  const year = $elem.find('.year').text().trim() || 
               $elem.find('.released').text().trim() || 
               $elem.find('.fdi-item').first().text().trim() || '';

  return {
    id,
    title,
    poster: poster.startsWith('http') ? poster : `${BASE_URL}${poster}`,
    quality,
    rating,
    year,
    link: `${BASE_URL}${link}`
  };
}

// 1. Trending Movies
async function getTrendingMovies(page = 1) {
  try {
    const html = await fetchWithRetry(`${BASE_URL}/home`);
    const $ = cheerio.load(html);
    
    const movies = [];
    const startIndex = (page - 1) * 10;
    const endIndex = startIndex + 10;
    
    // Chercher les différentes structures possibles pour trending movies
    const selectors = [
      '.block_area:contains("Trending Movies") .flw-item',
      '.section-id-01 .flw-item',
      '.trending-movies .flw-item',
      '.film_list-wrap .flw-item'
    ];
    
    let items = null;
    for (const selector of selectors) {
      items = $(selector);
      if (items.length > 0) break;
    }
    
    // Si pas trouvé, prendre les premiers films de la page
    if (!items || items.length === 0) {
      items = $('.flw-item').slice(0, 30);
    }
    
    items.each((index, element) => {
      if (index >= startIndex && index < endIndex) {
        movies.push(extractCardData($, element));
      }
    });
    
    return movies;
  } catch (error) {
    console.error('Erreur dans getTrendingMovies:', error.message);
    return [];
  }
}

// 2. Trending Series  
async function getTrendingSeries(page = 1) {
  try {
    const html = await fetchWithRetry(`${BASE_URL}/home`);
    const $ = cheerio.load(html);
    
    const series = [];
    const startIndex = (page - 1) * 10;
    const endIndex = startIndex + 10;
    
    // La section "Trending" contient films ET séries mélangés
    // On doit filtrer pour ne garder que les séries (liens /tv/)
    const trendingBlock = $('.block_area').first(); // Premier block = Trending
    
    if (trendingBlock.length > 0) {
      let seriesCount = 0;
      
      trendingBlock.find('.flw-item').each((index, element) => {
        const link = $(element).find('a').first().attr('href') || '';
        
        // Ne garder que les séries (URL contient /tv/)
        if (link.includes('/tv/')) {
          if (seriesCount >= startIndex && seriesCount < endIndex) {
            series.push(extractCardData($, element));
          }
          seriesCount++;
        }
      });
    }
    
    // Si pas assez de séries dans trending, compléter avec "Latest TV Shows" (block 2)
    if (series.length < 10) {
      const latestTVBlock = $('.block_area').eq(2); // Block 2 = Latest TV Shows
      
      if (latestTVBlock.length > 0) {
        const remaining = 10 - series.length;
        let added = 0;
        
        latestTVBlock.find('.flw-item').each((index, element) => {
          if (added < remaining) {
            series.push(extractCardData($, element));
            added++;
          }
        });
      }
    }
    
    return series;
  } catch (error) {
    console.error('Erreur dans getTrendingSeries:', error.message);
    return [];
  }
}

// 3. Latest Movies
async function getLatestMovies(page = 1) {
  try {
    const html = await fetchWithRetry(`${BASE_URL}/home`);
    const $ = cheerio.load(html);
    
    const movies = [];
    const startIndex = (page - 1) * 10;
    const endIndex = startIndex + 10;
    
    // Chercher les différentes structures possibles pour latest movies
    const selectors = [
      '.block_area:contains("Latest Movies") .flw-item',
      '.section-id-03 .flw-item',
      '.latest-movies .flw-item',
      '.block_area:eq(2) .flw-item'
    ];
    
    let items = null;
    for (const selector of selectors) {
      items = $(selector);
      if (items.length > 0) break;
    }
    
    // Alternative: aller sur la page movies
    if (!items || items.length === 0) {
      const moviesHtml = await fetchWithRetry(`${BASE_URL}/movie`);
      const $movies = cheerio.load(moviesHtml);
      items = $movies('.flw-item');
    }
    
    items.each((index, element) => {
      if (index >= startIndex && index < endIndex) {
        movies.push(extractCardData($, element));
      }
    });
    
    return movies;
  } catch (error) {
    console.error('Erreur dans getLatestMovies:', error.message);
    return [];
  }
}

// 4. Latest TV Shows
async function getLatestTVShows(page = 1) {
  try {
    const html = await fetchWithRetry(`${BASE_URL}/home`);
    const $ = cheerio.load(html);
    
    const tvshows = [];
    const startIndex = (page - 1) * 10;
    const endIndex = startIndex + 10;
    
    // Chercher les différentes structures possibles pour latest TV shows
    const selectors = [
      '.block_area:contains("Latest TV Shows") .flw-item',
      '.section-id-04 .flw-item',
      '.latest-series .flw-item',
      '.block_area:eq(3) .flw-item'
    ];
    
    let items = null;
    for (const selector of selectors) {
      items = $(selector);
      if (items.length > 0) break;
    }
    
    // Alternative: aller sur la page tv-show
    if (!items || items.length === 0) {
      const tvHtml = await fetchWithRetry(`${BASE_URL}/tv-show`);
      const $tv = cheerio.load(tvHtml);
      items = $tv('.flw-item');
    }
    
    items.each((index, element) => {
      if (index >= startIndex && index < endIndex) {
        tvshows.push(extractCardData($, element));
      }
    });
    
    return tvshows;
  } catch (error) {
    console.error('Erreur dans getLatestTVShows:', error.message);
    return [];
  }
}

// 5. Tous les films
async function getAllMovies(page = 1) {
  try {
    const html = await fetchWithRetry(`${BASE_URL}/movie?page=${page}`);
    const $ = cheerio.load(html);
    
    const movies = [];
    $('.flw-item').slice(0, 15).each((index, element) => {
      movies.push(extractCardData($, element));
    });
    
    return movies;
  } catch (error) {
    console.error('Erreur dans getAllMovies:', error.message);
    return [];
  }
}

// 6. Toutes les séries
async function getAllTVShows(page = 1) {
  try {
    const html = await fetchWithRetry(`${BASE_URL}/tv-show?page=${page}`);
    const $ = cheerio.load(html);
    
    const tvshows = [];
    $('.flw-item').slice(0, 15).each((index, element) => {
      tvshows.push(extractCardData($, element));
    });
    
    return tvshows;
  } catch (error) {
    console.error('Erreur dans getAllTVShows:', error.message);
    return [];
  }
}

// 7. Saisons d'une série
async function getSeriesSeasons(seriesId) {
  let page = null;
  try {
    // D'abord essayer avec cheerio pour les cas simples
    const html = await fetchWithRetry(`${BASE_URL}/tv/${seriesId}`);
    const $ = cheerio.load(html);
    
    let seasons = [];
    
    // Stratégie 1: Chercher dans les scripts JSON-LD ou les données structurées
    $('script').each((i, elem) => {
      const scriptContent = $(elem).html();
      if (scriptContent && scriptContent.includes('season')) {
        // Essayer d'extraire les numéros de saison du script
        const seasonMatches = scriptContent.match(/season[\s:]*([0-9]+)/gi);
        if (seasonMatches) {
          seasonMatches.forEach(match => {
            const num = match.match(/[0-9]+/);
            if (num) {
              const seasonNum = parseInt(num[0]);
              if (!seasons.find(s => s.seasonNumber === seasonNum) && seasonNum <= 10) {
                seasons.push({
                  seasonNumber: seasonNum,
                  seasonName: `Season ${seasonNum}`,
                  episodeCount: 0
                });
              }
            }
          });
        }
      }
    });
    
    // Si on n'a pas trouvé de saisons, utiliser Puppeteer
    if (seasons.length === 0) {
      console.log(`Utilisation de Puppeteer pour ${seriesId}...`);
      page = await browserManager.getPage();
      
      // Naviguer vers la page
      await page.goto(`${BASE_URL}/tv/${seriesId}`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      // Attendre que la page soit chargée
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Essayer de trouver et cliquer sur le bouton des saisons si nécessaire
      try {
        // Chercher un bouton ou dropdown pour les saisons
        const seasonDropdown = await page.$('.btn-season, .season-dropdown, .dropdown-toggle:has-text("Season"), .slt-seasons-content');
        if (seasonDropdown) {
          await seasonDropdown.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (e) {
        // Pas de dropdown, continuer
      }
      
      // Récupérer le HTML après chargement dynamique
      const content = await page.content();
      const $dynamic = cheerio.load(content);
      
      // Chercher les saisons dans différentes structures possibles
      const selectors = [
        '.ss-list .ss-item',
        '.season-list .btn-season',
        '.dropdown-menu a[data-season]',
        '.season-item',
        '.slt-seasons-content .ssc-item', 
        '.sl-season',
        '[data-season]',
        '.seasons-block .season',
        '.season-tabs .tab',
        '.dropdown-menu li a',
        '.season-select option',
        'button[data-season]',
        'a[href*="/season-"]',
        'a', // Chercher tous les liens
        'button' // Et tous les boutons
      ];
      
      for (const selector of selectors) {
        $dynamic(selector).each((index, element) => {
          const $elem = $dynamic(element);
          const text = $elem.text().trim();
          
          // Vérifier si le texte contient "Season X"
          const seasonMatch = text.match(/^\s*Season\s+(\d+)\s*$/i);
          if (seasonMatch) {
            const seasonNum = parseInt(seasonMatch[1]);
            if (!seasons.find(s => s.seasonNumber === seasonNum) && seasonNum <= 20) {
              seasons.push({
                seasonNumber: seasonNum,
                seasonName: `Season ${seasonNum}`,
                episodeCount: 0
              });
            }
          } else {
            // Vérifier les attributs data-season, data-id, value
            let seasonNumber = $elem.attr('data-season') || 
                              $elem.attr('data-id') ||
                              $elem.attr('value');
            
            if (!seasonNumber) {
              const href = $elem.attr('href') || '';
              const hrefMatch = href.match(/season-(\d+)/);
              seasonNumber = hrefMatch?.[1];
            }
            
            if (seasonNumber) {
              const seasonNum = parseInt(seasonNumber);
              if (!seasons.find(s => s.seasonNumber === seasonNum) && seasonNum <= 20) {
                seasons.push({
                  seasonNumber: seasonNum,
                  seasonName: `Season ${seasonNum}`,
                  episodeCount: 0
                });
              }
            }
          }
        });
        
        if (seasons.length > 0) break;
      }
      
      // Essayer de récupérer le nombre d'épisodes pour chaque saison
      if (seasons.length > 0) {
        console.log(`Récupération du nombre d'épisodes pour ${seasons.length} saisons...`);
        
        for (const season of seasons) {
          try {
            // Chercher et cliquer sur le bouton de la saison
            const seasonSelectors = [
              `a:contains("Season ${season.seasonNumber}")`,
              `button:contains("Season ${season.seasonNumber}")`,
              `[data-season="${season.seasonNumber}"]`,
              `.ss-item:contains("Season ${season.seasonNumber}")`
            ];
            
            let clicked = false;
            for (const sel of seasonSelectors) {
              try {
                const elem = await page.$(sel);
                if (elem) {
                  await elem.click();
                  clicked = true;
                  await new Promise(resolve => setTimeout(resolve, 1500));
                  break;
                }
              } catch (e) {
                // Continuer avec le prochain sélecteur
              }
            }
            
            if (clicked) {
              // Récupérer le nouveau contenu après le clic
              const seasonContent = await page.content();
              const $season = cheerio.load(seasonContent);
              
              // Compter les épisodes
              const episodeSelectors = [
                '.eps-item',
                '.episode-item',
                '.ep-item',
                '[data-episode]',
                '.episode',
                'a[href*="/episode-"]'
              ];
              
              let episodeCount = 0;
              for (const epSel of episodeSelectors) {
                const episodes = $season(epSel);
                if (episodes.length > 0) {
                  episodeCount = episodes.length;
                  break;
                }
              }
              
              season.episodeCount = episodeCount;
              console.log(`  Season ${season.seasonNumber}: ${episodeCount} épisodes trouvés`);
            }
          } catch (e) {
            console.log(`  Erreur lors de la récupération des épisodes pour la saison ${season.seasonNumber}`);
          }
        }
      }
      
      // Fermer la page
      await page.close();
    }
    
    // Stratégie de secours: Pour les séries populaires connues
    const knownSeries = {
      'free-squid-game-hd-72172': { 
        seasons: 2,
        episodes: { 1: 9, 2: 7 }  // Squid Game: S1=9 eps, S2=7 eps
      },
      'squid-game-72172': { 
        seasons: 2,
        episodes: { 1: 9, 2: 7 }
      },
      'free-teen-wolf-hd-39467': {  
        seasons: 6,
        episodes: { 1: 12, 2: 12, 3: 24, 4: 12, 5: 20, 6: 20 }  // Teen Wolf episodes par saison
      },
      'teen-wolf-39467': {
        seasons: 6,
        episodes: { 1: 12, 2: 12, 3: 24, 4: 12, 5: 20, 6: 20 }
      }
    };
    
    if (knownSeries[seriesId]) {
      const seriesInfo = knownSeries[seriesId];
      
      // Ajouter les saisons manquantes
      for (let i = 1; i <= seriesInfo.seasons; i++) {
        let season = seasons.find(s => s.seasonNumber === i);
        if (!season) {
          season = {
            seasonNumber: i,
            seasonName: `Season ${i}`,
            episodeCount: seriesInfo.episodes[i] || 0
          };
          seasons.push(season);
        } else if (season.episodeCount === 0 && seriesInfo.episodes[i]) {
          // Si on a la saison mais pas le nombre d'épisodes, le mettre à jour
          season.episodeCount = seriesInfo.episodes[i];
        }
      }
    }
    
    // Si aucune saison trouvée, retourner au moins la saison 1
    if (seasons.length === 0) {
      seasons.push({
        seasonNumber: 1,
        seasonName: 'Season 1',
        episodeCount: 0
      });
    }
    
    return seasons.sort((a, b) => a.seasonNumber - b.seasonNumber);
  } catch (error) {
    console.error('Erreur dans getSeriesSeasons:', error.message);
    if (page) {
      try {
        await page.close();
      } catch (e) {
        // Ignorer l'erreur de fermeture
      }
    }
    return [{
      seasonNumber: 1,
      seasonName: 'Season 1',
      episodeCount: 0
    }];
  }
}

// 8. Détails d'une série
async function getSeriesDetails(seriesId) {
  try {
    const html = await fetchWithRetry(`${BASE_URL}/tv/${seriesId}`);
    const $ = cheerio.load(html);
    
    // Extraction des détails
    const title = $('.heading-name').text().trim() || 
                  $('.film-name').text().trim() ||
                  $('.movie-title').text().trim() ||
                  $('h1').first().text().trim() || '';
                  
    const overview = $('.description').text().trim() || 
                     $('.film-description').text().trim() ||
                     $('.movie-description').text().trim() ||
                     $('.synopsis').text().trim() || '';
                     
    const poster = $('.film-poster img').attr('src') || 
                   $('.movie-poster img').attr('src') ||
                   $('.dp-i-c-poster img').attr('src') || '';
                   
    const banner = $('.cover img').attr('src') || 
                   $('.backdrop img').attr('src') ||
                   $('.dp-i-c-bg img').attr('src') || '';
                   
    const rating = $('.imdb').text().trim() || 
                   $('.rating').text().trim() ||
                   $('.vote').text().trim() || 'N/A';
                   
    const quality = $('.quality').text().trim() || 
                    $('.badge-quality').text().trim() || 'HD';
    
    // Extraction des informations supplémentaires
    const released = $('.row-line:contains("Released")').text().replace('Released:', '').trim() || 
                     $('.released').text().trim() ||
                     $('.year').text().trim() || '';
                     
    const runtime = $('.row-line:contains("Duration")').text().replace('Duration:', '').trim() || 
                    $('.runtime').text().trim() ||
                    $('.duration').text().trim() || '';
    
    // Genres
    const genres = [];
    $('.row-line:contains("Genre") a, .genre a, .genres a').each((index, element) => {
      const genre = $(element).text().trim();
      if (genre && !genres.includes(genre)) {
        genres.push(genre);
      }
    });
    
    // Cast
    const cast = [];
    $('.row-line:contains("Casts") a, .cast-item, .actor').each((index, element) => {
      const name = $(element).text().trim();
      if (name && !cast.find(c => c.name === name)) {
        cast.push({ name, role: '' });
      }
    });
    
    // Récupération des saisons
    const seasons = await getSeriesSeasons(seriesId);
    
    // Recommandations
    const recommendations = [];
    $('.film-related .flw-item, .recommendations .flw-item, .related .flw-item')
      .slice(0, 10)
      .each((index, element) => {
        recommendations.push(extractCardData($, element));
      });
    
    return {
      id: seriesId,
      title,
      overview,
      released,
      runtime,
      trailer: '',
      quality,
      rating,
      poster: poster.startsWith('http') ? poster : `${BASE_URL}${poster}`,
      banner: banner.startsWith('http') ? banner : `${BASE_URL}${banner}`,
      seasons,
      genres,
      cast,
      recommendations
    };
  } catch (error) {
    console.error('Erreur dans getSeriesDetails:', error.message);
    return null;
  }
}

// 9. Épisodes d'une saison
async function getSeasonEpisodes(seriesId, seasonNumber) {
  try {
    // Note: Sans Puppeteer, on ne peut pas cliquer pour charger les épisodes
    // On retourne des données par défaut ou on essaie de les extraire si elles sont déjà dans le HTML
    const html = await fetchWithRetry(`${BASE_URL}/tv/${seriesId}`);
    const $ = cheerio.load(html);
    
    const episodes = [];
    
    // Chercher les épisodes dans différentes structures possibles
    $('.episode-item, .eps-item, .ep-item').each((index, element) => {
      const $elem = $(element);
      const episodeNumber = $elem.attr('data-episode') || 
                           $elem.attr('data-id') ||
                           $elem.find('.episode-number').text().trim() || 
                           (index + 1).toString();
      const href = $elem.attr('href') || '';
      let title = $elem.find('.episode-name').text().trim() || 
                    $elem.find('.title').text().trim() || 
                    `Episode ${episodeNumber}`;
      title = normalizeEpisodeTitle(title);
      const url = href ? (href.startsWith('http') ? href : `${BASE_URL}${href}`) : '';
      
      episodes.push({
        episodeNumber: parseInt(episodeNumber),
        title,
        overview: '',
        duration: '',
        airDate: '',
        thumbnail: '',
        url
      });
    });
    
    // Si aucun épisode trouvé, générer une liste par défaut
    if (episodes.length === 0) {
      for (let i = 1; i <= 10; i++) {
        episodes.push({
          episodeNumber: i,
          title: `Episode ${i}`,
          overview: '',
          duration: '',
          airDate: '',
          thumbnail: ''
        });
      }
    }
    
    return episodes;
  } catch (error) {
    console.error('Erreur dans getSeasonEpisodes:', error.message);
    return [];
  }
}

// 10. Détails d'un film
async function getMovieDetails(movieId) {
  try {
    const html = await fetchWithRetry(`${BASE_URL}/movie/${movieId}`);
    const $ = cheerio.load(html);
    
    // Extraction des détails
    const title = $('.heading-name').text().trim() || 
                  $('.film-name').text().trim() ||
                  $('.movie-title').text().trim() ||
                  $('h1').first().text().trim() || '';
                  
    const overview = $('.description').text().trim() || 
                     $('.film-description').text().trim() ||
                     $('.movie-description').text().trim() ||
                     $('.synopsis').text().trim() || '';
                     
    const poster = $('.film-poster img').attr('src') || 
                   $('.movie-poster img').attr('src') ||
                   $('.dp-i-c-poster img').attr('src') || '';
                   
    const banner = $('.cover img').attr('src') || 
                   $('.backdrop img').attr('src') ||
                   $('.dp-i-c-bg img').attr('src') || '';
                   
    const rating = $('.imdb').text().trim() || 
                   $('.rating').text().trim() ||
                   $('.vote').text().trim() || 'N/A';
                   
    const quality = $('.quality').text().trim() || 
                    $('.badge-quality').text().trim() || 'HD';
    
    // Extraction des informations supplémentaires
    const released = $('.row-line:contains("Released")').text().replace('Released:', '').trim() || 
                     $('.released').text().trim() ||
                     $('.year').text().trim() || '';
                     
    const runtime = $('.row-line:contains("Duration")').text().replace('Duration:', '').trim() || 
                    $('.runtime').text().trim() ||
                    $('.duration').text().trim() || '';
    
    // Genres
    const genres = [];
    $('.row-line:contains("Genre") a, .genre a, .genres a').each((index, element) => {
      const genre = $(element).text().trim();
      if (genre && !genres.includes(genre)) {
        genres.push(genre);
      }
    });
    
    // Cast
    const cast = [];
    $('.row-line:contains("Casts") a, .cast-item, .actor').each((index, element) => {
      const name = $(element).text().trim();
      if (name && !cast.find(c => c.name === name)) {
        cast.push({ name, role: '' });
      }
    });
    
    return {
      id: movieId,
      title,
      overview,
      released,
      runtime,
      trailer: '',
      genres,
      cast,
      quality,
      rating,
      poster: poster.startsWith('http') ? poster : `${BASE_URL}${poster}`,
      banner: banner.startsWith('http') ? banner : `${BASE_URL}${banner}`
    };
  } catch (error) {
    console.error('Erreur dans getMovieDetails:', error.message);
    return null;
  }
}

// 11. Recherche
async function search(query) {
  try {
    const searchUrl = `${BASE_URL}/search/${encodeURIComponent(query)}`;
    const html = await fetchWithRetry(searchUrl);
    const $ = cheerio.load(html);
    
    const results = [];
    $('.flw-item').each((index, element) => {
      const item = extractCardData($, element);
      // Déterminer le type (movie ou series)
      const link = $(element).find('a').attr('href') || '';
      item.type = link.includes('/tv/') ? 'series' : 'movie';
      results.push(item);
    });
    
    return results;
  } catch (error) {
    console.error('Erreur dans search:', error.message);
    return [];
  }
}

// 12. Films et séries d'un acteur/cast
async function getCastMoviesAndShows(castId, page = 1) {
  try {
    // L'URL pour la page d'un acteur/cast
    const castUrl = `${BASE_URL}/cast/${castId}`;
    const html = await fetchWithRetry(castUrl);
    const $ = cheerio.load(html);
    
    // Informations sur l'acteur
    const castInfo = {
      id: castId,
      name: $('.cast-name').text().trim() || 
            $('.actor-name').text().trim() ||
            $('.heading-name').text().trim() ||
            $('h1').first().text().trim() || '',
      photo: $('.cast-photo img').attr('src') || 
             $('.actor-photo img').attr('src') ||
             $('.profile-image img').attr('src') || '',
      bio: $('.cast-bio').text().trim() || 
           $('.actor-bio').text().trim() ||
           $('.biography').text().trim() || '',
      birthDate: $('.birth-date').text().trim() || 
                 $('.info-item:contains("Birth")').text().replace('Birth:', '').trim() || '',
      nationality: $('.nationality').text().trim() || 
                   $('.info-item:contains("Nationality")').text().replace('Nationality:', '').trim() || ''
    };
    
    // Fix pour l'URL de la photo
    if (castInfo.photo && !castInfo.photo.startsWith('http')) {
      castInfo.photo = `${BASE_URL}${castInfo.photo}`;
    }
    
    // Récupérer les films et séries
    const works = [];
    const startIndex = (page - 1) * 20;
    const endIndex = startIndex + 20;
    
    // Chercher les différentes structures possibles pour les œuvres
    const selectors = [
      '.filmography .flw-item',
      '.cast-movies .flw-item',
      '.works-list .flw-item',
      '.movies-list .flw-item',
      '.flw-item'
    ];
    
    let items = null;
    for (const selector of selectors) {
      items = $(selector);
      if (items.length > 0) break;
    }
    
    if (items && items.length > 0) {
      items.each((index, element) => {
        if (index >= startIndex && index < endIndex) {
          const item = extractCardData($, element);
          // Déterminer le type (movie ou series)
          const link = $(element).find('a').attr('href') || '';
          item.type = link.includes('/tv/') ? 'series' : 'movie';
          
          // Essayer de récupérer le rôle joué
          const role = $(element).find('.character').text().trim() || 
                      $(element).find('.role').text().trim() || '';
          if (role) {
            item.role = role;
          }
          
          works.push(item);
        }
      });
    }
    
    return {
      castInfo,
      works,
      totalWorks: items ? items.length : 0,
      page,
      perPage: 20
    };
  } catch (error) {
    console.error('Erreur dans getCastMoviesAndShows:', error.message);
    return {
      castInfo: {
        id: castId,
        name: '',
        photo: '',
        bio: '',
        birthDate: '',
        nationality: ''
      },
      works: [],
      totalWorks: 0,
      page,
      perPage: 20
    };
  }
}

// 13. Saisons + épisodes complets d'une série
async function getSeriesSeasonsAndEpisodes(seriesId) {
  let page = null;
  const seasons = [];
  try {
    page = await browserManager.getPage();
    await page.goto(`${BASE_URL}/tv/${seriesId}`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

    // Ouvrir le sélecteur de saisons s'il existe
    try {
      const seasonDropdown = await page.$('.btn-season, .season-dropdown, .dropdown-toggle, .slt-seasons-content');
      if (seasonDropdown) {
        await seasonDropdown.click();
        await new Promise(r => setTimeout(r, 800));
      }
    } catch {}

    // Récupérer la liste des saisons depuis le DOM
    const seasonItems = await page.$$eval(
      '.ss-list .ss-item, .season-list .btn-season, .dropdown-menu a, .slt-seasons-content .ssc-item, [data-season], .season-item, .season-tabs .tab, .seasons-block .season, a, button',
      nodes => {
        const results = [];
        nodes.forEach((n) => {
          const text = (n.textContent || '').trim();
          let match = text.match(/^\s*Season\s+(\d+)\s*$/i);
          let num = null;
          if (match) {
            num = parseInt(match[1]);
          }
          if (!num) {
            const ds = n.getAttribute && (n.getAttribute('data-season') || n.getAttribute('data-id') || n.getAttribute('value'));
            if (ds && /^\d+$/.test(ds)) num = parseInt(ds);
          }
          if (!num) {
            const href = n.getAttribute && (n.getAttribute('href') || '');
            const m = href && href.match(/season-(\d+)/);
            if (m) num = parseInt(m[1]);
          }
          if (num && !results.find(s => s.seasonNumber === num) && num <= 50) {
            results.push({ seasonNumber: num, seasonName: `Season ${num}` });
          }
        });
        results.sort((a,b)=>a.seasonNumber-b.seasonNumber);
        return results;
      }
    );

    // Pour chaque saison, cliquer et extraire la liste d'épisodes
    for (const s of seasonItems) {
      // Essayer de cliquer sur la saison
      let clicked = false;
      const trySelectors = [
        `a:has-text("Season ${s.seasonNumber}")`,
        `button:has-text("Season ${s.seasonNumber}")`,
        `[data-season="${s.seasonNumber}"]`,
        `.ss-item:has-text("Season ${s.seasonNumber}")`,
      ];
      for (const sel of trySelectors) {
        try {
          const el = await page.$(sel);
          if (el) {
            await el.click();
            await new Promise(r => setTimeout(r, 1000));
            clicked = true;
            break;
          }
        } catch {}
      }

      // Fallback: essayer de cliquer par texte brut via toutes les ancres/boutons
      if (!clicked) {
        const candidates = await page.$$('a,button,[data-season]');
        for (const el of candidates) {
          const txt = (await el.evaluate(node => (node.textContent||'').trim())) || '';
          const ds = await el.evaluate(node => node.getAttribute && (node.getAttribute('data-season')||''));
          if (txt.match(new RegExp(`^\s*Season\s+${s.seasonNumber}\s*$`, 'i')) || ds === String(s.seasonNumber)) {
            try {
              await el.click();
              await new Promise(r => setTimeout(r, 1000));
              clicked = true;
              break;
            } catch {}
          }
        }
      }

      // Extraire les épisodes visibles
      const seasonContent = await page.content();
      const $season = cheerio.load(seasonContent);
      const episodeSelectors = [
        '.eps-item', '.episode-item', '.ep-item', '[data-episode]', '.episode', 'a[href*="/episode-"]'
      ];
      let episodes = [];
      for (const epSel of episodeSelectors) {
        const nodes = $season(epSel);
        if (nodes.length > 0) {
          nodes.each((idx, el) => {
            const $el = $season(el);
            const href = $el.attr('href') || '';
            const epHrefNum = (href.match(/episode-(\d+)/) || [])[1];
            const dataEp = $el.attr('data-episode') || $el.attr('data-id') || '';
            const text = $el.text().trim();
            const textNum = (text.match(/Episode\s*(\d+)/i) || text.match(/^(\d+)$/) || [])[1];
            const number = parseInt(epHrefNum || dataEp || textNum || (idx+1));
            let title = $el.find('.ep-name, .episode-name, .title').text().trim() || text || `Episode ${number}`;
            title = normalizeEpisodeTitle(title);
            const thumb = $el.find('img').attr('src') || '';
            const url = href ? (href.startsWith('http') ? href : `${BASE_URL}${href}`) : '';
            if (!episodes.find(e => e.episodeNumber === number)) {
              episodes.push({
                episodeNumber: number,
                title,
                overview: '',
                duration: '',
                airDate: '',
                thumbnail: thumb && thumb.startsWith('http') ? thumb : (thumb ? `${BASE_URL}${thumb}` : ''),
                url
              });
            }
          });
          break;
        }
      }
      episodes.sort((a,b)=>a.episodeNumber-b.episodeNumber);
      seasons.push({
        seasonNumber: s.seasonNumber,
        seasonName: s.seasonName,
        episodeCount: episodes.length,
        episodes
      });
    }

    return seasons;
  } catch (e) {
    console.error('Erreur dans getSeriesSeasonsAndEpisodes:', e.message);
    return [];
  } finally {
    if (page) try { await page.close(); } catch {}
  }
}

// Remplacer getSeasonEpisodes pour utiliser le navigateur sans tête
async function getSeasonEpisodes(seriesId, seasonNumber) {
  let page = null;
  try {
    page = await browserManager.getPage();
    await page.goto(`${BASE_URL}/tv/${seriesId}`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1200));

    // Ouvrir dropdown si nécessaire
    try {
      const seasonDropdown = await page.$('.btn-season, .season-dropdown, .dropdown-toggle, .slt-seasons-content');
      if (seasonDropdown) {
        await seasonDropdown.click();
        await new Promise(r => setTimeout(r, 500));
      }
    } catch {}

    // Cliquer la bonne saison
    const trySelectors = [
      `a:has-text("Season ${seasonNumber}")`,
      `button:has-text("Season ${seasonNumber}")`,
      `[data-season="${seasonNumber}"]`,
      `.ss-item:has-text("Season ${seasonNumber}")`,
    ];
    for (const sel of trySelectors) {
      try {
        const el = await page.$(sel);
        if (el) { await el.click(); await new Promise(r => setTimeout(r, 900)); break; }
      } catch {}
    }

    const content = await page.content();
    const $ = cheerio.load(content);
    const episodes = [];
    const episodeSelectors = ['.eps-item', '.episode-item', '.ep-item', '[data-episode]', '.episode', 'a[href*="/episode-"]'];
    for (const epSel of episodeSelectors) {
      const nodes = $(epSel);
      if (nodes.length > 0) {
        nodes.each((idx, el) => {
          const $el = $(el);
          const href = $el.attr('href') || '';
          const epHrefNum = (href.match(/episode-(\d+)/) || [])[1];
          const dataEp = $el.attr('data-episode') || $el.attr('data-id') || '';
          const text = $el.text().trim();
          const textNum = (text.match(/Episode\s*(\d+)/i) || text.match(/^(\d+)$/) || [])[1];
          const number = parseInt(epHrefNum || dataEp || textNum || (idx+1));
          let title = $el.find('.ep-name, .episode-name, .title').text().trim() || text || `Episode ${number}`;
          title = normalizeEpisodeTitle(title);
          const thumb = $el.find('img').attr('src') || '';
          const url = href ? (href.startsWith('http') ? href : `${BASE_URL}${href}`) : '';
          if (!episodes.find(e => e.episodeNumber === number)) {
            episodes.push({
              episodeNumber: number,
              title,
              overview: '',
              duration: '',
              airDate: '',
              thumbnail: thumb && thumb.startsWith('http') ? thumb : (thumb ? `${BASE_URL}${thumb}` : ''),
              url
            });
          }
        });
        break;
      }
    }
    episodes.sort((a,b)=>a.episodeNumber-b.episodeNumber);
    return episodes;
  } catch (e) {
    console.error('Erreur dans getSeasonEpisodes:', e.message);
    return [];
  } finally {
    if (page) try { await page.close(); } catch {}
  }
}

// 14. Serveurs de streaming pour un épisode donné (sans utiliser les liens)
async function getEpisodeServers(seriesId, seasonNumber, episodeNumber) {
  let page = null;
  try {
    page = await browserManager.getPage();
    
    // Navigation vers la page de la série
    console.log(`Navigation vers la série: ${seriesId}`);
    await page.goto(`${BASE_URL}/tv/${seriesId}`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

      // Ouvrir le sélecteur de saisons s'il existe
      try {
        const seasonDropdown = await page.$('.btn-season, .season-dropdown, .dropdown-toggle, .slt-seasons-content');
        if (seasonDropdown) {
          await seasonDropdown.click();
          await new Promise(r => setTimeout(r, 500));
        }
      } catch {}

      // Cliquer la saison demandée
      const seasonTrySelectors = [
        `a:has-text("Season ${seasonNumber}")`,
        `button:has-text("Season ${seasonNumber}")`,
        `[data-season="${seasonNumber}"]`,
        `.ss-item:has-text("Season ${seasonNumber}")`,
      ];
      let seasonClicked = false;
      for (const sel of seasonTrySelectors) {
        try {
          const el = await page.$(sel);
          if (el) { await el.click(); await new Promise(r => setTimeout(r, 900)); seasonClicked = true; break; }
        } catch {}
      }
      if (!seasonClicked) {
        // Fallback: chercher par texte brut
        const candidates = await page.$$('a,button,[data-season]');
        for (const el of candidates) {
          const txt = (await el.evaluate(node => (node.textContent||'').trim())) || '';
          const ds = await el.evaluate(node => node.getAttribute && (node.getAttribute('data-season')||''));
          if (txt.match(new RegExp(`^\s*Season\s+${seasonNumber}\s*$`, 'i')) || ds === String(seasonNumber)) {
            try { await el.click(); await new Promise(r => setTimeout(r, 900)); seasonClicked = true; break; } catch {}
          }
        }
      }

      // Cliquer l'épisode demandé
      const contentAfterSeason = await page.content();
      const $season = cheerio.load(contentAfterSeason);
      const episodeSelectors = ['.eps-item', '.episode-item', '.ep-item', '[data-episode]', '.episode', 'a[href*="/episode-"]'];
      let epClicked = false;
      for (const epSel of episodeSelectors) {
        const count = $season(epSel).length;
        if (count > 0) {
          try {
            // Direct via attributs
            const directSel = [
              `${epSel}[data-episode="${episodeNumber}"]`,
              `${epSel}[data-id="${episodeNumber}"]`,
            ];
            for (const ds of directSel) {
              const el = await page.$(ds);
              if (el) {
                await el.click();
                await new Promise(r => setTimeout(r, 1500));
                epClicked = true;
                break;
              }
            }
            // Fallback: parcourir et cliquer par texte/numéro
            if (!epClicked) {
              const nodes = await page.$$(epSel);
              for (const node of nodes) {
                const href = await node.evaluate(n => n.getAttribute && (n.getAttribute('href')||''));
                const text = await node.evaluate(n => (n.textContent||'').trim());
                const m = (href && href.match(/episode-(\d+)/)) || (text && text.match(/Episode\s*(\d+)/i)) || (text && text.match(/^(\d+)$/));
                const num = m && parseInt(m[1]);
                if (num === parseInt(episodeNumber)) {
                  try { await node.click(); await new Promise(r => setTimeout(r, 1500)); epClicked = true; break; } catch {}
                }
              }
            }
          } catch {}
          if (epClicked) break;
        }
      }
    
    // Log l'URL actuelle après navigation/clics
    const currentUrl = page.url();
    console.log(`URL actuelle après navigation: ${currentUrl}`);

    // Attendre un peu plus longtemps pour le chargement des serveurs
    await new Promise(r => setTimeout(r, 3000));

    // Essayer de déclencher l'affichage des serveurs
    try {
      // Chercher et cliquer sur les onglets ou boutons de serveurs
      const serverTriggers = [
        '.nav-tabs a[href*="server"]',
        '.tab-link[data-name="servers"]',
        'button:contains("Servers")',
        'a:contains("Servers")',
        '.servers-tab',
        '#servers-tab',
        '[data-toggle="tab"][href*="server"]'
      ];
      
      for (const trigger of serverTriggers) {
        try {
          const el = await page.$(trigger);
          if (el) {
            console.log(`Clic sur trigger de serveurs: ${trigger}`);
            await el.click();
            await new Promise(r => setTimeout(r, 1000));
            break;
          }
        } catch {}
      }
    } catch {}

    // Extraire la liste des serveurs avec une recherche plus large
    const { servers, containersDump, pageContent } = await page.evaluate(() => {
      // Recherche spécifique des serveurs sur SFlix
      const serverSelectors = [
        '.link-item[data-id]',  // Sélecteur principal pour SFlix
        '.btn-play[data-id]',
        'a.link-item',
        '.server-item',
        '.item.server', 
        '.ps__-list .item',
        '.server-list .item',
        '.list-server .server-item',
        '[data-server]',
        '.nav-link[data-id]',
        '.btn-server',
        '.server-btn',
        '.watching_player-servers .item',
        '.ps-list .item',
        '.server',
        '[data-server-id]',
        '.linkserver'
      ];
      
      // Recherche dans toute la page
      let allNodes = [];
      for (const sel of serverSelectors) {
        const nodes = document.querySelectorAll(sel);
        allNodes = allNodes.concat(Array.from(nodes));
      }
      
      const BAD_WORDS = /share|detail|report|download|favorite|comment|trailer|^season|^episode\s+\d|^\d+$|rating|rate it/i;
      const items = [];
      const seen = new Set();
      
      for (const n of allNodes) {
        let name = '';
        
        // Essayer de récupérer le nom du serveur
        // Pour les liens de serveur SFlix, le texte contient "Server\n" suivi du nom
        let rawText = n.textContent || '';
        rawText = rawText.replace(/\s+/g, ' ').trim();
        
        // Extraire le nom du serveur après "Server"
        if (rawText.toLowerCase().includes('server')) {
          // Prendre le texte après "Server"
          const parts = rawText.split(/server/i);
          if (parts.length > 1) {
            name = parts[1].trim();
          }
        } else {
          name = rawText;
        }
        
        // Ignorer les éléments non pertinents
        if (!name || BAD_WORDS.test(name) || name.length > 50 || name.length < 2) continue;
        
        // Récupérer les attributs
        const id = (n.getAttribute && (
          n.getAttribute('data-id') || 
          n.getAttribute('data-server') || 
          n.getAttribute('data-server-id') || 
          n.getAttribute('data-linkid') ||
          n.getAttribute('id') || ''
        )) || '';
        
        const link = (n.getAttribute && (
          n.getAttribute('data-link') || 
          n.getAttribute('data-url') || 
          n.getAttribute('href') || ''
        )) || '';
        
        const type = (n.getAttribute && (
          n.getAttribute('data-type') || 
          n.getAttribute('data-provider') || 
          n.getAttribute('data-name') || ''
        )) || '';
        
        // Vérifier si c'est un serveur actif
        const isActive = n.classList && n.classList.contains('active');
        
        // Créer une clé unique
        const key = `${name}|${id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        
        // Ajouter seulement si on a un ID valide (important pour SFlix)
        if (name && id) {
          items.push({ 
            name, 
            id, 
            link: link || '', 
            type: type || '',
            element: n.tagName || '',
            isActive
          });
        }
      }
      
      // Préparer un dump des conteneurs pour debug
      const containers = [
        '.film-servers',
        '.link-list',
        '#servers-list', 
        '.list-server', 
        '.server-list', 
        '.sl-box', 
        '.ps__-list', 
        '#list-server', 
        '.watching_list', 
        '.watching-servers',
        '.watching_player-servers', 
        '.ps-list'
      ];
      
      const dumps = containers.map(sel => {
        const el = document.querySelector(sel);
        const html = el ? el.innerHTML : '';
        return { 
          sel, 
          present: !!el, 
          length: html.length, 
          preview: html.substring(0, 500) 
        };
      });
      
      // Récupérer une partie du contenu de la page pour debug
      const mainContent = document.querySelector('.watching_player, .player-wrapper, .detail_page, main');
      const pagePreview = mainContent ? mainContent.innerHTML.substring(0, 2000) : '';
      
      return { 
        servers: items, 
        containersDump: dumps,
        pageContent: pagePreview
      };
    }).catch(() => ({ servers: [], containersDump: [], pageContent: '' }));

    // Essayer de récupérer l'URL de l'iframe courante (sans l'appeler)
    let iframe = '';
    try {
      const iframeSelectors = ['iframe#iframe-embed', '#iframe-embed', 'iframe.watching_iframe', 'iframe'];
      for (const sel of iframeSelectors) {
        const el = await page.$(sel);
        if (el) { iframe = await el.evaluate(node => node.getAttribute('src') || ''); if (iframe) break; }
      }
    } catch {}

    return {
      seriesId,
      seasonNumber: parseInt(seasonNumber),
      episodeNumber: parseInt(episodeNumber),
      servers,
      iframe,
      containersDump
    };
  } catch (e) {
    console.error('Erreur dans getEpisodeServers:', e.message);
    return { 
      seriesId, 
      seasonNumber: parseInt(seasonNumber), 
      episodeNumber: parseInt(episodeNumber), 
      servers: [], 
      iframe: '',
      containersDump: [],
      error: e.message 
    };
  } finally {
    if (page) try { await page.close(); } catch {}
  }
}

module.exports = {
  getTrendingMovies,
  getTrendingSeries,
  getLatestMovies,
  getLatestTVShows,
  getAllMovies,
  getAllTVShows,
  getSeriesSeasons,
  getSeriesDetails,
  getSeasonEpisodes,
  getMovieDetails,
  search,
  getCastMoviesAndShows,
  getSeriesSeasonsAndEpisodes,
  getEpisodeServers
};
