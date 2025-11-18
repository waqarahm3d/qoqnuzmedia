'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface FeaturedSection {
  id: string;
  title: string;
  description: string | null;
  section_type: 'tracks' | 'albums' | 'artists' | 'playlists';
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export default function FeaturedSectionsPage() {
  const router = useRouter();
  const [sections, setSections] = useState<FeaturedSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    section_type: 'tracks' as 'tracks' | 'albums' | 'artists' | 'playlists',
    is_active: true,
    display_order: 0,
  });

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const response = await fetch('/api/admin/featured-sections');
      if (response.ok) {
        const data = await response.json();
        setSections(data.sections || []);
      } else if (response.status === 403) {
        router.push('/home');
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/admin/featured-sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setFormData({
          title: '',
          description: '',
          section_type: 'tracks',
          is_active: true,
          display_order: 0,
        });
        fetchSections();
      } else {
        alert('Failed to create section');
      }
    } catch (error) {
      console.error('Error creating section:', error);
      alert('Error creating section');
    }
  };

  const handleToggleActive = async (sectionId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/featured-sections/${sectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        fetchSections();
      }
    } catch (error) {
      console.error('Error toggling section status:', error);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;

    try {
      const response = await fetch(`/api/admin/featured-sections/${sectionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchSections();
      }
    } catch (error) {
      console.error('Error deleting section:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Featured Sections</h1>
          <p className="text-gray-400 mt-1">Manage hyped sections like Spotify</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary text-black rounded-full font-semibold hover:bg-[#1ed760]"
        >
          Create Section
        </button>
      </div>

      {/* Sections List */}
      <div className="space-y-4">
        {sections.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No featured sections yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 text-primary hover:underline"
            >
              Create your first section
            </button>
          </div>
        ) : (
          sections.map((section) => (
            <div
              key={section.id}
              className="bg-surface rounded-lg p-6 border border-white/10"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold">{section.title}</h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        section.is_active
                          ? 'bg-[#ff5c2e]/20 text-[#ff5c2e]'
                          : 'bg-gray-500/20 text-gray-500'
                      }`}
                    >
                      {section.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-500">
                      {section.section_type}
                    </span>
                  </div>
                  {section.description && (
                    <p className="text-gray-400 mt-2">{section.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span>Display Order: {section.display_order}</span>
                    <span>•</span>
                    <span>
                      Created: {new Date(section.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/admin/featured-sections/${section.id}`)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
                  >
                    Manage Items
                  </button>
                  <button
                    onClick={() => handleToggleActive(section.id, section.is_active)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
                  >
                    {section.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteSection(section.id)}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Section Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-6">Create Featured Section</h2>

            <form onSubmit={handleCreateSection} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description (optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Section Type</label>
                <select
                  value={formData.section_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      section_type: e.target.value as any,
                    })
                  }
                  className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg"
                >
                  <option value="tracks">Tracks</option>
                  <option value="albums">Albums</option>
                  <option value="artists">Artists</option>
                  <option value="playlists">Playlists</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Display Order</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData({ ...formData, display_order: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg"
                  min="0"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_active" className="text-sm">
                  Active (visible to users)
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-black rounded-full font-semibold hover:bg-[#1ed760]"
                >
                  Create Section
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
