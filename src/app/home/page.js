'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';
import TopNav from '@/app/components/TopNav';
import { api } from '@/lib/api';

// Helper icons for the apps
const CalendarIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
    <rect x="8" y="14" width="2" height="2" fill="#4285F4"></rect>
  </svg>
);

const DocsIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const TasksIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#34A853" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4"></path>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
  </svg>
);

const MeetIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EA4335" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"></polygon>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
  </svg>
);

const BookmarksIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FBBC05" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
  </svg>
);

const WhiteboardIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8E24AA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21 15 16 10 5 21"></polyline>
  </svg>
);

export default function Home() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [recentItems, setRecentItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);

  // AI Guidance State
  const [aiGuidance, setAiGuidance] = useState(null);
  const [loadingAi, setLoadingAi] = useState(true);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const localUser = localStorage.getItem('sb_user');
      const localUid = localStorage.getItem('sb_uid');
      if (localUser) {
        try { setUserProfile(JSON.parse(localUser)); } catch (e) { }
      }
      if (localUid) {
        api.getAccount(localUid).then(res => {
          if (res.success && res.user) {
            setUserProfile(res.user);
            localStorage.setItem('sb_user', JSON.stringify(res.user));
          }
        }).catch(() => {});
      }
    }

    async function loadDashboardData() {
      setLoadingItems(true);
      setLoadingAi(true);
      try {
        // Parallel fetch for speed
        const [docsRes, tasksRes, wbRes, aiRes] = await Promise.all([
          api.getDocs().catch(() => ({})),
          api.getTasks().catch(() => ({})),
          api.getWhiteboards().catch(() => ({})),
          api.getAIGuidance().catch(() => ({ success: false }))
        ]);

        let allItems = [];
        if (docsRes.success && docsRes.data) allItems = [...allItems, ...docsRes.data.map(d => ({ ...d, type: 'doc', icon: <DocsIcon /> }))];
        if (tasksRes.success && tasksRes.data) allItems = [...allItems, ...tasksRes.data.map(t => ({ ...t, type: 'task', icon: <TasksIcon /> }))];
        if (wbRes.success && wbRes.data) allItems = [...allItems, ...wbRes.data.map(w => ({ ...w, type: 'whiteboard', icon: <WhiteboardIcon /> }))];

        allItems.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
        setRecentItems(allItems.slice(0, 4));

        if (aiRes.success && aiRes.data) {
          setAiGuidance(aiRes.data);
        }
      } catch (err) {
        console.error("Error fetching dashboard data", err);
      } finally {
        setLoadingItems(false);
        setLoadingAi(false);
      }
    }

    loadDashboardData();
  }, []);

  const getIconColor = (type) => {
    switch (type) {
      case 'doc': return '#e8f0fe';
      case 'task': return '#e6f4ea';
      case 'whiteboard': return '#f3e8fd';
      default: return '#e8eaed';
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column' }}>
      <TopNav userProfile={userProfile} isLoggedOut={!userProfile} />

      <main style={{ flex: 1, padding: '3rem 2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '0.5rem' }}>
          {userProfile?.avatar_url && (
            <img src={userProfile.avatar_url} alt={userProfile.name} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
          )}
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#202124', letterSpacing: '-0.02em', margin: 0 }}>
            {userProfile ? `Good afternoon, ${userProfile.name.split(' ')[0]}` : 'Good afternoon'}
          </h1>
        </div>
        <p style={{ fontSize: '1.1rem', color: '#5f6368', marginBottom: '3rem' }}>Here is what's happening in your workspace today.</p>

        <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>

          {/* AI Guidance Panel */}
          <div style={{
            backgroundColor: '#1a73e8',
            borderRadius: '16px',
            padding: '2rem',
            color: '#fff',
            boxShadow: '0 12px 24px rgba(26,115,232,0.15)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1, pointerEvents: 'none' }}>
              <svg width="150" height="150" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15 9l7 1-5 5 1 7-7-4-7 4 1-7-5-5 7-1z" />
              </svg>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ padding: '0.3rem 0.6rem', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>AI INSIGHTS</span>
              </div>
              <p style={{ fontSize: '1.1rem', lineHeight: 1.6, fontWeight: 500, marginBottom: '2rem' }}>
                {loadingAi ? 'Analyzing your workspace data...' : (aiGuidance?.guidance || 'Stay productive and collaborate with your team.')}
              </p>
            </div>

            {aiGuidance?.tasks && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {aiGuidance.tasks.map((task, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.5)' }}></div>
                    <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{task}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Apps */}
          <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            {[
              { name: 'Docs', icon: <DocsIcon />, link: '/docs', color: '#1a73e8' },
              { name: 'Tasks', icon: <TasksIcon />, link: '/tasks', color: '#fbbc04' },
              { name: 'Calendar', icon: <CalendarIcon />, link: '/calendar', color: '#ea4335' },
              { name: 'Whiteboard', icon: <WhiteboardIcon />, link: '/whiteboard', color: '#8e24aa' },
              { name: 'Meet', icon: <MeetIcon />, link: '/meet', color: '#00bcd4' },
            ].map(app => {
              const Wrapper = app.link ? Link : 'div';
              const props = app.link ? { href: app.link } : { onClick: app.onClick };
              return (
                <Wrapper key={app.name} {...props} style={{
                  backgroundColor: '#fff',
                  border: '1px solid #eaeaea',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  textDecoration: 'none',
                  color: '#202124',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }} onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.06)';
                  e.currentTarget.style.borderColor = app.color;
                }} onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                  e.currentTarget.style.borderColor = '#eaeaea';
                }}>
                  <div style={{ color: app.color, transform: 'scale(0.8)', transformOrigin: 'left center' }}>{app.icon}</div>
                  <span style={{ fontWeight: 600, fontSize: '1rem' }}>{app.name}</span>
                </Wrapper>
              );
            })}
          </div>

        </div>

        {/* Recent Work */}
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#202124', marginBottom: '1.5rem' }}>Jump back in</h2>

          {loadingItems ? (
            <div style={{ color: '#5f6368', padding: '2rem', textAlign: 'center' }}>Loading...</div>
          ) : recentItems.length > 0 ? (
            <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {recentItems.map((item, index) => (
                <div key={item._id || index} onClick={() => {
                  if (item.type === 'doc') router.push(`/doc/${item._id}`);
                  if (item.type === 'task') router.push(`/tasks`);
                  if (item.type === 'whiteboard') router.push(`/whiteboard/${item._id}`);
                }} style={{
                  backgroundColor: '#fff',
                  border: '1px solid #eaeaea',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.05)'} onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: getIconColor(item.type), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ transform: 'scale(0.6)' }}>{item.icon}</div>
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#202124', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title || 'Untitled'}
                      </h3>
                      <span style={{ fontSize: '0.8rem', color: '#5f6368' }}>
                        {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'Recently'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '3rem', backgroundColor: '#fff', border: '1px solid #eaeaea', borderRadius: '12px', textAlign: 'center' }}>
              <p style={{ color: '#5f6368', fontSize: '1rem', marginBottom: '1rem' }}>No recent activity found.</p>
              <button onClick={() => router.push('/docs')} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#1a73e8', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                Create a Document
              </button>
            </div>
          )}
        </div>
      </main>

    </div>
  );
}
