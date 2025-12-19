'use client';

import { useEffect } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { NamePrompt } from '@/components/NamePrompt';
import { UserProvider } from '@/lib/userContext';
import { initFirebase } from '@/lib/firebase';

export default function Home() {
  useEffect(() => {
    initFirebase();
  }, []);

  return (
    <UserProvider>
      <NamePrompt />
      <Dashboard />
    </UserProvider>
  );
}
