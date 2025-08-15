package com.example.sflixapi.data.api

import com.example.sflixapi.data.models.*
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

interface SFlixApiService {
    
    // ========== TRENDING ==========
    
    @GET("api/trending/movies")
    suspend fun getTrendingMovies(
        @Query("page") page: Int = 1
    ): Response<ApiResponse<List<MediaItem>>>
    
    @GET("api/trending/series")
    suspend fun getTrendingSeries(
        @Query("page") page: Int = 1
    ): Response<ApiResponse<List<MediaItem>>>
    
    // ========== LATEST ==========
    
    @GET("api/latest/movies")
    suspend fun getLatestMovies(
        @Query("page") page: Int = 1
    ): Response<ApiResponse<List<MediaItem>>>
    
    @GET("api/latest/tvshows")
    suspend fun getLatestTVShows(
        @Query("page") page: Int = 1
    ): Response<ApiResponse<List<MediaItem>>>
    
    // ========== BROWSE ALL ==========
    
    @GET("api/movies")
    suspend fun getAllMovies(
        @Query("page") page: Int = 1
    ): Response<ApiResponse<List<MediaItem>>>
    
    @GET("api/tvshows")
    suspend fun getAllTVShows(
        @Query("page") page: Int = 1
    ): Response<ApiResponse<List<MediaItem>>>
    
    // ========== DETAILS ==========
    
    @GET("api/movie/{id}")
    suspend fun getMovieDetails(
        @Path("id") movieId: String
    ): Response<ApiResponse<MovieDetail>>
    
    @GET("api/series/{id}")
    suspend fun getSeriesDetails(
        @Path("id") seriesId: String
    ): Response<ApiResponse<SeriesDetail>>
    
    // ========== SERIES SEASONS & EPISODES ==========
    
    @GET("api/series/{id}/seasons")
    suspend fun getSeriesSeasons(
        @Path("id") seriesId: String
    ): Response<ApiResponse<List<Season>>>
    
    @GET("api/series/{seriesId}/season/{seasonNumber}")
    suspend fun getSeasonEpisodes(
        @Path("seriesId") seriesId: String,
        @Path("seasonNumber") seasonNumber: Int
    ): Response<ApiResponse<List<Episode>>>
    
    // ========== SERVERS ==========
    
    @GET("api/movie/{id}/servers")
    suspend fun getMovieServers(
        @Path("id") movieId: String
    ): Response<ApiResponse<List<Server>>>
    
    @GET("api/series/{seriesId}/season/{season}/episode/{episode}/servers")
    suspend fun getEpisodeServers(
        @Path("seriesId") seriesId: String,
        @Path("season") seasonNumber: Int,
        @Path("episode") episodeNumber: Int
    ): Response<ApiResponse<List<Server>>>
    
    // ========== SEARCH ==========
    
    @GET("api/search")
    suspend fun search(
        @Query("query") query: String
    ): Response<ApiResponse<List<SearchResult>>>
    
    // ========== CAST ==========
    
    @GET("api/cast/{id}")
    suspend fun getCastMoviesAndShows(
        @Path("id") castId: String,
        @Query("page") page: Int = 1
    ): Response<CastResponse>
}

// Extension functions pour gérer les réponses
suspend fun <T> Response<ApiResponse<T>>.getDataOrThrow(): T {
    if (isSuccessful) {
        val apiResponse = body()
        if (apiResponse?.success == true && apiResponse.data != null) {
            return apiResponse.data
        } else {
            throw Exception(apiResponse?.error ?: "Unknown error")
        }
    } else {
        throw Exception("HTTP ${code()}: ${message()}")
    }
}

// Extension pour obtenir les données de façon safe
fun <T> Response<ApiResponse<T>>.getDataOrNull(): T? {
    return if (isSuccessful) {
        body()?.takeIf { it.success }?.data
    } else {
        null
    }
}
