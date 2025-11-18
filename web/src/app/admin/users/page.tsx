'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase-client';

interface User {
  id: string;
  email?: string;
  display_name: string | null;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  is_banned: boolean;
  country: string | null;
  website: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  admin_users?: { role_id: string; role?: { name: string; permissions: string[] } }[];
  social_links?: SocialLink[];
  artist_profiles?: ArtistLink[];
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  display_name: string | null;
}

interface ArtistLink {
  artist_id: string;
  is_primary: boolean;
  artists: {
    id: string;
    name: string;
    bio: string | null;
    avatar_url: string | null;
    verified: boolean;
    genres: string[];
  };
}

interface AdminRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

const SOCIAL_PLATFORMS = [
  { id: 'twitter', name: 'Twitter/X', icon: 'X' },
  { id: 'instagram', name: 'Instagram', icon: 'IG' },
  { id: 'facebook', name: 'Facebook', icon: 'FB' },
  { id: 'youtube', name: 'YouTube', icon: 'YT' },
  { id: 'spotify', name: 'Spotify', icon: 'SP' },
  { id: 'soundcloud', name: 'SoundCloud', icon: 'SC' },
  { id: 'tiktok', name: 'TikTok', icon: 'TT' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'LI' },
  { id: 'website', name: 'Website', icon: 'WEB' },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [artistForm, setArtistForm] = useState({ name: '', bio: '', genres: '' });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/users?page=${page}&limit=20&search=${encodeURIComponent(search)}`
      );
      const data = await response.json();
      if (data.users) {
        setUsers(data.users);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch admin roles
  const fetchRoles = async () => {
    try {
      const { data } = await supabase.from('admin_roles').select('*').order('name');
      if (data) setRoles(data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [page, search]);

  // Open user detail modal
  const openUserModal = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      const data = await response.json();
      if (data.user) {
        setSelectedUser(data.user);
        setEditForm({
          display_name: data.user.display_name || '',
          username: data.user.username || '',
          full_name: data.user.full_name || '',
          bio: data.user.bio || '',
          avatar_url: data.user.avatar_url || '',
          is_verified: data.user.is_verified || false,
          country: data.user.country || '',
          website: data.user.website || '',
          phone: data.user.phone || '',
          date_of_birth: data.user.date_of_birth || '',
          gender: data.user.gender || '',
        });
        setSocialLinks(data.user.social_links || []);
        setModalOpen(true);
        setActiveTab('profile');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  // Save user profile
  const saveProfile = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (response.ok) {
        fetchUsers();
        alert('Profile saved successfully');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // Save social links
  const saveSocialLinks = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/social-links`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ social_links: socialLinks }),
      });
      if (response.ok) {
        alert('Social links saved successfully');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save social links');
      }
    } catch (error) {
      console.error('Error saving social links:', error);
      alert('Failed to save social links');
    } finally {
      setSaving(false);
    }
  };

  // Toggle ban status
  const toggleBan = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_banned: !selectedUser.is_banned }),
      });
      if (response.ok) {
        setSelectedUser({ ...selectedUser, is_banned: !selectedUser.is_banned });
        fetchUsers();
      }
    } catch (error) {
      console.error('Error toggling ban:', error);
    } finally {
      setSaving(false);
    }
  };

  // Send password reset
  const sendPasswordReset = async () => {
    if (!selectedUser?.email) return;
    if (!confirm(`Send password reset email to ${selectedUser.email}?`)) return;

    setSaving(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(selectedUser.email);
      if (error) throw error;
      alert('Password reset email sent');
    } catch (error) {
      console.error('Error sending password reset:', error);
      alert('Failed to send password reset');
    } finally {
      setSaving(false);
    }
  };

  // Assign admin role
  const assignRole = async (roleId: string) => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_id: roleId }),
      });
      if (response.ok) {
        await openUserModal(selectedUser.id);
        fetchUsers();
        alert('Role assigned successfully');
      }
    } catch (error) {
      console.error('Error assigning role:', error);
    } finally {
      setSaving(false);
    }
  };

  // Remove admin role
  const removeRole = async () => {
    if (!selectedUser) return;
    if (!confirm('Remove admin role from this user?')) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await openUserModal(selectedUser.id);
        fetchUsers();
        alert('Role removed successfully');
      }
    } catch (error) {
      console.error('Error removing role:', error);
    } finally {
      setSaving(false);
    }
  };

  // Convert to artist
  const convertToArtist = async () => {
    if (!selectedUser || !artistForm.name) return;
    if (!confirm(`Create artist profile "${artistForm.name}" for this user?`)) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/convert-to-artist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artist_name: artistForm.name,
          bio: artistForm.bio || null,
          genres: artistForm.genres ? artistForm.genres.split(',').map(g => g.trim()) : [],
        }),
      });
      if (response.ok) {
        await openUserModal(selectedUser.id);
        setArtistForm({ name: '', bio: '', genres: '' });
        alert('Artist profile created successfully');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create artist profile');
      }
    } catch (error) {
      console.error('Error converting to artist:', error);
    } finally {
      setSaving(false);
    }
  };

  // Add social link
  const addSocialLink = (platform: string) => {
    if (socialLinks.find(l => l.platform === platform)) return;
    setSocialLinks([...socialLinks, { id: '', platform, url: '', display_name: null }]);
  };

  // Update social link
  const updateSocialLink = (index: number, field: string, value: string) => {
    const updated = [...socialLinks];
    updated[index] = { ...updated[index], [field]: value };
    setSocialLinks(updated);
  };

  // Remove social link
  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  // Delete single user
  const deleteUser = async () => {
    if (!selectedUser) return;
    if (!confirm(`Are you sure you want to permanently delete this user? This action cannot be undone.`)) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (response.ok) {
        setModalOpen(false);
        setSelectedUser(null);
        fetchUsers();
        alert('User deleted successfully');
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  // Delete multiple users
  const deleteSelectedUsers = async () => {
    if (selectedUsers.length === 0) return;
    if (!confirm(`Are you sure you want to permanently delete ${selectedUsers.length} user(s)? This action cannot be undone.`)) return;

    setDeleting(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_ids: selectedUsers }),
      });
      const data = await response.json();
      if (response.ok) {
        setSelectedUsers([]);
        fetchUsers();
        alert(data.message);
      } else {
        alert(data.error || 'Failed to delete users');
      }
    } catch (error) {
      console.error('Error deleting users:', error);
      alert('Failed to delete users');
    } finally {
      setDeleting(false);
    }
  };

  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Toggle all users selection
  const toggleAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-white/60">Manage all users, roles, and artist profiles</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedUsers.length > 0 && (
              <button
                onClick={deleteSelectedUsers}
                disabled={deleting}
                className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : `Delete ${selectedUsers.length} selected`}
              </button>
            )}
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 bg-surface border border-white/10 rounded-lg focus:outline-none focus:border-primary w-64"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-surface/50 rounded-lg p-4">
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-white/60 text-sm">Total Users</div>
          </div>
          <div className="bg-surface/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">
              {users.filter(u => u.is_verified).length}
            </div>
            <div className="text-white/60 text-sm">Verified</div>
          </div>
          <div className="bg-surface/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-400">
              {users.filter(u => u.is_banned).length}
            </div>
            <div className="text-white/60 text-sm">Banned</div>
          </div>
          <div className="bg-surface/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-primary">
              {users.filter(u => u.admin_users && u.admin_users.length > 0).length}
            </div>
            <div className="text-white/60 text-sm">Admins</div>
          </div>
        </div>

        {/* User Table */}
        <div className="bg-surface/30 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-4 w-12">
                  <input
                    type="checkbox"
                    checked={users.length > 0 && selectedUsers.length === users.length}
                    onChange={toggleAllUsers}
                    className="rounded"
                  />
                </th>
                <th className="text-left p-4 text-white/60 font-medium">User</th>
                <th className="text-left p-4 text-white/60 font-medium hidden md:table-cell">Status</th>
                <th className="text-left p-4 text-white/60 font-medium hidden lg:table-cell">Joined</th>
                <th className="text-right p-4 text-white/60 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-white/60">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-white/60">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
                    onClick={() => openUserModal(user.id)}
                  >
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.display_name || 'User'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/40">
                              {(user.display_name || user.username || 'U')[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {user.display_name || user.username || 'Unknown'}
                            {user.is_verified && (
                              <span className="text-primary text-xs">Verified</span>
                            )}
                            {user.admin_users && user.admin_users.length > 0 && (
                              <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded">
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="text-white/60 text-sm">{user.bio?.slice(0, 50) || 'No bio'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      {user.is_banned ? (
                        <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded">
                          Banned
                        </span>
                      ) : (
                        <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-white/60 text-sm hidden lg:table-cell">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openUserModal(user.id);
                        }}
                        className="text-primary hover:text-primary/80 text-sm"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-surface rounded hover:bg-surface/80 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-white/60">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 bg-surface rounded hover:bg-surface/80 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {/* User Detail Modal */}
        {modalOpen && selectedUser && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden">
                    {selectedUser.avatar_url ? (
                      <img
                        src={selectedUser.avatar_url}
                        alt={selectedUser.display_name || 'User'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/40 text-xl">
                        {(selectedUser.display_name || 'U')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-bold">{selectedUser.display_name || 'Unknown User'}</h2>
                    <p className="text-white/60 text-sm">{selectedUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-white/60 hover:text-white"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/10">
                {['profile', 'social', 'security', 'artist'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-sm font-medium capitalize ${
                      activeTab === tab
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white/60 text-sm mb-1">Display Name</label>
                        <input
                          type="text"
                          value={editForm.display_name || ''}
                          onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                          className="w-full px-3 py-2 bg-surface border border-white/10 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">Username</label>
                        <input
                          type="text"
                          value={editForm.username || ''}
                          onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                          className="w-full px-3 py-2 bg-surface border border-white/10 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">Full Name</label>
                        <input
                          type="text"
                          value={editForm.full_name || ''}
                          onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                          className="w-full px-3 py-2 bg-surface border border-white/10 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">Avatar URL</label>
                        <input
                          type="text"
                          value={editForm.avatar_url || ''}
                          onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })}
                          className="w-full px-3 py-2 bg-surface border border-white/10 rounded-lg"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-white/60 text-sm mb-1">Bio</label>
                        <textarea
                          value={editForm.bio || ''}
                          onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 bg-surface border border-white/10 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">Country</label>
                        <input
                          type="text"
                          value={editForm.country || ''}
                          onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                          className="w-full px-3 py-2 bg-surface border border-white/10 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">Phone</label>
                        <input
                          type="text"
                          value={editForm.phone || ''}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-full px-3 py-2 bg-surface border border-white/10 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">Website</label>
                        <input
                          type="text"
                          value={editForm.website || ''}
                          onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                          className="w-full px-3 py-2 bg-surface border border-white/10 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">Gender</label>
                        <select
                          value={editForm.gender || ''}
                          onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                          className="w-full px-3 py-2 bg-surface border border-white/10 rounded-lg"
                        >
                          <option value="">Not specified</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">Date of Birth</label>
                        <input
                          type="date"
                          value={editForm.date_of_birth || ''}
                          onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                          className="w-full px-3 py-2 bg-surface border border-white/10 rounded-lg"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="is_verified"
                          checked={editForm.is_verified || false}
                          onChange={(e) => setEditForm({ ...editForm, is_verified: e.target.checked })}
                          className="rounded"
                        />
                        <label htmlFor="is_verified" className="text-white/60 text-sm">Verified User</label>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={saveProfile}
                        disabled={saving}
                        className="px-4 py-2 bg-primary hover:bg-primary/80 text-black font-medium rounded-lg disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Profile'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Social Tab */}
                {activeTab === 'social' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {SOCIAL_PLATFORMS.map((platform) => (
                        <button
                          key={platform.id}
                          onClick={() => addSocialLink(platform.id)}
                          disabled={socialLinks.some(l => l.platform === platform.id)}
                          className="px-3 py-1 bg-surface hover:bg-surface/80 rounded text-sm disabled:opacity-50"
                        >
                          {platform.icon} {platform.name}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-3">
                      {socialLinks.map((link, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="w-24 text-sm text-white/60 capitalize">{link.platform}</span>
                          <input
                            type="text"
                            placeholder="URL"
                            value={link.url}
                            onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                            className="flex-1 px-3 py-2 bg-surface border border-white/10 rounded-lg text-sm"
                          />
                          <button
                            onClick={() => removeSocialLink(index)}
                            className="text-red-400 hover:text-red-300 p-2"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      {socialLinks.length === 0 && (
                        <p className="text-white/40 text-sm">No social links added. Click a platform above to add one.</p>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={saveSocialLinks}
                        disabled={saving}
                        className="px-4 py-2 bg-primary hover:bg-primary/80 text-black font-medium rounded-lg disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Social Links'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    {/* Account Status */}
                    <div className="bg-surface/50 rounded-lg p-4">
                      <h3 className="font-medium mb-3">Account Status</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={selectedUser.is_banned ? 'text-red-400' : 'text-green-400'}>
                            {selectedUser.is_banned ? 'Banned' : 'Active'}
                          </p>
                          <p className="text-white/60 text-sm">
                            Last sign in: {selectedUser.last_sign_in_at
                              ? new Date(selectedUser.last_sign_in_at).toLocaleString()
                              : 'Never'}
                          </p>
                        </div>
                        <button
                          onClick={toggleBan}
                          disabled={saving}
                          className={`px-4 py-2 rounded-lg font-medium ${
                            selectedUser.is_banned
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          }`}
                        >
                          {selectedUser.is_banned ? 'Unban User' : 'Ban User'}
                        </button>
                      </div>
                    </div>

                    {/* Password Reset */}
                    <div className="bg-surface/50 rounded-lg p-4">
                      <h3 className="font-medium mb-3">Password</h3>
                      <div className="flex items-center justify-between">
                        <p className="text-white/60 text-sm">Send password reset email to user</p>
                        <button
                          onClick={sendPasswordReset}
                          disabled={saving}
                          className="px-4 py-2 bg-surface hover:bg-surface/80 rounded-lg"
                        >
                          Send Reset Email
                        </button>
                      </div>
                    </div>

                    {/* Admin Role */}
                    <div className="bg-surface/50 rounded-lg p-4">
                      <h3 className="font-medium mb-3">Admin Role</h3>
                      {selectedUser.admin_users && selectedUser.admin_users.length > 0 ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-primary">
                              {selectedUser.admin_users[0].role?.name || 'Admin'}
                            </p>
                            <p className="text-white/60 text-sm">
                              Permissions: {selectedUser.admin_users[0].role?.permissions?.join(', ') || 'None'}
                            </p>
                          </div>
                          <button
                            onClick={removeRole}
                            disabled={saving}
                            className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg"
                          >
                            Remove Role
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-white/60 text-sm mb-3">Not an admin. Assign a role:</p>
                          <div className="flex flex-wrap gap-2">
                            {roles.map((role) => (
                              <button
                                key={role.id}
                                onClick={() => assignRole(role.id)}
                                disabled={saving}
                                className="px-3 py-1 bg-surface hover:bg-surface/80 rounded text-sm"
                              >
                                {role.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Delete Account */}
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                      <h3 className="font-medium mb-3 text-red-400">Danger Zone</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white/60 text-sm">Permanently delete this user account</p>
                          <p className="text-red-400/60 text-xs mt-1">This action cannot be undone</p>
                        </div>
                        <button
                          onClick={deleteUser}
                          disabled={deleting || (selectedUser.admin_users && selectedUser.admin_users.length > 0)}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50"
                        >
                          {deleting ? 'Deleting...' : 'Delete User'}
                        </button>
                      </div>
                      {selectedUser.admin_users && selectedUser.admin_users.length > 0 && (
                        <p className="text-yellow-400/60 text-xs mt-2">Remove admin role before deleting</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Artist Tab */}
                {activeTab === 'artist' && (
                  <div className="space-y-6">
                    {selectedUser.artist_profiles && selectedUser.artist_profiles.length > 0 ? (
                      <div className="bg-surface/50 rounded-lg p-4">
                        <h3 className="font-medium mb-3">Linked Artist Profiles</h3>
                        {selectedUser.artist_profiles.map((link) => (
                          <div key={link.artist_id} className="flex items-center gap-3 p-3 bg-black/20 rounded-lg">
                            <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden">
                              {link.artists.avatar_url ? (
                                <img src={link.artists.avatar_url} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/40">
                                  {link.artists.name[0]}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium flex items-center gap-2">
                                {link.artists.name}
                                {link.artists.verified && <span className="text-primary text-xs">Verified</span>}
                              </p>
                              <p className="text-white/60 text-sm">
                                {link.artists.genres?.join(', ') || 'No genres'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-surface/50 rounded-lg p-4">
                        <h3 className="font-medium mb-3">Create Artist Profile</h3>
                        <p className="text-white/60 text-sm mb-4">
                          Convert this user to an artist to allow them to upload and manage music.
                        </p>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-white/60 text-sm mb-1">Artist Name *</label>
                            <input
                              type="text"
                              value={artistForm.name}
                              onChange={(e) => setArtistForm({ ...artistForm, name: e.target.value })}
                              placeholder="Stage name or band name"
                              className="w-full px-3 py-2 bg-surface border border-white/10 rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-white/60 text-sm mb-1">Bio</label>
                            <textarea
                              value={artistForm.bio}
                              onChange={(e) => setArtistForm({ ...artistForm, bio: e.target.value })}
                              placeholder="Artist biography"
                              rows={3}
                              className="w-full px-3 py-2 bg-surface border border-white/10 rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-white/60 text-sm mb-1">Genres (comma-separated)</label>
                            <input
                              type="text"
                              value={artistForm.genres}
                              onChange={(e) => setArtistForm({ ...artistForm, genres: e.target.value })}
                              placeholder="Pop, Rock, Electronic"
                              className="w-full px-3 py-2 bg-surface border border-white/10 rounded-lg"
                            />
                          </div>
                          <button
                            onClick={convertToArtist}
                            disabled={saving || !artistForm.name}
                            className="px-4 py-2 bg-primary hover:bg-primary/80 text-black font-medium rounded-lg disabled:opacity-50"
                          >
                            {saving ? 'Creating...' : 'Create Artist Profile'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
