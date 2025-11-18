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
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const MusicIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13"/>
    <circle cx="6" cy="18" r="3"/>
    <circle cx="18" cy="16" r="3"/>
  </svg>
);

const ArtistIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

const AlbumIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const PlaylistIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const TrendingUpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

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
            <div className="text-white/60">Loading analytics...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Calculate growth percentages
  const userGrowth = analytics?.overview.totalUsers
    ? ((analytics.overview.newUsersLast30Days / analytics.overview.totalUsers) * 100).toFixed(1)
    : '0';

  const playGrowth = analytics?.overview.totalPlays
    ? ((analytics.overview.playsLast30Days / analytics.overview.totalPlays) * 100).toFixed(1)
    : '0';

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-white/60">Detailed platform analytics and insights</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <div className="flex bg-surface/50 rounded-lg p-1">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-primary text-black'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                </button>
              ))}
            </div>
            <button
              onClick={fetchAnalytics}
              className="p-2 bg-surface/50 rounded-lg hover:bg-surface transition-colors"
              title="Refresh"
            >
              <RefreshIcon />
            </button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <MetricCard
            icon={<UsersIcon />}
            label="Total Users"
            value={analytics?.overview.totalUsers || 0}
            subValue={`+${analytics?.overview.newUsersLast30Days || 0}`}
            subLabel="this month"
            color="blue"
          />
          <MetricCard
            icon={<ArtistIcon />}
            label="Total Artists"
            value={analytics?.overview.totalArtists || 0}
            color="purple"
          />
          <MetricCard
            icon={<MusicIcon />}
            label="Total Tracks"
            value={analytics?.overview.totalTracks || 0}
            color="primary"
          />
          <MetricCard
            icon={<AlbumIcon />}
            label="Total Albums"
            value={analytics?.overview.totalAlbums || 0}
            color="yellow"
          />
          <MetricCard
            icon={<PlaylistIcon />}
            label="Playlists"
            value={analytics?.overview.totalPlaylists || 0}
            color="indigo"
          />
          <MetricCard
            icon={<PlayIcon />}
            label="Total Plays"
            value={analytics?.overview.totalPlays || 0}
            subValue={`+${analytics?.overview.playsLast30Days || 0}`}
            subLabel="this month"
            color="green"
          />
        </div>

        {/* Growth Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">User Growth</h3>
              <span className="text-green-400 text-sm flex items-center gap-1">
                <TrendingUpIcon />
                {userGrowth}%
              </span>
            </div>
            <div className="flex items-end gap-4">
              <div>
                <p className="text-3xl font-bold">{analytics?.overview.newUsersLast30Days || 0}</p>
                <p className="text-white/60 text-sm">New users this month</p>
              </div>
              <div className="flex-1 h-16 flex items-end gap-1">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-blue-500/60 rounded-t"
                    style={{ height: `${20 + Math.random() * 80}%` }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-surface/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Listening Growth</h3>
              <span className="text-green-400 text-sm flex items-center gap-1">
                <TrendingUpIcon />
                {playGrowth}%
              </span>
            </div>
            <div className="flex items-end gap-4">
              <div>
                <p className="text-3xl font-bold">{analytics?.overview.playsLast30Days || 0}</p>
                <p className="text-white/60 text-sm">Plays this month</p>
              </div>
              <div className="flex-1 h-16 flex items-end gap-1">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-primary/60 rounded-t"
                    style={{ height: `${20 + Math.random() * 80}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Daily Activity Chart */}
        <div className="bg-surface/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Daily Listening Activity</h2>
              <p className="text-white/60 text-sm">Track plays over time</p>
            </div>
            <div className="flex items-center gap-2 text-white/60">
              <CalendarIcon />
              <span className="text-sm">Last 30 days</span>
            </div>
          </div>

          <div className="h-64 flex flex-col">
            {/* Y-axis labels */}
            <div className="flex-1 flex">
              <div className="flex flex-col justify-between text-xs text-white/40 pr-3">
                {(() => {
                  const maxPlays = Math.max(...(analytics?.dailyPlaysChart.map(d => d.plays) || [0]), 1);
                  return [maxPlays, Math.round(maxPlays * 0.75), Math.round(maxPlays * 0.5), Math.round(maxPlays * 0.25), 0].map(val => (
                    <span key={val}>{val}</span>
                  ));
                })()}
              </div>

              {/* Bars */}
              <div className="flex-1 flex items-end gap-1 border-l border-b border-white/10 pl-2 pb-2">
                {analytics?.dailyPlaysChart.slice(-30).map((day) => {
                  const maxPlays = Math.max(...(analytics?.dailyPlaysChart.map(d => d.plays) || [1]), 1);
                  const height = (day.plays / maxPlays) * 100;

                  return (
                    <div
                      key={day.date}
                      className="flex-1 bg-primary/70 hover:bg-primary rounded-t transition-all cursor-pointer group relative"
                      style={{ height: `${Math.max(height, 1)}%` }}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <p className="font-medium">{day.plays.toLocaleString()} plays</p>
                        <p className="text-white/60">{day.date}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Top Content - Extended View */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Tracks - Extended */}
          <div className="bg-surface/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="text-primary"><MusicIcon /></div>
                <h2 className="text-lg font-semibold">Top Tracks</h2>
              </div>
              <span className="text-white/40 text-sm">Last 30 days</span>
            </div>
            <div className="space-y-2">
              {analytics?.topTracks.slice(0, 10).map((track: any, index) => (
                <div
                  key={track.track_id}
                  className="flex items-center justify-between p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index < 3 ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white/60'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{track.tracks?.title || 'Unknown'}</p>
                      <p className="text-white/60 text-sm truncate">{track.tracks?.artists?.name || 'Unknown Artist'}</p>
                    </div>
                  </div>
                  <div className="text-right pl-4">
                    <span className="text-primary font-semibold">{track.total_plays?.toLocaleString()}</span>
                    <p className="text-white/40 text-xs">plays</p>
                  </div>
                </div>
              ))}
              {(!analytics?.topTracks || analytics.topTracks.length === 0) && (
                <p className="text-white/40 text-sm text-center py-8">No track data available</p>
              )}
            </div>
          </div>

          {/* Top Artists - Extended */}
          <div className="bg-surface/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="text-primary"><ArtistIcon /></div>
                <h2 className="text-lg font-semibold">Top Artists</h2>
              </div>
              <span className="text-white/40 text-sm">Last 30 days</span>
            </div>
            <div className="space-y-2">
              {analytics?.topArtists.slice(0, 10).map((artist: any, index) => (
                <div
                  key={artist.artist_id}
                  className="flex items-center justify-between p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index < 3 ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white/60'
                    }`}>
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
                  <div className="text-right pl-4">
                    <span className="text-primary font-semibold">{artist.total_plays?.toLocaleString()}</span>
                    <p className="text-white/40 text-xs">plays</p>
                  </div>
                </div>
              ))}
              {(!analytics?.topArtists || analytics.topArtists.length === 0) && (
                <p className="text-white/40 text-sm text-center py-8">No artist data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Albums & Playlists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Albums */}
          <div className="bg-surface/50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="text-primary"><AlbumIcon /></div>
              <h2 className="text-lg font-semibold">Recent Albums</h2>
            </div>
            <div className="space-y-2">
              {analytics?.topAlbums?.slice(0, 5).map((album: any, index) => (
                <div
                  key={album.id}
                  className="flex items-center gap-3 p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  <div className="w-12 h-12 rounded bg-white/10 overflow-hidden flex-shrink-0">
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
                <p className="text-white/40 text-sm text-center py-8">No albums available</p>
              )}
            </div>
          </div>

          {/* Top Playlists */}
          <div className="bg-surface/50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="text-primary"><PlaylistIcon /></div>
              <h2 className="text-lg font-semibold">Popular Playlists</h2>
            </div>
            <div className="space-y-2">
              {analytics?.topPlaylists?.slice(0, 5).map((playlist: any, index) => (
                <div
                  key={playlist.id}
                  className="flex items-center gap-3 p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  <div className="w-12 h-12 rounded bg-white/10 overflow-hidden flex-shrink-0">
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
                <p className="text-white/40 text-sm text-center py-8">No playlists available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  subValue?: string;
  subLabel?: string;
  color: string;
}

function MetricCard({ icon, label, value, subValue, subLabel, color }: MetricCardProps) {
  const colorClasses: Record<string, string> = {
    blue: 'text-blue-400',
    primary: 'text-primary',
    purple: 'text-purple-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    indigo: 'text-indigo-400',
  };

  return (
    <div className="bg-surface/50 rounded-xl p-4">
      <div className={`${colorClasses[color]} mb-2`}>{icon}</div>
      <p className="text-2xl font-bold">{value.toLocaleString()}</p>
      <p className="text-white/60 text-xs">{label}</p>
      {subValue && (
        <p className="text-primary text-xs mt-1">
          {subValue} <span className="text-white/40">{subLabel}</span>
        </p>
      )}
    </div>
  );
}
