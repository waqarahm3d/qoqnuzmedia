'use client';

import { useState, useEffect } from 'react';
import { usePlatformDetect } from '@/lib/hooks/usePlatformDetect';
import { CloseIcon } from './icons';

export const PWAInstallPrompt = () => {
  const { platform, browser, isStandalone, canInstall } = usePlatformDetect();
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedDate = dismissed ? new Date(dismissed) : null;
    const daysSinceDismissed = dismissedDate
      ? (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
      : 999;

    // Don't show if:
    // - Already in standalone mode
    // - Can't install on this platform
    // - Dismissed within last 7 days
    if (isStandalone || !canInstall || daysSinceDismissed < 7) {
      return;
    }

    // Listen for beforeinstallprompt event (Chrome, Edge, Samsung)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For Safari iOS, show after 3 seconds
    if (platform === 'ios' && browser === 'safari') {
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [platform, browser, isStandalone, canInstall]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Chrome/Edge install
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  // Platform-specific instructions
  const getInstructions = () => {
    if (platform === 'ios' && browser === 'safari') {
      return (
        <div className="space-y-3">
          <p className="text-sm text-white/80">To install Qoqnuz Music on your iPhone/iPad:</p>
          <ol className="text-sm text-white/70 space-y-2 pl-4">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">1.</span>
              <span>Tap the <strong className="text-white">Share</strong> button (
                <svg className="inline w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/>
                </svg>
              ) at the bottom of the screen</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">2.</span>
              <span>Scroll and tap <strong className="text-white">"Add to Home Screen"</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">3.</span>
              <span>Tap <strong className="text-white">"Add"</strong> to confirm</span>
            </li>
          </ol>
        </div>
      );
    }

    if (platform === 'android' && (browser === 'chrome' || browser === 'samsung')) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-white/80">To install Qoqnuz Music on your Android device:</p>
          <ol className="text-sm text-white/70 space-y-2 pl-4">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">1.</span>
              <span>Tap the <strong className="text-white">Menu</strong> button (⋮) at the top-right</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">2.</span>
              <span>Select <strong className="text-white">"Add to Home screen"</strong> or <strong className="text-white">"Install app"</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">3.</span>
              <span>Tap <strong className="text-white">"Install"</strong> to confirm</span>
            </li>
          </ol>
          {deferredPrompt && (
            <button
              onClick={handleInstall}
              className="w-full mt-3 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors"
            >
              Install Now
            </button>
          )}
        </div>
      );
    }

    if (platform === 'windows' && (browser === 'chrome' || browser === 'edge')) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-white/80">To install Qoqnuz Music on Windows:</p>
          <ol className="text-sm text-white/70 space-y-2 pl-4">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">1.</span>
              <span>Click the <strong className="text-white">Install</strong> icon (
                <svg className="inline w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
              ) in the address bar</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">2.</span>
              <span>Click <strong className="text-white">"Install"</strong> in the popup</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">3.</span>
              <span>The app will be added to your Start Menu and Desktop</span>
            </li>
          </ol>
          {deferredPrompt && (
            <button
              onClick={handleInstall}
              className="w-full mt-3 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors"
            >
              Install Now
            </button>
          )}
        </div>
      );
    }

    if (platform === 'mac' && (browser === 'chrome' || browser === 'edge')) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-white/80">To install Qoqnuz Music on Mac:</p>
          <ol className="text-sm text-white/70 space-y-2 pl-4">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">1.</span>
              <span>Click the <strong className="text-white">Install</strong> icon (
                <svg className="inline w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
              ) in the address bar</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">2.</span>
              <span>Click <strong className="text-white">"Install"</strong> in the popup</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">3.</span>
              <span>The app will be added to your Applications folder</span>
            </li>
          </ol>
          {deferredPrompt && (
            <button
              onClick={handleInstall}
              className="w-full mt-3 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors"
            >
              Install Now
            </button>
          )}
        </div>
      );
    }

    // Fallback for other browsers
    return (
      <div className="space-y-3">
        <p className="text-sm text-white/80">
          Install Qoqnuz Music for a better experience! Look for the install option in your browser menu.
        </p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full sm:max-w-md bg-gradient-to-b from-gray-900 to-black border border-white/10 sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 duration-300 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                <path d="M10 17l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" fill="black"/>
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white">Install Qoqnuz Music</h3>
              <p className="text-xs text-white/60">Listen offline, faster access</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {getInstructions()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white/5 border-t border-white/10 text-center">
          <p className="text-xs text-white/40">
            Works offline • No storage used • Instant access
          </p>
        </div>

        {/* Dismiss button for non-Chrome browsers */}
        {!deferredPrompt && (
          <div className="px-6 pb-4">
            <button
              onClick={handleDismiss}
              className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 font-medium rounded-lg transition-colors text-sm"
            >
              Maybe Later
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
