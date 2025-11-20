'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase-client';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalArtists: number;
    totalAlbums: number;
    totalTracks: number;
    totalPlaylists: number;
    totalPlays: number;
    newUsersLast30Days: number;
    playsLast30Days: number;
  };
  topTracks: any[];
  topArtists: any[];
  topAlbums: any[];
  topPlaylists: any[];
  dailyPlaysChart: { date: string; plays: number }[];
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/admin/analytics', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <div style={{ color: '#b3b3b3' }}>Loading analytics...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #ef4444',
          borderRadius: '12px',
          padding: '24px',
          color: '#fca5a5'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Error</div>
          <div>{error}</div>
        </div>
      </AdminLayout>
    );
  }

  if (!analytics) return null;

  const { overview, topTracks, topArtists, topAlbums, topPlaylists, dailyPlaysChart } = analytics;

  // Calculate growth percentages (simplified - would need historical data for real percentages)
  const userGrowth = overview.totalUsers > 0
    ? Math.round((overview.newUsersLast30Days / overview.totalUsers) * 100)
    : 0;

  const playGrowth = overview.totalPlays > 0
    ? Math.round((overview.playsLast30Days / overview.totalPlays) * 100)
    : 0;

  // Find max plays for chart scaling
  const maxPlays = Math.max(...dailyPlaysChart.map(d => d.plays), 1);

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
            Analytics
          </h1>
          <p style={{ color: '#b3b3b3' }}>
            Comprehensive platform analytics and insights
          </p>
        </div>

        {/* Overview Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          {/* Total Users */}
          <div style={{
            background: '#181818',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #282828'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', color: '#b3b3b3', fontWeight: 600 }}>Total Users</div>
              <div style={{ fontSize: '20px' }}>👥</div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
              {overview.totalUsers.toLocaleString()}
            </div>
            <div style={{ fontSize: '13px', color: '#22c55e' }}>
              +{overview.newUsersLast30Days} in last 30 days ({userGrowth}%)
            </div>
          </div>

          {/* Total Plays */}
          <div style={{
            background: '#181818',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #282828'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', color: '#b3b3b3', fontWeight: 600 }}>Total Plays</div>
              <div style={{ fontSize: '20px' }}>▶️</div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
              {overview.totalPlays.toLocaleString()}
            </div>
            <div style={{ fontSize: '13px', color: '#22c55e' }}>
              +{overview.playsLast30Days.toLocaleString()} in last 30 days
            </div>
          </div>

          {/* Total Tracks */}
          <div style={{
            background: '#181818',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #282828'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', color: '#b3b3b3', fontWeight: 600 }}>Total Tracks</div>
              <div style={{ fontSize: '20px' }}>🎵</div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff' }}>
              {overview.totalTracks.toLocaleString()}
            </div>
          </div>

          {/* Total Artists */}
          <div style={{
            background: '#181818',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #282828'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', color: '#b3b3b3', fontWeight: 600 }}>Total Artists</div>
              <div style={{ fontSize: '20px' }}>🎤</div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff' }}>
              {overview.totalArtists.toLocaleString()}
            </div>
          </div>

          {/* Total Albums */}
          <div style={{
            background: '#181818',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #282828'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', color: '#b3b3b3', fontWeight: 600 }}>Total Albums</div>
              <div style={{ fontSize: '20px' }}>💿</div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff' }}>
              {overview.totalAlbums.toLocaleString()}
            </div>
          </div>

          {/* Total Playlists */}
          <div style={{
            background: '#181818',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #282828'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', color: '#b3b3b3', fontWeight: 600 }}>Total Playlists</div>
              <div style={{ fontSize: '20px' }}>📋</div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff' }}>
              {overview.totalPlaylists.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Daily Plays Chart */}
        {dailyPlaysChart.length > 0 && (
          <div style={{
            background: '#181818',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px',
            border: '1px solid #282828'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>
              Daily Plays (Last 30 Days)
            </h2>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '200px' }}>
              {dailyPlaysChart.map((item, index) => {
                const height = (item.plays / maxPlays) * 100;
                return (
                  <div
                    key={index}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <div
                      title={`${item.date}: ${item.plays} plays`}
                      style={{
                        width: '100%',
                        height: `${height}%`,
                        background: 'linear-gradient(180deg, #ff4a14 0%, #ff6b3d 100%)',
                        borderRadius: '4px 4px 0 0',
                        minHeight: item.plays > 0 ? '4px' : '0',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(180deg, #ff5c2e 0%, #ff7d52 100%)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(180deg, #ff4a14 0%, #ff6b3d 100%)';
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '12px',
              fontSize: '12px',
              color: '#b3b3b3'
            }}>
              <span>{dailyPlaysChart[0]?.date}</span>
              <span>{dailyPlaysChart[dailyPlaysChart.length - 1]?.date}</span>
            </div>
          </div>
        )}

        {/* Top Performers Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {/* Top Tracks */}
          <div style={{
            background: '#181818',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #282828'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>
              Top Tracks (30 Days)
            </h2>
            {topTracks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {topTracks.map((item, index) => (
                  <div
                    key={item.track_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: '#121212',
                      borderRadius: '8px',
                      border: '1px solid #282828'
                    }}
                  >
                    <div style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#ff4a14',
                      minWidth: '24px'
                    }}>
                      #{index + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                        {item.tracks.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#b3b3b3' }}>
                        {item.tracks.artists?.name || 'Unknown Artist'}
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#22c55e' }}>
                      {item.total_plays.toLocaleString()} plays
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#b3b3b3' }}>
                No play data yet
              </div>
            )}
          </div>

          {/* Top Artists */}
          <div style={{
            background: '#181818',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #282828'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>
              Top Artists (30 Days)
            </h2>
            {topArtists.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {topArtists.map((item, index) => (
                  <div
                    key={item.artist_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: '#121212',
                      borderRadius: '8px',
                      border: '1px solid #282828'
                    }}
                  >
                    <div style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#ff4a14',
                      minWidth: '24px'
                    }}>
                      #{index + 1}
                    </div>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      background: '#282828',
                      flexShrink: 0
                    }}>
                      {item.artists?.avatar_url ? (
                        <img
                          src={item.artists.avatar_url}
                          alt={item.artists.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                          🎤
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
                        {item.artists?.name || 'Unknown'}
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#22c55e' }}>
                      {item.total_plays.toLocaleString()} plays
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#b3b3b3' }}>
                No play data yet
              </div>
            )}
          </div>
        </div>

        {/* Bottom Grid - Albums and Playlists */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px'
        }}>
          {/* Top Albums */}
          <div style={{
            background: '#181818',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #282828'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>
              Top Albums (30 Days)
            </h2>
            {topAlbums.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {topAlbums.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: '#121212',
                      borderRadius: '8px',
                      border: '1px solid #282828'
                    }}
                  >
                    <div style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#ff4a14',
                      minWidth: '24px'
                    }}>
                      #{index + 1}
                    </div>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      background: '#282828',
                      flexShrink: 0
                    }}>
                      {item.cover_url ? (
                        <img
                          src={item.cover_url}
                          alt={item.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                          💿
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#b3b3b3' }}>
                        {item.artists?.name || 'Unknown Artist'}
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#22c55e' }}>
                      {item.total_plays.toLocaleString()} plays
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#b3b3b3' }}>
                No play data yet
              </div>
            )}
          </div>

          {/* Top Playlists */}
          <div style={{
            background: '#181818',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #282828'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>
              Top Playlists (By Track Count)
            </h2>
            {topPlaylists.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {topPlaylists.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: '#121212',
                      borderRadius: '8px',
                      border: '1px solid #282828'
                    }}
                  >
                    <div style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#ff4a14',
                      minWidth: '24px'
                    }}>
                      #{index + 1}
                    </div>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      background: '#282828',
                      flexShrink: 0
                    }}>
                      {item.cover_url ? (
                        <img
                          src={item.cover_url}
                          alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                          📋
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#b3b3b3' }}>
                        {item.profiles?.display_name || 'Unknown User'}
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#22c55e' }}>
                      {item.track_count} tracks
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#b3b3b3' }}>
                No playlists yet
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
