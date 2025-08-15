# SFlix API

## Description
A Node.js REST API for scraping movie and TV series information from SFlix streaming website. This project uses Puppeteer for dynamic content scraping, Cheerio for HTML parsing, and Express.js for REST endpoints.

**⚠️ DISCLAIMER: This project is created for educational purposes only to understand web scraping and REST APIs. Always respect website terms of service and copyright laws.**

## Prérequis
- Node.js (version 14 ou supérieure)
- npm ou yarn

## Installation

1. Clonez ou téléchargez le projet dans le dossier `sflix-api`

2. Naviguez vers le dossier du projet :
```bash
cd C:\Users\Depezo\sflix-api
```

3. Installez les dépendances :
```bash
npm install
```

## Démarrage du serveur

### Mode production :
```bash
npm start
```

### Mode développement (avec rechargement automatique) :
```bash
npm run dev
```

Le serveur démarrera sur `http://localhost:3000`

## Endpoints disponibles

### Documentation
- `GET /` - Affiche la documentation de l'API

### Trending (Tendances)
- `GET /api/trending/movies?page=1` - Films tendances (10 par page)
- `GET /api/trending/series?page=1` - Séries tendances (10 par page)

### Latest (Derniers ajouts)
- `GET /api/latest/movies?page=1` - Derniers films (10 par page)
- `GET /api/latest/tvshows?page=1` - Dernières séries TV (10 par page)

### Browse (Parcourir)
- `GET /api/movies?page=1` - Tous les films (15 par page)
- `GET /api/tvshows?page=1` - Toutes les séries TV (15 par page)

### Détails
- `GET /api/movie/:id` - Détails d'un film spécifique
- `GET /api/series/:id` - Détails d'une série spécifique
- `GET /api/series/:id/seasons` - Liste des saisons d'une série
- `GET /api/series/:seriesId/season/:seasonNumber` - Épisodes d'une saison

### Cast/Acteurs
- `GET /api/cast/:id?page=1` - Récupérer tous les films et séries d'un acteur (20 par page)

### Recherche
- `GET /api/search?query=yourquery` - Rechercher des films et séries

## Format des réponses

### Réponse de succès
```json
{
  "success": true,
  "page": 1,
  "perPage": 10,
  "data": [...]
}
```

### Réponse d'erreur
```json
{
  "success": false,
  "error": "Message d'erreur"
}
```

## Exemple d'utilisation avec Retrofit (Android)

### Interface Retrofit
```kotlin
interface SFlixApi {
    @GET("api/trending/movies")
    suspend fun getTrendingMovies(@Query("page") page: Int): ApiResponse<List<Movie>>
    
    @GET("api/trending/series")
    suspend fun getTrendingSeries(@Query("page") page: Int): ApiResponse<List<Series>>
    
    @GET("api/latest/movies")
    suspend fun getLatestMovies(@Query("page") page: Int): ApiResponse<List<Movie>>
    
    @GET("api/latest/tvshows")
    suspend fun getLatestTVShows(@Query("page") page: Int): ApiResponse<List<Series>>
    
    @GET("api/movies")
    suspend fun getAllMovies(@Query("page") page: Int): ApiResponse<List<Movie>>
    
    @GET("api/tvshows")
    suspend fun getAllTVShows(@Query("page") page: Int): ApiResponse<List<Series>>
    
    @GET("api/series/{id}/seasons")
    suspend fun getSeriesSeasons(@Path("id") seriesId: String): ApiResponse<List<Season>>
    
    @GET("api/series/{id}")
    suspend fun getSeriesDetails(@Path("id") seriesId: String): ApiResponse<SeriesDetail>
    
    @GET("api/series/{seriesId}/season/{seasonNumber}")
    suspend fun getSeasonEpisodes(
        @Path("seriesId") seriesId: String,
        @Path("seasonNumber") seasonNumber: Int
    ): ApiResponse<List<Episode>>
    
    @GET("api/movie/{id}")
    suspend fun getMovieDetails(@Path("id") movieId: String): ApiResponse<MovieDetail>
    
    @GET("api/search")
    suspend fun search(@Query("query") query: String): ApiResponse<List<SearchResult>>
    
    @GET("api/cast/{id}")
    suspend fun getCastMoviesAndShows(
        @Path("id") castId: String,
        @Query("page") page: Int = 1
    ): ApiResponse<CastResponse>
}
```

### Configuration Retrofit
```kotlin
val retrofit = Retrofit.Builder()
    .baseUrl("http://localhost:3000/")
    .addConverterFactory(GsonConverterFactory.create())
    .build()

val api = retrofit.create(SFlixApi::class.java)
```

## Structure des données

### Movie/Series (Liste)
```json
{
  "id": "movie-id",
  "title": "Titre du film",
  "poster": "URL de l'affiche",
  "quality": "HD",
  "rating": "7.5",
  "year": "2024",
  "link": "URL complète"
}
```

### Movie Detail
```json
{
  "id": "movie-id",
  "title": "Titre du film",
  "overview": "Synopsis",
  "released": "2024",
  "runtime": "120 min",
  "trailer": "URL du trailer",
  "genres": ["Action", "Adventure"],
  "cast": [{"name": "Acteur", "role": "Rôle"}],
  "quality": "HD",
  "rating": "7.5",
  "poster": "URL de l'affiche",
  "banner": "URL de la bannière"
}
```

### Series Detail
```json
{
  "id": "series-id",
  "title": "Titre de la série",
  "overview": "Synopsis",
  "released": "2024",
  "runtime": "45 min",
  "trailer": "URL du trailer",
  "quality": "HD",
  "rating": "8.0",
  "poster": "URL de l'affiche",
  "banner": "URL de la bannière",
  "seasons": [
    {
      "seasonNumber": 1,
      "seasonName": "Season 1",
      "episodeCount": 10
    }
  ],
  "genres": ["Drama", "Thriller"],
  "cast": [{"name": "Acteur", "role": "Rôle"}],
  "recommendations": [...]
}
```

### Cast Response
```json
{
  "success": true,
  "castId": "actor-id",
  "page": 1,
  "data": {
    "castInfo": {
      "id": "actor-id",
      "name": "Nom de l'acteur",
      "photo": "URL de la photo",
      "bio": "Biographie",
      "birthDate": "Date de naissance",
      "nationality": "Nationalité"
    },
    "works": [
      {
        "id": "movie-id",
        "title": "Titre",
        "poster": "URL",
        "quality": "HD",
        "rating": "7.5",
        "year": "2024",
        "type": "movie",
        "role": "Rôle joué"
      }
    ],
    "totalWorks": 50,
    "page": 1,
    "perPage": 20
  }
}
```

## Known Issues & Recent Fixes

### ✅ Fixed Issues
1. **Trending Series Endpoint** - Previously returned movies instead of series
   - Fixed by filtering for `/tv/` links in the Trending section
   - Falls back to "Latest TV Shows" section when needed

### ⚠️ Current Issues
1. **Episode Servers Not Loading** (`/api/series/:id/season/:season/episode/:episode/servers`)
   - Returns empty server lists despite servers being visible on the website
   - Likely caused by dynamic content loading or anti-bot protections
   - Workaround: Use test scripts in visible browser mode for debugging

## Dépannage / Troubleshooting

### Erreur : "Connection refused" ou "ECONNREFUSED"
- Le site peut être temporairement indisponible
- Vérifiez votre connexion internet
- Le site peut bloquer certaines adresses IP

### Erreur : "Timeout"
- Le site peut être lent ou inaccessible
- Augmentez le timeout dans le code si nécessaire

### Erreur : "No data found"
- La structure du site a peut-être changé
- Vérifiez les sélecteurs CSS dans `scraper.js`

### Empty Server Lists
- Run test scripts in visible mode: `node test-scripts/test-advanced.js`
- Check for JavaScript errors in Puppeteer
- Verify site hasn't changed structure

## Notes importantes

1. **Utilisation éducative uniquement** : Ce projet est conçu pour apprendre le web scraping et les API REST
2. **Respect du site** : N'effectuez pas trop de requêtes simultanées pour éviter de surcharger le serveur
3. **Légalité** : Assurez-vous de respecter les lois locales concernant le web scraping
4. **Performance** : Le scraping peut prendre quelques secondes par requête
5. **Railway Compatible** : Cette version est optimisée pour fonctionner sur Railway et autres plateformes cloud sans navigateur headless

## Licence
MIT - À des fins éducatives uniquement

## Support
Pour toute question technique concernant l'API, consultez la documentation ou testez les endpoints directement.
