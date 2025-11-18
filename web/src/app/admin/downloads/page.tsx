'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase-client';

interface DownloadJob {
  id: string;
  url: string;
  source_type: string;
  download_type: string;
  status: string;
  total_items: number;
  completed_items: number;
  failed_items: number;
  current_item: string | null;
  progress_percent: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  metadata: any;
}

export default function DownloadsPage() {
  const [jobs, setJobs] = useState<DownloadJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // New job form
  const [newJob, setNewJob] = useState({
    url: '',
    source_type: 'youtube',
    download_type: 'single',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchJobs();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('Not authenticated');
        return;
      }

      const params = new URLSearchParams({ page: '1', limit: '50' });
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/admin/downloads?${params}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch download jobs');
      }

      const data = await response.json();
      setJobs(data.jobs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitJob = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newJob.url) {
      alert('Please enter a URL');
      return;
    }

    try {
      setSubmitting(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('Not authenticated');
        return;
      }

      const response = await fetch('/api/admin/downloads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(newJob),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit job');
      }

      const data = await response.json();

      // Close modal and refresh
      setShowNewJobModal(false);
      setNewJob({ url: '', source_type: 'youtube', download_type: 'single' });
      fetchJobs();

      alert('Download job submitted successfully!');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to cancel this job?')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/downloads/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'cancel' }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel job');
      }

      fetchJobs();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/downloads/${jobId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete job');
      }

      fetchJobs();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-gray-500',
      queued: 'bg-blue-500',
      downloading: 'bg-yellow-500 animate-pulse',
      processing: 'bg-purple-500 animate-pulse',
      completed: 'bg-green-500',
      failed: 'bg-red-500',
      cancelled: 'bg-gray-700',
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded ${statusColors[status] || 'bg-gray-500'} text-white`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const getSourceIcon = (sourceType: string) => {
    return sourceType === 'youtube' ? '📺' : '🎵';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Audio Downloads</h1>
            <p className="text-gray-400 mt-1">
              Download and process audio from YouTube and SoundCloud
            </p>
          </div>
          <button
            onClick={() => setShowNewJobModal(true)}
            className="px-4 py-2 bg-[#ff4a14] hover:bg-[#ff5c2e] text-white rounded-lg font-medium transition-colors"
          >
            + New Download
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <label className="text-gray-400 text-sm">Filter by status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff4a14]"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="queued">Queued</option>
            <option value="downloading">Downloading</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={fetchJobs}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-200 px-4 py-3 rounded">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Jobs List */}
        {loading && jobs.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-4xl mb-4">⏳</div>
              <div className="text-gray-400">Loading download jobs...</div>
            </div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">📥</div>
            <h3 className="text-xl font-semibold text-white mb-2">No download jobs yet</h3>
            <p className="text-gray-400 mb-6">
              Start by creating a new download job from YouTube or SoundCloud
            </p>
            <button
              onClick={() => setShowNewJobModal(true)}
              className="px-6 py-3 bg-[#ff4a14] hover:bg-[#ff5c2e] text-white rounded-lg font-medium transition-colors"
            >
              Create Your First Download
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{getSourceIcon(job.source_type)}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {job.metadata?.title || 'Untitled'}
                        </h3>
                        <p className="text-sm text-gray-400 truncate max-w-2xl">
                          {job.url}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 mt-3">
                      {getStatusBadge(job.status)}
                      <span className="text-sm text-gray-400">
                        Type: <span className="text-white">{job.download_type}</span>
                      </span>
                      {job.total_items > 0 && (
                        <span className="text-sm text-gray-400">
                          Progress: <span className="text-white">{job.completed_items}/{job.total_items}</span>
                          {job.failed_items > 0 && <span className="text-red-400"> ({job.failed_items} failed)</span>}
                        </span>
                      )}
                      {job.progress_percent > 0 && (
                        <span className="text-sm text-gray-400">
                          <span className="text-[#ff5c2e]">{job.progress_percent.toFixed(1)}%</span>
                        </span>
                      )}
                    </div>

                    {job.current_item && (
                      <div className="mt-2 text-sm text-gray-400">
                        Current: <span className="text-white">{job.current_item}</span>
                      </div>
                    )}

                    {job.error_message && (
                      <div className="mt-2 text-sm text-red-400">
                        Error: {job.error_message}
                      </div>
                    )}

                    {job.progress_percent > 0 && job.progress_percent < 100 && (
                      <div className="mt-3">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-[#ff4a14] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${job.progress_percent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="mt-3 text-xs text-gray-500">
                      Created: {new Date(job.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {(job.status === 'downloading' || job.status === 'queued' || job.status === 'pending') && (
                      <button
                        onClick={() => handleCancelJob(job.id)}
                        className="px-3 py-1 bg-yellow-900/20 hover:bg-yellow-900/40 text-yellow-400 rounded transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="px-3 py-1 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New Job Modal */}
        {showNewJobModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
              <h2 className="text-2xl font-bold text-white mb-4">New Download Job</h2>

              <form onSubmit={handleSubmitJob} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    URL *
                  </label>
                  <input
                    type="url"
                    value={newJob.url}
                    onChange={(e) => setNewJob({ ...newJob, url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=... or https://soundcloud.com/..."
                    className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff4a14]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Source Type *
                  </label>
                  <select
                    value={newJob.source_type}
                    onChange={(e) => setNewJob({ ...newJob, source_type: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff4a14]"
                  >
                    <option value="youtube">📺 YouTube</option>
                    <option value="soundcloud">🎵 SoundCloud</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Download Type *
                  </label>
                  <select
                    value={newJob.download_type}
                    onChange={(e) => setNewJob({ ...newJob, download_type: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff4a14]"
                  >
                    <option value="single">Single Track/Video</option>
                    <option value="playlist">Playlist</option>
                    <option value="channel">Channel (YouTube)</option>
                    <option value="user">User (SoundCloud)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowNewJobModal(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#ff4a14] hover:bg-[#ff5c2e] text-white rounded-lg transition-colors disabled:opacity-50"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Download'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
