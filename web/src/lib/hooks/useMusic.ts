/**
 * React Hooks for Music Data
 */

import { useEffect, useState } from 'react';
import * as api from '@/lib/api/client';

export function useAlbums(limit = 20) {
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getAlbums({ limit })
      .then(setAlbums)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [limit]);

  return { albums, loading, error };
}

export function useAlbum(id: string) {
  const [album, setAlbum] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getAlbum(id)
      .then(setAlbum)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { album, loading, error };
}

export function useArtists(limit = 20) {
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getArtists({ limit })
      .then(setArtists)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [limit]);

  return { artists, loading, error };
}

export function useArtist(id: string) {
  const [artist, setArtist] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.getArtist(id),
      api.getArtistTracks(id, 5)
    ])
      .then(([artistData, tracksData]) => {
        setArtist(artistData);
        setTracks(tracksData);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { artist, tracks, loading, error };
}

export function usePlaylists(limit = 20) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getPlaylists({ limit })
      .then(setPlaylists)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [limit]);

  return { playlists, loading, error };
}

export function usePlaylist(id: string) {
  const [playlist, setPlaylist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getPlaylist(id)
      .then(setPlaylist)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { playlist, loading, error, refresh: () => api.getPlaylist(id).then(setPlaylist) };
}

export function useUserLibrary() {
  const [library, setLibrary] = useState<any>({ playlists: [], artists: [], albums: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getUserLibrary()
      .then(setLibrary)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { library, loading, error, refresh: () => api.getUserLibrary().then(setLibrary) };
}

export function useLikedTracks() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getLikedTracks()
      .then(setTracks)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { tracks, loading, error, refresh: () => api.getLikedTracks().then(setTracks) };
}

export function useSearch(query: string, type?: 'all' | 'tracks' | 'albums' | 'artists' | 'playlists') {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults({});
      return;
    }

    setLoading(true);
    api.search(query, type)
      .then(setResults)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [query, type]);

  return { results, loading, error };
}

export function useGenres() {
  const [genres, setGenres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getGenres()
      .then(setGenres)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { genres, loading, error };
}

export function useTracks(limit = 20) {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getTracks({ limit })
      .then(setTracks)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [limit]);

  return { tracks, loading, error };
}
