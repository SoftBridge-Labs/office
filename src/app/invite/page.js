'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import TopNav from '@/app/components/TopNav';

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: 'success' });

  useEffect(() => {
    const t = searchParams.get('token');
    if (t) setToken(t);

    if (typeof window !== 'undefined') {
      const localUser = localStorage.getItem('sb_user');
      if (localUser) {
        try { setUserProfile(JSON.parse(localUser)); } catch (e) {}
      }
    }
  }, [searchParams]);

  const handleAccept = async () => {
    setLoading(true);
    setMsg({ text: '', type: 'success' });
    try {
      const res = await api.acceptInvite({ token });
      setMsg({ text: res.message, type: res.success ? 'success' : 'error' });
      if (res.success && res.workspaceId) {
        setWorkspaceId(res.workspaceId);
        localStorage.setItem('sb_workspace_id', res.workspaceId);
        setTimeout(() => {
          router.push('/');
        }, 1500);
      }
    } catch (e) {
      setMsg({ text: e.message || 'Error accepting invite', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f8f9fa' }}>
      <TopNav userProfile={userProfile} isLoggedOut={!userProfile} />
      
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ padding: '2.5rem', border: '1px solid #dadce0', borderRadius: '10px', backgroundColor: '#fff', width: '100%', maxWidth: '450px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ width: '60px', height: '60px', backgroundColor: '#e8f0fe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#1a73e8' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#202124', marginBottom: '1rem' }}>
            Workspace Invitation
          </h1>
          
          {token ? (
            <>
              <p style={{ color: '#5f6368', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
                You have been invited to join a SoftBridge workspace.
              </p>
              
              {!userProfile ? (
                <div style={{ backgroundColor: '#fff3cd', padding: '1rem', borderRadius: '8px', color: '#856404', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Please log in to accept this invitation.
                </div>
              ) : (
                <button 
                  onClick={handleAccept} 
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#1a73e8',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 500,
                    fontSize: '1rem',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Accepting...' : 'Accept Invitation'}
                </button>
              )}
            </>
          ) : (
            <p style={{ color: '#5f6368', fontSize: '0.95rem' }}>Invalid or missing invitation link.</p>
          )}

          {msg.text && (
            <div style={{ marginTop: '1.25rem', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem', backgroundColor: msg.type === 'error' ? '#fce8e6' : '#e6f4ea', color: msg.type === 'error' ? '#c5221f' : '#137333' }}>
              {msg.text}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <InviteContent />
    </Suspense>
  );
}
