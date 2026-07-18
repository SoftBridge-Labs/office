'use client';

import { useState, useEffect } from 'react';
import TopNav from '@/app/components/TopNav';
import { api } from '@/lib/api';
import styles from '../page.module.css';

const inputStyle = {
  width: '100%',
  padding: '0.65rem 0.75rem',
  border: '1px solid var(--border, #e2e8f0)',
  borderRadius: '8px',
  background: '#ffffff',
  fontSize: '0.875rem',
  color: 'var(--text-main, #1a1a1a)',
  outline: 'none',
  marginBottom: '0.75rem'
};

export default function BookmarksPage() {
  const [userProfile, setUserProfile] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Development');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const localUser = localStorage.getItem('sb_user');
      if (localUser) {
        try { setUserProfile(JSON.parse(localUser)); } catch (e) {}
      }
    }
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const res = await api.getBookmarks();
      if (res.success) {
        setBookmarks(res.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateBookmark = async (e) => {
    e.preventDefault();
    try {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      const res = await api.createBookmark({
        title, url, category, description, tags: tagList, isPublic: false
      });
      if (res.success) {
        setTitle('');
        setUrl('');
        setCategory('Development');
        setDescription('');
        setTags('');
        setShowAddForm(false);
        loadBookmarks();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteBookmark = async (id) => {
    if (!confirm('Are you sure you want to delete this bookmark?')) return;
    try {
      await api.deleteBookmark(id);
      loadBookmarks();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={styles.container}>
      <TopNav userProfile={userProfile} isLoggedOut={!userProfile} />
      
      <style>{`
        @media (max-width: 768px) {
          .bookmarks-main-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      
      <main className={styles.mainPanel}>
        <header className={styles.header}>
          <h2 className={styles.pageTitle}>Bookmarks Manager</h2>
          <button 
            onClick={() => setShowAddForm(!showAddForm)} 
            className={styles.actionBadge} 
            style={{ border: 'none', cursor: 'pointer', outline: 'none' }}
          >
            {showAddForm ? 'Cancel' : '+ Add Bookmark'}
          </button>
        </header>

        <div style={{ marginBottom: '2rem' }}>
          <input
            type="text"
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.85rem 1.2rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              fontSize: '0.95rem',
              outline: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
              transition: 'all 0.2s ease'
            }}
            onFocus={e => e.target.style.boxShadow = '0 4px 20px rgba(59, 130, 246, 0.15)'}
            onBlur={e => e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.03)'}
          />
        </div>

        <div className="bookmarks-main-grid" style={{ display: 'grid', gridTemplateColumns: showAddForm ? '1.2fr 1fr' : '1fr', gap: '2rem' }}>
          
          {/* Bookmarks List */}
          <div>
            {bookmarks.length === 0 ? (
              <div style={{ background: 'linear-gradient(145deg, #ffffff, #f8fafc)', padding: '4rem', borderRadius: '24px', textAlign: 'center', border: '1px dashed #cbd5e1', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '4rem', color: '#94a3b8', marginBottom: '1rem', display: 'block' }}>bookmark_border</span>
                <p style={{ color: '#475569', fontSize: '1.1rem', fontWeight: 500 }}>No bookmarks saved yet. Click "+ Add Bookmark" to get started.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {bookmarks.filter(bm => !searchQuery || (bm.title && bm.title.toLowerCase().includes(searchQuery.toLowerCase())) || (bm.description && bm.description.toLowerCase().includes(searchQuery.toLowerCase()))).map((bm) => (
                  <div key={bm._id} className="bookmark-card" style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                    <button 
                      onClick={() => handleDeleteBookmark(bm._id)}
                      className="delete-btn"
                      style={{ position: 'absolute', top: '16px', right: '16px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: '6px', display: 'flex', transition: 'all 0.2s', opacity: 0 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>delete</span>
                    </button>
                    <div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', background: 'linear-gradient(135deg, #fef3c7, #fde68a)', padding: '4px 10px', borderRadius: '12px', letterSpacing: '0.05em', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                        {bm.category}
                      </span>
                      <h4 style={{ fontWeight: 800, fontSize: '1.2rem', marginTop: '1rem', marginBottom: '0.5rem', color: '#0f172a', lineHeight: 1.3 }}>{bm.title}</h4>
                      <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '1rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{bm.description || 'No description provided.'}</p>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1.5rem' }}>
                        {bm.tags && bm.tags.map((t, idx) => (
                          <span key={idx} style={{ fontSize: '0.75rem', background: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: '6px', fontWeight: 500 }}>
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <a href={bm.url} target="_blank" rel="noopener noreferrer" className="visit-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#ffffff', textDecoration: 'none', padding: '0.75rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700, transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                      Visit Link <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>open_in_new</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Bookmark Sidebar */}
          {showAddForm && (
            <div style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(16px)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.6)', height: 'fit-content', boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>🔖 New Bookmark</h3>
                <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <form onSubmit={handleCreateBookmark}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', color: '#475569' }}>TITLE *</label>
                <input style={{ ...inputStyle, background: 'rgba(255,255,255,0.9)', border: '1px solid #cbd5e1', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }} type="text" placeholder="e.g. MDN Docs" value={title} onChange={e => setTitle(e.target.value)} required />

                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', color: '#475569', marginTop: '1rem' }}>URL *</label>
                <input style={{ ...inputStyle, background: 'rgba(255,255,255,0.9)', border: '1px solid #cbd5e1', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }} type="url" placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} required />

                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', color: '#475569', marginTop: '1rem' }}>CATEGORY</label>
                <select style={{ ...inputStyle, background: 'rgba(255,255,255,0.9)', border: '1px solid #cbd5e1' }} value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="Development">Development</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Reference">Reference</option>
                  <option value="Other">Other</option>
                </select>

                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', color: '#475569', marginTop: '1rem' }}>DESCRIPTION</label>
                <textarea style={{ ...inputStyle, resize: 'vertical', background: 'rgba(255,255,255,0.9)', border: '1px solid #cbd5e1' }} rows="3" placeholder="Brief note..." value={description} onChange={e => setDescription(e.target.value)} />

                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', color: '#475569', marginTop: '1rem' }}>TAGS (COMMA-SEPARATED)</label>
                <input style={{ ...inputStyle, background: 'rgba(255,255,255,0.9)', border: '1px solid #cbd5e1' }} type="text" placeholder="web, js, docs" value={tags} onChange={e => setTags(e.target.value)} />

                <button className="submit-btn" type="submit" style={{ width: '100%', padding: '0.85rem', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', marginTop: '1.5rem', boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)', transition: 'all 0.2s' }}>
                  Save Bookmark
                </button>
              </form>
            </div>
          )}

        </div>

        <style>{`
          .bookmark-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px rgba(0,0,0,0.08) !important;
            border-color: rgba(59, 130, 246, 0.3) !important;
          }
          .bookmark-card:hover .delete-btn {
            opacity: 1 !important;
          }
          .delete-btn:hover {
            background: #ef4444 !important;
            color: #ffffff !important;
          }
          .visit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6) !important;
          }
          .visit-btn:active {
            transform: translateY(0);
          }
          .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6) !important;
          }
          .submit-btn:active {
            transform: translateY(0);
          }
        `}</style>
      </main>
    </div>
  );
}
