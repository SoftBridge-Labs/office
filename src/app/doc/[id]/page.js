'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { api } from '@/lib/api';
import styles from '../../page.module.css';

export default function DocumentEditorPage() {
  const { id } = useParams();
  const router = useRouter();

  const [userProfile, setUserProfile] = useState(null);
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [collaborators, setCollaborators] = useState([]);
  const [isPublic, setIsPublic] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const localUser = localStorage.getItem('sb_user');
      if (localUser) {
        try { setUserProfile(JSON.parse(localUser)); } catch (e) {}
      }
    }
    loadDocument();
  }, [id]);

  const loadDocument = async () => {
    setLoading(true);
    try {
      const res = await api.getDocs();
      if (res.success && res.data) {
        const found = res.data.find(d => d._id === id);
        if (found) {
          setDocTitle(found.title || '');
          setDocContent(found.content || '');
          setCollaborators(found.collaborators || []);
          setIsPublic(found.isPublic || false);
        } else {
          router.push('/docs');
        }
      }
    } catch (e) {
      console.error(e);
      router.push('/docs');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!docTitle.trim()) return alert('Document title is required.');
    setSaving(true);
    try {
      const res = await api.updateDoc(id, {
        title: docTitle,
        content: docContent,
        collaborators,
        isPublic
      });
      if (res.success) {
        alert('Document saved successfully.');
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.deleteDoc(id);
      router.push('/docs');
    } catch (e) {
      alert(e.message);
    }
  };

  const handleTogglePublic = async () => {
    const nextPublic = !isPublic;
    setIsPublic(nextPublic);
    try {
      await api.updateDoc(id, {
        title: docTitle,
        content: docContent,
        collaborators,
        isPublic: nextPublic
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    const email = inviteEmail.trim().toLowerCase();
    
    if (collaborators.some(c => c.email?.toLowerCase() === email)) {
      alert('User is already a collaborator.');
      return;
    }

    const updated = [...collaborators, { email, role: 'editor' }];
    setCollaborators(updated);
    setInviteEmail('');
    try {
      await api.updateDoc(id, {
        title: docTitle,
        content: docContent,
        collaborators: updated,
        isPublic
      });
    } catch (e) {
      alert(e.message);
    }
  };

  const handleRemoveCollaborator = async (email) => {
    const updated = collaborators.filter(c => c.email?.toLowerCase() !== email.toLowerCase());
    setCollaborators(updated);
    try {
      await api.updateDoc(id, {
        title: docTitle,
        content: docContent,
        collaborators: updated,
        isPublic
      });
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className={styles.container}>
      <Sidebar userProfile={userProfile} isLoggedOut={!userProfile} />
      
      <main className={styles.mainPanel} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100vh', boxSizing: 'border-box' }}>
        
        {/* Navigation & Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
          <button 
            onClick={() => router.push('/docs')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_back</span>
            Back to Docs
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={handleDelete} 
              style={{
                padding: '0.5rem 1rem',
                background: '#fee2e2',
                color: '#ef4444',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'opacity 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Delete
            </button>
            <button 
              onClick={handleSave} 
              disabled={saving}
              style={{
                padding: '0.5rem 1.5rem',
                background: 'var(--text-primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                opacity: saving ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <div style={{ width: '28px', height: '28px', border: '3px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', flex: 1, minHeight: 0 }}>
            
            {/* Left Column: Editor */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%', minHeight: 0 }}>
              <input 
                style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-display)',
                  padding: '0.25rem 0',
                  borderBottom: '1px solid transparent',
                  transition: 'border-color 0.15s'
                }}
                value={docTitle} 
                onChange={e => setDocTitle(e.target.value)} 
                placeholder="Untitled Document" 
                onFocus={e => e.currentTarget.style.borderBottomColor = 'var(--brand)'}
                onBlur={e => e.currentTarget.style.borderBottomColor = 'transparent'}
              />

              <textarea 
                style={{ 
                  flex: 1, 
                  padding: '1.5rem', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border)', 
                  background: '#ffffff', 
                  color: 'var(--text-primary)', 
                  outline: 'none', 
                  fontFamily: 'Courier New, Courier, monospace', 
                  fontSize: '0.95rem', 
                  lineHeight: 1.6,
                  resize: 'none',
                  boxShadow: 'var(--shadow-xs)',
                  transition: 'border-color 0.15s, box-shadow 0.15s'
                }}
                value={docContent}
                onChange={e => setDocContent(e.target.value)}
                placeholder="Start writing here... (supports Markdown)"
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'var(--brand)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.08)';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                }}
              />
            </div>

            {/* Right Column: Collaboration & Sharing */}
            <div style={{
              background: 'var(--bg-surface)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              boxShadow: 'var(--shadow-xs)',
              overflowY: 'auto'
            }}>
              {/* Access Settings */}
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: 'var(--brand)' }}>share</span>
                  Access Settings
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-muted)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{isPublic ? 'Public Link' : 'Private'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {isPublic ? 'Anyone with the link can view' : 'Only invited members can view'}
                    </div>
                  </div>
                  <button 
                    onClick={handleTogglePublic}
                    style={{
                      padding: '0.35rem 0.75rem',
                      background: isPublic ? 'var(--brand)' : 'var(--text-secondary)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {isPublic ? 'Make Private' : 'Make Public'}
                  </button>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

              {/* Invite Collaborators */}
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: 'var(--brand)' }}>group_add</span>
                  Invite Collaborators
                </h3>
                <form onSubmit={handleInvite} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="email"
                    placeholder="user@softbridgelabs.in"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    required
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.75rem',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      outline: 'none',
                      background: '#fff'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'var(--text-primary)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Invite
                  </button>
                </form>
              </div>

              {/* Collaborators List */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Collaborators ({collaborators.length})
                </h4>
                {collaborators.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0' }}>
                    No collaborators added yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
                    {collaborators.map(member => (
                      <div 
                        key={member.email} 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem 0.75rem',
                          background: 'var(--bg-muted)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          fontSize: '0.8rem'
                        }}
                      >
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, paddingRight: '0.5rem' }}>
                          <span style={{ fontWeight: 600 }}>{member.email}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCollaborator(member.email)}
                          style={{
                            border: 'none',
                            background: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '2px',
                            borderRadius: '4px'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
