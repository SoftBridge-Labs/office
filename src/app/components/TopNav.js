'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import OneTapLogin from '@/app/components/OneTapLogin';
import { api } from '@/lib/api';

export default function TopNav({ userProfile, isLoggedOut }) {
  const router = useRouter();
  const pathname = usePathname();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAppSwitcher, setShowAppSwitcher] = useState(false);
  const [workspaceMember, setWorkspaceMember] = useState(null);
  const [showStartupForm, setShowStartupForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef(null);
  const switcherRef = useRef(null);

  const NAV_ITEMS = [
    { label: 'Home', href: '/home', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { label: 'Ping', href: '/ping', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg> },
    { label: 'Docs', href: '/docs', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
    { label: 'Calendar', href: '/calendar', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
    { label: 'Meet', href: '/meet', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg> },
    { label: 'Tasks', href: '/tasks', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
    { label: 'Bookmarks', href: '/bookmarks', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> },
    { label: 'Whiteboard', href: '/whiteboard', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> },
  ];

  const currentApp = NAV_ITEMS.find(n => n.href !== '/' && pathname.startsWith(n.href)) || NAV_ITEMS[0];

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('sb_workspace_id')) {
      api.getMe().then(res => {
        if (res.success) {
          setWorkspaceMember(res.data);
        }
      }).catch(err => {
        console.error("Error fetching workspace member:", err);
        // If the user's workspace was deleted or they were removed, clear it so they can create a new one.
        if (err.message && err.message.includes('not a member')) {
          localStorage.removeItem('sb_workspace_id');
          window.location.reload();
        }
      });
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setShowProfileMenu(false);
      if (switcherRef.current && !switcherRef.current.contains(event.target)) setShowAppSwitcher(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLoginSuccess = (authData) => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sb_user');
    localStorage.removeItem('sb_id_token');
    localStorage.removeItem('sb_uid');
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.5rem 1.5rem',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #dadce0',
      height: '64px',
      flexShrink: 0,
      position: 'relative'
    }}>
      <style>{`
        .topnav-search { display: block; }
        .topnav-logo-text { display: block; }
        .topnav-right-nav { gap: 1.5rem; }
        @media (max-width: 768px) {
          .topnav-search { display: none !important; }
          .topnav-logo-text { display: none !important; }
          .topnav-right-nav { gap: 0.5rem !important; }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
        <div 
          onClick={() => setShowAppSwitcher(!showAppSwitcher)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#5f6368',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(60, 64, 67, 0.08)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </div>
        
        {/* App Switcher Dropdown */}
        {showAppSwitcher && (
          <div ref={switcherRef} style={{
            position: 'absolute', top: '50px', left: 0, width: '320px',
            background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)',
            borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            padding: '1rem', zIndex: 1000, border: '1px solid rgba(0,0,0,0.05)',
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem'
          }}>
            {NAV_ITEMS.map((app) => (
              <Link key={app.label} href={app.href} onClick={() => setShowAppSwitcher(false)} style={{
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

        <Link href={currentApp.href} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ color: '#1a73e8', display: 'flex', alignItems: 'center', padding: '4px', background: 'rgba(26, 115, 232, 0.1)', borderRadius: '8px' }}>
            {currentApp.icon}
          </div>
          <span className="topnav-logo-text" style={{ fontSize: '1.3rem', fontWeight: 600, color: '#202124', letterSpacing: '-0.02em' }}>
            {currentApp.label}
          </span>
        </Link>
      </div>

      <div className="topnav-search" style={{ flex: 1, maxWidth: '720px', margin: '0 2rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#f1f3f4',
          borderRadius: '24px',
          padding: '0 1rem',
          height: '48px',
          transition: 'background-color 0.2s, box-shadow 0.2s'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}>
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            placeholder="Search in Workspace" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
              }
            }}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              padding: '0 0.75rem',
              fontSize: '1rem',
              color: '#202124'
            }} 
          />
        </div>
      </div>

      <div className="topnav-right-nav" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <Link href="/pricing" style={{ textDecoration: 'none', color: '#5f6368', fontWeight: 500, fontSize: '0.95rem' }}>
          Pricing
        </Link>
        {!isLoggedOut && userProfile ? (
          <div style={{ position: 'relative' }} ref={menuRef}>
            <div 
              style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#1a73e8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', cursor: 'pointer', overflow: 'hidden' }} 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              title="Account Options"
            >
              {userProfile.avatar_url ? (
                <img src={userProfile.avatar_url} alt={userProfile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'U'
              )}
            </div>
            
            {showProfileMenu && (
              <div style={{
                position: 'absolute',
                top: '120%',
                right: '0',
                backgroundColor: '#fff',
                border: '1px solid #dadce0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                minWidth: '200px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                padding: '0.5rem 0'
              }}>
                <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #dadce0', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ fontWeight: 600, color: '#202124' }}>{userProfile.name}</div>
                    {workspaceMember && workspaceMember.status === 'active' ? (
                      <span style={{ background: '#e0e7ff', color: '#4f46e5', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Work</span>
                    ) : (
                      <span style={{ background: '#f3f4f6', color: '#6b7280', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Free</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#5f6368' }}>{userProfile.email}</div>
                </div>
                {(workspaceMember?.role === 'admin' || workspaceMember?.role === 'owner' || !workspaceMember) && (
                  <a href="/admin" style={{ padding: '0.5rem 1rem', textDecoration: 'none', color: '#202124', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f3f4'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    {workspaceMember ? 'Admin Panel' : 'Create Workspace'}
                  </a>
                )}
                
                <a 
                  href="#startup-support" 
                  onClick={(e) => { e.preventDefault(); setShowStartupForm(true); setShowProfileMenu(false); }} 
                  style={{ padding: '0.5rem 1rem', textDecoration: 'none', color: '#202124', cursor: 'pointer' }} 
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f3f4'} 
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Startup Support
                </a>
                
                <div 
                  onClick={handleLogout}
                  style={{ padding: '0.5rem 1rem', cursor: 'pointer', color: '#d93025' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f3f4'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Log out
                </div>
              </div>
            )}
          </div>
        ) : (
          <OneTapLogin 
            onSuccess={handleLoginSuccess} 
            buttonText="Sign In"
            style={{
              backgroundColor: '#1a73e8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '0.5rem 1.5rem',
              fontWeight: 500,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          />
        )}
      </div>

      {showStartupForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ background: '#fff', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid #eaeaea' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#202124' }}>SoftBridge Startup Program</h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#5f6368' }}>Please provide your Organization ID during application: <strong style={{color: '#1a73e8', userSelect: 'all'}}>{userProfile?.workspace_id || 'default'}</strong></p>
              </div>
              <button onClick={() => setShowStartupForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#5f6368', padding: '0.5rem' }}>&times;</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              <iframe 
                src="https://forms.softbridgelabs.in/form/6a423feb203629cb06e01af7?embed=true" 
                width="100%" 
                height="600px" 
                frameBorder="0"
                style={{ border: 'none', borderRadius: '8px' }}
              ></iframe>
              <div style={{ fontFamily: 'sans-serif', fontSize: '11px', color: '#666', textAlign: 'center', marginTop: '10px' }}>
                Powered by <a href="https://forms.softbridgelabs.in" target="_blank" rel="noreferrer" style={{ color: 'var(--brand, #1a73e8)', textDecoration: 'none', fontWeight: 600 }}>SoftBridge Forms</a>
              </div>
            </div>
          </div>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          `}} />
        </div>
      )}
    </header>
  );
}
