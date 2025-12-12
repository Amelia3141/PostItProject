'use client';

import { useEffect } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { initFirebase } from '@/lib/firebase';

export default function Home() {
  useEffect(() => {
    // Initialize Firebase on mount
    initFirebase();
  }, []);

  return <Dashboard />;
}
