'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import styles from './page.module.css';

export default function Home() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const localUser = localStorage.getItem('sb_user');
      if (localUser) {
        try {
          setUserProfile(JSON.parse(localUser));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  return (
    <div className={styles.container} style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#ededeb', width: '100vw' }}>
      <Sidebar userProfile={userProfile} isLoggedOut={!userProfile} />

      {/* Main Panel matching Calendar */}
      <main className={styles.mainPanel} style={{ flex: 1, padding: '2rem 4rem', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <h2 className={styles.pageTitle}>Overview</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {userProfile ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Welcome, {userProfile.name || 'User'}</span>
                <Link href="/calendar" style={{ padding: '0.5rem 1rem', background: '#1a1a1a', color: '#fff', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem' }}>
                  Go to Calendar
                </Link>
              </div>
            ) : (
              <>
                <Link href="/login" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', padding: '0.5rem 1rem' }}>
                  Sign In
                </Link>
                <Link href="/login?signup=true" style={{ padding: '0.5rem 1rem', background: '#1a1a1a', color: '#fff', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem' }}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </header>

        <div className={styles.dashboardGrid} style={{ flex: 1, overflowY: 'auto', paddingBottom: '2rem', gridTemplateColumns: '1fr 360px' }}>
          {/* Left Column App List (Swapped) */}
          <div className={styles.appCardGrid}>
            {/* Calendar Active Card */}
            <Link href="/calendar" className={`${styles.appRowCard} ${styles.cardPurple}`}>
              <div className={styles.appNameCol}>
                <span className={styles.appName}>Calendar</span>
                <span className={styles.appStatus}>Active</span>
              </div>
              <div className={styles.appDescCol}>
                Manage your schedules, configure connected calendars, and set availability booking slots.
              </div>
              <div className={styles.appActionCol}>
                <span className={styles.actionBadge}>Open</span>
              </div>
            </Link>

            {/* Docs Active Card */}
            <Link href="/docs" className={`${styles.appRowCard} ${styles.cardGreen}`}>
              <div className={styles.appNameCol}>
                <span className={styles.appName}>Docs</span>
                <span className={styles.appStatus}>Active</span>
              </div>
              <div className={styles.appDescCol}>
                Word processor with distraction-free rich layouts, real-time sync, and offline support.
              </div>
              <div className={styles.appActionCol}>
                <span className={styles.actionBadge}>Open</span>
              </div>
            </Link>

            {/* Tasks Active Card */}
            <Link href="/tasks" className={`${styles.appRowCard} ${styles.cardBlue}`}>
              <div className={styles.appNameCol}>
                <span className={styles.appName}>Tasks</span>
                <span className={styles.appStatus}>Active</span>
              </div>
              <div className={styles.appDescCol}>
                Sprint planning, board management, and task scheduling tools for teams and individuals.
              </div>
              <div className={styles.appActionCol}>
                <span className={styles.actionBadge}>Open</span>
              </div>
            </Link>

            {/* Bookmarks Active Card */}
            <Link href="/bookmarks" className={`${styles.appRowCard} ${styles.cardOrange}`}>
              <div className={styles.appNameCol}>
                <span className={styles.appName}>Bookmarks</span>
                <span className={styles.appStatus}>Active</span>
              </div>
              <div className={styles.appDescCol}>
                Organize, catalog, and manage quick-access directory links interconnected with docs and tasks.
              </div>
              <div className={styles.appActionCol}>
                <span className={styles.actionBadge}>Open</span>
              </div>
            </Link>

            {/* Whiteboard Active Card */}
            <Link href="/whiteboard" className={`${styles.appRowCard} ${styles.cardTeal}`}>
              <div className={styles.appNameCol}>
                <span className={styles.appName}>Whiteboard</span>
                <span className={styles.appStatus}>Active</span>
              </div>
              <div className={styles.appDescCol}>
                Element-based layout drawing, flow charts, and collaborative whiteboard sketching.
              </div>
              <div className={styles.appActionCol}>
                <span className={styles.actionBadge}>Open</span>
              </div>
            </Link>

            {/* Meet Active Card */}
            <Link href="/meet" className={`${styles.appRowCard} ${styles.cardRose}`}>
              <div className={styles.appNameCol}>
                <span className={styles.appName}>Meet</span>
                <span className={styles.appStatus}>Active</span>
              </div>
              <div className={styles.appDescCol}>
                Secure, high-definition video conferencing for teams with built-in chat, screen sharing, and reactions.
              </div>
              <div className={styles.appActionCol}>
                <span className={styles.actionBadge}>Open</span>
              </div>
            </Link>
          </div>

          {/* Right Column Hero block (Swapped) */}
          <div className={styles.heroCard} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', minHeight: '380px' }}>
            <div>
              <div className={styles.heroLabel}>SoftBridge Labs</div>
              <h1 className={styles.heroTitle}>
                Workspace
                <br />
                Suite
              </h1>
              <p className={styles.heroDesc} style={{ marginTop: '1.25rem' }}>
                Next-generation office applications for computation and scheduling — designed beautifully and built to perform.
              </p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '2rem' }}>
              <a
                href="#startup-support"
                onClick={(e) => {
                  window.dispatchEvent(new Event('open-startup-support'));
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: '#1a1a1a',
                  color: '#fff',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  textAlign: 'center',
                  transition: 'opacity 0.2s',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Apply for Startup Support
              </a>
              <Link
                href="/pricing"
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'rgba(0, 0, 0, 0.05)',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  color: '#1a1a1a',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  textAlign: 'center',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.08)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
              >
                View Pricing plans
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

