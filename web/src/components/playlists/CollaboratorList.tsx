'use client';

import { useState, useEffect } from 'react';
import { UserIcon, CloseIcon } from '../icons';

interface Collaborator {
  id: string;
  user_id: string;
  permission: 'view' | 'edit' | 'admin';
  status: 'pending' | 'accepted' | 'rejected';
  user?: {
    id: string;
    email: string;
    full_name?: string;
  };
  invited_by_user?: {
    full_name?: string;
  };
}

interface CollaboratorListProps {
  playlistId: string;
  isOwner: boolean;
  onClose: () => void;
}

export const CollaboratorList = ({ playlistId, isOwner, onClose }: CollaboratorListProps) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermission, setInvitePermission] = useState<'view' | 'edit' | 'admin'>('edit');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchCollaborators();
  }, [playlistId]);

  const fetchCollaborators = async () => {
    try {
      const response = await fetch(`/api/playlists/${playlistId}/collaborators`);
      if (!response.ok) throw new Error('Failed to fetch collaborators');
      const data = await response.json();
      setCollaborators(data.data.collaborators || []);
    } catch (error) {
      console.error('Failed to fetch collaborators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);

    try {
      const response = await fetch(`/api/playlists/${playlistId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          permission: invitePermission,
        }),
      });

      if (!response.ok) throw new Error('Failed to invite collaborator');

      setInviteEmail('');
      setShowInviteForm(false);
      fetchCollaborators();
    } catch (error) {
      console.error('Failed to invite:', error);
      alert('Failed to invite collaborator. Please try again.');
    } finally {
      setInviting(false);
    }
  };

  const handleUpdatePermission = async (collaboratorId: string, newPermission: string) => {
    try {
      const response = await fetch(`/api/playlists/${playlistId}/collaborators`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collaborator_id: collaboratorId,
          permission: newPermission,
        }),
      });

      if (!response.ok) throw new Error('Failed to update permission');

      fetchCollaborators();
    } catch (error) {
      console.error('Failed to update permission:', error);
      alert('Failed to update permission. Please try again.');
    }
  };

  const handleRemove = async (collaboratorId: string) => {
    if (!confirm('Are you sure you want to remove this collaborator?')) return;

    try {
      const response = await fetch(
        `/api/playlists/${playlistId}/collaborators?collaborator_id=${collaboratorId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to remove collaborator');

      fetchCollaborators();
    } catch (error) {
      console.error('Failed to remove collaborator:', error);
      alert('Failed to remove collaborator. Please try again.');
    }
  };

  const handleAcceptReject = async (collaboratorId: string, status: 'accepted' | 'rejected') => {
    try {
      const response = await fetch(`/api/playlists/${playlistId}/collaborators`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collaborator_id: collaboratorId,
          status,
        }),
      });

      if (!response.ok) throw new Error(`Failed to ${status} invite`);

      fetchCollaborators();
    } catch (error) {
      console.error(`Failed to ${status}:`, error);
      alert(`Failed to ${status} invite. Please try again.`);
    }
  };

  const getPermissionBadgeColor = (permission: string) => {
    switch (permission) {
      case 'admin':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'edit':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'view':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-white/10 text-white/60 border-white/10';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-white/10 text-white/60 border-white/10';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold">Collaborators</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <CloseIcon size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Invite Button */}
          {isOwner && !showInviteForm && (
            <button
              onClick={() => setShowInviteForm(true)}
              className="w-full mb-6 px-4 py-3 bg-primary hover:bg-[#ff5c2e] text-black font-semibold rounded-lg transition-colors"
            >
              + Invite Collaborator
            </button>
          )}

          {/* Invite Form */}
          {showInviteForm && (
            <form onSubmit={handleInvite} className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <h3 className="font-semibold mb-3">Invite New Collaborator</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Email</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Permission</label>
                  <select
                    value={invitePermission}
                    onChange={(e) => setInvitePermission(e.target.value as any)}
                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="view">View only</option>
                    <option value="edit">Can edit</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={inviting}
                    className="flex-1 px-4 py-2 bg-primary hover:bg-[#ff5c2e] text-black font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {inviting ? 'Sending...' : 'Send Invite'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteForm(false);
                      setInviteEmail('');
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Collaborators List */}
          {loading ? (
            <div className="text-center py-8 text-white/60">Loading collaborators...</div>
          ) : collaborators.length > 0 ? (
            <div className="space-y-3">
              {collaborators.map((collab) => (
                <div
                  key={collab.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                      <UserIcon size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">
                        {collab.user?.full_name || collab.user?.email || 'Unknown User'}
                      </div>
                      <div className="text-sm text-white/60">{collab.user?.email}</div>
                      {collab.status === 'pending' && (
                        <div className="text-xs text-white/40 mt-1">
                          Invited by {collab.invited_by_user?.full_name || 'someone'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status Badge */}
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded border ${getStatusBadgeColor(
                        collab.status
                      )}`}
                    >
                      {collab.status}
                    </span>

                    {/* Permission Badge/Selector */}
                    {isOwner && collab.status === 'accepted' ? (
                      <select
                        value={collab.permission}
                        onChange={(e) => handleUpdatePermission(collab.id, e.target.value)}
                        className={`px-2 py-1 text-xs font-medium rounded border bg-surface ${getPermissionBadgeColor(
                          collab.permission
                        )}`}
                      >
                        <option value="view">View</option>
                        <option value="edit">Edit</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded border ${getPermissionBadgeColor(
                          collab.permission
                        )}`}
                      >
                        {collab.permission}
                      </span>
                    )}

                    {/* Actions */}
                    {isOwner ? (
                      <button
                        onClick={() => handleRemove(collab.id)}
                        className="text-white/40 hover:text-red-400 transition-colors"
                        title="Remove collaborator"
                      >
                        <CloseIcon size={18} />
                      </button>
                    ) : (
                      collab.status === 'pending' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleAcceptReject(collab.id, 'accepted')}
                            className="px-3 py-1 text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleAcceptReject(collab.id, 'rejected')}
                            className="px-3 py-1 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/60">
              <p>No collaborators yet</p>
              {isOwner && (
                <p className="text-sm mt-2">Click "Invite Collaborator" to add people</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
