'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface AnalysisStats {
  totalTracks: number;
  analyzedTracks: number;
  pendingTracks: number;
  percentComplete: number;
}

interface MoodDistribution {
  [mood: string]: number;
}

interface AnalysisResult {
  trackId: string;
  success: boolean;
  mood: string | null;
  confidence: number | null;
  error?: string;
  processingTimeMs: number;
}

export default function MoodAnalysisPage() {
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [moodDistribution, setMoodDistribution] = useState<MoodDistribution>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [batchSize, setBatchSize] = useState(10);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/analyze-tracks');
      if (!response.ok) throw new Error('Failed to fetch analysis stats');

      const data = await response.json();
      setStats(data.stats);
      setMoodDistribution(data.moodDistribution || {});
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runBatchAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      setAnalysisResults([]);
      setError('');

      const response = await fetch('/api/admin/analyze-tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: batchSize })
      });

      if (!response.ok) throw new Error('Failed to run batch analysis');

      const data = await response.json();
      setAnalysisResults(data.results || []);

      // Refresh stats after analysis
      await fetchStats();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getMoodColor = (mood: string): string => {
    const colors: Record<string, string> = {
      happy: 'bg-yellow-500',
      sad: 'bg-blue-500',
      energetic: 'bg-orange-500',
      chill: 'bg-cyan-500',
      focused: 'bg-purple-500',
      romantic: 'bg-pink-500',
      angry: 'bg-red-500',
      peaceful: 'bg-green-500'
    };
    return colors[mood] || 'bg-gray-500';
  };

  const getMoodEmoji = (mood: string): string => {
    const emojis: Record<string, string> = {
      happy: '😊',
      sad: '😢',
      energetic: '⚡',
      chill: '😌',
      focused: '🎯',
      romantic: '❤️',
      angry: '😠',
      peaceful: '☮️'
    };
    return emojis[mood] || '🎵';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <div className="text-white/60">Loading mood analysis...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mood Analysis</h1>
            <p className="text-white/60">Analyze tracks to detect mood and generate tags</p>
          </div>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 19V6l12-2v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-2c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-2" />
                </svg>
              </div>
              <span className="text-white/60 text-sm">Total Tracks</span>
            </div>
            <p className="text-2xl font-bold">{stats?.totalTracks || 0}</p>
          </div>

          <div className="bg-surface/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-white/60 text-sm">Analyzed</span>
            </div>
            <p className="text-2xl font-bold">{stats?.analyzedTracks || 0}</p>
          </div>

          <div className="bg-surface/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-white/60 text-sm">Pending</span>
            </div>
            <p className="text-2xl font-bold">{stats?.pendingTracks || 0}</p>
          </div>

          <div className="bg-surface/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-white/60 text-sm">Progress</span>
            </div>
            <p className="text-2xl font-bold">{stats?.percentComplete || 0}%</p>
          </div>
        </div>

        {/* Progress Bar */}
        {stats && stats.totalTracks > 0 && (
          <div className="bg-surface/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/60">Analysis Progress</span>
              <span className="text-sm font-medium">{stats.analyzedTracks} / {stats.totalTracks}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all duration-500"
                style={{ width: `${stats.percentComplete}%` }}
              />
            </div>
          </div>
        )}

        {/* Batch Analysis Control */}
        <div className="bg-surface/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Run Batch Analysis</h2>
          <p className="text-white/60 text-sm mb-4">
            Analyze tracks that don't have mood metadata yet. This will extract audio features and classify moods using ML.
          </p>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-white/60">Batch Size:</label>
              <select
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm"
                disabled={isAnalyzing}
              >
                <option value={5}>5 tracks</option>
                <option value={10}>10 tracks</option>
                <option value={20}>20 tracks</option>
                <option value={50}>50 tracks</option>
              </select>
            </div>

            <button
              onClick={runBatchAnalysis}
              disabled={isAnalyzing || (stats?.pendingTracks === 0)}
              className={`
                px-6 py-2 rounded-lg font-medium transition-all
                ${isAnalyzing || stats?.pendingTracks === 0
                  ? 'bg-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-primary text-black hover:bg-primary/90'
                }
              `}
            >
              {isAnalyzing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing...
                </span>
              ) : stats?.pendingTracks === 0 ? (
                'All Tracks Analyzed'
              ) : (
                `Analyze ${Math.min(batchSize, stats?.pendingTracks || 0)} Tracks`
              )}
            </button>
          </div>
        </div>

        {/* Mood Distribution */}
        {Object.keys(moodDistribution).length > 0 && (
          <div className="bg-surface/50 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Mood Distribution</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(moodDistribution)
                .sort(([, a], [, b]) => b - a)
                .map(([mood, count]) => (
                  <div key={mood} className="bg-black/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{getMoodEmoji(mood)}</span>
                      <span className="font-medium capitalize">{mood}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getMoodColor(mood)}`} />
                      <span className="text-2xl font-bold">{count}</span>
                      <span className="text-white/40 text-sm">tracks</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {analysisResults.length > 0 && (
          <div className="bg-surface/50 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">
              Latest Analysis Results
              <span className="text-sm font-normal text-white/60 ml-2">
                ({analysisResults.filter(r => r.success).length} successful, {analysisResults.filter(r => !r.success).length} failed)
              </span>
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {analysisResults.map((result, index) => (
                <div
                  key={result.trackId}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    result.success ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/10 text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-mono">{result.trackId.slice(0, 8)}...</p>
                      {result.success && result.mood && (
                        <p className="text-xs text-white/60">
                          {getMoodEmoji(result.mood)} {result.mood} ({Math.round((result.confidence || 0) * 100)}%)
                        </p>
                      )}
                      {!result.success && result.error && (
                        <p className="text-xs text-red-400">{result.error}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded ${
                      result.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {result.success ? 'Success' : 'Failed'}
                    </span>
                    <p className="text-xs text-white/40 mt-1">{result.processingTimeMs}ms</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
