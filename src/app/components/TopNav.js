'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import OneTapLogin from '@/app/components/OneTapLogin';
import { api } from '@/lib/api';

export default function TopNav({ userProfile, isLoggedOut }) {
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [workspaceMember, setWorkspaceMember] = useState(null);
  const [showStartupForm, setShowStartupForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef(null);

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
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{
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
        </Link>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.3rem', fontWeight: 600, color: '#202124', letterSpacing: '-0.02em' }}>SoftBridge Workspace</span>
        </Link>
      </div>

      <div style={{ flex: 1, maxWidth: '720px', margin: '0 2rem' }}>
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
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
                  <div style={{ fontWeight: 600, color: '#202124' }}>{userProfile.name}</div>
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
