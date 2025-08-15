package com.example.sflixapi.network

import com.example.sflixapi.data.api.SFlixApiService
import com.google.gson.GsonBuilder
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitClient {
    
    // Configuration de l'URL de base
    // Pour émulateur Android utilisant le localhost de votre PC
    private const val BASE_URL_EMULATOR = "http://10.0.2.2:3000/"
    
    // Pour appareil physique sur le même réseau (remplacez par votre IP locale)
    private const val BASE_URL_LOCAL = "http://192.168.1.100:3000/"
    
    // Pour serveur déployé
    private const val BASE_URL_PRODUCTION = "https://your-api-domain.com/"
    
    // Choisissez l'URL appropriée
    private const val BASE_URL = BASE_URL_EMULATOR
    
    private val gson = GsonBuilder()
        .setLenient()
        .create()
    
    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = if (BuildConfig.DEBUG) {
            HttpLoggingInterceptor.Level.BODY
        } else {
            HttpLoggingInterceptor.Level.NONE
        }
    }
    
    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(loggingInterceptor)
        .addInterceptor { chain ->
            val original = chain.request()
            val request = original.newBuilder()
                .header("Accept", "application/json")
                .header("Content-Type", "application/json")
                .build()
            chain.proceed(request)
        }
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()
    
    private val retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create(gson))
        .build()
    
    val apiService: SFlixApiService = retrofit.create(SFlixApiService::class.java)
}

// Alternative avec configuration dynamique
class SFlixApiClient(baseUrl: String) {
    
    private val gson = GsonBuilder()
        .setLenient()
        .create()
    
    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }
    
    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(loggingInterceptor)
        .addInterceptor { chain ->
            val original = chain.request()
            val request = original.newBuilder()
                .header("Accept", "application/json")
                .build()
            chain.proceed(request)
        }
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()
    
    private val retrofit = Retrofit.Builder()
        .baseUrl(baseUrl)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create(gson))
        .build()
    
    val api: SFlixApiService = retrofit.create(SFlixApiService::class.java)
    
    companion object {
        @Volatile
        private var INSTANCE: SFlixApiClient? = null
        
        fun getInstance(baseUrl: String = "http://10.0.2.2:3000/"): SFlixApiClient {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: SFlixApiClient(baseUrl).also { INSTANCE = it }
            }
        }
    }
}
