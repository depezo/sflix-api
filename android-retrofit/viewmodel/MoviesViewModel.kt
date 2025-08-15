package com.example.sflixapi.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.sflixapi.data.models.MediaItem
import com.example.sflixapi.data.models.MovieDetail
import com.example.sflixapi.data.models.Server
import com.example.sflixapi.repository.SFlixRepository
import kotlinx.coroutines.launch

class MoviesViewModel : ViewModel() {
    
    private val repository = SFlixRepository.getInstance()
    
    // UI State
    private val _trendingMovies = MutableLiveData<List<MediaItem>>()
    val trendingMovies: LiveData<List<MediaItem>> = _trendingMovies
    
    private val _latestMovies = MutableLiveData<List<MediaItem>>()
    val latestMovies: LiveData<List<MediaItem>> = _latestMovies
    
    private val _movieDetail = MutableLiveData<MovieDetail?>()
    val movieDetail: LiveData<MovieDetail?> = _movieDetail
    
    private val _movieServers = MutableLiveData<List<Server>>()
    val movieServers: LiveData<List<Server>> = _movieServers
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    private val _errorMessage = MutableLiveData<String?>()
    val errorMessage: LiveData<String?> = _errorMessage
    
    // Functions
    fun loadTrendingMovies() {
        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null
            
            repository.getTrendingMovies()
                .onSuccess { movies ->
                    _trendingMovies.value = movies
                }
                .onFailure { exception ->
                    _errorMessage.value = exception.message
                    _trendingMovies.value = emptyList()
                }
            
            _isLoading.value = false
        }
    }
    
    fun loadLatestMovies() {
        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null
            
            repository.getLatestMovies()
                .onSuccess { movies ->
                    _latestMovies.value = movies
                }
                .onFailure { exception ->
                    _errorMessage.value = exception.message
                    _latestMovies.value = emptyList()
                }
            
            _isLoading.value = false
        }
    }
    
    fun loadMovieDetails(movieId: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null
            
            repository.getMovieDetails(movieId)
                .onSuccess { movie ->
                    _movieDetail.value = movie
                }
                .onFailure { exception ->
                    _errorMessage.value = exception.message
                    _movieDetail.value = null
                }
            
            _isLoading.value = false
        }
    }
    
    fun loadMovieServers(movieId: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null
            
            repository.getMovieServers(movieId)
                .onSuccess { servers ->
                    _movieServers.value = servers
                }
                .onFailure { exception ->
                    _errorMessage.value = exception.message
                    _movieServers.value = emptyList()
                }
            
            _isLoading.value = false
        }
    }
    
    fun clearError() {
        _errorMessage.value = null
    }
}
