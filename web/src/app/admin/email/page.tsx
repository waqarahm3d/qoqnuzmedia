'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase-client';

export default function EmailPage() {
  const [activeTab, setActiveTab] = useState<'compose' | 'campaigns' | 'logs'>('compose');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [deletingCampaign, setDeletingCampaign] = useState<string | null>(null);
  const [clearingLogs, setClearingLogs] = useState(false);

  useEffect(() => {
    if (activeTab === 'campaigns') {
      fetchCampaigns();
    } else if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab]);

  const testSMTP = async () => {
    setTesting(true);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('/api/admin/email/test-smtp', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setSmtpStatus('connected');
        setMessage({ type: 'success', text: result.message });
      } else {
        setSmtpStatus('error');
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error: any) {
      setSmtpStatus('error');
      setMessage({ type: 'error', text: error.message });
    } finally {
      setTesting(false);
    }
  };

  const sendBulkEmail = async () => {
    if (!subject || !content) {
      setMessage({ type: 'error', text: 'Subject and content are required' });
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('/api/admin/email/send-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          subject,
          html: content,
          campaignName: campaignName || `Campaign - ${new Date().toLocaleDateString()}`,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `Email campaign started! Sending to ${result.totalRecipients} recipients.`,
        });
        setSubject('');
        setContent('');
        setCampaignName('');
        setTimeout(() => setActiveTab('campaigns'), 2000);
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSending(false);
    }
  };

  const fetchCampaigns = async () => {
    setLoadingCampaigns(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('/api/admin/email/campaigns', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();
      setCampaigns(result.campaigns || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('/api/admin/email/logs', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();
      setLogs(result.logs || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }

    setDeletingCampaign(campaignId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`/api/admin/email/campaigns?id=${campaignId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Campaign deleted successfully' });
        fetchCampaigns(); // Refresh the list
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete campaign' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setDeletingCampaign(null);
    }
  };

  const clearAllLogs = async () => {
    if (!confirm('Are you sure you want to clear ALL email logs? This action cannot be undone.')) {
      return;
    }

    setClearingLogs(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('/api/admin/email/logs', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: result.message || 'Logs cleared successfully' });
        fetchLogs(); // Refresh the list
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to clear logs' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setClearingLogs(false);
    }
  };

  return (
    <AdminLayout>
      <div style={{ padding: '0' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
                Email Management
              </h1>
              <p style={{ color: '#b3b3b3' }}>
                Send announcements, newsletters, and view email campaigns
              </p>
            </div>
            <button
              onClick={testSMTP}
              disabled={testing}
              style={{
                padding: '10px 20px',
                background: smtpStatus === 'connected' ? '#22c55e' : '#ff4a14',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: testing ? 'not-allowed' : 'pointer',
                opacity: testing ? 0.6 : 1,
              }}
            >
              {testing ? 'Testing...' : smtpStatus === 'connected' ? '✓ Connected' : 'Test SMTP'}
            </button>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            style={{
              padding: '16px',
              marginBottom: '24px',
              borderRadius: '8px',
              backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${message.type === 'success' ? '#22c55e' : '#ef4444'}`,
              color: message.type === 'success' ? '#22c55e' : '#fca5a5',
            }}
          >
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #282828', marginBottom: '32px' }}>
          {(['compose', 'campaigns', 'logs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 24px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #ff4a14' : '2px solid transparent',
                color: activeTab === tab ? '#ffffff' : '#b3b3b3',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Compose Tab */}
        {activeTab === 'compose' && (
          <div style={{ maxWidth: '800px' }}>
            <div style={{ background: '#181818', borderRadius: '12px', padding: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>
                Compose Bulk Email
              </h2>
              <p style={{ color: '#b3b3b3', marginBottom: '24px' }}>
                Send an email to all registered users. Use this for announcements, new features, or marketing campaigns.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g., New Feature Announcement"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#121212',
                      color: '#ffffff',
                      border: '1px solid #282828',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject line"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#121212',
                      color: '#ffffff',
                      border: '1px solid #282828',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                    Email Content (HTML) *
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="<p>Your email content here...</p>"
                    required
                    rows={12}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#121212',
                      color: '#ffffff',
                      border: '1px solid #282828',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      fontFamily: 'monospace',
                      resize: 'vertical',
                    }}
                  />
                  <p style={{ color: '#666666', fontSize: '12px', marginTop: '8px' }}>
                    You can use HTML tags for formatting. The email will be wrapped in a responsive template automatically.
                  </p>
                </div>

                <button
                  onClick={sendBulkEmail}
                  disabled={sending || !subject || !content}
                  style={{
                    padding: '14px 28px',
                    background: sending || !subject || !content ? '#282828' : '#ff4a14',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: sending || !subject || !content ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {sending ? 'Sending...' : 'Send to All Users'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
                Email Campaigns
              </h2>
              <button
                onClick={fetchCampaigns}
                disabled={loadingCampaigns}
                style={{
                  padding: '10px 20px',
                  background: '#282828',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: loadingCampaigns ? 'not-allowed' : 'pointer',
                }}
              >
                {loadingCampaigns ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {campaigns.length === 0 ? (
              <div style={{ background: '#181818', borderRadius: '12px', padding: '60px 24px', textAlign: 'center' }}>
                <p style={{ color: '#b3b3b3', fontSize: '16px' }}>
                  No email campaigns yet. Start by composing your first email!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {campaigns.map((campaign) => (
                  <div key={campaign.id} style={{ background: '#181818', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
                          {campaign.name}
                        </h3>
                        <p style={{ color: '#b3b3b3', fontSize: '14px' }}>{campaign.subject}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background:
                              campaign.status === 'sent'
                                ? 'rgba(34, 197, 94, 0.2)'
                                : campaign.status === 'sending'
                                ? 'rgba(59, 130, 246, 0.2)'
                                : campaign.status === 'failed'
                                ? 'rgba(239, 68, 68, 0.2)'
                                : 'rgba(107, 114, 128, 0.2)',
                            color:
                              campaign.status === 'sent'
                                ? '#22c55e'
                                : campaign.status === 'sending'
                                ? '#3b82f6'
                                : campaign.status === 'failed'
                                ? '#ef4444'
                                : '#6b7280',
                          }}
                        >
                          {campaign.status}
                        </span>
                        <button
                          onClick={() => deleteCampaign(campaign.id)}
                          disabled={deletingCampaign === campaign.id}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: deletingCampaign === campaign.id ? 'not-allowed' : 'pointer',
                            opacity: deletingCampaign === campaign.id ? 0.6 : 1,
                          }}
                        >
                          {deletingCampaign === campaign.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#b3b3b3' }}>
                      <span>Recipients: {campaign.total_recipients}</span>
                      <span>Sent: {campaign.sent_count}</span>
                      <span>Failed: {campaign.failed_count}</span>
                      <span>Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
                Email Logs
              </h2>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={clearAllLogs}
                  disabled={clearingLogs || logs.length === 0}
                  style={{
                    padding: '10px 20px',
                    background: clearingLogs || logs.length === 0 ? '#282828' : 'rgba(239, 68, 68, 0.1)',
                    color: clearingLogs || logs.length === 0 ? '#666666' : '#ef4444',
                    border: clearingLogs || logs.length === 0 ? 'none' : '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: clearingLogs || logs.length === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {clearingLogs ? 'Clearing...' : 'Clear All Logs'}
                </button>
                <button
                  onClick={fetchLogs}
                  disabled={loadingLogs}
                  style={{
                    padding: '10px 20px',
                    background: '#282828',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: loadingLogs ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loadingLogs ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>

            {logs.length === 0 ? (
              <div style={{ background: '#181818', borderRadius: '12px', padding: '60px 24px', textAlign: 'center' }}>
                <p style={{ color: '#b3b3b3', fontSize: '16px' }}>
                  No email logs yet.
                </p>
              </div>
            ) : (
              <div style={{ background: '#181818', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#121212' }}>
                    <tr>
                      <th style={{ padding: '16px', textAlign: 'left', color: '#b3b3b3', fontWeight: 600, fontSize: '14px' }}>
                        Recipient
                      </th>
                      <th style={{ padding: '16px', textAlign: 'left', color: '#b3b3b3', fontWeight: 600, fontSize: '14px' }}>
                        Subject
                      </th>
                      <th style={{ padding: '16px', textAlign: 'left', color: '#b3b3b3', fontWeight: 600, fontSize: '14px' }}>
                        Status
                      </th>
                      <th style={{ padding: '16px', textAlign: 'left', color: '#b3b3b3', fontWeight: 600, fontSize: '14px' }}>
                        Sent At
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} style={{ borderTop: '1px solid #282828' }}>
                        <td style={{ padding: '16px', color: '#ffffff', fontSize: '14px' }}>
                          {log.recipient_email}
                        </td>
                        <td style={{ padding: '16px', color: '#ffffff', fontSize: '14px' }}>
                          {log.subject}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                              background: log.status === 'sent' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                              color: log.status === 'sent' ? '#22c55e' : '#ef4444',
                            }}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px', color: '#b3b3b3', fontSize: '14px' }}>
                          {new Date(log.sent_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
