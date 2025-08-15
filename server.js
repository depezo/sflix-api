const express = require('express');
const cors = require('cors');
const scraper = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Route de base
app.get('/', (req, res) => {
  res.json({
    message: 'API SFlix Scraper - À des fins éducatives uniquement',
    endpoints: {
      trending: {
        movies: '/api/trending/movies?page=1',
        series: '/api/trending/series?page=1'
      },
      latest: {
        movies: '/api/latest/movies?page=1',
        tvshows: '/api/latest/tvshows?page=1'
      },
      browse: {
        movies: '/api/movies?page=1',
        tvshows: '/api/tvshows?page=1'
      },
      details: {
        movie: '/api/movie/:id',
        series: '/api/series/:id',
        seasons: '/api/series/:id/seasons',
        seasonsWithEpisodes: '/api/series/:id/seasons-episodes',
        episodes: '/api/series/:seriesId/season/:seasonNumber',
        episodeServers: '/api/series/:seriesId/season/:seasonNumber/episode/:episodeNumber/servers'
      },
      cast: '/api/cast/:id?page=1',
      search: '/api/search?query=yourquery'
    }
  });
});

// 1. Trending Movies - 10 éléments par page
app.get('/api/trending/movies', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await scraper.getTrendingMovies(page);
    res.json({
      success: true,
      page: page,
      perPage: 10,
      data: data
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 2. Trending Series - 10 éléments par page
app.get('/api/trending/series', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await scraper.getTrendingSeries(page);
    res.json({
      success: true,
      page: page,
      perPage: 10,
      data: data
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 3. Latest Movies - 10 éléments par page
app.get('/api/latest/movies', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await scraper.getLatestMovies(page);
    res.json({
      success: true,
      page: page,
      perPage: 10,
      data: data
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 4. Latest TV Shows - 10 éléments par page
app.get('/api/latest/tvshows', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await scraper.getLatestTVShows(page);
    res.json({
      success: true,
      page: page,
      perPage: 10,
      data: data
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 5. Liste de tous les films - 15 films par page
app.get('/api/movies', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await scraper.getAllMovies(page);
    res.json({
      success: true,
      page: page,
      perPage: 15,
      data: data
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 6. Liste de toutes les séries - 15 séries par page
app.get('/api/tvshows', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await scraper.getAllTVShows(page);
    res.json({
      success: true,
      page: page,
      perPage: 15,
      data: data
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 7. Toutes les saisons pour une série donnée
app.get('/api/series/:id/seasons', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await scraper.getSeriesSeasons(id);
    res.json({
      success: true,
      seriesId: id,
      data: data
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 7b. Saisons + épisodes d'une série donnée
app.get('/api/series/:id/seasons-episodes', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await scraper.getSeriesSeasonsAndEpisodes(id);
    res.json({ success: true, seriesId: id, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. Détails complets d'une série
app.get('/api/series/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await scraper.getSeriesDetails(id);
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 9. Tous les épisodes d'une saison donnée
app.get('/api/series/:seriesId/season/:seasonNumber', async (req, res) => {
  try {
    const { seriesId, seasonNumber } = req.params;
    const data = await scraper.getSeasonEpisodes(seriesId, seasonNumber);
    res.json({
      success: true,
      seriesId: seriesId,
      seasonNumber: seasonNumber,
      data: data
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 9b. Liste des serveurs pour un épisode donné (sans visiter les liens)
app.get('/api/series/:seriesId/season/:seasonNumber/episode/:episodeNumber/servers', async (req, res) => {
  try {
    const { seriesId, seasonNumber, episodeNumber } = req.params;
    const data = await scraper.getEpisodeServers(seriesId, seasonNumber, episodeNumber);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 10. Détails d'un film
app.get('/api/movie/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await scraper.getMovieDetails(id);
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 11. Recherche
app.get('/api/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ 
        success: false, 
        error: 'Le paramètre query est requis' 
      });
    }
    const data = await scraper.search(query);
    res.json({
      success: true,
      query: query,
      data: data
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 12. Films et séries d'un acteur/cast
app.get('/api/cast/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const data = await scraper.getCastMoviesAndShows(id, page);
    res.json({
      success: true,
      castId: id,
      page: page,
      data: data
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint non trouvé'
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📝 Documentation disponible sur http://localhost:${PORT}/`);
});

module.exports = app;
