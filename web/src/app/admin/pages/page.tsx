'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase-client';
import 'react-quill/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface CustomPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_description: string | null;
  is_published: boolean;
  display_in_footer: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export default function PagesManagementPage() {
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPage, setEditingPage] = useState<CustomPage | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    meta_description: '',
    is_published: false,
    display_in_footer: true,
    display_order: 0,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/pages', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPages(data.pages || []);
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingPage(null);
    setFormData({
      title: '',
      slug: '',
      content: '',
      meta_description: '',
      is_published: false,
      display_in_footer: true,
      display_order: pages.length,
    });
    setShowEditor(true);
  };

  const handleEdit = (page: CustomPage) => {
    setEditingPage(page);
    setFormData({
      title: page.title,
      slug: page.slug,
      content: page.content,
      meta_description: page.meta_description || '',
      is_published: page.is_published,
      display_in_footer: page.display_in_footer,
      display_order: page.display_order,
    });
    setShowEditor(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessage({ type: 'error', text: 'Not authenticated' });
        return;
      }

      // Auto-generate slug from title if empty
      const slug = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const method = editingPage ? 'PATCH' : 'POST';
      const url = editingPage ? `/api/admin/pages/${editingPage.id}` : '/api/admin/pages';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ ...formData, slug }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save page');
      }

      setMessage({ type: 'success', text: `Page ${editingPage ? 'updated' : 'created'} successfully!` });
      setShowEditor(false);
      fetchPages();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/pages/${pageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Page deleted successfully' });
        fetchPages();
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error deleting page:', error);
    }
  };

  const togglePublish = async (page: CustomPage) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/pages/${page.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ is_published: !page.is_published }),
      });

      if (response.ok) {
        fetchPages();
      }
    } catch (error) {
      console.error('Error toggling publish status:', error);
    }
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean'],
      [{ 'color': [] }, { 'background': [] }],
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent', 'link', 'image', 'align', 'color', 'background'
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
          <div style={{ color: '#b3b3b3' }}>Loading pages...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
            Pages Management
          </h1>
          <p style={{ color: '#b3b3b3' }}>
            Create and manage custom pages like Privacy Policy, Terms of Service, About, etc.
          </p>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${message.type === 'success' ? '#22c55e' : '#ef4444'}`,
            color: message.type === 'success' ? '#22c55e' : '#fca5a5',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
          }}>
            {message.text}
          </div>
        )}

        {/* Pages List */}
        {!showEditor && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ color: '#b3b3b3' }}>
                {pages.length} page{pages.length !== 1 ? 's' : ''}
              </div>
              <button
                onClick={handleCreateNew}
                style={{
                  padding: '12px 24px',
                  background: '#ff4a14',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + Create New Page
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pages.map((page) => (
                <div
                  key={page.id}
                  style={{
                    background: '#181818',
                    borderRadius: '12px',
                    padding: '24px',
                    border: '1px solid #282828',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
                          {page.title}
                        </h3>
                        <div style={{
                          padding: '4px 12px',
                          background: page.is_published ? 'rgba(34, 197, 94, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                          color: page.is_published ? '#22c55e' : '#6b7280',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}>
                          {page.is_published ? 'PUBLISHED' : 'DRAFT'}
                        </div>
                        {page.display_in_footer && (
                          <div style={{
                            padding: '4px 12px',
                            background: 'rgba(59, 130, 246, 0.2)',
                            color: '#60a5fa',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}>
                            IN FOOTER
                          </div>
                        )}
                      </div>
                      <div style={{ color: '#b3b3b3', fontSize: '14px', marginBottom: '8px' }}>
                        /{page.slug}
                      </div>
                      {page.meta_description && (
                        <div style={{ color: '#b3b3b3', fontSize: '13px' }}>
                          {page.meta_description}
                        </div>
                      )}
                      <div style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>
                        Order: {page.display_order} • Updated: {new Date(page.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEdit(page)}
                        style={{
                          padding: '8px 16px',
                          background: '#282828',
                          color: '#ffffff',
                          border: '1px solid #3f3f3f',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => togglePublish(page)}
                        style={{
                          padding: '8px 16px',
                          background: page.is_published ? 'rgba(107, 114, 128, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                          color: page.is_published ? '#9ca3af' : '#22c55e',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {page.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => handleDelete(page.id)}
                        style={{
                          padding: '8px 16px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {pages.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  background: '#181818',
                  borderRadius: '12px',
                  border: '1px solid #282828',
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                  <div style={{ color: '#b3b3b3', marginBottom: '16px' }}>
                    No custom pages yet
                  </div>
                  <button
                    onClick={handleCreateNew}
                    style={{
                      padding: '12px 24px',
                      background: '#ff4a14',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Create Your First Page
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Editor */}
        {showEditor && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <button
                onClick={() => setShowEditor(false)}
                style={{
                  padding: '8px 16px',
                  background: '#282828',
                  color: '#ffffff',
                  border: '1px solid #3f3f3f',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                ← Back to Pages
              </button>
            </div>

            <div style={{ background: '#181818', borderRadius: '12px', padding: '24px', border: '1px solid #282828' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', marginBottom: '24px' }}>
                {editingPage ? 'Edit Page' : 'Create New Page'}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Title */}
                <div>
                  <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                    Page Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Privacy Policy"
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

                {/* Slug */}
                <div>
                  <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                    URL Slug (leave empty to auto-generate)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#666' }}>/</span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      placeholder="privacy-policy"
                      style={{
                        flex: 1,
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
                  <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                    Only lowercase letters, numbers, and hyphens allowed
                  </div>
                </div>

                {/* Meta Description */}
                <div>
                  <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                    Meta Description (for SEO)
                  </label>
                  <textarea
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    placeholder="A brief description for search engines"
                    rows={2}
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

                {/* Content Editor */}
                <div>
                  <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                    Content *
                  </label>
                  <div style={{ background: '#ffffff', borderRadius: '8px', minHeight: '400px' }}>
                    <ReactQuill
                      theme="snow"
                      value={formData.content}
                      onChange={(value) => setFormData({ ...formData, content: value })}
                      modules={quillModules}
                      formats={quillFormats}
                      style={{ height: '350px', marginBottom: '42px' }}
                    />
                  </div>
                </div>

                {/* Settings */}
                <div style={{ display: 'flex', gap: '32px', paddingTop: '16px', borderTop: '1px solid #282828' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      id="is_published"
                      checked={formData.is_published}
                      onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="is_published" style={{ color: '#ffffff', cursor: 'pointer' }}>
                      Published (visible to users)
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      id="display_in_footer"
                      checked={formData.display_in_footer}
                      onChange={(e) => setFormData({ ...formData, display_in_footer: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="display_in_footer" style={{ color: '#ffffff', cursor: 'pointer' }}>
                      Show in footer
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label htmlFor="display_order" style={{ color: '#ffffff' }}>
                      Display Order:
                    </label>
                    <input
                      type="number"
                      id="display_order"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                      min="0"
                      style={{
                        width: '80px',
                        padding: '8px 12px',
                        background: '#121212',
                        color: '#ffffff',
                        border: '1px solid #282828',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px' }}>
                  <button
                    onClick={() => setShowEditor(false)}
                    disabled={saving}
                    style={{
                      padding: '12px 24px',
                      background: '#282828',
                      color: '#ffffff',
                      border: '1px solid #3f3f3f',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: saving ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !formData.title || !formData.content}
                    style={{
                      padding: '12px 32px',
                      background: (saving || !formData.title || !formData.content) ? '#282828' : '#ff4a14',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: (saving || !formData.title || !formData.content) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {saving ? 'Saving...' : (editingPage ? 'Update Page' : 'Create Page')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
