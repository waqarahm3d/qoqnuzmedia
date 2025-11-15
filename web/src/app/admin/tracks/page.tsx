'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase-client';

interface Track {
  id: string;
  title: string;
  artist_id: string;
  album_id: string | null;
  duration_ms: number;
  play_count: number;
  explicit: boolean;
  created_at: string;
  artists?: {
    name: string;
  };
  albums?: {
    title: string;
  };
}

export default function TracksPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTracks();
  }, [page, search]);

  const fetchTracks = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('Not authenticated');
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
      });

      const response = await fetch(`/api/admin/tracks?${params}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch tracks');
      }

      const data = await response.json();
      setTracks(data.tracks || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <AdminLayout>
      <div style={{ padding: '0' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
              Tracks
            </h1>
            <p style={{ color: '#b3b3b3' }}>
              Manage tracks on the platform
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '24px' }}>
          <input
            type="text"
            placeholder="Search tracks..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '12px 16px',
              background: '#121212',
              color: '#ffffff',
              border: '1px solid #282828',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#1DB954'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#282828'}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            color: '#fca5a5',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
          }}>
            <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎵</div>
            <div style={{ color: '#b3b3b3' }}>Loading tracks...</div>
          </div>
        )}

        {/* Tracks Table */}
        {!loading && !error && (
          <>
            <div style={{
              background: '#181818',
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '32px',
            }}>
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr 200px 150px 100px 120px',
                gap: '16px',
                padding: '12px 16px',
                borderBottom: '1px solid #282828',
                color: '#b3b3b3',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}>
                <div>#</div>
                <div>Title</div>
                <div>Artist</div>
                <div>Album</div>
                <div>Duration</div>
                <div>Plays</div>
              </div>

              {/* Table Rows */}
              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1fr 200px 150px 100px 120px',
                    gap: '16px',
                    padding: '12px 16px',
                    borderBottom: '1px solid #282828',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#282828'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ color: '#b3b3b3', fontSize: '14px' }}>
                    {(page - 1) * 20 + index + 1}
                  </div>
                  <div>
                    <div style={{ color: '#ffffff', fontWeight: 500, marginBottom: '4px' }}>
                      {track.title}
                      {track.explicit && (
                        <span style={{
                          marginLeft: '8px',
                          padding: '2px 6px',
                          background: '#727272',
                          color: '#000000',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          borderRadius: '2px',
                        }}>
                          E
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ color: '#b3b3b3', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {track.artists?.name || 'Unknown Artist'}
                  </div>
                  <div style={{ color: '#b3b3b3', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {track.albums?.title || '—'}
                  </div>
                  <div style={{ color: '#b3b3b3', fontSize: '14px' }}>
                    {formatDuration(track.duration_ms)}
                  </div>
                  <div style={{ color: '#1DB954', fontSize: '14px', fontWeight: 600 }}>
                    {track.play_count?.toLocaleString() || 0}
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {tracks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎵</div>
                <h3 style={{ color: '#ffffff', fontSize: '20px', marginBottom: '8px' }}>
                  No tracks found
                </h3>
                <p style={{ color: '#b3b3b3' }}>
                  {search ? 'Try a different search term' : 'Tracks will appear here'}
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  style={{
                    padding: '10px 20px',
                    background: page === 1 ? '#181818' : '#282828',
                    color: page === 1 ? '#727272' : '#ffffff',
                    border: 'none',
                    borderRadius: '500px',
                    fontWeight: 600,
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Previous
                </button>
                <span style={{ padding: '10px 20px', color: '#ffffff', fontWeight: 600 }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  style={{
                    padding: '10px 20px',
                    background: page === totalPages ? '#181818' : '#282828',
                    color: page === totalPages ? '#727272' : '#ffffff',
                    border: 'none',
                    borderRadius: '500px',
                    fontWeight: 600,
                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
