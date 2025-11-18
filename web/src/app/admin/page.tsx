'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

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

// SVG Icons
const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const MusicIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13"/>
    <circle cx="6" cy="18" r="3"/>
    <circle cx="18" cy="16" r="3"/>
  </svg>
);

const ArtistIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

const PlayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

const AlbumIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const PlaylistIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const ChartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

const TrendingIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

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
      const response = await fetch('/api/admin/analytics');

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
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <div className="text-white/60">Loading dashboard...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-white/60">Welcome to Qoqnuz Music Admin Portal</p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={analytics?.overview.totalUsers || 0}
            change={`+${analytics?.overview.newUsersLast30Days || 0} this month`}
            icon={<UsersIcon />}
            color="blue"
          />
          <StatCard
            title="Total Tracks"
            value={analytics?.overview.totalTracks || 0}
            icon={<MusicIcon />}
            color="primary"
          />
          <StatCard
            title="Total Artists"
            value={analytics?.overview.totalArtists || 0}
            icon={<ArtistIcon />}
            color="purple"
          />
          <StatCard
            title="Total Plays"
            value={analytics?.overview.totalPlays || 0}
            change={`+${analytics?.overview.playsLast30Days || 0} this month`}
            icon={<PlayIcon />}
            color="green"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Albums"
            value={analytics?.overview.totalAlbums || 0}
            icon={<AlbumIcon />}
            color="yellow"
          />
          <StatCard
            title="Playlists"
            value={analytics?.overview.totalPlaylists || 0}
            icon={<PlaylistIcon />}
            color="indigo"
          />
          <StatCard
            title="Plays (30d)"
            value={analytics?.overview.playsLast30Days || 0}
            icon={<ChartIcon />}
            color="pink"
          />
        </div>

        {/* Activity Chart */}
        <div className="bg-surface/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Listening Activity</h2>
              <p className="text-white/60 text-sm">Last 30 days</p>
            </div>
            <div className="text-primary">
              <TrendingIcon />
            </div>
          </div>
          <div className="h-48 flex items-end gap-1">
            {analytics?.dailyPlaysChart.slice(-30).map((day, index) => {
              const maxPlays = Math.max(...(analytics?.dailyPlaysChart.map(d => d.plays) || [1]), 1);
              const height = (day.plays / maxPlays) * 100;

              return (
                <div
                  key={day.date}
                  className="flex-1 bg-primary/80 hover:bg-primary rounded-t transition-all cursor-pointer group relative"
                  style={{ height: `${Math.max(height, 2)}%` }}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {day.date}: {day.plays} plays
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-white/40 mt-2">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Top Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Artists */}
          <div className="bg-surface/50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="text-primary"><ArtistIcon /></div>
              <h2 className="text-lg font-semibold">Top 5 Artists</h2>
            </div>
            <div className="space-y-3">
              {analytics?.topArtists.slice(0, 5).map((artist: any, index) => (
                <div
                  key={artist.artist_id}
                  className="flex items-center justify-between p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                      {artist.artists?.avatar_url ? (
                        <img src={artist.artists.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
                          {(artist.artists?.name || 'A')[0]}
                        </div>
                      )}
                    </div>
                    <span className="font-medium truncate">{artist.artists?.name || 'Unknown'}</span>
                  </div>
                  <span className="text-primary font-semibold text-sm">
                    {artist.total_plays?.toLocaleString()}
                  </span>
                </div>
              ))}
              {(!analytics?.topArtists || analytics.topArtists.length === 0) && (
                <p className="text-white/40 text-sm text-center py-4">No data available</p>
              )}
            </div>
          </div>

          {/* Top Tracks */}
          <div className="bg-surface/50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="text-primary"><MusicIcon /></div>
              <h2 className="text-lg font-semibold">Top 5 Songs</h2>
            </div>
            <div className="space-y-3">
              {analytics?.topTracks.slice(0, 5).map((track: any, index) => (
                <div
                  key={track.track_id}
                  className="flex items-center justify-between p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium truncate">{track.tracks?.title || 'Unknown'}</p>
                      <p className="text-white/60 text-sm truncate">{track.tracks?.artists?.name || 'Unknown Artist'}</p>
                    </div>
                  </div>
                  <span className="text-primary font-semibold text-sm">
                    {track.total_plays?.toLocaleString()}
                  </span>
                </div>
              ))}
              {(!analytics?.topTracks || analytics.topTracks.length === 0) && (
                <p className="text-white/40 text-sm text-center py-4">No data available</p>
              )}
            </div>
          </div>

          {/* Top Albums */}
          <div className="bg-surface/50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="text-primary"><AlbumIcon /></div>
              <h2 className="text-lg font-semibold">Top 5 Albums</h2>
            </div>
            <div className="space-y-3">
              {analytics?.topAlbums?.slice(0, 5).map((album: any, index) => (
                <div
                  key={album.id}
                  className="flex items-center gap-3 p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  <div className="w-10 h-10 rounded bg-white/10 overflow-hidden flex-shrink-0">
                    {album.cover_url ? (
                      <img src={album.cover_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/40">
                        <AlbumIcon />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{album.title}</p>
                    <p className="text-white/60 text-sm truncate">{album.artists?.name || 'Unknown Artist'}</p>
                  </div>
                </div>
              ))}
              {(!analytics?.topAlbums || analytics.topAlbums.length === 0) && (
                <p className="text-white/40 text-sm text-center py-4">No albums available</p>
              )}
            </div>
          </div>

          {/* Top Playlists */}
          <div className="bg-surface/50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="text-primary"><PlaylistIcon /></div>
              <h2 className="text-lg font-semibold">Top 5 Playlists</h2>
            </div>
            <div className="space-y-3">
              {analytics?.topPlaylists?.slice(0, 5).map((playlist: any, index) => (
                <div
                  key={playlist.id}
                  className="flex items-center gap-3 p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  <div className="w-10 h-10 rounded bg-white/10 overflow-hidden flex-shrink-0">
                    {playlist.cover_url ? (
                      <img src={playlist.cover_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/40">
                        <PlaylistIcon />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{playlist.name}</p>
                    <p className="text-white/60 text-sm truncate">by {playlist.profiles?.display_name || 'Unknown'}</p>
                  </div>
                </div>
              ))}
              {(!analytics?.topPlaylists || analytics.topPlaylists.length === 0) && (
                <p className="text-white/40 text-sm text-center py-4">No playlists available</p>
              )}
            </div>
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
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, change, icon, color }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-400',
    primary: 'bg-primary/10 text-primary',
    purple: 'bg-purple-500/10 text-purple-400',
    green: 'bg-green-500/10 text-green-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
    indigo: 'bg-indigo-500/10 text-indigo-400',
    pink: 'bg-pink-500/10 text-pink-400',
  };

  return (
    <div className="bg-surface/50 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/60 text-sm">{title}</p>
          <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
          {change && <p className="text-xs text-primary mt-1">{change}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
