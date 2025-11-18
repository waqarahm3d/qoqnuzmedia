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
  dailyPlaysChart: { date: string; plays: number }[];
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
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
          color: '#fca5a5',
          padding: '16px',
          borderRadius: '8px',
        }}>
          <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Error</p>
          <p>{error}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ padding: '0' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
            Analytics
          </h1>
          <p style={{ color: '#b3b3b3' }}>
            Detailed platform analytics and insights
          </p>
        </div>

        {/* Time Range Selector */}
        <div style={{ marginBottom: '32px', display: 'flex', gap: '12px' }}>
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                padding: '10px 20px',
                background: timeRange === range ? '#ff4a14' : '#282828',
                color: '#ffffff',
                border: 'none',
                borderRadius: '500px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                if (timeRange !== range) e.currentTarget.style.background = '#3e3e3e';
              }}
              onMouseOut={(e) => {
                if (timeRange !== range) e.currentTarget.style.background = '#282828';
              }}
            >
              Last {range === '7d' ? '7' : range === '30d' ? '30' : '90'} days
            </button>
          ))}
        </div>

        {/* Stats Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
        }}>
          <StatCard
            title="Total Users"
            value={analytics?.overview.totalUsers || 0}
            subtitle={`+${analytics?.overview.newUsersLast30Days || 0} this month`}
            icon="👥"
            color="#3b82f6"
          />
          <StatCard
            title="Total Tracks"
            value={analytics?.overview.totalTracks || 0}
            icon="🎵"
            color="#ff4a14"
          />
          <StatCard
            title="Total Plays"
            value={analytics?.overview.totalPlays || 0}
            subtitle={`+${analytics?.overview.playsLast30Days || 0} this month`}
            icon="▶️"
            color="#ef4444"
          />
          <StatCard
            title="Total Artists"
            value={analytics?.overview.totalArtists || 0}
            icon="🎤"
            color="#a855f7"
          />
        </div>

        {/* Charts */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
        }}>
          {/* Top Tracks */}
          <div style={{ background: '#181818', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>
              Top Tracks
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {analytics?.topTracks.slice(0, 10).map((track: any, index) => (
                <div
                  key={track.track_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    background: '#282828',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#b3b3b3', minWidth: '30px' }}>
                      #{index + 1}
                    </span>
                    <div>
                      <p style={{ color: '#ffffff', fontWeight: 500, marginBottom: '4px' }}>
                        {track.tracks?.title || 'Unknown'}
                      </p>
                      <p style={{ fontSize: '14px', color: '#b3b3b3' }}>
                        {track.tracks?.artists?.name || 'Unknown Artist'}
                      </p>
                    </div>
                  </div>
                  <span style={{ color: '#ff4a14', fontWeight: 'bold' }}>
                    {track.total_plays?.toLocaleString()} plays
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Artists */}
          <div style={{ background: '#181818', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>
              Top Artists
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {analytics?.topArtists.slice(0, 10).map((artist: any, index) => (
                <div
                  key={artist.artist_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    background: '#282828',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#b3b3b3', minWidth: '30px' }}>
                      #{index + 1}
                    </span>
                    <p style={{ color: '#ffffff', fontWeight: 500 }}>
                      {artist.artists?.name || 'Unknown'}
                    </p>
                  </div>
                  <span style={{ color: '#ff4a14', fontWeight: 'bold' }}>
                    {artist.total_plays?.toLocaleString()} plays
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Daily Plays Chart */}
        <div style={{ background: '#181818', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>
            Daily Plays Trend
          </h2>
          <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '4px' }}>
            {analytics?.dailyPlaysChart.slice(-30).map((day) => {
              const maxPlays = Math.max(...analytics.dailyPlaysChart.map((d) => d.plays), 1);
              const height = (day.plays / maxPlays) * 100;

              return (
                <div
                  key={day.date}
                  style={{
                    flex: 1,
                    background: '#ff4a14',
                    borderRadius: '4px 4px 0 0',
                    height: `${height}%`,
                    minHeight: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  title={`${day.date}: ${day.plays} plays`}
                  onMouseOver={(e) => e.currentTarget.style.background = '#ff5c2e'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#ff4a14'}
                />
              );
            })}
          </div>
          <div style={{ textAlign: 'center', color: '#b3b3b3', fontSize: '14px', marginTop: '16px' }}>
            Hover over bars to see details
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: string;
  color: string;
}

function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  return (
    <div style={{ background: '#181818', borderRadius: '12px', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: '#b3b3b3', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
            {title}
          </p>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
            {value.toLocaleString()}
          </p>
          {subtitle && (
            <p style={{ fontSize: '14px', color: '#ff4a14' }}>{subtitle}</p>
          )}
        </div>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '12px',
          background: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}
