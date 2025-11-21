'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSocialStore } from '@/lib/stores/socialStore';
import { useUIStore } from '@/lib/stores/uiStore';
import { cn } from '@/lib/utils/cn';

/**
 * ShareMenu Component
 *
 * Dropdown menu for sharing content with:
 * - Copy link
 * - Social media platforms
 * - Embed code
 * - QR code option
 *
 * @example
 * ```tsx
 * <ShareMenu
 *   entityType="track"
 *   entityId={track.id}
 *   entityName={track.title}
 * />
 * ```
 */

export interface ShareMenuProps {
  /** Type of entity to share */
  entityType: 'track' | 'album' | 'playlist' | 'artist';
  /** ID of entity */
  entityId: string;
  /** Display name of entity */
  entityName: string;
  /** Trigger element (button, icon, etc) */
  trigger?: React.ReactNode;
  /** Custom className for trigger */
  className?: string;
}

export function ShareMenu({
  entityType,
  entityId,
  entityName,
  trigger,
  className,
}: ShareMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { generateShareUrl, copyShareUrl } = useSocialStore();
  const { showToast } = useUIStore();

  const shareUrl = generateShareUrl(entityType, entityId);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleCopyLink = async () => {
    const success = await copyShareUrl(shareUrl);
    if (success) {
      showToast('Link copied to clipboard', 'success');
      setIsOpen(false);
    } else {
      showToast('Failed to copy link', 'error');
    }
  };

  const handleSharePlatform = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(`Check out ${entityName} on Qoqnuz!`);

    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      email: `mailto:?subject=${encodedText}&body=${encodedUrl}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
      setIsOpen(false);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: entityName,
          text: `Check out ${entityName} on Qoqnuz!`,
          url: shareUrl,
        });
        setIsOpen(false);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          showToast('Failed to share', 'error');
        }
      }
    }
  };

  const supportsNativeShare = typeof navigator !== 'undefined' && navigator.share;

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Trigger */}
      {trigger ? (
        <button onClick={() => setIsOpen(!isOpen)} className={className}>
          {trigger}
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'p-2 rounded-full hover:bg-[var(--qz-overlay-light)] transition-colors',
            className
          )}
          aria-label="Share"
        >
          <ShareIcon className="w-5 h-5" />
        </button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-[var(--qz-bg-elevated)] border border-[var(--qz-border-subtle)] rounded-lg shadow-2xl z-[var(--qz-z-dropdown)] animate-slideDown overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-[var(--qz-border-subtle)]">
            <h3 className="font-semibold text-[var(--qz-text-primary)]">Share</h3>
            <p className="text-sm text-[var(--qz-text-secondary)] mt-0.5 truncate">
              {entityName}
            </p>
          </div>

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--qz-bg-surface-hover)] transition-colors border-b border-[var(--qz-border-subtle)]"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-[var(--qz-bg-surface)] rounded-full">
              <LinkIcon className="w-5 h-5 text-[var(--qz-text-secondary)]" />
            </div>
            <span className="font-medium text-[var(--qz-text-primary)]">Copy Link</span>
          </button>

          {/* Native Share (if supported) */}
          {supportsNativeShare && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--qz-bg-surface-hover)] transition-colors border-b border-[var(--qz-border-subtle)]"
            >
              <div className="w-10 h-10 flex items-center justify-center bg-[var(--qz-bg-surface)] rounded-full">
                <ShareIcon className="w-5 h-5 text-[var(--qz-text-secondary)]" />
              </div>
              <span className="font-medium text-[var(--qz-text-primary)]">More Options</span>
            </button>
          )}

          {/* Social Platforms */}
          <div className="p-2">
            <div className="grid grid-cols-4 gap-2">
              <SharePlatformButton
                platform="twitter"
                icon={<TwitterIcon />}
                label="Twitter"
                onClick={() => handleSharePlatform('twitter')}
              />
              <SharePlatformButton
                platform="facebook"
                icon={<FacebookIcon />}
                label="Facebook"
                onClick={() => handleSharePlatform('facebook')}
              />
              <SharePlatformButton
                platform="whatsapp"
                icon={<WhatsAppIcon />}
                label="WhatsApp"
                onClick={() => handleSharePlatform('whatsapp')}
              />
              <SharePlatformButton
                platform="email"
                icon={<EmailIcon />}
                label="Email"
                onClick={() => handleSharePlatform('email')}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Share Platform Button
function SharePlatformButton({
  platform,
  icon,
  label,
  onClick,
}: {
  platform: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-[var(--qz-bg-surface-hover)] transition-colors group"
      aria-label={`Share on ${label}`}
    >
      <div className="w-10 h-10 flex items-center justify-center">{icon}</div>
      <span className="text-xs text-[var(--qz-text-tertiary)] group-hover:text-[var(--qz-text-secondary)]">
        {label}
      </span>
    </button>
  );
}

// Icons

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#1DA1F2">
      <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#25D366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}
