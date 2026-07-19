'use client';

import React, { useState, useEffect } from 'react';
import { PingProvider } from '../context/PingContext';
import PingSidebar from '../components/PingSidebar';
import PingMainChat from '../components/PingMainChat';
import PingRightPanel from '../components/PingRightPanel';
import PingModals from '../components/PingModals';
import TopNav from '@/app/components/TopNav';

export default function PingPage() {
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('sb_user');
      if (savedUser) {
        try { setUserProfile(JSON.parse(savedUser)); } catch (e) {}
      }
    }
  }, []);

  return (
    <PingProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <TopNav userProfile={userProfile} isLoggedOut={!userProfile} />
        <div style={{ display: 'flex', flex: 1, background: '#f8f9fa', color: '#202124', fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>
          <PingSidebar />
          <PingMainChat />
          <PingRightPanel />
        </div>
      </div>
      <PingModals />
    </PingProvider>
  );
}
