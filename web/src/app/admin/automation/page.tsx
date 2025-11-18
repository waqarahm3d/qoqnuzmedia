'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase-client';

interface CronJob {
  jobid: number;
  jobname: string;
  schedule: string;
  active: boolean;
  database: string;
}

interface CronExecution {
  jobname: string;
  status: string;
  start_time: string;
  return_message: string;
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
  const [cronExecutions, setCronExecutions] = useState<CronExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [triggering, setTriggering] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchStatus();
    fetchCronExecutions();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchStatus();
      fetchCronExecutions();
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

  const fetchCronExecutions = async () => {
    // Note: Direct access to cron.job_run_details is not available via Supabase client
    // Execution history would need to be tracked in a custom table or via server-side API
    // For now, we rely on the cron job status from the main API endpoint
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
        const data = await response.json();
        setSuccessMessage(`✅ Successfully triggered: ${task}`);
        setTimeout(() => {
          fetchStatus();
          fetchCronExecutions();
        }, 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to trigger automation');
      }
    } catch (err: any) {
      setError(err.message);
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

  const healthStatus = getHealthStatus();

  if (loading && !status) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
          <div style={{ color: '#b3b3b3' }}>Loading automation status...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ padding: '0' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
              Automation Dashboard
            </h1>
            <p style={{ color: '#b3b3b3' }}>
              Monitor and control automated background processes
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#b3b3b3', fontSize: '14px' }}>
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Auto-refresh (30s)
              </label>
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid #22c55e',
            color: '#4ade80',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
          }}>
            {successMessage}
          </div>
        )}

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

        {/* System Health */}
        <div style={{ background: '#181818', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '16px' }}>
            System Health
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: healthStatus === 'healthy' ? 'rgba(34, 197, 94, 0.2)' :
                          healthStatus === 'warning' ? 'rgba(251, 191, 36, 0.2)' :
                          'rgba(239, 68, 68, 0.2)',
              border: `3px solid ${healthStatus === 'healthy' ? '#22c55e' :
                                   healthStatus === 'warning' ? '#fbbf24' :
                                   '#ef4444'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
            }}>
              {healthStatus === 'healthy' ? '✓' : healthStatus === 'warning' ? '⚠' : '✗'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
                {healthStatus === 'healthy' ? 'System Healthy' :
                 healthStatus === 'warning' ? 'Minor Issues Detected' :
                 'System Errors'}
              </div>
              <div style={{ color: '#b3b3b3', fontSize: '14px' }}>
                {healthStatus === 'healthy' && 'All automation systems running normally'}
                {healthStatus === 'warning' && 'Some automations may need attention'}
                {healthStatus === 'error' && 'Critical: Automation systems offline'}
              </div>
            </div>
          </div>
        </div>

        {/* Manual Triggers */}
        <div style={{ background: '#181818', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '16px' }}>
            Manual Triggers
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <button
              onClick={() => triggerAutomation('all')}
              disabled={triggering}
              style={{
                padding: '16px',
                background: triggering ? '#282828' : 'linear-gradient(135deg, #ff4a14 0%, #ff5c2e 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: triggering ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(255, 74, 20, 0.3)',
              }}
            >
              🚀 Trigger All Automations
            </button>
            <button
              onClick={() => triggerAutomation('smart_playlists')}
              disabled={triggering}
              style={{
                padding: '16px',
                background: triggering ? '#282828' : '#4a90e2',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: triggering ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              🎵 Generate Smart Playlists
            </button>
            <button
              onClick={() => triggerAutomation('trending')}
              disabled={triggering}
              style={{
                padding: '16px',
                background: triggering ? '#282828' : '#e24a90',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: triggering ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              📈 Calculate Trending
            </button>
            <button
              onClick={() => triggerAutomation('listening_stats')}
              disabled={triggering}
              style={{
                padding: '16px',
                background: triggering ? '#282828' : '#90e24a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: triggering ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              📊 Aggregate Listening Stats
            </button>
          </div>
        </div>

        {status && (
          <>
            {/* Cron Jobs Status */}
            <div style={{ background: '#181818', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '16px' }}>
                Scheduled Cron Jobs
              </h2>
              {status.cron_jobs && status.cron_jobs.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #282828' }}>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#b3b3b3', fontSize: '14px' }}>Job Name</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#b3b3b3', fontSize: '14px' }}>Schedule (Cron)</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#b3b3b3', fontSize: '14px' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#b3b3b3', fontSize: '14px' }}>Next Run</th>
                      </tr>
                    </thead>
                    <tbody>
                      {status.cron_jobs.map((job: CronJob, index: number) => {
                        const scheduleDesc = getCronDescription(job.schedule);
                        return (
                          <tr key={index} style={{ borderBottom: '1px solid #282828' }}>
                            <td style={{ padding: '12px', color: '#ffffff', fontWeight: 500 }}>{job.jobname}</td>
                            <td style={{ padding: '12px', color: '#b3b3b3', fontFamily: 'monospace', fontSize: '13px' }}>
                              <div>{job.schedule}</div>
                              <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>{scheduleDesc}</div>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                background: job.active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                color: job.active ? '#4ade80' : '#fca5a5',
                              }}>
                                {job.active ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </td>
                            <td style={{ padding: '12px', color: '#b3b3b3', fontSize: '13px' }}>
                              {getNextRunTime(job.schedule)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#b3b3b3' }}>
                  ⚠️ No cron jobs found. Please run the automation migration.
                </div>
              )}
            </div>

            {/* Execution History */}
            {cronExecutions.length > 0 && (
              <div style={{ background: '#181818', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '16px' }}>
                  Recent Executions
                </h2>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #282828' }}>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#b3b3b3', fontSize: '14px' }}>Job</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#b3b3b3', fontSize: '14px' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#b3b3b3', fontSize: '14px' }}>Started</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#b3b3b3', fontSize: '14px' }}>Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cronExecutions.slice(0, 10).map((exec: any, index: number) => (
                        <tr key={index} style={{ borderBottom: '1px solid #282828' }}>
                          <td style={{ padding: '12px', color: '#ffffff' }}>{exec.jobname}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 600,
                              background: exec.status === 'succeeded' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                              color: exec.status === 'succeeded' ? '#4ade80' : '#fca5a5',
                            }}>
                              {exec.status.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: '#b3b3b3', fontSize: '13px' }}>
                            {new Date(exec.start_time).toLocaleString()}
                          </td>
                          <td style={{ padding: '12px', color: '#b3b3b3', fontSize: '13px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {exec.return_message || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Smart Playlists Status */}
            <div style={{ background: '#181818', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '16px' }}>
                Smart Playlists
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div style={{ padding: '16px', background: '#121212', borderRadius: '8px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff4a14', marginBottom: '8px' }}>
                    {status.smart_playlists.total}
                  </div>
                  <div style={{ color: '#b3b3b3', fontSize: '14px' }}>Total Playlists</div>
                </div>
                {Object.entries(status.smart_playlists.by_type || {}).map(([type, count]) => (
                  <div key={type} style={{ padding: '16px', background: '#121212', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
                      {count as number}
                    </div>
                    <div style={{ color: '#b3b3b3', fontSize: '12px', textTransform: 'capitalize' }}>
                      {type.replace(/_/g, ' ')}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ color: '#b3b3b3', fontSize: '14px' }}>
                Last generated: {status.smart_playlists.latest_generation
                  ? new Date(status.smart_playlists.latest_generation).toLocaleString()
                  : 'Never'}
              </div>
            </div>

            {/* Background Tasks Status */}
            <div style={{ background: '#181818', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '16px' }}>
                Background Tasks Queue
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '16px', background: '#121212', borderRadius: '8px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff4a14', marginBottom: '8px' }}>
                    {status.background_tasks.total}
                  </div>
                  <div style={{ color: '#b3b3b3', fontSize: '14px' }}>Total Tasks</div>
                </div>
                {Object.entries(status.background_tasks.by_status || {}).map(([statusName, count]) => (
                  <div key={statusName} style={{ padding: '16px', background: '#121212', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
                      {count as number}
                    </div>
                    <div style={{ color: '#b3b3b3', fontSize: '12px', textTransform: 'capitalize' }}>
                      {statusName}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Tracks Status */}
            <div style={{ background: '#181818', borderRadius: '12px', padding: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '16px' }}>
                Trending Tracks
              </h2>
              <div style={{ color: '#b3b3b3', fontSize: '14px' }}>
                Last calculated: {status.trending_tracks.last_calculated
                  ? new Date(status.trending_tracks.last_calculated).toLocaleString()
                  : 'Never'}
              </div>
            </div>
          </>
        )}

        {/* Refresh Button */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            onClick={() => {
              fetchStatus();
              fetchCronExecutions();
            }}
            disabled={loading}
            style={{
              padding: '12px 32px',
              background: loading ? '#282828' : '#333333',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              if (!loading) e.currentTarget.style.background = '#444444';
            }}
            onMouseOut={(e) => {
              if (!loading) e.currentTarget.style.background = '#333333';
            }}
          >
            {loading ? 'Refreshing...' : '🔄 Refresh Status'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

// Helper function to describe cron schedule
function getCronDescription(schedule: string): string {
  const patterns: Record<string, string> = {
    '0 2 * * *': 'Daily at 2:00 AM',
    '0 3 * * *': 'Daily at 3:00 AM',
    '0 */6 * * *': 'Every 6 hours',
    '0 4 * * 0': 'Sundays at 4:00 AM',
    '0 5 * * *': 'Daily at 5:00 AM',
  };

  return patterns[schedule] || 'Custom schedule';
}

// Helper function to calculate next run time (simplified)
function getNextRunTime(schedule: string): string {
  // This is a simplified version - in production, use a proper cron parser
  const now = new Date();
  const patterns: Record<string, string> = {
    '0 2 * * *': getNextTime(2, 0),
    '0 3 * * *': getNextTime(3, 0),
    '0 */6 * * *': 'Every 6 hours',
    '0 4 * * 0': getNextSunday(4, 0),
    '0 5 * * *': getNextTime(5, 0),
  };

  return patterns[schedule] || 'See schedule';
}

function getNextTime(hour: number, minute: number): string {
  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next.toLocaleString();
}

function getNextSunday(hour: number, minute: number): string {
  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);

  // Get next Sunday
  const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
  next.setDate(now.getDate() + daysUntilSunday);

  return next.toLocaleString();
}
