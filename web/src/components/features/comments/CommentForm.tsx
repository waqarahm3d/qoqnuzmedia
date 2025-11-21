'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui';
import { useCommentStore } from '@/lib/stores/commentStore';
import { useUIStore } from '@/lib/stores/uiStore';
import { cn } from '@/lib/utils/cn';
import type { Comment } from '@/lib/types/music';

/**
 * CommentForm Component
 *
 * Form for adding comments or replies with:
 * - Auto-expanding textarea
 * - Character count
 * - Submit button
 * - Cancel button (for replies)
 * - Loading state
 *
 * @example
 * ```tsx
 * <CommentForm
 *   trackId={trackId}
 *   onSuccess={() => console.log('Comment added')}
 * />
 * ```
 */

export interface CommentFormProps {
  /** Track ID */
  trackId: string;
  /** Parent comment ID (for replies) */
  parentId?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Show cancel button */
  showCancel?: boolean;
  /** Callback when cancelled */
  onCancel?: () => void;
  /** Callback when comment is submitted */
  onSuccess?: () => void;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Current user info */
  currentUser?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export function CommentForm({
  trackId,
  parentId,
  placeholder = 'Add a comment...',
  showCancel = false,
  onCancel,
  onSuccess,
  autoFocus = false,
  currentUser = {
    id: 'current-user-id',
    name: 'Current User',
  },
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { addComment, addReply } = useCommentStore();
  const { showToast } = useUIStore();

  const maxLength = 500;
  const remainingChars = maxLength - content.length;

  // Auto-focus
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() || content.length > maxLength) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newComment: Comment = {
        id: `comment-${Date.now()}-${Math.random()}`,
        track_id: trackId,
        user_id: currentUser.id,
        user_name: currentUser.name,
        user_avatar: currentUser.avatar,
        parent_id: parentId,
        content: content.trim(),
        likes_count: 0,
        is_liked: false,
        created_at: new Date().toISOString(),
      };

      if (parentId) {
        addReply(trackId, parentId, newComment);
        showToast('Reply added', 'success');
      } else {
        addComment(trackId, newComment);
        showToast('Comment added', 'success');
      }

      // Reset form
      setContent('');
      onSuccess?.();
    } catch (error) {
      showToast('Failed to add comment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent('');
    onCancel?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={1}
          className={cn(
            'w-full px-4 py-3 bg-[var(--qz-bg-surface)] border rounded-lg',
            'text-[var(--qz-text-primary)] placeholder:text-[var(--qz-text-tertiary)]',
            'outline-none transition-all resize-none',
            'hover:border-[var(--qz-border-strong)]',
            'focus:border-[var(--qz-primary)] focus:ring-2 focus:ring-[var(--qz-primary)]/20',
            content.length > maxLength
              ? 'border-[var(--qz-error)]'
              : 'border-[var(--qz-border-default)]'
          )}
          disabled={isSubmitting}
        />

        {/* Character Count */}
        {content.length > 0 && (
          <div
            className={cn(
              'absolute bottom-3 right-3 text-xs',
              remainingChars < 50
                ? remainingChars < 0
                  ? 'text-[var(--qz-error)]'
                  : 'text-[var(--qz-warning)]'
                : 'text-[var(--qz-text-tertiary)]'
            )}
          >
            {remainingChars}
          </div>
        )}
      </div>

      {/* Actions */}
      {(content.trim() || showCancel) && (
        <div className="flex items-center justify-end gap-2">
          {showCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || content.length > maxLength || isSubmitting}
            loading={isSubmitting}
          >
            {parentId ? 'Reply' : 'Comment'}
          </Button>
        </div>
      )}
    </form>
  );
}
