'use client';

import { useState, useEffect } from 'react';
import { MobilePlayer } from './MobilePlayer';
import { DesktopPlayer } from './DesktopPlayer';

export const ResponsivePlayer = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleExpand = () => {
    setIsExpanded(true);
    // Prevent body scroll when expanded on mobile
    if (isMobile) {
      document.body.style.overflow = 'hidden';
    }
  };

  const handleCollapse = () => {
    setIsExpanded(false);
    // Restore body scroll
    document.body.style.overflow = '';
  };

  // On mobile, show MobilePlayer with expand/collapse functionality
  if (isMobile) {
    return (
      <MobilePlayer
        isExpanded={isExpanded}
        onExpand={handleExpand}
        onCollapse={handleCollapse}
      />
    );
  }

  // On desktop/tablet, show DesktopPlayer
  return <DesktopPlayer onExpand={handleExpand} />;
};
