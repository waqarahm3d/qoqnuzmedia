'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase-client';

interface User {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  created_at: string;
  admin_users: Array<{
    id: string;
    role_id: string;
    is_active: boolean;
  }> | null;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [adminRoles, setAdminRoles] = useState<any[]>([]);
  const [managingUser, setManagingUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchAdminRoles();
  }, [page, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('Not authenticated');
        return;
      }

      const url = new URL('/api/admin/users', window.location.origin);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('limit', '20');
      if (search) url.searchParams.set('search', search);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_roles')
        .select('*')
        .order('name');

      if (error) throw error;
      setAdminRoles(data || []);
    } catch (err: any) {
      console.error('Failed to fetch admin roles:', err);
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (!confirm('Remove admin role from this user?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to remove admin role');
      }

      fetchUsers();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 mt-1">
            Manage users and assign admin roles
          </p>
        </div>

        {/* Search */}
        <div className="bg-gray-800 rounded-lg p-4">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading...</div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-500 text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          <>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {users.map((user) => {
                    const isAdmin = user.admin_users && user.admin_users.length > 0;

                    return (
                      <tr key={user.id} className="hover:bg-gray-700/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                              {user.avatar_url ? (
                                <img
                                  src={user.avatar_url}
                                  alt={user.display_name || 'User'}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-white text-lg">👤</span>
                              )}
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {user.display_name || 'Unknown User'}
                              </p>
                              {user.bio && (
                                <p className="text-sm text-gray-400 truncate max-w-md">
                                  {user.bio}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {isAdmin ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400">
                              Admin
                            </span>
                          ) : (
                            <span className="text-gray-500">User</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {isAdmin ? (
                            <button
                              onClick={() => handleRemoveAdmin(user.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              Remove Admin
                            </button>
                          ) : (
                            <button
                              onClick={() => setManagingUser(user)}
                              className="text-green-400 hover:text-green-300"
                            >
                              Make Admin
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg"
              >
                Previous
              </button>
              <span className="text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg"
              >
                Next
              </button>
            </div>
          </>
        )}

        {/* Assign Admin Role Modal */}
        {managingUser && (
          <AssignRoleModal
            user={managingUser}
            roles={adminRoles}
            onClose={() => setManagingUser(null)}
            onSuccess={() => {
              setManagingUser(null);
              fetchUsers();
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}

interface AssignRoleModalProps {
  user: User;
  roles: any[];
  onClose: () => void;
  onSuccess: () => void;
}

function AssignRoleModal({ user, roles, onClose, onSuccess }: AssignRoleModalProps) {
  const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id || '');
  const [loading, setLoading] = useState(false);

  const handleAssign = async () => {
    if (!selectedRoleId) {
      alert('Please select a role');
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`/api/admin/users/${user.id}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ role_id: selectedRoleId }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign role');
      }

      onSuccess();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4">
          Assign Admin Role
        </h2>
        <p className="text-gray-400 mb-4">
          Assign an admin role to{' '}
          <span className="text-white font-medium">
            {user.display_name || 'this user'}
          </span>
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Role
          </label>
          <select
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg"
          >
            {loading ? 'Assigning...' : 'Assign Role'}
          </button>
        </div>
      </div>
    </div>
  );
}
