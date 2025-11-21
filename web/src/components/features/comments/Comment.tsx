'use client';

import React, { useState } from 'react';
import { useCommentStore } from '@/lib/stores/commentStore';
import { useUIStore } from '@/lib/stores/uiStore';
import { cn } from '@/lib/utils/cn';
import type { Comment as CommentType } from '@/lib/types/music';

/**
 * Comment Component
 *
 * Individual comment with:
 * - User avatar and name
 * - Comment content
 * - Like button
 * - Reply button
 * - Delete button (own comments)
 * - Nested replies
 * - Timestamp
 *
 * @example
 * ```tsx
 * <Comment
 *   comment={comment}
 *   trackId={trackId}
 *   onReply={(comment) => handleReply(comment)}
 * />
 * ```
 */

export interface CommentProps {
  /** Comment data */
  comment: CommentType;
  /** Track ID */
  trackId: string;
  /** Nesting level (for indentation) */
  level?: number;
  /** Callback when reply is clicked */
  onReply?: (comment: CommentType) => void;
  /** Current user ID */
  currentUserId?: string;
}

export function Comment({
  comment,
  trackId,
  level = 0,
  onReply,
  currentUserId = 'current-user-id',
}: CommentProps) {
  const [showReplies, setShowReplies] = useState(true);

  const { likeComment, unlikeComment, deleteComment } = useCommentStore();
  const { showToast } = useUIStore();

  const isOwnComment = comment.user_id === currentUserId;
  const hasReplies = comment.replies && comment.replies.length > 0;

  const handleLike = () => {
    if (comment.is_liked) {
      unlikeComment(trackId, comment.id);
    } else {
      likeComment(trackId, comment.id);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteComment(trackId, comment.id);
      showToast('Comment deleted', 'success');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Max nesting level
  const maxLevel = 3;
  const canNest = level < maxLevel;

  return (
    <div className={cn('flex gap-3', level > 0 && 'ml-12')}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--qz-bg-surface)]">
          {comment.user_avatar ? (
            <img
              src={comment.user_avatar}
              alt={comment.user_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-[var(--qz-text-tertiary)]" />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-[var(--qz-text-primary)] text-sm">
            {comment.user_name}
          </span>
          <span className="text-xs text-[var(--qz-text-tertiary)]">
            {formatTimestamp(comment.created_at)}
          </span>
        </div>

        {/* Comment Text */}
        <p className="text-[var(--qz-text-primary)] text-sm mb-2 whitespace-pre-wrap break-words">
          {comment.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-4 mb-3">
          {/* Like Button */}
          <button
            onClick={handleLike}
            className={cn(
              'flex items-center gap-1.5 text-xs font-medium transition-colors',
              comment.is_liked
                ? 'text-[var(--qz-primary)]'
                : 'text-[var(--qz-text-secondary)] hover:text-[var(--qz-text-primary)]'
            )}
          >
            <HeartIcon
              className="w-4 h-4"
              filled={comment.is_liked}
            />
            {comment.likes_count ? (
              <span>{comment.likes_count}</span>
            ) : null}
          </button>

          {/* Reply Button */}
          {canNest && onReply && (
            <button
              onClick={() => onReply(comment)}
              className="text-xs font-medium text-[var(--qz-text-secondary)] hover:text-[var(--qz-text-primary)] transition-colors"
            >
              Reply
            </button>
          )}

          {/* Delete Button (own comments only) */}
          {isOwnComment && (
            <button
              onClick={handleDelete}
              className="text-xs font-medium text-[var(--qz-text-secondary)] hover:text-[var(--qz-error)] transition-colors"
            >
              Delete
            </button>
          )}
        </div>

        {/* Replies */}
        {hasReplies && (
          <div className="space-y-4">
            {/* Toggle Replies Button */}
            {comment.replies!.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[var(--qz-primary)] hover:underline"
              >
                {showReplies ? (
                  <>
                    <ChevronUpIcon className="w-3 h-3" />
                    Hide {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
                  </>
                ) : (
                  <>
                    <ChevronDownIcon className="w-3 h-3" />
                    Show {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
                  </>
                )}
              </button>
            )}

            {/* Nested Replies */}
            {showReplies && (
              <div className="space-y-4">
                {comment.replies!.map((reply) => (
                  <Comment
                    key={reply.id}
                    comment={reply}
                    trackId={trackId}
                    level={level + 1}
                    onReply={onReply}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
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

function HeartIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function ChevronUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 15l-6-6-6 6" />
    </svg>
  );
}
