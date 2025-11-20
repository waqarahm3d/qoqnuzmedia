'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase-client';
import { SignupPrompt } from '@/components/ui/SignupPrompt';

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
}

export default function FeedbackPage() {
  const { user } = useAuth();
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [activeTab, setActiveTab] = useState<'submit' | 'my-issues'>('submit');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('bug');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Issues list state
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  useEffect(() => {
    if (user && activeTab === 'my-issues') {
      fetchIssues();
    }
  }, [user, activeTab]);

  const fetchIssues = async () => {
    setLoadingIssues(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/issues', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();
      setIssues(result.issues || []);
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoadingIssues(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setShowSignupPrompt(true);
      return;
    }

    if (!title || !description) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title,
          description,
          category,
          priority: 'medium',
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Issue submitted successfully! We\'ll review it soon.' });
        setTitle('');
        setDescription('');
        setCategory('bug');
        setTimeout(() => {
          setActiveTab('my-issues');
          fetchIssues();
        }, 2000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to submit issue' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return '#3b82f6';
      case 'in_progress':
        return '#f59e0b';
      case 'resolved':
        return '#22c55e';
      case 'closed':
        return '#6b7280';
      case 'wont_fix':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Open';
      case 'in_progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Closed';
      case 'wont_fix':
        return "Won't Fix";
      default:
        return status;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'bug':
        return '🐛 Bug Report';
      case 'feature_request':
        return '✨ Feature Request';
      case 'improvement':
        return '📈 Improvement';
      case 'question':
        return '❓ Question';
      case 'other':
        return '💬 Other';
      default:
        return category;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Feedback & Support</h1>
          <p className="text-gray-400">
            Report issues, request features, or ask questions. We're here to help!
          </p>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className="mb-6 p-4 rounded-lg"
            style={{
              backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${message.type === 'success' ? '#22c55e' : '#ef4444'}`,
              color: message.type === 'success' ? '#22c55e' : '#fca5a5',
            }}
          >
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-700 mb-8">
          <button
            onClick={() => setActiveTab('submit')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'submit'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Submit Issue
          </button>
          <button
            onClick={() => setActiveTab('my-issues')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'my-issues'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            My Issues
          </button>
        </div>

        {/* Submit Tab */}
        {activeTab === 'submit' && (
          <div className="bg-gray-800 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-6">Submit a New Issue</h2>

            {!user && (
              <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
                <p className="text-yellow-200">
                  <strong>Note:</strong> You need to be signed in to submit an issue.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white font-semibold mb-2">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary"
                  required
                >
                  <option value="bug">🐛 Bug Report</option>
                  <option value="feature_request">✨ Feature Request</option>
                  <option value="improvement">📈 Improvement</option>
                  <option value="question">❓ Question</option>
                  <option value="other">💬 Other</option>
                </select>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief description of the issue"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide detailed information about the issue..."
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary resize-none"
                  required
                />
                <p className="mt-2 text-sm text-gray-400">
                  Include steps to reproduce, expected behavior, and any error messages.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting || !user}
                className="w-full px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Issue'}
              </button>
            </form>
          </div>
        )}

        {/* My Issues Tab */}
        {activeTab === 'my-issues' && (
          <div>
            {!user ? (
              <div className="bg-gray-800 rounded-xl p-8 text-center">
                <p className="text-gray-400 mb-4">
                  Please sign in to view your submitted issues.
                </p>
                <button
                  onClick={() => setShowSignupPrompt(true)}
                  className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors"
                >
                  Sign In
                </button>
              </div>
            ) : loadingIssues ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                <p className="mt-4 text-gray-400">Loading your issues...</p>
              </div>
            ) : issues.length === 0 ? (
              <div className="bg-gray-800 rounded-xl p-8 text-center">
                <p className="text-gray-400">
                  You haven't submitted any issues yet.
                </p>
                <button
                  onClick={() => setActiveTab('submit')}
                  className="mt-4 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors"
                >
                  Submit Your First Issue
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-colors cursor-pointer"
                    onClick={() => setSelectedIssue(selectedIssue?.id === issue.id ? null : issue)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{issue.title}</h3>
                          <span
                            className="px-3 py-1 text-xs font-semibold rounded-full"
                            style={{
                              backgroundColor: `${getStatusColor(issue.status)}20`,
                              color: getStatusColor(issue.status),
                            }}
                          >
                            {getStatusLabel(issue.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">{getCategoryLabel(issue.category)}</p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(issue.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {selectedIssue?.id === issue.id && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <h4 className="font-semibold mb-2">Description:</h4>
                        <p className="text-gray-300 whitespace-pre-wrap mb-4">{issue.description}</p>

                        {issue.status === 'resolved' && issue.resolution_comment && (
                          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                            <h4 className="font-semibold text-green-400 mb-2">✓ Resolution:</h4>
                            <p className="text-gray-300 whitespace-pre-wrap">{issue.resolution_comment}</p>
                            {issue.resolved_at && (
                              <p className="text-sm text-gray-500 mt-2">
                                Resolved on {new Date(issue.resolved_at).toLocaleString()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Signup Prompt Modal */}
        <SignupPrompt
          isOpen={showSignupPrompt}
          onClose={() => setShowSignupPrompt(false)}
          action="submit feedback and track your issues"
        />
      </div>
    </div>
  );
}
