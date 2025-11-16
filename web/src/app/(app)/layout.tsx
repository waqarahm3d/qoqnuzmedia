import { AppLayout } from '@/components/layout/AppLayout';
import { ReactNode } from 'react';

export default function AppLayoutWrapper({ children }: { children: ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
