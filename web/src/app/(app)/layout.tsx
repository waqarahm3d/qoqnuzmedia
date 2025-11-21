import { AppShell } from '@/components/layout';

/**
 * App Layout
 *
 * Layout wrapper for all authenticated app pages.
 * Includes sidebar, header, player, and mobile navigation.
 */

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
