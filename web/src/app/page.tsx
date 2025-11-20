/**
 * Qoqnuz Music - Root Page
 * Redirects to /home for app access
 */

import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/home');
}
