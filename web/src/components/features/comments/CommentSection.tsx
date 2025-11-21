'use client';

import React, { useState } from 'react';
import { Comment } from './Comment';
import { CommentForm } from './CommentForm';
import { useCommentStore } from '@/lib/stores/commentStore';
import type { Comment as CommentType } from '@/lib/types/music';

/**
 * CommentSection Component
 *
 * Complete comment section with:
 * - Comment form
 * - Comment list
 * - Sort options
 * - Reply functionality
 * - Loading states
 * - Empty state
 *
 * @example
 * ```tsx
 * <CommentSection trackId={track.id} />
 * ```
 */

export interface CommentSectionProps {
  /** Track ID */
  trackId: string;
  /** Show section header */
  showHeader?: boolean;
  /** Current user info */
  currentUser?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

type SortType = 'recent' | 'popular';

export function CommentSection({
  trackId,
  showHeader = true,
  currentUser,
}: CommentSectionProps) {
  const [replyingTo, setReplyingTo] = useState<CommentType | null>(null);
  const [sort, setSort] = useState<SortType>('recent');

  const { getComments, getCommentCount } = useCommentStore();

  const comments = getComments(trackId);
  const commentCount = getCommentCount(trackId);

  // Sort comments
  const sortedComments = [...comments].sort((a, b) => {
    if (sort === 'popular') {
      return (b.likes_count || 0) - (a.likes_count || 0);
    }
    // Recent (default)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleReply = (comment: CommentType) => {
    setReplyingTo(comment);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleReplySuccess = () => {
    setReplyingTo(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-[var(--qz-text-primary)]">
            Comments {commentCount > 0 && `(${commentCount})`}
          </h3>

          {/* Sort */}
          {comments.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--qz-text-secondary)]">Sort by:</span>
              <div className="flex gap-1 p-1 bg-[var(--qz-bg-surface)] rounded-lg">
                <button
                  onClick={() => setSort('recent')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    sort === 'recent'
                      ? 'bg-[var(--qz-bg-elevated)] text-[var(--qz-text-primary)] shadow-sm'
                      : 'text-[var(--qz-text-secondary)] hover:text-[var(--qz-text-primary)]'
                  }`}
                >
                  Recent
                </button>
                <button
                  onClick={() => setSort('popular')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    sort === 'popular'
                      ? 'bg-[var(--qz-bg-elevated)] text-[var(--qz-text-primary)] shadow-sm'
                      : 'text-[var(--qz-text-secondary)] hover:text-[var(--qz-text-primary)]'
                  }`}
                >
                  Popular
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comment Form */}
      <CommentForm trackId={trackId} currentUser={currentUser} />

      {/* Reply Form (if replying) */}
      {replyingTo && (
        <div className="ml-12 p-4 bg-[var(--qz-bg-surface)] rounded-lg border-l-4 border-[var(--qz-primary)]">
          <div className="text-sm text-[var(--qz-text-secondary)] mb-3">
            Replying to <span className="font-semibold text-[var(--qz-text-primary)]">{replyingTo.user_name}</span>
          </div>
          <CommentForm
            trackId={trackId}
            parentId={replyingTo.id}
            placeholder={`Reply to ${replyingTo.user_name}...`}
            showCancel
            onCancel={handleCancelReply}
            onSuccess={handleReplySuccess}
            autoFocus
            currentUser={currentUser}
          />
        </div>
      )}

      {/* Comments List */}
      {sortedComments.length > 0 ? (
        <div className="space-y-6">
          {sortedComments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              trackId={trackId}
              onReply={handleReply}
              currentUserId={currentUser?.id}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-[var(--qz-bg-surface)]">
            <CommentIcon className="w-8 h-8 text-[var(--qz-text-tertiary)]" />
          </div>
          <h4 className="text-lg font-semibold text-[var(--qz-text-primary)] mb-1">
            No comments yet
          </h4>
          <p className="text-sm text-[var(--qz-text-secondary)]">
            Be the first to comment on this track
          </p>
        </div>
      )}
    </div>
  );
}

// Icons

function CommentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}
