package com.example.sflixapi.example

import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.sflixapi.network.RetrofitClient
import com.example.sflixapi.network.SFlixApiClient
import com.example.sflixapi.repository.SFlixRepository
import com.example.sflixapi.viewmodel.MoviesViewModel
import kotlinx.coroutines.launch

/**
 * Exemples d'utilisation de l'API SFlix avec Retrofit
 */
class ExampleActivity : AppCompatActivity() {
    
    // Option 1: Utilisation avec ViewModel
    private val moviesViewModel: MoviesViewModel by viewModels()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Option 1: Avec ViewModel et LiveData
        useWithViewModel()
        
        // Option 2: Appel direct avec Repository
        useWithRepository()
        
        // Option 3: Appel direct avec Retrofit
        useDirectRetrofitCall()
    }
    
    /**
     * Option 1: Utilisation avec ViewModel (Recommandé)
     */
    private fun useWithViewModel() {
        // Observer les films tendance
        moviesViewModel.trendingMovies.observe(this) { movies ->
            Log.d("ExampleActivity", "Trending movies: ${movies.size}")
            movies.forEach { movie ->
                Log.d("ExampleActivity", "Movie: ${movie.title}")
            }
        }
        
        // Observer les erreurs
        moviesViewModel.errorMessage.observe(this) { error ->
            error?.let {
                Toast.makeText(this, "Error: $it", Toast.LENGTH_LONG).show()
            }
        }
        
        // Observer le chargement
        moviesViewModel.isLoading.observe(this) { isLoading ->
            if (isLoading) {
                Log.d("ExampleActivity", "Loading...")
            } else {
                Log.d("ExampleActivity", "Loading complete")
            }
        }
        
        // Charger les films tendance
        moviesViewModel.loadTrendingMovies()
        
        // Charger les détails d'un film
        moviesViewModel.loadMovieDetails("atlas-2024")
    }
    
    /**
     * Option 2: Utilisation avec Repository
     */
    private fun useWithRepository() {
        val repository = SFlixRepository.getInstance()
        
        lifecycleScope.launch {
            // Récupérer les films tendance
            repository.getTrendingMovies()
                .onSuccess { movies ->
                    Log.d("ExampleActivity", "Got ${movies.size} trending movies")
                }
                .onFailure { exception ->
                    Log.e("ExampleActivity", "Error: ${exception.message}")
                }
            
            // Rechercher du contenu
            repository.searchContent("Avatar")
                .onSuccess { results ->
                    Log.d("ExampleActivity", "Search results: ${results.size}")
                }
                .onFailure { exception ->
                    Log.e("ExampleActivity", "Search error: ${exception.message}")
                }
            
            // Obtenir les détails d'une série
            repository.getSeriesDetails("free-foundation-hd-72427")
                .onSuccess { series ->
                    Log.d("ExampleActivity", "Series: ${series.title}")
                    Log.d("ExampleActivity", "Seasons: ${series.seasons.size}")
                }
                .onFailure { exception ->
                    Log.e("ExampleActivity", "Error: ${exception.message}")
                }
        }
    }
    
    /**
     * Option 3: Appel direct avec Retrofit (Non recommandé pour production)
     */
    private fun useDirectRetrofitCall() {
        lifecycleScope.launch {
            try {
                // Utilisation du singleton RetrofitClient
                val apiService = RetrofitClient.apiService
                
                // Récupérer les films récents
                val latestMovies = apiService.getLatestMovies()
                Log.d("ExampleActivity", "Latest movies: ${latestMovies.size}")
                
                // Récupérer les serveurs d'un film
                val servers = apiService.getMovieServers("atlas-2024")
                servers.forEach { server ->
                    Log.d("ExampleActivity", "Server: ${server.name} - ${server.id}")
                }
                
                // Alternative avec configuration dynamique
                val customClient = SFlixApiClient.getInstance("http://192.168.1.100:3000/")
                val trendingSeries = customClient.api.getTrendingSeries()
                Log.d("ExampleActivity", "Trending series: ${trendingSeries.size}")
                
            } catch (e: Exception) {
                Log.e("ExampleActivity", "Direct call error", e)
                Toast.makeText(this@ExampleActivity, "Error: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }
}

/**
 * Exemple d'utilisation dans un Fragment
 */
class ExampleFragment : Fragment() {
    
    private val repository = SFlixRepository.getInstance()
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        viewLifecycleOwner.lifecycleScope.launch {
            // Récupérer les serveurs d'un épisode
            repository.getEpisodeServers(
                seriesId = "free-foundation-hd-72427",
                seasonNumber = 1,
                episodeNumber = 1
            ).onSuccess { servers ->
                servers.forEach { server ->
                    Log.d("ExampleFragment", "Episode server: ${server.name}")
                }
            }.onFailure { error ->
                Log.e("ExampleFragment", "Error loading servers", error)
            }
        }
    }
}

/**
 * Notes importantes:
 * 
 * 1. Dépendances Gradle nécessaires:
 *    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
 *    implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
 *    implementation 'com.squareup.okhttp3:logging-interceptor:4.11.0'
 *    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'
 *    implementation 'androidx.lifecycle:lifecycle-viewmodel-ktx:2.6.2'
 *    implementation 'androidx.lifecycle:lifecycle-livedata-ktx:2.6.2'
 * 
 * 2. Permissions dans AndroidManifest.xml:
 *    <uses-permission android:name="android.permission.INTERNET" />
 * 
 * 3. Configuration réseau:
 *    - Pour émulateur: utilisez http://10.0.2.2:3000/
 *    - Pour appareil physique: utilisez l'IP locale de votre PC (ex: http://192.168.1.100:3000/)
 *    - Assurez-vous que le serveur Node.js est démarré (npm start)
 * 
 * 4. Pour Android 9+ (API 28+), si vous utilisez HTTP (non HTTPS):
 *    Ajoutez dans AndroidManifest.xml:
 *    android:usesCleartextTraffic="true"
 *    
 *    Ou créez res/xml/network_security_config.xml:
 *    <?xml version="1.0" encoding="utf-8"?>
 *    <network-security-config>
 *        <domain-config cleartextTrafficPermitted="true">
 *            <domain includeSubdomains="true">10.0.2.2</domain>
 *            <domain includeSubdomains="true">192.168.1.100</domain>
 *        </domain-config>
 *    </network-security-config>
 *    
 *    Et référencez-le dans AndroidManifest.xml:
 *    android:networkSecurityConfig="@xml/network_security_config"
 */
