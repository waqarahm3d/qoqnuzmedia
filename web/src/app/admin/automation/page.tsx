'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface CronJob {
  jobid: number;
  jobname: string;
  schedule: string;
  active: boolean;
  database: string;
}

interface AutomationStatus {
  cron_jobs: CronJob[];
  background_tasks: {
    total: number;
    by_status: Record<string, number>;
    by_type: Record<string, number>;
    recent_tasks: any[];
  };
  smart_playlists: {
    total: number;
    by_type: Record<string, number>;
    latest_generation: string | null;
  };
  trending_tracks: {
    last_calculated: string | null;
  };
}

export default function AutomationDashboard() {
  const [status, setStatus] = useState<AutomationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [triggering, setTriggering] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchStatus();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/automation/trigger');

      if (response.ok) {
        const data = await response.json();
        setStatus(data.automation_status);
        setLastRefresh(new Date());
      } else {
        const errorData = await response.json();
        console.error('Automation status error:', errorData);
        setError(errorData.error || 'Failed to fetch automation status');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const triggerAutomation = async (task: string) => {
    try {
      setTriggering(true);
      setSuccessMessage('');
      setError('');

      const response = await fetch('/api/automation/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task }),
      });

      if (response.ok) {
        setSuccessMessage(`Successfully triggered: ${task.replace(/_/g, ' ')}`);
        setTimeout(() => {
          fetchStatus();
          setSuccessMessage('');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to trigger automation');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to trigger automation');
    } finally {
      setTriggering(false);
    }
  };

  const getHealthStatus = () => {
    if (!status) return 'unknown';

    const hasActiveCrons = status.cron_jobs.some(job => job.active);
    const hasRecentPlaylists = status.smart_playlists.latest_generation;
    const pendingTasks = status.background_tasks.by_status?.pending || 0;

    if (hasActiveCrons && hasRecentPlaylists && pendingTasks < 100) {
      return 'healthy';
    } else if (hasActiveCrons) {
      return 'warning';
    } else {
      return 'error';
    }
  };

  const getCronDescription = (schedule: string): string => {
    const patterns: Record<string, string> = {
      '0 2 * * *': 'Daily at 2:00 AM',
      '0 3 * * *': 'Daily at 3:00 AM',
      '0 */6 * * *': 'Every 6 hours',
      '0 4 * * 0': 'Sundays at 4:00 AM',
      '0 5 * * *': 'Daily at 5:00 AM',
    };
    return patterns[schedule] || schedule;
  };

  if (loading && !status) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ff4a14] mx-auto mb-4"></div>
            <p className="text-gray-400">Loading automation status...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const healthStatus = getHealthStatus();

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Automation Dashboard</h1>
            <p className="text-gray-400 mt-1">Monitor and manage automated tasks</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 text-[#ff4a14] focus:ring-[#ff4a14]"
              />
              Auto-refresh (30s)
            </label>
            <div className="text-xs text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded-lg flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
            <p className="font-bold flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              Error
            </p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {/* System Health */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">System Health</h2>
          <div className="flex items-center gap-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
              healthStatus === 'healthy' ? 'bg-green-500/20 border-2 border-green-500' :
              healthStatus === 'warning' ? 'bg-yellow-500/20 border-2 border-yellow-500' :
              'bg-red-500/20 border-2 border-red-500'
            }`}>
              {healthStatus === 'healthy' ? (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : healthStatus === 'warning' ? (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              ) : (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">
                {healthStatus === 'healthy' ? 'System Healthy' :
                 healthStatus === 'warning' ? 'Minor Issues Detected' :
                 'System Errors'}
              </h3>
              <p className="text-gray-400">
                {healthStatus === 'healthy' && 'All automation systems running normally'}
                {healthStatus === 'warning' && 'Some automations may need attention'}
                {healthStatus === 'error' && 'Critical: Automation systems offline'}
              </p>
            </div>
          </div>
        </div>

        {/* Manual Triggers */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Manual Triggers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => triggerAutomation('all')}
              disabled={triggering}
              className="p-4 bg-gradient-to-br from-[#ff4a14] to-[#ff5c2e] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4" />
                <path d="m16.2 7.8 2.9-2.9" />
                <path d="M18 12h4" />
                <path d="m16.2 16.2 2.9 2.9" />
                <path d="M12 18v4" />
                <path d="m4.9 19.1 2.9-2.9" />
                <path d="M2 12h4" />
                <path d="m4.9 4.9 2.9 2.9" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Trigger All
            </button>
            <button
              onClick={() => triggerAutomation('smart_playlists')}
              disabled={triggering}
              className="p-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15V6" />
                <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                <path d="M12 12H3" />
                <path d="M16 6H3" />
                <path d="M12 18H3" />
              </svg>
              Smart Playlists
            </button>
            <button
              onClick={() => triggerAutomation('trending')}
              disabled={triggering}
              className="p-4 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              Trending
            </button>
            <button
              onClick={() => triggerAutomation('listening_stats')}
              disabled={triggering}
              className="p-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="20" x2="12" y2="10" />
                <line x1="18" y1="20" x2="18" y2="4" />
                <line x1="6" y1="20" x2="6" y2="16" />
              </svg>
              Listening Stats
            </button>
          </div>
        </div>

        {/* Cron Jobs */}
        {status && status.cron_jobs && status.cron_jobs.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Scheduled Jobs</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Job Name</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Schedule</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {status.cron_jobs.map((job) => (
                    <tr key={job.jobid} className="border-b border-gray-700/50">
                      <td className="py-3 px-4 text-white">{job.jobname}</td>
                      <td className="py-3 px-4 text-gray-400">{getCronDescription(job.schedule)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          job.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {job.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        {status && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Smart Playlists */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">Smart Playlists</h3>
              <div className="text-4xl font-bold text-[#ff4a14] mb-2">
                {status.smart_playlists.total}
              </div>
              <p className="text-sm text-gray-400">
                Last generated: {status.smart_playlists.latest_generation
                  ? new Date(status.smart_playlists.latest_generation).toLocaleString()
                  : 'Never'}
              </p>
              {status.smart_playlists.by_type && Object.keys(status.smart_playlists.by_type).length > 0 && (
                <div className="mt-4 space-y-2">
                  {Object.entries(status.smart_playlists.by_type).map(([type, count]) => (
                    <div key={type} className="flex justify-between text-sm">
                      <span className="text-gray-400 capitalize">{type.replace(/_/g, ' ')}</span>
                      <span className="text-white font-semibold">{count as number}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Background Tasks */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">Background Tasks</h3>
              <div className="text-4xl font-bold text-blue-400 mb-2">
                {status.background_tasks.total}
              </div>
              <p className="text-sm text-gray-400 mb-4">Total tasks</p>
              {status.background_tasks.by_status && Object.keys(status.background_tasks.by_status).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(status.background_tasks.by_status).map(([statusKey, count]) => (
                    <div key={statusKey} className="flex justify-between text-sm">
                      <span className="text-gray-400 capitalize">{statusKey}</span>
                      <span className={`font-semibold ${
                        statusKey === 'completed' ? 'text-green-400' :
                        statusKey === 'failed' ? 'text-red-400' :
                        statusKey === 'pending' ? 'text-yellow-400' :
                        'text-white'
                      }`}>{count as number}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Trending Tracks */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">Trending Tracks</h3>
              <div className="text-sm text-gray-400 mb-2">Last calculated</div>
              <p className="text-white">
                {status.trending_tracks.last_calculated
                  ? new Date(status.trending_tracks.last_calculated).toLocaleString()
                  : 'Never'}
              </p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
