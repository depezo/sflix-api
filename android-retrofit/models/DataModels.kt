package com.example.sflixapi.data.models

import com.google.gson.annotations.SerializedName

// Response wrapper
data class ApiResponse<T>(
    @SerializedName("success") val success: Boolean,
    @SerializedName("page") val page: Int? = null,
    @SerializedName("perPage") val perPage: Int? = null,
    @SerializedName("data") val data: T? = null,
    @SerializedName("error") val error: String? = null
)

// Movie/Series list item
data class MediaItem(
    @SerializedName("id") val id: String,
    @SerializedName("title") val title: String,
    @SerializedName("poster") val poster: String,
    @SerializedName("quality") val quality: String? = null,
    @SerializedName("rating") val rating: String? = null,
    @SerializedName("year") val year: String? = null,
    @SerializedName("link") val link: String,
    @SerializedName("type") val type: String? = null // "movie" or "series"
)

// Movie detail
data class MovieDetail(
    @SerializedName("id") val id: String,
    @SerializedName("title") val title: String,
    @SerializedName("overview") val overview: String,
    @SerializedName("released") val released: String? = null,
    @SerializedName("runtime") val runtime: String? = null,
    @SerializedName("trailer") val trailer: String? = null,
    @SerializedName("genres") val genres: List<String> = emptyList(),
    @SerializedName("cast") val cast: List<CastMember> = emptyList(),
    @SerializedName("quality") val quality: String? = null,
    @SerializedName("rating") val rating: String? = null,
    @SerializedName("poster") val poster: String,
    @SerializedName("banner") val banner: String? = null
)

// Series detail
data class SeriesDetail(
    @SerializedName("id") val id: String,
    @SerializedName("title") val title: String,
    @SerializedName("overview") val overview: String,
    @SerializedName("released") val released: String? = null,
    @SerializedName("runtime") val runtime: String? = null,
    @SerializedName("trailer") val trailer: String? = null,
    @SerializedName("quality") val quality: String? = null,
    @SerializedName("rating") val rating: String? = null,
    @SerializedName("poster") val poster: String,
    @SerializedName("banner") val banner: String? = null,
    @SerializedName("seasons") val seasons: List<Season> = emptyList(),
    @SerializedName("genres") val genres: List<String> = emptyList(),
    @SerializedName("cast") val cast: List<CastMember> = emptyList(),
    @SerializedName("recommendations") val recommendations: List<MediaItem> = emptyList()
)

// Season
data class Season(
    @SerializedName("seasonNumber") val seasonNumber: Int,
    @SerializedName("seasonName") val seasonName: String,
    @SerializedName("episodeCount") val episodeCount: Int? = null,
    @SerializedName("episodes") val episodes: List<Episode>? = null
)

// Episode
data class Episode(
    @SerializedName("episodeNumber") val episodeNumber: Int,
    @SerializedName("title") val title: String,
    @SerializedName("airDate") val airDate: String? = null,
    @SerializedName("overview") val overview: String? = null,
    @SerializedName("runtime") val runtime: String? = null,
    @SerializedName("id") val id: String? = null
)

// Cast member
data class CastMember(
    @SerializedName("name") val name: String,
    @SerializedName("role") val role: String? = null,
    @SerializedName("id") val id: String? = null,
    @SerializedName("photo") val photo: String? = null
)

// Cast response
data class CastResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("castId") val castId: String,
    @SerializedName("page") val page: Int,
    @SerializedName("data") val data: CastData
)

data class CastData(
    @SerializedName("castInfo") val castInfo: CastInfo,
    @SerializedName("works") val works: List<CastWork>,
    @SerializedName("totalWorks") val totalWorks: Int,
    @SerializedName("page") val page: Int,
    @SerializedName("perPage") val perPage: Int
)

data class CastInfo(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("photo") val photo: String? = null,
    @SerializedName("bio") val bio: String? = null,
    @SerializedName("birthDate") val birthDate: String? = null,
    @SerializedName("nationality") val nationality: String? = null
)

data class CastWork(
    @SerializedName("id") val id: String,
    @SerializedName("title") val title: String,
    @SerializedName("poster") val poster: String,
    @SerializedName("quality") val quality: String? = null,
    @SerializedName("rating") val rating: String? = null,
    @SerializedName("year") val year: String? = null,
    @SerializedName("type") val type: String, // "movie" or "series"
    @SerializedName("role") val role: String? = null
)

// Search result
data class SearchResult(
    @SerializedName("id") val id: String,
    @SerializedName("title") val title: String,
    @SerializedName("poster") val poster: String,
    @SerializedName("type") val type: String, // "movie" or "series"
    @SerializedName("year") val year: String? = null,
    @SerializedName("rating") val rating: String? = null
)

// Server
data class Server(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("embedUrl") val embedUrl: String? = null,
    @SerializedName("type") val type: String? = null
)
