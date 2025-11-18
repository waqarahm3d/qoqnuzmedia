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

export default function AdminDashboard() {
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
            <div className="text-gray-400">Loading analytics...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-900/20 border border-red-500 text-red-200 px-4 py-3 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Welcome to Qoqnuz Music Admin Portal
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={analytics?.overview.totalUsers || 0}
            change={`+${analytics?.overview.newUsersLast30Days || 0} this month`}
            icon="👥"
            color="blue"
          />
          <StatCard
            title="Total Tracks"
            value={analytics?.overview.totalTracks || 0}
            icon="🎵"
            color="green"
          />
          <StatCard
            title="Total Artists"
            value={analytics?.overview.totalArtists || 0}
            icon="🎤"
            color="purple"
          />
          <StatCard
            title="Total Plays"
            value={analytics?.overview.totalPlays || 0}
            change={`+${analytics?.overview.playsLast30Days || 0} this month`}
            icon="▶️"
            color="red"
          />
        </div>

        {/* Second Row Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Albums"
            value={analytics?.overview.totalAlbums || 0}
            icon="💿"
            color="yellow"
          />
          <StatCard
            title="Playlists"
            value={analytics?.overview.totalPlaylists || 0}
            icon="📋"
            color="indigo"
          />
          <StatCard
            title="Plays (30d)"
            value={analytics?.overview.playsLast30Days || 0}
            icon="📊"
            color="pink"
          />
        </div>

        {/* Top Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Tracks */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Top Tracks (30 days)
            </h2>
            <div className="space-y-3">
              {analytics?.topTracks.slice(0, 5).map((track: any, index) => (
                <div
                  key={track.track_id}
                  className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-gray-400">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="text-white font-medium">
                        {track.tracks?.title || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-400">
                        {track.tracks?.artists?.name || 'Unknown Artist'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[#ff5c2e] font-bold">
                    {track.total_plays?.toLocaleString()} plays
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Artists */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Top Artists (30 days)
            </h2>
            <div className="space-y-3">
              {analytics?.topArtists.slice(0, 5).map((artist: any, index) => (
                <div
                  key={artist.artist_id}
                  className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-gray-400">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="text-white font-medium">
                        {artist.artists?.name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[#ff5c2e] font-bold">
                    {artist.total_plays?.toLocaleString()} plays
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Daily Plays Chart (Simple Bar Chart) */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Daily Plays (Last 30 days)
          </h2>
          <div className="h-64 flex items-end justify-between space-x-1">
            {analytics?.dailyPlaysChart.slice(-30).map((day) => {
              const maxPlays = Math.max(
                ...analytics.dailyPlaysChart.map((d) => d.plays)
              );
              const height = (day.plays / maxPlays) * 100;

              return (
                <div
                  key={day.date}
                  className="flex-1 bg-[#ff4a14] hover:bg-[#ff5c2e] rounded-t transition-colors"
                  style={{ height: `${height}%` }}
                  title={`${day.date}: ${day.plays} plays`}
                />
              );
            })}
          </div>
          <div className="text-center text-gray-400 text-sm mt-4">
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
  change?: string;
  icon: string;
  color: string;
}

function StatCard({ title, value, change, icon, color }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-900/20 text-blue-400',
    green: 'bg-[#ff4a14]/20 text-[#ff5c2e]',
    purple: 'bg-purple-900/20 text-purple-400',
    red: 'bg-red-900/20 text-red-400',
    yellow: 'bg-yellow-900/20 text-yellow-400',
    indigo: 'bg-indigo-900/20 text-indigo-400',
    pink: 'bg-pink-900/20 text-pink-400',
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">
            {value.toLocaleString()}
          </p>
          {change && (
            <p className="text-sm text-[#ff5c2e] mt-1">{change}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
