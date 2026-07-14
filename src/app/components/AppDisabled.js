import React from 'react';

export default function AppDisabled({ appName }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      minHeight: '60vh',
      backgroundColor: '#f8f9fa',
      padding: '2rem'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '3rem',
        backgroundColor: '#fff',
        borderRadius: '16px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
        border: '1px solid #eaeaea',
        maxWidth: '500px',
        width: '100%'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          backgroundColor: '#fce8e6',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          color: '#d93025'
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#202124', marginBottom: '1rem' }}>
          Access Restricted
        </h2>
        <p style={{ color: '#5f6368', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          Your workspace administrator has disabled the <strong style={{ color: '#202124' }}>{appName}</strong> application. 
          If you believe this is an error, please contact your workspace admin.
        </p>
        <a href="/" style={{
          display: 'inline-block',
          padding: '0.75rem 1.5rem',
          backgroundColor: '#1a73e8',
          color: '#fff',
          textDecoration: 'none',
          fontWeight: 500,
          borderRadius: '8px',
          transition: 'background-color 0.2s'
        }}>
          Return to Dashboard
        </a>
      </div>
    </div>
  );
}
