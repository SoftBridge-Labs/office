'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import TopNav from '@/app/components/TopNav';
import { api } from '@/lib/api';
import styles from '../home/page.module.css';

const inputStyle = {
  padding: '0.5rem 0.75rem',
  border: '1px solid #dadce0',
  borderRadius: '6px',
  fontSize: '0.9rem',
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
};

const btnPrimary = {
  padding: '0.5rem 1.25rem',
  backgroundColor: '#1a73e8',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 500,
  fontSize: '0.9rem',
};

export default function AdminPanelLayout({ children }) {
  const [userProfile, setUserProfile] = useState(null);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [workspaceInput, setWorkspaceInput] = useState('');
  const [workspaceId, setWorkspaceId] = useState('default');
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const localUser = localStorage.getItem('sb_user');
      if (localUser) {
        try { setUserProfile(JSON.parse(localUser)); } catch (e) {}
      }
      
      const checkWorkspaces = async () => {
        try {
          const res = await api.getMyWorkspaces();
          if (res.success && res.data && res.data.length > 0) {
            const existingId = res.data[0].workspace_id;
            localStorage.setItem('sb_workspace_id', existingId);
            setWorkspaceId(existingId);
          } else {
            setShowWorkspaceModal(true);
          }
        } catch (error) {
          const wId = localStorage.getItem('sb_workspace_id');
          if (!wId || wId === 'default') {
            setShowWorkspaceModal(true);
          } else {
            setWorkspaceId(wId);
          }
        }
      };
      
      checkWorkspaces();
    }
  }, []);

  const saveWorkspace = () => {
    if (workspaceInput.trim()) {
      localStorage.setItem('sb_workspace_id', workspaceInput.trim());
      setWorkspaceId(workspaceInput.trim());
      setShowWorkspaceModal(false);
      window.location.reload();
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'users', label: 'Users', icon: 'group' },
    { id: 'billing', label: 'Billing', icon: 'credit_card' },
    { id: 'departments', label: 'Departments', icon: 'corporate_fare' },
    { id: 'apps', label: 'Apps', icon: 'extension' },
    { id: 'permissions', label: 'Permissions', icon: 'key' },
    { id: 'security', label: 'Security & SSO', icon: 'security' },
    { id: 'domains', label: 'Domains', icon: 'language' },
    { id: 'audit', label: 'Audit Logs', icon: 'receipt_long' },
  ];

  return (
    <div className={styles.container || ''} style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f8fafc', color: '#1e293b' }}>
      <TopNav userProfile={userProfile} isLoggedOut={!userProfile} />
      <main style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <nav style={{ width: '250px', flexShrink: 0, backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', padding: '1.75rem 1rem', overflowY: 'auto' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', padding: '0 0.85rem', marginBottom: '0.5rem' }}>Admin Console</p>
          <div style={{ padding: '0 0.85rem', marginBottom: '1.5rem', fontSize: '0.7rem', color: '#94a3b8' }}>
            Org ID: <span style={{ userSelect: 'all', color: '#64748b', fontWeight: 600 }}>{userProfile?.workspace_id || workspaceId}</span>
          </div>
          {tabs.map(tab => {
            const isActive = pathname === `/admin/${tab.id}`;
            return (
              <Link key={tab.id} href={`/admin/${tab.id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', textAlign: 'left', padding: '0.65rem 0.85rem',
                  borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: isActive ? 600 : 500,
                  backgroundColor: isActive ? '#eff6ff' : 'transparent',
                  color: isActive ? '#2563eb' : '#475569',
                  marginBottom: '4px',
                  textDecoration: 'none',
                  transition: 'background-color 0.2s, color 0.2s'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', fontWeight: isActive ? 600 : 400 }}>{tab.icon}</span>
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2.5rem 3.5rem', backgroundColor: '#f8fafc', position: 'relative' }}>
          
          {showWorkspaceModal && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.9)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ padding: '2rem', border: '1px solid #dadce0', borderRadius: '10px', backgroundColor: '#fff', width: '400px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <h2 style={{ marginBottom: '1rem', fontSize: '1.4rem' }}>Welcome to Workspace Admin</h2>
                <p style={{ color: '#5f6368', marginBottom: '1.5rem', fontSize: '0.9rem' }}>You need a unique Organization ID to manage your workspace and receive startup credits.</p>
                
                <div style={{ paddingBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Create New Organization</h3>
                  <button onClick={async () => {
                    try {
                      const res = await api.initWorkspace();
                      if (res.success && res.workspaceId) {
                        localStorage.setItem('sb_workspace_id', res.workspaceId);
                        setWorkspaceId(res.workspaceId);
                        setShowWorkspaceModal(false);
                        window.location.reload();
                      }
                    } catch (e) {
                      console.error("Failed to initialize workspace", e);
                    }
                  }} style={{ ...btnPrimary, width: '100%', backgroundColor: '#0f9d58' }}>Generate Unique Org ID & Continue</button>
                </div>
              </div>
            </div>
          )}

          <div style={{ maxWidth: '900px' }}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
