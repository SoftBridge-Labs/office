'use client';

import { useState, useEffect } from 'react';

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export default function DateCard({ selectedDate }) {
  const day   = DAYS[selectedDate.getDay()];
  const date  = selectedDate.getDate();
  const month = MONTHS[selectedDate.getMonth()];
  const year  = selectedDate.getFullYear();

  return (
    <div style={{
      background: 'var(--text-primary)',
      borderRadius: 'var(--radius-xl)',
      padding: '1.75rem',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
    }}>
      <div>
        <div style={{ fontSize: '0.8rem', fontWeight: 500, opacity: 0.55, marginBottom: '0.35rem', letterSpacing: '0.04em' }}>
          {day.toUpperCase()}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.75rem', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em' }}>
          {date}
        </div>
        <div style={{ fontSize: '0.95rem', fontWeight: 500, opacity: 0.7, marginTop: '0.25rem' }}>
          {month} {year}
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.7rem', opacity: 0.45, marginBottom: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Local Time</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
            <Clock />
          </div>
        </div>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
