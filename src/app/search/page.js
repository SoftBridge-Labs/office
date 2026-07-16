'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import TopNav from '@/app/components/TopNav';
import Sidebar from '@/app/components/Sidebar';
import { api } from '@/lib/api';

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const localUser = localStorage.getItem('sb_user');
      if (localUser) {
        try { setUserProfile(JSON.parse(localUser)); } catch (e) { }
      }
    }
  }, []);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setLoading(false);
      return;
    }

    async function performSearch() {
      setLoading(true);
      try {
        const [docsRes, tasksRes, wbRes, bmRes] = await Promise.all([
          api.getDocs().catch(() => ({})),
          api.getTasks().catch(() => ({})),
          api.getWhiteboards().catch(() => ({})),
          api.getBookmarks().catch(() => ({}))
        ]);

        let allItems = [];
        if (docsRes.success && docsRes.data) allItems = [...allItems, ...docsRes.data.map(d => ({ ...d, type: 'doc', label: 'Document' }))];
        if (tasksRes.success && tasksRes.data) allItems = [...allItems, ...tasksRes.data.map(t => ({ ...t, type: 'task', label: 'Task' }))];
        if (wbRes.success && wbRes.data) allItems = [...allItems, ...wbRes.data.map(w => ({ ...w, type: 'whiteboard', label: 'Whiteboard' }))];
        if (bmRes.success && bmRes.data) allItems = [...allItems, ...bmRes.data.map(b => ({ ...b, type: 'bookmark', label: 'Bookmark' }))];

        const lowerQuery = query.toLowerCase();
        const filtered = allItems.filter(item => {
          const titleMatch = item.title && item.title.toLowerCase().includes(lowerQuery);
          const descMatch = item.description && item.description.toLowerCase().includes(lowerQuery);
          return titleMatch || descMatch;
        });

        filtered.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
        setResults(filtered);
      } catch (err) {
        console.error("Search error", err);
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [query]);

  const handleNavigate = (item) => {
    if (item.type === 'doc') router.push(`/doc/${item._id}`);
    if (item.type === 'task') router.push(`/tasks`);
    if (item.type === 'whiteboard') router.push(`/whiteboard/${item._id}`);
    if (item.type === 'bookmark') router.push(`/bookmarks`);
  };

  return (
    <div style={{ flex: 1, padding: '3rem 2rem', maxWidth: '1000px', width: '100%' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#202124', marginBottom: '0.5rem' }}>Search Results</h1>
      <p style={{ fontSize: '1.1rem', color: '#5f6368', marginBottom: '2rem' }}>
        Showing results for <strong>"{query}"</strong>
      </p>

      {loading ? (
        <div style={{ color: '#5f6368' }}>Searching your workspace...</div>
      ) : results.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {results.map((item, i) => (
            <div 
              key={i} 
              onClick={() => handleNavigate(item)}
              style={{
                backgroundColor: '#fff',
                border: '1px solid #eaeaea',
                borderRadius: '12px',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.05)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#1a73e8' }}>{item.title || 'Untitled'}</h3>
                {item.description && <p style={{ margin: 0, color: '#5f6368', fontSize: '0.9rem' }}>{item.description}</p>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', backgroundColor: '#f1f3f4', borderRadius: '4px', color: '#5f6368', fontWeight: 600 }}>
                  {item.label}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#9aa0a6', marginTop: '0.5rem' }}>
                  {new Date(item.updatedAt || item.createdAt || 0).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '3rem', backgroundColor: '#fff', border: '1px solid #eaeaea', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ color: '#5f6368', fontSize: '1.1rem', marginBottom: '1rem' }}>No results found in your workspace.</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const localUser = localStorage.getItem('sb_user');
      if (localUser) {
        try { setUserProfile(JSON.parse(localUser)); } catch (e) { }
      }
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column' }}>
      <TopNav userProfile={userProfile} isLoggedOut={!userProfile} />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar activePage="home" />
        <Suspense fallback={<div style={{ padding: '2rem' }}>Loading...</div>}>
          <SearchResults />
        </Suspense>
      </div>
    </div>
  );
}
