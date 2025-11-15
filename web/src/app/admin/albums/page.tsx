'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase-client';

interface Album {
  id: string;
  title: string;
  artist_id: string;
  cover_image_url: string | null;
  release_date: string;
  total_tracks: number;
  created_at: string;
  artists?: {
    name: string;
  };
}

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAlbums();
  }, [page, search]);

  const fetchAlbums = async () => {
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

      const response = await fetch(`/api/admin/albums?${params}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch albums');
      }

      const data = await response.json();
      setAlbums(data.albums || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div style={{ padding: '0' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
              Albums
            </h1>
            <p style={{ color: '#b3b3b3' }}>
              Manage albums on the platform
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '24px' }}>
          <input
            type="text"
            placeholder="Search albums..."
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
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💿</div>
            <div style={{ color: '#b3b3b3' }}>Loading albums...</div>
          </div>
        )}

        {/* Albums Grid */}
        {!loading && !error && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '20px',
              marginBottom: '32px',
            }}>
              {albums.map((album) => (
                <div
                  key={album.id}
                  style={{
                    background: '#181818',
                    borderRadius: '8px',
                    padding: '16px',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#282828';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#181818';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {/* Album Cover */}
                  <div style={{
                    width: '100%',
                    paddingBottom: '100%',
                    background: album.cover_image_url
                      ? `url(${album.cover_image_url}) center/cover`
                      : '#282828',
                    borderRadius: '4px',
                    marginBottom: '12px',
                    position: 'relative',
                  }}>
                    {!album.cover_image_url && (
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '48px',
                      }}>
                        💿
                      </div>
                    )}
                  </div>

                  {/* Album Info */}
                  <h3 style={{
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 600,
                    marginBottom: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {album.title}
                  </h3>
                  <p style={{
                    color: '#b3b3b3',
                    fontSize: '12px',
                    marginBottom: '8px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {album.artists?.name || 'Unknown Artist'}
                  </p>
                  <p style={{ color: '#727272', fontSize: '11px' }}>
                    {album.total_tracks} tracks • {new Date(album.release_date).getFullYear()}
                  </p>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {albums.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>💿</div>
                <h3 style={{ color: '#ffffff', fontSize: '20px', marginBottom: '8px' }}>
                  No albums found
                </h3>
                <p style={{ color: '#b3b3b3' }}>
                  {search ? 'Try a different search term' : 'Albums will appear here'}
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
