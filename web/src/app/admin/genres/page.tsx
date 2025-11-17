'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase-client';

interface Genre {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  color: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export default function GenresManagement() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#1DB954',
    display_order: 0,
  });

  useEffect(() => {
    fetchGenres();
  }, [search]);

  const fetchGenres = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `/api/admin/genres?search=${encodeURIComponent(search)}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      const data = await response.json();
      setGenres(data.genres || []);
    } catch (error) {
      console.error('Failed to fetch genres:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const url = editingGenre
        ? `/api/admin/genres/${editingGenre.id}`
        : '/api/admin/genres';
      const method = editingGenre ? 'PUT' : 'POST';

      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('color', formData.color);
      submitData.append('display_order', formData.display_order.toString());
      if (imageFile) submitData.append('image', imageFile);

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: submitData,
      });

      if (response.ok) {
        setShowCreateModal(false);
        setEditingGenre(null);
        setImageFile(null);
        setFormData({
          name: '',
          description: '',
          color: '#1DB954',
          display_order: 0,
        });
        fetchGenres();
      } else {
        const errorData = await response.json();
        alert('Error: ' + (errorData.error || 'Failed to save genre'));
      }
    } catch (error) {
      console.error('Failed to save genre:', error);
      alert('Failed to save genre');
    }
  };

  const handleEdit = (genre: Genre) => {
    setEditingGenre(genre);
    setImageFile(null);
    setFormData({
      name: genre.name,
      description: genre.description || '',
      color: genre.color,
      display_order: genre.display_order,
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this genre?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/genres/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (response.ok) {
        fetchGenres();
      }
    } catch (error) {
      console.error('Failed to delete genre:', error);
    }
  };

  const toggleActive = async (genre: Genre) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/genres/${genre.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ is_active: !genre.is_active }),
      });
      if (response.ok) {
        fetchGenres();
      }
    } catch (error) {
      console.error('Failed to toggle genre:', error);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Genres</h1>
          <button
            onClick={() => {
              setEditingGenre(null);
              setImageFile(null);
              setFormData({
                name: '',
                description: '',
                color: '#1DB954',
                display_order: 0,
              });
              setShowCreateModal(true);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            + Add Genre
          </button>
        </div>

        {/* Search */}
        <div className="bg-gray-800 rounded-lg p-4">
          <input
            type="text"
            placeholder="Search genres..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
          />
        </div>

        {/* Genres Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {genres.map((genre) => (
            <div
              key={genre.id}
              className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors"
              style={{ borderTop: `4px solid ${genre.color}` }}
            >
              {genre.image_url ? (
                <div className="w-full h-32 bg-gray-700">
                  <img
                    src={genre.image_url}
                    alt={genre.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className="w-full h-32 flex items-center justify-center text-4xl"
                  style={{ backgroundColor: genre.color + '20' }}
                >
                  🎵
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-bold text-lg">
                    {genre.name}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      genre.is_active
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-600 text-gray-300'
                    }`}
                  >
                    {genre.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {genre.description && (
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {genre.description}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(genre)}
                    className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleActive(genre)}
                    className="flex-1 px-3 py-1.5 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                  >
                    {genre.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(genre.id)}
                    className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {genres.length === 0 && (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🎵</div>
            <h3 className="text-white text-xl font-bold mb-2">
              No genres found
            </h3>
            <p className="text-gray-400">
              {search
                ? 'No genres match your search'
                : 'Get started by adding your first genre'}
            </p>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-white mb-4">
                {editingGenre ? 'Edit Genre' : 'Add New Genre'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Genre Image</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700"
                  />
                  {editingGenre?.image_url && (
                    <p className="text-xs text-gray-400 mt-1">
                      Current: {editingGenre.image_url}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      className="w-16 h-10 bg-gray-700 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        display_order: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    {editingGenre ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingGenre(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Cancel
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
