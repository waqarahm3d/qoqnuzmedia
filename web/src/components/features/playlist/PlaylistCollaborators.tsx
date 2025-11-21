'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { InviteCollaboratorModal } from './InviteCollaboratorModal';
import { usePlaylistStore } from '@/lib/stores/playlistStore';
import { useUIStore } from '@/lib/stores/uiStore';
import type { Playlist, PlaylistCollaborator } from '@/lib/types/music';

/**
 * PlaylistCollaborators Component
 *
 * Manage playlist collaborators with:
 * - List of current collaborators
 * - Add/remove collaborators
 * - Change permission levels
 * - Owner badge
 *
 * @example
 * ```tsx
 * <PlaylistCollaborators
 *   playlist={playlist}
 *   currentUserId={userId}
 * />
 * ```
 */

export interface PlaylistCollaboratorsProps {
  /** Playlist data */
  playlist: Playlist;
  /** Current user ID */
  currentUserId?: string;
  /** Show invite button */
  showInviteButton?: boolean;
}

export function PlaylistCollaborators({
  playlist,
  currentUserId = 'current-user-id',
  showInviteButton = true,
}: PlaylistCollaboratorsProps) {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const { removeCollaborator, updateCollaboratorRole } = usePlaylistStore();
  const { showToast } = useUIStore();

  const isOwner = playlist.owner_id === currentUserId;
  const collaborators = playlist.collaborators || [];

  const handleRemoveCollaborator = (userId: string) => {
    if (confirm('Remove this collaborator?')) {
      removeCollaborator(playlist.id, userId);
      showToast('Collaborator removed', 'success');
    }
  };

  const handleChangeRole = (userId: string, newRole: PlaylistCollaborator['role']) => {
    updateCollaboratorRole(playlist.id, userId, newRole);
    showToast('Permission updated', 'success');
  };

  if (!playlist.is_collaborative) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[var(--qz-text-primary)]">
          Collaborators
        </h3>
        {isOwner && showInviteButton && (
          <Button
            size="sm"
            onClick={() => setIsInviteModalOpen(true)}
            icon={<PlusIcon className="w-4 h-4" />}
          >
            Invite
          </Button>
        )}
      </div>

      {/* Owner */}
      <div className="flex items-center gap-3 p-3 bg-[var(--qz-bg-surface)] rounded-lg">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--qz-bg-base)]">
          {playlist.owner_avatar ? (
            <img
              src={playlist.owner_avatar}
              alt={playlist.owner_name || 'Owner'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-[var(--qz-text-tertiary)]" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[var(--qz-text-primary)] truncate">
            {playlist.owner_name || 'Unknown'}
          </div>
          <div className="text-sm text-[var(--qz-text-secondary)]">Owner</div>
        </div>

        <div className="px-3 py-1 bg-[var(--qz-primary)]/10 text-[var(--qz-primary)] rounded-full text-xs font-semibold">
          Owner
        </div>
      </div>

      {/* Collaborators List */}
      {collaborators.length > 0 ? (
        <div className="space-y-2">
          {collaborators.map((collaborator) => (
            <div
              key={collaborator.user_id}
              className="flex items-center gap-3 p-3 bg-[var(--qz-bg-surface)] rounded-lg group"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--qz-bg-base)]">
                {collaborator.user_avatar ? (
                  <img
                    src={collaborator.user_avatar}
                    alt={collaborator.user_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-[var(--qz-text-tertiary)]" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[var(--qz-text-primary)] truncate">
                  {collaborator.user_name}
                </div>
                <div className="text-sm text-[var(--qz-text-secondary)] capitalize">
                  {collaborator.role}
                </div>
              </div>

              {/* Actions (owner only) */}
              {isOwner && (
                <div className="flex items-center gap-2">
                  {/* Role Dropdown */}
                  <select
                    value={collaborator.role}
                    onChange={(e) =>
                      handleChangeRole(
                        collaborator.user_id,
                        e.target.value as PlaylistCollaborator['role']
                      )
                    }
                    className="px-2 py-1 bg-[var(--qz-bg-elevated)] border border-[var(--qz-border-default)] rounded text-sm text-[var(--qz-text-primary)] outline-none hover:border-[var(--qz-border-strong)] focus:border-[var(--qz-primary)] cursor-pointer"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveCollaborator(collaborator.user_id)}
                    className="p-2 rounded-full hover:bg-[var(--qz-overlay-light)] text-[var(--qz-text-secondary)] hover:text-[var(--qz-error)] transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Remove collaborator"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-[var(--qz-text-secondary)]">
          <p className="text-sm">No collaborators yet</p>
          {isOwner && (
            <p className="text-xs mt-1">
              Invite others to help manage this playlist
            </p>
          )}
        </div>
      )}

      {/* Permissions Legend */}
      <div className="p-4 bg-[var(--qz-bg-surface)] rounded-lg space-y-2">
        <h4 className="text-sm font-semibold text-[var(--qz-text-primary)] mb-2">
          Permission Levels
        </h4>
        <div className="space-y-1.5 text-xs text-[var(--qz-text-secondary)]">
          <div className="flex gap-2">
            <span className="font-semibold text-[var(--qz-text-primary)] w-16">Viewer:</span>
            <span>Can view and play the playlist</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-[var(--qz-text-primary)] w-16">Editor:</span>
            <span>Can add and remove tracks</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-[var(--qz-text-primary)] w-16">Admin:</span>
            <span>Can edit playlist details and manage collaborators</span>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      <InviteCollaboratorModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        playlistId={playlist.id}
        playlistName={playlist.name}
      />
    </div>
  );
}

// Icons

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
