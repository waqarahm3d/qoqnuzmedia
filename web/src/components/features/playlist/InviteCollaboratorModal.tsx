'use client';

import React, { useState } from 'react';
import { Modal, ModalContent, ModalFooter, Button } from '@/components/ui';
import { usePlaylistStore } from '@/lib/stores/playlistStore';
import { useUIStore } from '@/lib/stores/uiStore';
import type { PlaylistCollaborator } from '@/lib/types/music';

/**
 * InviteCollaboratorModal Component
 *
 * Modal for inviting collaborators with:
 * - Email/username input
 * - Permission level selection
 * - User search (future)
 * - Multiple invites (future)
 *
 * @example
 * ```tsx
 * <InviteCollaboratorModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   playlistId={playlistId}
 * />
 * ```
 */

export interface InviteCollaboratorModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Playlist ID */
  playlistId: string;
  /** Playlist name (for display) */
  playlistName?: string;
}

export function InviteCollaboratorModal({
  isOpen,
  onClose,
  playlistId,
  playlistName,
}: InviteCollaboratorModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<PlaylistCollaborator['role']>('editor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addCollaborator } = usePlaylistStore();
  const { showToast } = useUIStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Email or username is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock collaborator (in real app, would fetch user by email)
      const newCollaborator: PlaylistCollaborator = {
        user_id: `user-${Date.now()}`,
        user_name: email.split('@')[0], // Use email prefix as name
        role,
        invited_by: 'current-user-id',
        created_at: new Date().toISOString(),
      };

      addCollaborator(playlistId, newCollaborator);
      showToast(`Invited ${email} as ${role}`, 'success');
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite collaborator');
      showToast('Failed to send invitation', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setRole('editor');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invite Collaborator"
      description={playlistName ? `Invite someone to collaborate on "${playlistName}"` : undefined}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <ModalContent className="space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--qz-text-primary)] mb-2">
              Email or Username
            </label>
            <input
              type="text"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--qz-bg-surface)] border border-[var(--qz-border-default)] rounded-lg text-[var(--qz-text-primary)] placeholder:text-[var(--qz-text-tertiary)] outline-none hover:border-[var(--qz-border-strong)] focus:border-[var(--qz-primary)] focus:ring-2 focus:ring-[var(--qz-primary)]/20 transition-all"
              autoFocus
            />
          </div>

          {/* Permission Level */}
          <div>
            <label className="block text-sm font-medium text-[var(--qz-text-primary)] mb-2">
              Permission Level
            </label>
            <div className="space-y-2">
              {[
                {
                  value: 'viewer',
                  label: 'Viewer',
                  description: 'Can view and play the playlist',
                },
                {
                  value: 'editor',
                  label: 'Editor',
                  description: 'Can add and remove tracks',
                },
                {
                  value: 'admin',
                  label: 'Admin',
                  description: 'Can edit details and manage collaborators',
                },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-start gap-3 p-3 bg-[var(--qz-bg-surface)] rounded-lg cursor-pointer hover:bg-[var(--qz-bg-surface-hover)] transition-colors"
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={role === option.value}
                    onChange={(e) => setRole(e.target.value as PlaylistCollaborator['role'])}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-[var(--qz-text-primary)]">
                      {option.label}
                    </div>
                    <div className="text-sm text-[var(--qz-text-secondary)]">
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex gap-2">
              <InfoIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-200">
                An invitation will be sent to this email address. They'll need to accept before
                they can collaborate.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-[var(--qz-error)]/10 border border-[var(--qz-error)] rounded-lg text-sm text-[var(--qz-error)]">
              {error}
            </div>
          )}
        </ModalContent>

        <ModalFooter>
          <Button variant="ghost" onClick={handleClose} type="button" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting} disabled={!email.trim()}>
            Send Invitation
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// Icons

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}
