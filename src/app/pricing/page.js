'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';
import styles from '../page.module.css';

export default function PricingPage() {
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

  const comparisonFeatures = [
    { category: 'Calendar', name: 'Connected Calendars', free: '1 integration', pro: 'Unlimited integrations' },
    { category: 'Calendar', name: 'Custom Booking Slots', free: 'Basic (15 min only)', pro: 'Unlimited custom slots & buffers' },
    { category: 'Docs', name: 'Document Limit', free: 'Up to 10 docs', pro: 'Unlimited docs' },
    { category: 'Docs', name: 'Real-time Collaboration', free: 'Read-only sharing', pro: 'Full edit & sync' },
    { category: 'Docs', name: 'AI Writing Assistant', free: '✕', pro: 'Included (unlimited prompts)' },
    { category: 'Tasks', name: 'Sprint Boards', free: 'Up to 3 boards', pro: 'Unlimited boards' },
    { category: 'Tasks', name: 'Team Assignments', free: '✕', pro: 'Included' },
    { category: 'Bookmarks', name: 'Quick-access Links', free: 'Up to 50 links', pro: 'Unlimited links & categories' },
    { category: 'Whiteboard', name: 'Elements & Export', free: 'Standard tools', pro: 'Collaborative sketching & vector exports' },
    { category: 'Meet', name: 'Call Duration Limit', free: '40 minutes', pro: 'Unlimited' },
    { category: 'Meet', name: 'High-definition Video', free: '720p', pro: '1080p Full HD' },
    { category: 'Meet', name: 'Screen Sharing & Recording', free: 'Sharing only', pro: 'Sharing & Cloud Recording' },
    { category: 'Platform', name: 'Ecosystem Ads', free: 'Supported by ads', pro: 'Ad-free experience' },
    { category: 'Platform', name: 'Support Tier', free: 'Standard community support', pro: 'Priority 24/7 assistance' },
  ];

  return (
    <div className={styles.container} style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#ededeb', width: '100vw' }}>
      <Sidebar userProfile={userProfile} isLoggedOut={!userProfile} />

      <main className={styles.mainPanel} style={{ flex: 1, padding: '2.5rem 4rem', height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <header className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexShrink: 0 }}>
          <div>
            <h2 className={styles.pageTitle} style={{ fontSize: '2rem', color: '#0f172a' }}>Pricing Plans</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Choose the perfect plan to supercharge your workspace productivity.
            </p>
          </div>
        </header>

        {/* Pricing Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem',
          marginBottom: '4rem',
          alignItems: 'stretch',
          flexShrink: 0
        }}>
          {/* Free Tier */}
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '2.5rem 2rem',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Free</span>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, margin: '0.5rem 0', color: 'var(--text-primary)' }}>Starter</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>$0</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ month</span>
              </div>
              
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Get started with core workspace features. Ideal for individuals managing personal booking, notes, and task lists.
              </p>
            </div>

            <Link href="/login" style={{
              display: 'block',
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-primary)',
              textAlign: 'center',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.85rem',
              marginTop: '2.5rem',
              transition: 'background-color 0.2s',
              border: '1px solid var(--border)'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--border)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-app)'}
            >
              Get Started
            </Link>
          </div>

          {/* Pro Tier (Featured, aligned with brand color) */}
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '2.5rem 2rem',
            border: '2px solid var(--brand)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{
              position: 'absolute',
              top: '-12px',
              right: '1.5rem',
              background: 'var(--brand)',
              color: '#ffffff',
              padding: '0.25rem 0.75rem',
              borderRadius: '99px',
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Most Popular
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pro</span>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, margin: '0.5rem 0', color: 'var(--text-primary)' }}>Professional</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--brand)' }}>₹399</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ month</span>
              </div>
              
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Unlock unlimited sync, advanced booking pages, AI features, and seamless team collaboration across all workspace apps.
              </p>
            </div>

            <a href="https://account.softbridgelabs.in/premium" style={{
              display: 'block',
              width: '100%',
              padding: '0.75rem',
              background: 'var(--brand)',
              color: '#ffffff',
              textAlign: 'center',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.85rem',
              marginTop: '2.5rem',
              transition: 'opacity 0.2s',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Upgrade Now
            </a>
          </div>

          {/* Startup / Enterprise Tier */}
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '2.5rem 2rem',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Startup / Enterprise</span>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, margin: '0.5rem 0', color: 'var(--text-primary)' }}>SaaS Program</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2.0rem', fontWeight: 800, color: 'var(--text-primary)' }}>Custom</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ scale</span>
              </div>
              
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Advanced security, dedicated tenant controls, custom domain bookings, and priority team deployment support.
              </p>
            </div>

            <a 
              href="#startup-support" 
              onClick={(e) => {
                window.dispatchEvent(new Event('open-startup-support'));
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'var(--text-primary)',
                color: '#ffffff',
                textAlign: 'center',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.85rem',
                marginTop: '2.5rem',
                transition: 'opacity 0.2s',
                boxShadow: 'var(--shadow-xs)'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Apply for Startup Support
            </a>
          </div>
        </div>

        {/* Features Comparison Table */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: '2.5rem 2rem',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '3rem'
        }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem', color: '#0f172a' }}>
            Detailed Feature Comparison
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '1rem 0.5rem', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', width: '35%' }}>Workspace Feature</th>
                  <th style={{ padding: '1rem 0.5rem', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', width: '30%' }}>Free Plan</th>
                  <th style={{ padding: '1rem 0.5rem', fontWeight: 600, color: 'var(--brand)', fontSize: '0.9rem', width: '35%' }}>Professional Plan</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feat, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem 0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.15rem' }}>
                        {feat.category}
                      </span>
                      {feat.name}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', fontSize: '0.85rem', color: feat.free === '✕' ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
                      {feat.free}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {feat.pro}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
