package com.example.sflixapi.repository

import com.example.sflixapi.data.models.*
import com.example.sflixapi.network.RetrofitClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import retrofit2.Response

class SFlixRepository {
    
    private val apiService = RetrofitClient.apiService
    
    // Movies
    suspend fun getTrendingMovies() = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getTrendingMovies()
            if (response.isSuccessful) {
                Result.success(response.body() ?: emptyList())
            } else {
                Result.failure(Exception("Error: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getLatestMovies() = withContext(Dispatchers.IO) {
        try {
            Result.success(apiService.getLatestMovies())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getMovieDetails(movieId: String) = withContext(Dispatchers.IO) {
        try {
            Result.success(apiService.getMovieDetails(movieId))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getMovieServers(movieId: String) = withContext(Dispatchers.IO) {
        try {
            Result.success(apiService.getMovieServers(movieId))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    // Series
    suspend fun getTrendingSeries() = withContext(Dispatchers.IO) {
        try {
            Result.success(apiService.getTrendingSeries())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getLatestSeries() = withContext(Dispatchers.IO) {
        try {
            Result.success(apiService.getLatestSeries())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getSeriesDetails(seriesId: String) = withContext(Dispatchers.IO) {
        try {
            Result.success(apiService.getSeriesDetails(seriesId))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getEpisodeServers(
        seriesId: String,
        seasonNumber: Int,
        episodeNumber: Int
    ) = withContext(Dispatchers.IO) {
        try {
            Result.success(apiService.getEpisodeServers(seriesId, seasonNumber, episodeNumber))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    // Search
    suspend fun searchContent(query: String) = withContext(Dispatchers.IO) {
        try {
            Result.success(apiService.search(query))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    // Singleton instance
    companion object {
        @Volatile
        private var INSTANCE: SFlixRepository? = null
        
        fun getInstance(): SFlixRepository {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: SFlixRepository().also { INSTANCE = it }
            }
        }
    }
}
