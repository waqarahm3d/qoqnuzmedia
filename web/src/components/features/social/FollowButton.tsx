'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { useSocialStore } from '@/lib/stores/socialStore';
import { useUIStore } from '@/lib/stores/uiStore';
import type { User } from '@/lib/types/music';

/**
 * FollowButton Component
 *
 * Button for following/unfollowing users with:
 * - Optimistic updates
 * - Loading states
 * - Different variants (primary, secondary, ghost)
 * - Hover state showing "Unfollow"
 *
 * @example
 * ```tsx
 * <FollowButton user={artist} />
 * ```
 */

export interface FollowButtonProps {
  /** User to follow/unfollow */
  user: User;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Show icon */
  showIcon?: boolean;
  /** Custom className */
  className?: string;
  /** Callback when follow status changes */
  onChange?: (isFollowing: boolean) => void;
}

export function FollowButton({
  user,
  variant = 'outline',
  size = 'md',
  showIcon = false,
  className,
  onChange,
}: FollowButtonProps) {
  const { following, followUser, unfollowUser, isFollowing: checkIsFollowing } = useSocialStore();
  const { showToast } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isFollowing = checkIsFollowing(user.id);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsLoading(true);

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (isFollowing) {
        unfollowUser(user.id);
        showToast(`Unfollowed ${user.display_name || user.email}`, 'info');
        onChange?.(false);
      } else {
        followUser(user);
        showToast(`Following ${user.display_name || user.email}`, 'success');
        onChange?.(true);
      }
    } catch (error) {
      showToast('Failed to update follow status', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine button text
  const getButtonText = () => {
    if (isLoading) return 'Loading...';
    if (isFollowing) {
      return isHovered ? 'Unfollow' : 'Following';
    }
    return 'Follow';
  };

  // Determine button variant
  const getButtonVariant = () => {
    if (isFollowing && isHovered) {
      return 'danger';
    }
    if (isFollowing) {
      return 'secondary';
    }
    return variant;
  };

  return (
    <Button
      variant={getButtonVariant()}
      size={size}
      onClick={handleClick}
      loading={isLoading}
      disabled={isLoading}
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      icon={
        showIcon ? (
          isFollowing ? (
            <CheckIcon className="w-4 h-4" />
          ) : (
            <PlusIcon className="w-4 h-4" />
          )
        ) : undefined
      }
    >
      {getButtonText()}
    </Button>
  );
}

// Icons

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
