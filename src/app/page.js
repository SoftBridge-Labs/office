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
    <div className={styles.container}>
      {/* Global Sidebar Panel */}
      <Sidebar userProfile={userProfile} isLoggedOut={!userProfile} />

      {/* Main Panel matching Calendar */}
      <main className={styles.mainPanel}>
        <header className={styles.header}>
          <h2 className={styles.pageTitle}>Overview</h2>
        </header>

        <div className={styles.dashboardGrid}>
          {/* Left Column Hero block */}
          <div className={styles.heroCard}>
            <div>
              <div className={styles.heroLabel}>SoftBridge Labs</div>
              <h1 className={styles.heroTitle}>
                Workspace
                <br />
                Suite
              </h1>
            </div>
            <p className={styles.heroDesc}>
              Next-generation office applications for computation and scheduling — designed beautifully and built to perform.
            </p>
          </div>

          {/* Right Column App List */}
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
          </div>
        </div>
      </main>
    </div>
  );
}
