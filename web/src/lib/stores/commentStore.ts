import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Comment } from '@/lib/types/music';

/**
 * Comment Store
 *
 * Manages track comments including:
 * - Comments and replies
 * - Comment likes
 * - Nested comment threads
 * - Real-time updates (future)
 */

interface CommentState {
  // State
  comments: Record<string, Comment[]>; // trackId -> comments
  isLoading: boolean;
  error: string | null;

  // Actions - Comments
  setComments: (trackId: string, comments: Comment[]) => void;
  addComment: (trackId: string, comment: Comment) => void;
  updateComment: (trackId: string, commentId: string, updates: Partial<Comment>) => void;
  deleteComment: (trackId: string, commentId: string) => void;

  // Actions - Replies
  addReply: (trackId: string, parentId: string, reply: Comment) => void;

  // Actions - Likes
  likeComment: (trackId: string, commentId: string) => void;
  unlikeComment: (trackId: string, commentId: string) => void;

  // Loading states
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Utility
  getComments: (trackId: string) => Comment[];
  getCommentCount: (trackId: string) => number;
  reset: () => void;
}

const initialState = {
  comments: {},
  isLoading: false,
  error: null,
};

export const useCommentStore = create<CommentState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Setters
      setComments: (trackId, comments) =>
        set((state) => ({
          comments: {
            ...state.comments,
            [trackId]: comments,
          },
        })),

      addComment: (trackId, comment) =>
        set((state) => {
          const trackComments = state.comments[trackId] || [];
          return {
            comments: {
              ...state.comments,
              [trackId]: [comment, ...trackComments],
            },
          };
        }),

      updateComment: (trackId, commentId, updates) =>
        set((state) => {
          const trackComments = state.comments[trackId] || [];

          const updateCommentRecursive = (comments: Comment[]): Comment[] => {
            return comments.map((comment) => {
              if (comment.id === commentId) {
                return { ...comment, ...updates };
              }
              if (comment.replies && comment.replies.length > 0) {
                return {
                  ...comment,
                  replies: updateCommentRecursive(comment.replies),
                };
              }
              return comment;
            });
          };

          return {
            comments: {
              ...state.comments,
              [trackId]: updateCommentRecursive(trackComments),
            },
          };
        }),

      deleteComment: (trackId, commentId) =>
        set((state) => {
          const trackComments = state.comments[trackId] || [];

          const deleteCommentRecursive = (comments: Comment[]): Comment[] => {
            return comments
              .filter((comment) => comment.id !== commentId)
              .map((comment) => {
                if (comment.replies && comment.replies.length > 0) {
                  return {
                    ...comment,
                    replies: deleteCommentRecursive(comment.replies),
                  };
                }
                return comment;
              });
          };

          return {
            comments: {
              ...state.comments,
              [trackId]: deleteCommentRecursive(trackComments),
            },
          };
        }),

      // Replies
      addReply: (trackId, parentId, reply) =>
        set((state) => {
          const trackComments = state.comments[trackId] || [];

          const addReplyRecursive = (comments: Comment[]): Comment[] => {
            return comments.map((comment) => {
              if (comment.id === parentId) {
                return {
                  ...comment,
                  replies: [reply, ...(comment.replies || [])],
                };
              }
              if (comment.replies && comment.replies.length > 0) {
                return {
                  ...comment,
                  replies: addReplyRecursive(comment.replies),
                };
              }
              return comment;
            });
          };

          return {
            comments: {
              ...state.comments,
              [trackId]: addReplyRecursive(trackComments),
            },
          };
        }),

      // Likes
      likeComment: (trackId, commentId) =>
        set((state) => {
          const trackComments = state.comments[trackId] || [];

          const likeCommentRecursive = (comments: Comment[]): Comment[] => {
            return comments.map((comment) => {
              if (comment.id === commentId) {
                return {
                  ...comment,
                  is_liked: true,
                  likes_count: (comment.likes_count || 0) + 1,
                };
              }
              if (comment.replies && comment.replies.length > 0) {
                return {
                  ...comment,
                  replies: likeCommentRecursive(comment.replies),
                };
              }
              return comment;
            });
          };

          return {
            comments: {
              ...state.comments,
              [trackId]: likeCommentRecursive(trackComments),
            },
          };
        }),

      unlikeComment: (trackId, commentId) =>
        set((state) => {
          const trackComments = state.comments[trackId] || [];

          const unlikeCommentRecursive = (comments: Comment[]): Comment[] => {
            return comments.map((comment) => {
              if (comment.id === commentId) {
                return {
                  ...comment,
                  is_liked: false,
                  likes_count: Math.max(0, (comment.likes_count || 0) - 1),
                };
              }
              if (comment.replies && comment.replies.length > 0) {
                return {
                  ...comment,
                  replies: unlikeCommentRecursive(comment.replies),
                };
              }
              return comment;
            });
          };

          return {
            comments: {
              ...state.comments,
              [trackId]: unlikeCommentRecursive(trackComments),
            },
          };
        }),

      // Loading states
      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      // Utility
      getComments: (trackId) => {
        return get().comments[trackId] || [];
      },

      getCommentCount: (trackId) => {
        const comments = get().comments[trackId] || [];

        const countCommentsRecursive = (comments: Comment[]): number => {
          return comments.reduce((total, comment) => {
            const replyCount = comment.replies ? countCommentsRecursive(comment.replies) : 0;
            return total + 1 + replyCount;
          }, 0);
        };

        return countCommentsRecursive(comments);
      },

      reset: () => set(initialState),
    }),
    { name: 'CommentStore' }
  )
);
