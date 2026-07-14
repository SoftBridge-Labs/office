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

        <div style={{ display: 'grid', gridTemplateColumns: showAddForm ? '1.2fr 1fr' : '1fr', gap: '2rem' }}>
          
          {/* Bookmarks List */}
          <div>
            {bookmarks.length === 0 ? (
              <div style={{ background: '#ffffff', padding: '3rem', borderRadius: '24px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--text-muted)' }}>bookmark_border</span>
                <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>No bookmarks saved yet. Click "+ Add Bookmark" to get started.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {bookmarks.map((bm) => (
                  <div key={bm._id} style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
                    <button 
                      onClick={() => handleDeleteBookmark(bm._id)}
                      style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>delete</span>
                    </button>
                    <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', background: '#fffbeb', padding: '2px 8px', borderRadius: '100px' }}>
                        {bm.category}
                      </span>
                      <h4 style={{ fontWeight: 800, fontSize: '1.1rem', marginTop: '0.5rem', marginBottom: '0.25rem' }}>{bm.title}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-dark-gray)', marginBottom: '0.75rem' }}>{bm.description || 'No description provided.'}</p>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '1rem' }}>
                        {bm.tags && bm.tags.map((t, idx) => (
                          <span key={idx} style={{ fontSize: '0.7rem', background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: '4px' }}>
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <a href={bm.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', background: 'var(--text-main)', color: '#ffffff', textDecoration: 'none', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                      Visit Link
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Bookmark Sidebar */}
          {showAddForm && (
            <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '24px', border: '1px solid var(--border-subtle)', height: 'fit-content' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem' }}>New Bookmark</h3>
              
              <form onSubmit={handleCreateBookmark}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Title *</label>
                <input style={inputStyle} type="text" placeholder="e.g. MDN Docs" value={title} onChange={e => setTitle(e.target.value)} required />

                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>URL *</label>
                <input style={inputStyle} type="url" placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} required />

                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Category</label>
                <select style={inputStyle} value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="Development">Development</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Reference">Reference</option>
                  <option value="Other">Other</option>
                </select>

                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Description</label>
                <textarea style={{ ...inputStyle, resize: 'vertical' }} rows="2" placeholder="Brief note..." value={description} onChange={e => setDescription(e.target.value)} />

                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Tags (comma-separated)</label>
                <input style={inputStyle} type="text" placeholder="web, js, docs" value={tags} onChange={e => setTags(e.target.value)} />

                <button type="submit" style={{ width: '100%', padding: '0.65rem', background: 'var(--text-main)', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                  Save Bookmark
                </button>
              </form>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
