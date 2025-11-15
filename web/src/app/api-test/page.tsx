'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';

interface RequestHistory {
  id: string;
  method: string;
  endpoint: string;
  timestamp: number;
  status?: number;
  duration?: number;
}

export default function APITestPage() {
  const [activeTab, setActiveTab] = useState('user');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [requestDuration, setRequestDuration] = useState<number | null>(null);
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [customMethod, setCustomMethod] = useState('GET');
  const [customBody, setCustomBody] = useState('{}');
  const [history, setHistory] = useState<RequestHistory[]>([]);
  const [showCustomRequest, setShowCustomRequest] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
  }, []);

  const makeRequest = async (method: string, endpoint: string, body?: any) => {
    setLoading(true);
    setResults(null);
    setRequestDuration(null);

    const startTime = performance.now();
    const requestId = Date.now().toString();

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setResults({
          error: 'Not authenticated. Please sign in first.',
          hint: 'Go to /auth/signin to authenticate'
        });
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
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      setRequestDuration(duration);

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      const result = {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        data,
      };

      setResults(result);

      // Add to history
      const historyItem: RequestHistory = {
        id: requestId,
        method,
        endpoint,
        timestamp: Date.now(),
        status: response.status,
        duration,
      };
      setHistory(prev => [historyItem, ...prev.slice(0, 9)]); // Keep last 10

    } catch (error: any) {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      setRequestDuration(duration);

      setResults({
        error: error.message,
        type: error.name,
        stack: error.stack,
        networkError: true,
      });

      // Add to history
      setHistory(prev => [{
        id: requestId,
        method,
        endpoint,
        timestamp: Date.now(),
      }, ...prev.slice(0, 9)]);
    } finally {
      setLoading(false);
    }
  };

  const makeCustomRequest = () => {
    try {
      let parsedBody = undefined;
      if (customMethod !== 'GET' && customBody.trim()) {
        parsedBody = JSON.parse(customBody);
      }
      makeRequest(customMethod, customEndpoint, parsedBody);
    } catch (error: any) {
      setResults({
        error: 'Invalid JSON in request body',
        details: error.message,
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const tabs = [
    { id: 'user', name: 'User Profile', icon: '👤' },
    { id: 'playlists', name: 'Playlists', icon: '📋' },
    { id: 'library', name: 'Library', icon: '❤️' },
    { id: 'social', name: 'Social', icon: '👥' },
    { id: 'search', name: 'Search', icon: '🔍' },
    { id: 'history', name: 'History', icon: '📊' },
    { id: 'comments', name: 'Comments', icon: '💬' },
    { id: 'reactions', name: 'Reactions', icon: '😊' },
    { id: 'feed', name: 'Feed', icon: '📰' },
    { id: 'custom', name: 'Custom', icon: '⚙️' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #121212 0%, #1a1a1a 100%)',
        color: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '8px', color: '#ffffff' }}>
            🧪 API Test Dashboard
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <p style={{ color: '#b3b3b3', fontSize: '16px', margin: 0 }}>
              {user ? `Signed in as: ${user.email}` : 'Not signed in - Please authenticate first'}
            </p>
            {user && (
              <span style={{
                padding: '4px 12px',
                background: 'rgba(29, 185, 84, 0.2)',
                border: '1px solid #1DB954',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#1ed760',
                fontWeight: '600',
              }}>
                ✓ Authenticated
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid #282828', marginBottom: '30px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: '8px', minWidth: 'min-content' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setShowCustomRequest(tab.id === 'custom');
                }}
                style={{
                  padding: '12px 20px',
                  background: activeTab === tab.id ? 'rgba(29, 185, 84, 0.1)' : 'transparent',
                  color: activeTab === tab.id ? '#1DB954' : '#b3b3b3',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #1DB954' : '2px solid transparent',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = '#b3b3b3';
                  }
                }}
              >
                <span style={{ marginRight: '8px' }}>{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: history.length > 0 ? '1fr 300px' : '1fr', gap: '30px' }}>
          {/* Main Content */}
          <div>
            {/* Custom Request */}
            {activeTab === 'custom' && (
              <div style={{ background: '#181818', padding: '30px', borderRadius: '12px', border: '1px solid #282828' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '20px', color: '#ffffff' }}>
                  Custom API Request
                </h2>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#b3b3b3', fontSize: '14px', fontWeight: '600' }}>
                    HTTP Method
                  </label>
                  <select
                    value={customMethod}
                    onChange={(e) => setCustomMethod(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#121212',
                      color: '#ffffff',
                      border: '1px solid #282828',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#b3b3b3', fontSize: '14px', fontWeight: '600' }}>
                    Endpoint
                  </label>
                  <input
                    type="text"
                    value={customEndpoint}
                    onChange={(e) => setCustomEndpoint(e.target.value)}
                    placeholder="/api/..."
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#121212',
                      color: '#ffffff',
                      border: '1px solid #282828',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>

                {customMethod !== 'GET' && (
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#b3b3b3', fontSize: '14px', fontWeight: '600' }}>
                      Request Body (JSON)
                    </label>
                    <textarea
                      value={customBody}
                      onChange={(e) => setCustomBody(e.target.value)}
                      placeholder='{"key": "value"}'
                      rows={8}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: '#121212',
                        color: '#ffffff',
                        border: '1px solid #282828',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        outline: 'none',
                        resize: 'vertical',
                      }}
                    />
                  </div>
                )}

                <button
                  onClick={makeCustomRequest}
                  disabled={loading || !customEndpoint}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: loading || !customEndpoint ? '#535353' : '#1DB954',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: loading || !customEndpoint ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {loading ? '⏳ Sending Request...' : '▶️ Send Request'}
                </button>
              </div>
            )}

            {/* Predefined Tests */}
            {activeTab !== 'custom' && (
              <div style={{ background: '#181818', padding: '30px', borderRadius: '12px', border: '1px solid #282828' }}>
                {/* User Profile Tests */}
                {activeTab === 'user' && (
                  <>
                    <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '20px', color: '#ffffff' }}>
                      User Profile API
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <ApiButton
                        method="GET"
                        endpoint="/api/user/profile"
                        description="Get current user profile"
                        onClick={() => makeRequest('GET', '/api/user/profile')}
                      />
                      <ApiButton
                        method="PUT"
                        endpoint="/api/user/profile"
                        description="Update profile with test data"
                        onClick={() =>
                          makeRequest('PUT', '/api/user/profile', {
                            display_name: 'Test User',
                            bio: 'Updated via API test',
                          })
                        }
                      />
                    </div>
                  </>
                )}

                {/* Playlists Tests */}
                {activeTab === 'playlists' && (
                  <>
                    <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '20px', color: '#ffffff' }}>
                      Playlists API
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <ApiButton
                        method="GET"
                        endpoint="/api/playlists"
                        description="List all my playlists"
                        onClick={() => makeRequest('GET', '/api/playlists')}
                      />
                      <ApiButton
                        method="POST"
                        endpoint="/api/playlists"
                        description="Create a new playlist"
                        onClick={() =>
                          makeRequest('POST', '/api/playlists', {
                            name: `Test Playlist ${Date.now()}`,
                            description: 'Created from API test',
                            is_public: true,
                          })
                        }
                      />
                    </div>
                  </>
                )}

                {/* Library Tests */}
                {activeTab === 'library' && (
                  <>
                    <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '20px', color: '#ffffff' }}>
                      Library API
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <ApiButton
                        method="GET"
                        endpoint="/api/library/liked-tracks"
                        description="Get liked tracks"
                        onClick={() => makeRequest('GET', '/api/library/liked-tracks')}
                      />
                      <ApiButton
                        method="POST"
                        endpoint="/api/library/liked-tracks"
                        description="Like a track"
                        onClick={() =>
                          makeRequest('POST', '/api/library/liked-tracks', {
                            track_id: 't1111111-1111-1111-1111-111111111111',
                          })
                        }
                      />
                    </div>
                  </>
                )}

                {/* Social Tests */}
                {activeTab === 'social' && (
                  <>
                    <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '20px', color: '#ffffff' }}>
                      Social API
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <ApiButton
                        method="GET"
                        endpoint="/api/social/follow/users?type=following"
                        description="Get users I'm following"
                        onClick={() => makeRequest('GET', '/api/social/follow/users?type=following')}
                      />
                      <ApiButton
                        method="GET"
                        endpoint="/api/social/follow/artists"
                        description="Get followed artists"
                        onClick={() => makeRequest('GET', '/api/social/follow/artists')}
                      />
                    </div>
                  </>
                )}

                {/* Search Tests */}
                {activeTab === 'search' && (
                  <>
                    <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '20px', color: '#ffffff' }}>
                      Search API
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <ApiButton
                        method="GET"
                        endpoint="/api/search?q=test&type=all"
                        description="Search all types"
                        onClick={() => makeRequest('GET', '/api/search?q=test&type=all')}
                      />
                      <ApiButton
                        method="GET"
                        endpoint="/api/search?q=luna&type=tracks"
                        description="Search tracks only"
                        onClick={() => makeRequest('GET', '/api/search?q=luna&type=tracks')}
                      />
                    </div>
                  </>
                )}

                {/* History Tests */}
                {activeTab === 'history' && (
                  <>
                    <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '20px', color: '#ffffff' }}>
                      History API
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <ApiButton
                        method="GET"
                        endpoint="/api/history"
                        description="Get playback history"
                        onClick={() => makeRequest('GET', '/api/history')}
                      />
                      <ApiButton
                        method="POST"
                        endpoint="/api/history"
                        description="Record a play"
                        onClick={() =>
                          makeRequest('POST', '/api/history', {
                            track_id: 't1111111-1111-1111-1111-111111111111',
                          })
                        }
                      />
                    </div>
                  </>
                )}

                {/* Comments Tests */}
                {activeTab === 'comments' && (
                  <>
                    <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '20px', color: '#ffffff' }}>
                      Comments API
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <ApiButton
                        method="GET"
                        endpoint="/api/comments/tracks?track_id=..."
                        description="Get track comments"
                        onClick={() =>
                          makeRequest('GET', '/api/comments/tracks?track_id=t1111111-1111-1111-1111-111111111111')
                        }
                      />
                      <ApiButton
                        method="POST"
                        endpoint="/api/comments/tracks"
                        description="Add a comment"
                        onClick={() =>
                          makeRequest('POST', '/api/comments/tracks', {
                            track_id: 't1111111-1111-1111-1111-111111111111',
                            content: 'Great track!',
                          })
                        }
                      />
                    </div>
                  </>
                )}

                {/* Reactions Tests */}
                {activeTab === 'reactions' && (
                  <>
                    <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '20px', color: '#ffffff' }}>
                      Reactions API
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <ApiButton
                        method="GET"
                        endpoint="/api/reactions?track_id=..."
                        description="Get reactions"
                        onClick={() =>
                          makeRequest('GET', '/api/reactions?track_id=t1111111-1111-1111-1111-111111111111')
                        }
                      />
                      <ApiButton
                        method="POST"
                        endpoint="/api/reactions"
                        description="Add a reaction"
                        onClick={() =>
                          makeRequest('POST', '/api/reactions', {
                            track_id: 't1111111-1111-1111-1111-111111111111',
                            emoji: '🔥',
                          })
                        }
                      />
                    </div>
                  </>
                )}

                {/* Feed Tests */}
                {activeTab === 'feed' && (
                  <>
                    <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '20px', color: '#ffffff' }}>
                      Feed API
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <ApiButton
                        method="GET"
                        endpoint="/api/feed"
                        description="Get activity feed"
                        onClick={() => makeRequest('GET', '/api/feed')}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Results Section */}
            {loading && (
              <div
                style={{
                  marginTop: '30px',
                  background: '#181818',
                  padding: '40px',
                  borderRadius: '12px',
                  border: '1px solid #282828',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                <div style={{ color: '#b3b3b3', fontSize: '16px' }}>Sending request...</div>
              </div>
            )}

            {results && !loading && (
              <div
                style={{
                  marginTop: '30px',
                  background: '#181818',
                  padding: '30px',
                  borderRadius: '12px',
                  border: '1px solid #282828',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#ffffff', margin: 0 }}>
                    Response
                  </h3>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(results, null, 2))}
                    style={{
                      padding: '8px 16px',
                      background: '#282828',
                      color: '#ffffff',
                      border: '1px solid #404040',
                      borderRadius: '6px',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    📋 Copy
                  </button>
                </div>

                {/* Status Badge */}
                {results.status && (
                  <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '6px 16px',
                        background: results.ok ? 'rgba(29, 185, 84, 0.2)' : 'rgba(230, 77, 77, 0.2)',
                        border: `1px solid ${results.ok ? '#1DB954' : '#e64d4d'}`,
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: results.ok ? '#1ed760' : '#ff6b6b',
                      }}
                    >
                      {results.status} {results.statusText}
                    </span>
                    {requestDuration !== null && (
                      <span style={{ color: '#b3b3b3', fontSize: '14px' }}>
                        ⏱️ {requestDuration}ms
                      </span>
                    )}
                  </div>
                )}

                {/* Error Display */}
                {results.error && (
                  <div
                    style={{
                      padding: '20px',
                      background: 'rgba(230, 77, 77, 0.1)',
                      border: '1px solid rgba(230, 77, 77, 0.3)',
                      borderRadius: '8px',
                      marginBottom: '20px',
                    }}
                  >
                    <div style={{ color: '#ff6b6b', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                      ⚠️ Error
                    </div>
                    <div style={{ color: '#ffb3b3', fontSize: '14px', marginBottom: '12px' }}>
                      {results.error}
                    </div>
                    {results.type && (
                      <div style={{ color: '#b3b3b3', fontSize: '12px', marginBottom: '4px' }}>
                        Type: {results.type}
                      </div>
                    )}
                    {results.hint && (
                      <div style={{ color: '#b3b3b3', fontSize: '12px', fontStyle: 'italic' }}>
                        💡 {results.hint}
                      </div>
                    )}
                  </div>
                )}

                {/* Response Data */}
                <pre
                  style={{
                    background: '#121212',
                    padding: '20px',
                    borderRadius: '8px',
                    overflow: 'auto',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    color: '#e0e0e0',
                    maxHeight: '500px',
                    border: '1px solid #282828',
                  }}
                >
                  {JSON.stringify(results.data || results, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Request History Sidebar */}
          {history.length > 0 && (
            <div>
              <div style={{ background: '#181818', padding: '20px', borderRadius: '12px', border: '1px solid #282828', position: 'sticky', top: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#ffffff' }}>
                  Recent Requests
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {history.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '12px',
                        background: '#121212',
                        borderRadius: '6px',
                        border: '1px solid #282828',
                        fontSize: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            background: item.method === 'GET' ? '#1DB954' : item.method === 'POST' ? '#3b82f6' : item.method === 'DELETE' ? '#ef4444' : '#f59e0b',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '700',
                            color: '#ffffff',
                          }}
                        >
                          {item.method}
                        </span>
                        {item.status && (
                          <span style={{ color: item.status < 400 ? '#1ed760' : '#ff6b6b', fontSize: '11px', fontWeight: '600' }}>
                            {item.status}
                          </span>
                        )}
                      </div>
                      <div style={{ color: '#b3b3b3', wordBreak: 'break-all', marginBottom: '4px' }}>
                        {item.endpoint}
                      </div>
                      <div style={{ color: '#707070', fontSize: '10px' }}>
                        {item.duration && `${item.duration}ms • `}
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ApiButtonProps {
  method: string;
  endpoint: string;
  description: string;
  onClick: () => void;
}

function ApiButton({ method, endpoint, description, onClick }: ApiButtonProps) {
  const methodColors: Record<string, { bg: string; text: string }> = {
    GET: { bg: '#1DB954', text: '#ffffff' },
    POST: { bg: '#3b82f6', text: '#ffffff' },
    PUT: { bg: '#f59e0b', text: '#ffffff' },
    DELETE: { bg: '#ef4444', text: '#ffffff' },
  };

  const colors = methodColors[method] || { bg: '#6b7280', text: '#ffffff' };

  return (
    <button
      onClick={onClick}
      style={{
        padding: '16px 20px',
        background: '#121212',
        color: '#ffffff',
        border: '1px solid #282828',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        textAlign: 'left',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#282828';
        e.currentTarget.style.borderColor = '#404040';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#121212';
        e.currentTarget.style.borderColor = '#282828';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span
          style={{
            padding: '4px 10px',
            background: colors.bg,
            color: colors.text,
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '700',
            minWidth: '60px',
            textAlign: 'center',
          }}
        >
          {method}
        </span>
        <code style={{ color: '#b3b3b3', fontSize: '13px', fontFamily: 'monospace' }}>
          {endpoint}
        </code>
      </div>
      <div style={{ color: '#808080', fontSize: '13px', paddingLeft: '72px' }}>
        {description}
      </div>
    </button>
  );
}
