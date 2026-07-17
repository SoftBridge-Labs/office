'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const NAV_ITEMS = [
  { label: 'Home', href: '/', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { label: 'Ping', href: '/ping', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg> },
  { label: 'Docs', href: '/docs', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
  { label: 'Calendar', href: '/calendar', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { label: 'Meet', href: '/meet', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg> },
  { label: 'Tasks', href: '/tasks', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
  { label: 'Bookmarks', href: '/bookmarks', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> },
  { label: 'Whiteboard', href: '/whiteboard', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> },
];

export default function AppSwitcher() {
  const [show, setShow] = useState(false);
  const ref = useRef(null);
  const pathname = usePathname() || '/';

  const currentApp = NAV_ITEMS.find(n => n.href !== '/' && pathname.startsWith(n.href)) || NAV_ITEMS[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) setShow(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <div 
        onClick={() => setShow(!show)}
        style={{
          width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#5f6368', transition: 'background-color 0.2s',
          background: show ? 'rgba(60, 64, 67, 0.08)' : 'transparent'
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(60, 64, 67, 0.08)'}
        onMouseLeave={e => !show && (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      </div>
      
      {show && (
        <div style={{
          position: 'absolute', top: '50px', left: 0, width: '320px',
          background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)',
          borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          padding: '1rem', zIndex: 10000, border: '1px solid rgba(0,0,0,0.05)',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem'
        }}>
          {NAV_ITEMS.map((app) => (
            <Link key={app.label} href={app.href} onClick={() => setShow(false)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
              padding: '12px 8px', borderRadius: '12px', textDecoration: 'none',
              color: '#3c4043', transition: 'all 0.2s ease', cursor: 'pointer',
              background: currentApp.label === app.label ? 'rgba(26, 115, 232, 0.08)' : 'transparent'
            }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'} onMouseLeave={e => e.currentTarget.style.background = currentApp.label === app.label ? 'rgba(26, 115, 232, 0.08)' : 'transparent'}>
              <div style={{ color: currentApp.label === app.label ? '#1a73e8' : '#5f6368', transform: 'scale(1.5)' }}>
                {app.icon}
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: currentApp.label === app.label ? '#1a73e8' : '#3c4043' }}>{app.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
