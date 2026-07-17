'use client';

import React from 'react';
import { PingProvider } from './context/PingContext';
import PingSidebar from './components/PingSidebar';
import PingMainChat from './components/PingMainChat';
import PingRightPanel from './components/PingRightPanel';
import PingModals from './components/PingModals';

export default function PingPage() {
  return (
    <PingProvider>
      <div style={{ display: 'flex', height: '100vh', background: '#f8f9fa', color: '#202124', fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>
        <PingSidebar />
        <PingMainChat />
        <PingRightPanel />
      </div>
      <PingModals />
    </PingProvider>
  );
}
