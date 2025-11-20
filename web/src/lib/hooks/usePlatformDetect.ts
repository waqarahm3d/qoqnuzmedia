import { useState, useEffect } from 'react';

export type Platform = 'ios' | 'android' | 'windows' | 'mac' | 'unknown';
export type Browser = 'chrome' | 'safari' | 'firefox' | 'edge' | 'samsung' | 'opera' | 'other';

interface PlatformInfo {
  platform: Platform;
  browser: Browser;
  isMobile: boolean;
  isStandalone: boolean;
  canInstall: boolean;
}

export function usePlatformDetect(): PlatformInfo {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>({
    platform: 'unknown',
    browser: 'other',
    isMobile: false,
    isStandalone: false,
    canInstall: false,
  });

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone === true;

    // Detect platform
    let platform: Platform = 'unknown';
    if (/iphone|ipad|ipod/.test(ua)) {
      platform = 'ios';
    } else if (/android/.test(ua)) {
      platform = 'android';
    } else if (/win/.test(ua)) {
      platform = 'windows';
    } else if (/mac/.test(ua)) {
      platform = 'mac';
    }

    // Detect browser
    let browser: Browser = 'other';
    if (/edg/.test(ua)) {
      browser = 'edge';
    } else if (/chrome|crios/.test(ua) && !/edg/.test(ua)) {
      browser = 'chrome';
    } else if (/safari/.test(ua) && !/chrome|crios/.test(ua)) {
      browser = 'safari';
    } else if (/firefox|fxios/.test(ua)) {
      browser = 'firefox';
    } else if (/samsungbrowser/.test(ua)) {
      browser = 'samsung';
    } else if (/opera|opr/.test(ua)) {
      browser = 'opera';
    }

    // Detect mobile
    const isMobile = /mobile|android|iphone|ipad|ipod/.test(ua);

    // Determine if PWA can be installed
    let canInstall = false;
    if (platform === 'ios' && browser === 'safari' && !isStandalone) {
      canInstall = true;
    } else if ((platform === 'android' || platform === 'windows' || platform === 'mac') &&
               (browser === 'chrome' || browser === 'edge' || browser === 'samsung') &&
               !isStandalone) {
      canInstall = true;
    }

    setPlatformInfo({
      platform,
      browser,
      isMobile,
      isStandalone,
      canInstall,
    });
  }, []);

  return platformInfo;
}
