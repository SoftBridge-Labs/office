'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const NAV_ITEMS = [
  {
    label: 'Calendar', href: '/calendar',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    label: 'Docs', href: '/docs',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
  },
  {
    label: 'Tasks', href: '/tasks',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
  },
  {
    label: 'Bookmarks', href: '/bookmarks',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    label: 'Whiteboard', href: '/whiteboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
  },
  {
    label: 'Meet', href: '/meet',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    ),
  },
];

export default function Sidebar({ userProfile, isLoggedOut }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [aiUsage, setAiUsage] = useState(null);

  useEffect(() => {
    if (!isLoggedOut) {
      api.getAiUsage().then(res => { if (res.success) setAiUsage(res); }).catch(() => {});
    }
  }, [isLoggedOut]);

  const handleLogout = () => {
    localStorage.removeItem('sb_id_token');
    localStorage.removeItem('sb_uid');
    router.push('/login');
  };

  const s = {
    aside: {
      width: '220px', height: '100vh', display: 'flex', flexDirection: 'column',
      padding: '1.25rem 1rem', borderRight: '1px solid var(--border)',
      background: 'var(--bg-surface)', position: 'sticky', top: 0, zIndex: 100, flexShrink: 0,
    },
    logo: { display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '2rem', padding: '0 0.25rem' },
    logoMark: {
      width: '28px', height: '28px', borderRadius: '7px', flexShrink: 0,
      background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '-0.02em',
    },
    logoText: { fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' },
    sectionLabel: { fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0 0.5rem', marginBottom: '0.4rem' },
    bottomSection: { marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' },
  };

  return (
    <aside style={s.aside}>
      {/* Logo */}
      <Link href="/" style={s.logo}>
        <span style={s.logoText}>SoftBridge Workspace</span>
      </Link>

      {/* Nav */}
      <div style={{ flex: 1 }}>
        <div style={s.sectionLabel}>Workspace</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {NAV_ITEMS.map(item => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href} href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.625rem',
                  padding: '0.55rem 0.625rem', borderRadius: 'var(--radius)',
                  fontWeight: active ? 600 : 500, fontSize: '0.85rem',
                  color: active ? 'var(--brand)' : 'var(--text-secondary)',
                  background: active ? 'var(--brand-subtle)' : 'transparent',
                  transition: 'all 0.12s',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
              >
                <span style={{ opacity: active ? 1 : 0.7 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ ...s.sectionLabel, marginTop: '1.5rem' }}>Platform</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <Link
            href="/pricing"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.625rem',
              padding: '0.55rem 0.625rem', borderRadius: 'var(--radius)',
              fontWeight: pathname === '/pricing' ? 600 : 500, fontSize: '0.85rem',
              color: pathname === '/pricing' ? 'var(--brand)' : 'var(--text-secondary)',
              background: pathname === '/pricing' ? 'var(--brand-subtle)' : 'transparent',
              transition: 'all 0.12s',
              textDecoration: 'none',
            }}
            onMouseEnter={e => { if (pathname !== '/pricing') { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
            onMouseLeave={e => { if (pathname !== '/pricing') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
          >
            <span style={{ opacity: pathname === '/pricing' ? 1 : 0.7 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </span>
            Pricing
          </Link>

          <a
            href="#startup-support"
            onClick={(e) => {
              window.dispatchEvent(new Event('open-startup-support'));
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.625rem',
              padding: '0.55rem 0.625rem', borderRadius: 'var(--radius)',
              fontWeight: 500, fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              background: 'transparent',
              transition: 'all 0.12s',
              textDecoration: 'none',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <span style={{ opacity: 0.7 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </span>
            Startup Support
          </a>
        </nav>
      </div>

      {/* Bottom section */}
      <div style={s.bottomSection}>
        {/* Local Storage Sandbox Notification */}
        {isLoggedOut && (
          <div style={{
            padding: '0.75rem',
            background: 'var(--brand-subtle)',
            border: '1px dashed var(--brand-border)',
            borderRadius: 'var(--radius)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            marginBottom: '0.25rem'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: '4.5px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.05rem', verticalAlign: 'middle' }}>cloud_off</span>
              Local Sandbox Mode
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
              Data is saved to local storage. Sign in or join with a new account to save to the cloud.
            </div>
          </div>
        )}

        {/* AI Usage */}
        {aiUsage && (
          <div style={{ padding: '0.625rem 0.75rem', background: 'var(--brand-subtle)', border: '1px solid var(--brand-border)', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: aiUsage.isPremium ? 'var(--success)' : 'var(--warning)', background: 'var(--bg-surface)', padding: '1px 5px', borderRadius: '4px' }}>
                {aiUsage.isPremium ? 'PRO' : 'FREE'}
              </span>
            </div>
            <div style={{ height: '4px', background: 'var(--brand-border)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min((aiUsage.usedToday / aiUsage.limit) * 100, 100)}%`, background: 'var(--brand)', borderRadius: '99px', transition: 'width 0.5s' }} />
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {aiUsage.usedToday} / {aiUsage.limit} today
            </div>
          </div>
        )}

        {/* User / Auth */}
        {isLoggedOut ? (
          <button
            onClick={() => router.push('/login')}
            style={{ width: '100%', padding: '0.6rem', background: 'var(--text-primary)', color: '#fff', borderRadius: 'var(--radius)', fontSize: '0.825rem', fontWeight: 600, transition: 'opacity 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Sign In
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.375rem 0.25rem' }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
              background: 'var(--brand-subtle)', border: '1px solid var(--brand-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--brand)', fontWeight: 700, fontSize: '0.75rem',
            }}>
              {(userProfile?.name || userProfile?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userProfile?.name || 'User'}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userProfile?.email || ''}
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              style={{ color: 'var(--text-muted)', padding: '4px', borderRadius: 'var(--radius-sm)', transition: 'all 0.15s', lineHeight: 1 }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--danger-bg)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
