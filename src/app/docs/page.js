'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopNav from '@/app/components/TopNav';
import AppDisabled from '@/app/components/AppDisabled';
import { api } from '@/lib/api';
import styles from '../page.module.css';

export default function DocsDashboardPage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appDisabled, setAppDisabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const localUser = localStorage.getItem('sb_user');
      if (localUser) {
        try { setUserProfile(JSON.parse(localUser)); } catch (e) {}
      }
    }
    loadDocs();
  }, []);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const res = await api.getDocs();
      if (res.success) {
        setDocs(res.data || []);
      } else if (res.status === 403 || res.message?.toLowerCase().includes('disabled')) {
        setAppDisabled(true);
      }
    } catch (e) {
      if (e.message?.toLowerCase().includes('disabled') || e.status === 403) {
        setAppDisabled(true);
      } else {
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    try {
      const res = await api.createDoc({ title: 'Untitled Document', content: '', collaborators: [], isPublic: false });
      if (res.success && res.data) {
        router.push(`/doc/${res.data._id}`);
      }
    } catch (e) {
      alert(e.message);
    }
  };

  if (appDisabled) {
    return (
      <div className={styles.container}>
        <TopNav userProfile={userProfile} isLoggedOut={!userProfile} />
        <AppDisabled appName="Docs" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <TopNav userProfile={userProfile} isLoggedOut={!userProfile} />
      
      <main className={styles.mainPanel} style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Documents Workspace</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Create, edit, and collaborate on rich markdown files.</p>
          </div>
          <button 
            onClick={handleCreateNew} 
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--brand, #4f46e5)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'transform 0.15s, opacity 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>+</span> Create Document
          </button>
        </div>

        {/* Dashboard Grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, height: '200px' }}>
            <div style={{ width: '28px', height: '28px', border: '3px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : docs.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem 2rem',
            background: 'var(--bg-muted)',
            borderRadius: '16px',
            border: '2px dashed var(--border)',
            textAlign: 'center',
            gap: '1rem',
            flex: 1
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: 'var(--text-muted)' }}>description</span>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>No Documents Yet</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '300px' }}>Get started by creating your first document now.</p>
            <button
              onClick={handleCreateNew}
              style={{
                padding: '0.6rem 1.25rem',
                background: 'var(--text-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Start a Document
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Filter documents by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  backgroundColor: 'var(--bg-surface)'
                }}
              />
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem',
              paddingBottom: '2rem'
            }}>
              {docs.filter(doc => !searchQuery || (doc.title && doc.title.toLowerCase().includes(searchQuery.toLowerCase()))).map(doc => (
              <div 
                key={doc._id}
                onClick={() => router.push(`/doc/${doc._id}`)}
                style={{
                  background: 'var(--bg-surface)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  e.currentTarget.style.borderColor = 'var(--brand)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: 'var(--brand)' }}>description</span>
                  <h3 style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flex: 1
                  }}>
                    {doc.title || 'Untitled Document'}
                  </h3>
                </div>
                
                <p style={{
                  fontSize: '0.825rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.5',
                  margin: 0,
                  height: '4.5em',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  textOverflow: 'ellipsis'
                }}>
                  {doc.content || 'No description or content yet. Start writing...'}
                </p>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 'auto',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--bg-app)',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)'
                }}>
                  <span>Updated {doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString() : (doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'recently')}</span>
                  <span style={{
                    color: 'var(--brand)',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    Edit &rarr;
                  </span>
                </div>
              </div>
              ))}
            </div>
          </>
        )}
      </main>
      
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
