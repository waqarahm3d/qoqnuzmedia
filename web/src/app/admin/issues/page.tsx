'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase-client';

interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  resolution_comment: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  user: {
    id: string;
    full_name: string;
    email: string;
  };
  comments: any[];
}

export default function AdminIssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Modal state
  const [newStatus, setNewStatus] = useState('');
  const [resolutionComment, setResolutionComment] = useState('');
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Stats
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchIssues();
    fetchStats();
  }, [filterStatus, filterCategory, filterPriority]);

  const fetchIssues = async () => {
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      let url = '/api/admin/issues?';
      if (filterStatus) url += `status=${filterStatus}&`;
      if (filterCategory) url += `category=${filterCategory}&`;
      if (filterPriority) url += `priority=${filterPriority}&`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();
      setIssues(result.issues || []);
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/issues/stats', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();
      setStats(result.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const openIssueModal = async (issue: Issue) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch full issue details with comments
      const response = await fetch(`/api/admin/issues/${issue.id}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();
      setSelectedIssue(result.issue);
      setNewStatus(result.issue.status);
      setResolutionComment(result.issue.resolution_comment || '');
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching issue details:', error);
    }
  };

  const handleUpdateIssue = async () => {
    if (!selectedIssue) return;

    if (newStatus === 'resolved' && !resolutionComment.trim()) {
      setMessage({ type: 'error', text: 'Please provide a resolution comment' });
      return;
    }

    setUpdating(true);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`/api/admin/issues/${selectedIssue.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          resolution_comment: newStatus === 'resolved' ? resolutionComment : undefined,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Issue updated successfully! Email sent to user.' });
        setTimeout(() => {
          setShowModal(false);
          setSelectedIssue(null);
          fetchIssues();
          fetchStats();
        }, 2000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update issue' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#3b82f6';
      case 'in_progress': return '#f59e0b';
      case 'resolved': return '#22c55e';
      case 'closed': return '#6b7280';
      case 'wont_fix': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#6b7280';
      case 'medium': return '#3b82f6';
      case 'high': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <AdminLayout>
      <div style={{ padding: '0' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
            Issue Management
          </h1>
          <p style={{ color: '#b3b3b3' }}>
            Manage user feedback, bug reports, and feature requests
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <div style={{ background: '#181818', borderRadius: '12px', padding: '20px' }}>
              <p style={{ color: '#b3b3b3', fontSize: '14px', marginBottom: '8px' }}>Total Issues</p>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff' }}>{stats.total_issues || 0}</p>
            </div>
            <div style={{ background: '#181818', borderRadius: '12px', padding: '20px' }}>
              <p style={{ color: '#b3b3b3', fontSize: '14px', marginBottom: '8px' }}>Open</p>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>{stats.open_issues || 0}</p>
            </div>
            <div style={{ background: '#181818', borderRadius: '12px', padding: '20px' }}>
              <p style={{ color: '#b3b3b3', fontSize: '14px', marginBottom: '8px' }}>In Progress</p>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>{stats.in_progress_issues || 0}</p>
            </div>
            <div style={{ background: '#181818', borderRadius: '12px', padding: '20px' }}>
              <p style={{ color: '#b3b3b3', fontSize: '14px', marginBottom: '8px' }}>Resolved</p>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#22c55e' }}>{stats.resolved_issues || 0}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ background: '#181818', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#121212',
                  color: '#ffffff',
                  border: '1px solid #282828',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                }}
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
                <option value="wont_fix">Won't Fix</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#121212',
                  color: '#ffffff',
                  border: '1px solid #282828',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                }}
              >
                <option value="">All Categories</option>
                <option value="bug">Bug</option>
                <option value="feature_request">Feature Request</option>
                <option value="improvement">Improvement</option>
                <option value="question">Question</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                Priority
              </label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#121212',
                  color: '#ffffff',
                  border: '1px solid #282828',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                }}
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={() => {
                  setFilterStatus('');
                  setFilterCategory('');
                  setFilterPriority('');
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#282828',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Issues List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <p style={{ color: '#b3b3b3' }}>Loading issues...</p>
          </div>
        ) : issues.length === 0 ? (
          <div style={{ background: '#181818', borderRadius: '12px', padding: '60px 24px', textAlign: 'center' }}>
            <p style={{ color: '#b3b3b3', fontSize: '16px' }}>
              No issues found with the current filters.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {issues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => openIssueModal(issue)}
                style={{
                  background: '#181818',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#202020'}
                onMouseOut={(e) => e.currentTarget.style.background = '#181818'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
                        {issue.title}
                      </h3>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: `${getStatusColor(issue.status)}20`,
                          color: getStatusColor(issue.status),
                        }}
                      >
                        {issue.status.replace('_', ' ')}
                      </span>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: `${getPriorityColor(issue.priority)}20`,
                          color: getPriorityColor(issue.priority),
                        }}
                      >
                        {issue.priority}
                      </span>
                    </div>
                    <p style={{ color: '#b3b3b3', fontSize: '14px', margin: 0 }}>
                      {issue.category.replace('_', ' ')} • Reported by {issue.user?.full_name || 'Unknown'} ({issue.user?.email})
                    </p>
                  </div>
                  <span style={{ color: '#666666', fontSize: '14px' }}>
                    {new Date(issue.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Issue Details Modal */}
        {showModal && selectedIssue && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px',
            }}
            onClick={() => setShowModal(false)}
          >
            <div
              style={{
                background: '#181818',
                borderRadius: '12px',
                maxWidth: '800px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                padding: '32px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
                  {selectedIssue.title}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#b3b3b3',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '0',
                    width: '32px',
                    height: '32px',
                  }}
                >
                  ×
                </button>
              </div>

              {message && (
                <div
                  style={{
                    padding: '12px 16px',
                    marginBottom: '20px',
                    borderRadius: '8px',
                    backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${message.type === 'success' ? '#22c55e' : '#ef4444'}`,
                    color: message.type === 'success' ? '#22c55e' : '#fca5a5',
                  }}
                >
                  {message.text}
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <p style={{ color: '#b3b3b3', fontSize: '14px', marginBottom: '4px' }}>
                  Reported by: {selectedIssue.user?.full_name} ({selectedIssue.user?.email})
                </p>
                <p style={{ color: '#b3b3b3', fontSize: '14px' }}>
                  Date: {new Date(selectedIssue.created_at).toLocaleString()}
                </p>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
                  Description
                </h3>
                <p style={{ color: '#e0e0e0', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                  {selectedIssue.description}
                </p>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', marginBottom: '12px' }}>
                  Update Status
                </h3>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#121212',
                    color: '#ffffff',
                    border: '1px solid #282828',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    marginBottom: '16px',
                  }}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                  <option value="wont_fix">Won't Fix</option>
                </select>

                {newStatus === 'resolved' && (
                  <div>
                    <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                      Resolution Comment (will be emailed to user) *
                    </label>
                    <textarea
                      value={resolutionComment}
                      onChange={(e) => setResolutionComment(e.target.value)}
                      placeholder="Explain how the issue was resolved..."
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: '#121212',
                        color: '#ffffff',
                        border: '1px solid #282828',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'vertical',
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '12px 24px',
                    background: '#282828',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateIssue}
                  disabled={updating}
                  style={{
                    padding: '12px 24px',
                    background: updating ? '#282828' : '#ff4a14',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: updating ? 'not-allowed' : 'pointer',
                    opacity: updating ? 0.6 : 1,
                  }}
                >
                  {updating ? 'Updating...' : 'Update Issue'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
