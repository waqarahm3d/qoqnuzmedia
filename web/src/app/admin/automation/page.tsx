'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase-client';

interface AutomationStatus {
  cron_jobs: any[];
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

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/automation/trigger', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data.automation_status);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch automation status');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerAutomation = async (task: string) => {
    try {
      setTriggering(true);
      setSuccessMessage('');
      setError('');

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/automation/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ task }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(`Successfully triggered: ${task}`);
        // Refresh status after trigger
        setTimeout(fetchStatus, 2000);
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

  if (loading) {
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
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
            Automation Dashboard
          </h1>
          <p style={{ color: '#b3b3b3' }}>
            Monitor and control automated background processes
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div style={{
            background: 'rgba(255, 74, 20, 0.1)',
            border: '1px solid #ff4a14',
            color: '#ff5c2e',
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
                background: triggering ? '#282828' : '#ff4a14',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: triggering ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
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
                        <th style={{ padding: '12px', textAlign: 'left', color: '#b3b3b3', fontSize: '14px' }}>Schedule</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#b3b3b3', fontSize: '14px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {status.cron_jobs.map((job: any, index: number) => (
                        <tr key={index} style={{ borderBottom: '1px solid #282828' }}>
                          <td style={{ padding: '12px', color: '#ffffff' }}>{job.jobname}</td>
                          <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'monospace' }}>{job.schedule}</td>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#b3b3b3' }}>
                  ⚠️ No cron jobs found. Please run the automation migration.
                </div>
              )}
            </div>

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
            onClick={fetchStatus}
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
