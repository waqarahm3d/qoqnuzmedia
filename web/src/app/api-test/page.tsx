'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';

export default function APITestPage() {
  const [activeTab, setActiveTab] = useState('user');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
  }, []);

  const makeRequest = async (method: string, endpoint: string, body?: any) => {
    setLoading(true);
    setResults(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setResults({ error: 'Not authenticated. Please sign in first.' });
        setLoading(false);
        return;
      }

      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      };

      if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(endpoint, options);
      const data = await response.json();

      setResults({
        status: response.status,
        statusText: response.statusText,
        data,
      });
    } catch (error: any) {
      setResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'user', name: 'User Profile' },
    { id: 'playlists', name: 'Playlists' },
    { id: 'library', name: 'Library' },
    { id: 'social', name: 'Social' },
    { id: 'search', name: 'Search' },
    { id: 'history', name: 'History' },
    { id: 'comments', name: 'Comments' },
    { id: 'reactions', name: 'Reactions' },
    { id: 'feed', name: 'Feed' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>🧪 API Test Dashboard</h1>
        <p style={{ color: '#999', marginBottom: '30px' }}>
          {user ? `Signed in as: ${user.email}` : 'Not signed in'}
        </p>

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid #333', marginBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '10px 20px',
                  background: activeTab === tab.id ? '#1DB954' : 'transparent',
                  color: activeTab === tab.id ? '#fff' : '#999',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #1DB954' : '2px solid transparent',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* User Profile Tests */}
        {activeTab === 'user' && (
          <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>User Profile API</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => makeRequest('GET', '/api/user/profile')}
                style={buttonStyle}
              >
                GET /api/user/profile
              </button>
              <button
                onClick={() =>
                  makeRequest('PUT', '/api/user/profile', {
                    display_name: 'Test User',
                    bio: 'Updated via API test',
                  })
                }
                style={buttonStyle}
              >
                PUT /api/user/profile (update profile)
              </button>
            </div>
          </div>
        )}

        {/* Playlists Tests */}
        {activeTab === 'playlists' && (
          <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Playlists API</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => makeRequest('GET', '/api/playlists')}
                style={buttonStyle}
              >
                GET /api/playlists (list my playlists)
              </button>
              <button
                onClick={() =>
                  makeRequest('POST', '/api/playlists', {
                    name: `Test Playlist ${Date.now()}`,
                    description: 'Created from API test',
                    is_public: true,
                  })
                }
                style={buttonStyle}
              >
                POST /api/playlists (create playlist)
              </button>
            </div>
          </div>
        )}

        {/* Library Tests */}
        {activeTab === 'library' && (
          <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Library API</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => makeRequest('GET', '/api/library/liked-tracks')}
                style={buttonStyle}
              >
                GET /api/library/liked-tracks
              </button>
              <button
                onClick={() =>
                  makeRequest('POST', '/api/library/liked-tracks', {
                    track_id: 't1111111-1111-1111-1111-111111111111',
                  })
                }
                style={buttonStyle}
              >
                POST /api/library/liked-tracks (like a track)
              </button>
            </div>
          </div>
        )}

        {/* Social Tests */}
        {activeTab === 'social' && (
          <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Social API</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => makeRequest('GET', '/api/social/follow/users?type=following')}
                style={buttonStyle}
              >
                GET /api/social/follow/users (following)
              </button>
              <button
                onClick={() => makeRequest('GET', '/api/social/follow/artists')}
                style={buttonStyle}
              >
                GET /api/social/follow/artists
              </button>
            </div>
          </div>
        )}

        {/* Search Tests */}
        {activeTab === 'search' && (
          <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Search API</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => makeRequest('GET', '/api/search?q=test&type=all')}
                style={buttonStyle}
              >
                GET /api/search?q=test&type=all
              </button>
              <button
                onClick={() => makeRequest('GET', '/api/search?q=luna&type=tracks')}
                style={buttonStyle}
              >
                GET /api/search?q=luna&type=tracks
              </button>
            </div>
          </div>
        )}

        {/* History Tests */}
        {activeTab === 'history' && (
          <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>History API</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => makeRequest('GET', '/api/history')}
                style={buttonStyle}
              >
                GET /api/history
              </button>
              <button
                onClick={() =>
                  makeRequest('POST', '/api/history', {
                    track_id: 't1111111-1111-1111-1111-111111111111',
                  })
                }
                style={buttonStyle}
              >
                POST /api/history (record play)
              </button>
            </div>
          </div>
        )}

        {/* Comments Tests */}
        {activeTab === 'comments' && (
          <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Comments API</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() =>
                  makeRequest('GET', '/api/comments/tracks?track_id=t1111111-1111-1111-1111-111111111111')
                }
                style={buttonStyle}
              >
                GET /api/comments/tracks
              </button>
              <button
                onClick={() =>
                  makeRequest('POST', '/api/comments/tracks', {
                    track_id: 't1111111-1111-1111-1111-111111111111',
                    content: 'Great track!',
                  })
                }
                style={buttonStyle}
              >
                POST /api/comments/tracks (add comment)
              </button>
            </div>
          </div>
        )}

        {/* Reactions Tests */}
        {activeTab === 'reactions' && (
          <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Reactions API</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() =>
                  makeRequest('GET', '/api/reactions?track_id=t1111111-1111-1111-1111-111111111111')
                }
                style={buttonStyle}
              >
                GET /api/reactions
              </button>
              <button
                onClick={() =>
                  makeRequest('POST', '/api/reactions', {
                    track_id: 't1111111-1111-1111-1111-111111111111',
                    emoji: '🔥',
                  })
                }
                style={buttonStyle}
              >
                POST /api/reactions (add reaction)
              </button>
            </div>
          </div>
        )}

        {/* Feed Tests */}
        {activeTab === 'feed' && (
          <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Feed API</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => makeRequest('GET', '/api/feed')}
                style={buttonStyle}
              >
                GET /api/feed
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {loading && (
          <div style={{
            background: '#1a1a1a',
            padding: '20px',
            borderRadius: '8px',
            marginTop: '30px',
            textAlign: 'center',
          }}>
            Loading...
          </div>
        )}

        {results && !loading && (
          <div style={{
            background: '#1a1a1a',
            padding: '20px',
            borderRadius: '8px',
            marginTop: '30px',
          }}>
            <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>Response:</h3>
            {results.status && (
              <div style={{ marginBottom: '15px' }}>
                <span
                  style={{
                    padding: '4px 12px',
                    background: results.status < 300 ? '#1DB954' : '#f44',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                >
                  {results.status} {results.statusText}
                </span>
              </div>
            )}
            <pre style={{
              background: '#0f0f0f',
              padding: '15px',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px',
              lineHeight: '1.6',
            }}>
              {JSON.stringify(results.data || results, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: '12px 20px',
  background: '#282828',
  color: '#fff',
  border: '1px solid #444',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  textAlign: 'left',
  transition: 'all 0.2s',
};
