'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopNav from '@/app/components/TopNav';

export default function PricingPage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const localUser = localStorage.getItem('sb_user');
      if (localUser) {
        try { setUserProfile(JSON.parse(localUser)); } catch (e) {}
      }
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column' }}>
      <TopNav userProfile={userProfile} isLoggedOut={!userProfile} />

      <main style={{ flex: 1, padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, color: '#111827', marginBottom: '1rem', letterSpacing: '-0.03em' }}>
            Simple, transparent pricing
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#4b5563', maxWidth: '600px', margin: '0 auto' }}>
            Everything your team needs to collaborate, communicate, and grow. No hidden fees.
          </p>
        </div>

        {/* Pricing Cards */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', marginBottom: '4rem' }}>
          
          {/* Core Plan */}
          <div style={{
            background: '#fff',
            borderRadius: '24px',
            padding: '2.5rem',
            width: '100%',
            maxWidth: '450px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', backgroundColor: '#1a73e8' }} />
            
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>Workspace Core</h3>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>All the essential tools for your entire organization.</p>
            
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '2rem' }}>
              <span style={{ fontSize: '3.5rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.05em' }}>
                ₹199
              </span>
              <span style={{ color: '#6b7280', fontWeight: 500 }}>/user/month</span>
            </div>

            <button 
              onClick={() => router.push(userProfile ? '/admin/billing' : '/')}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: '#1a73e8',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: '2.5rem',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1557b0'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1a73e8'}
            >
              Get Started
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>What's included</div>
              {[
                'Unlimited Documents & Collaboration',
                'Advanced Task & Sprint Management',
                'Unlimited Bookmarks & Folders',
                'Collaborative Digital Whiteboards',
                'Up to 5 hours of Meet video calls per user',
                'Admin Directory & Access Controls'
              ].map((feature, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '-2px' }}>
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span style={{ color: '#4b5563', fontSize: '1rem' }}>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Add-ons Plan */}
          <div style={{
            background: '#f8fafc',
            borderRadius: '24px',
            padding: '2.5rem',
            width: '100%',
            maxWidth: '450px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>Pay-As-You-Go Add-ons</h3>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Scale your usage beyond the core limits seamlessly using workspace credits.</p>
            
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7"></polygon>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                  </svg>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>Meet Overage</h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280' }}>For when you exceed the 5hr limit</p>
                </div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#111827' }}>
                ₹10 <span style={{ fontSize: '1rem', fontWeight: 500, color: '#6b7280' }}>/ extra hour</span>
              </div>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#4b5563', lineHeight: 1.5 }}>
                Automatically deducted from your workspace credit balance. No hard cutoffs, just keep talking.
              </p>
            </div>

            <div style={{ background: '#fff', border: '1px dashed #cbd5e1', borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 8 12 12 16 14"></polyline>
                </svg>
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#475569' }}>More Add-ons Coming Soon</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>Storage, AI queries, & premium integrations.</p>
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
