'use client';

import React, { useState } from 'react';
import { Modal, ModalContent, ModalFooter } from '@/components/ui/modal/Modal';
import { Input } from '@/components/ui/input/Input';
import { Button } from '@/components/ui/button/Button';
import { usePlaylistStore } from '@/lib/stores/playlistStore';
import { useUIStore } from '@/lib/stores/uiStore';
import type { Playlist } from '@/lib/types/music';

/**
 * CreatePlaylistModal Component
 *
 * Modal for creating new playlists with:
 * - Name input (required)
 * - Description input (optional)
 * - Privacy toggle (public/private)
 * - Collaborative toggle
 *
 * @example
 * ```tsx
 * <CreatePlaylistModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 * />
 * ```
 */

export interface CreatePlaylistModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when playlist is created */
  onSuccess?: (playlist: Playlist) => void;
}

export function CreatePlaylistModal({ isOpen, onClose, onSuccess }: CreatePlaylistModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isCollaborative, setIsCollaborative] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addPlaylist } = usePlaylistStore();
  const { showToast } = useUIStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Playlist name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // In a real app, this would be an API call
      // For now, we'll create a mock playlist
      const newPlaylist: Playlist = {
        id: `playlist-${Date.now()}`,
        name: name.trim(),
        description: description.trim() || undefined,
        is_public: isPublic,
        is_collaborative: isCollaborative,
        owner_id: 'current-user-id', // Would come from auth
        owner_name: 'Current User', // Would come from auth
        tracks_count: 0,
        duration: 0,
        tracks: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Add to store
      addPlaylist(newPlaylist);

      // Show success toast
      showToast('Playlist created successfully', 'success');

      // Call onSuccess callback
      onSuccess?.(newPlaylist);

      // Reset form and close
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create playlist');
      showToast('Failed to create playlist', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setIsPublic(true);
    setIsCollaborative(false);
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Playlist"
      description="Create a new playlist to organize your favorite tracks"
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <ModalContent className="space-y-4">
          {/* Name Input */}
          <div>
            <Input
              label="Playlist Name"
              placeholder="My Awesome Playlist"
              value={name}
              onChange={(e) => setName(e.target.value)}
              variant={error && !name.trim() ? 'error' : 'default'}
              error={error && !name.trim() ? 'Playlist name is required' : undefined}
              autoFocus
              required
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--qz-text-primary)] mb-2">
              Description
            </label>
            <textarea
              placeholder="Add an optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 bg-[var(--qz-bg-surface)] border border-[var(--qz-border-default)] rounded-lg text-[var(--qz-text-primary)] placeholder:text-[var(--qz-text-tertiary)] transition-all outline-none hover:border-[var(--qz-border-strong)] focus:border-[var(--qz-primary)] focus:ring-2 focus:ring-[var(--qz-primary)]/20 resize-none"
            />
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between p-4 bg-[var(--qz-bg-surface)] rounded-lg">
            <div className="flex-1">
              <div className="font-medium text-[var(--qz-text-primary)]">Public Playlist</div>
              <div className="text-sm text-[var(--qz-text-secondary)] mt-0.5">
                Anyone can view and search for this playlist
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isPublic ? 'bg-[var(--qz-primary)]' : 'bg-[var(--qz-bg-base)]'
              }`}
              role="switch"
              aria-checked={isPublic}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isPublic ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Collaborative Toggle */}
          <div className="flex items-center justify-between p-4 bg-[var(--qz-bg-surface)] rounded-lg">
            <div className="flex-1">
              <div className="font-medium text-[var(--qz-text-primary)]">Collaborative</div>
              <div className="text-sm text-[var(--qz-text-secondary)] mt-0.5">
                Allow others to add and remove tracks
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCollaborative(!isCollaborative)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isCollaborative ? 'bg-[var(--qz-primary)]' : 'bg-[var(--qz-bg-base)]'
              }`}
              role="switch"
              aria-checked={isCollaborative}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isCollaborative ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
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
          <Button type="submit" loading={isSubmitting} disabled={!name.trim()}>
            Create Playlist
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
