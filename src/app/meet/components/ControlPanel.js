'use client';

export default function ControlPanel({
  micActive,
  videoActive,
  toggleMic,
  toggleVideo,
  endCall
}) {
  return (
    <div style={{
      position: 'absolute',
      bottom: '1.5rem',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(18, 18, 20, 0.85)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '24px',
      padding: '0.85rem 2rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1.25rem',
      boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
      zIndex: 10
    }}>
      <button
        onClick={toggleMic}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: 'none',
          background: micActive ? 'rgba(255,255,255,0.08)' : '#ef4444',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}
        title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
      >
        {micActive ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
            <path d="M17 11a7 7 0 0 1-1.34 4.24M5 10v2a7 7 0 0 0 10.23 6.13"/>
            <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        )}
      </button>

      <button
        onClick={toggleVideo}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: 'none',
          background: videoActive ? 'rgba(255,255,255,0.08)' : '#ef4444',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}
        title={videoActive ? 'Stop Video' : 'Start Video'}
      >
        {videoActive ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        )}
      </button>

      <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.15)' }} />

      <button
        onClick={endCall}
        style={{
          padding: '0 1.5rem',
          height: '48px',
          borderRadius: '24px',
          border: 'none',
          background: '#ef4444',
          color: '#fff',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
          transition: 'all 0.2s ease',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M10.68 13.31a16 16 0 0 0 3.41 3.41l2.28-2.28a1 1 0 0 1 .92-.27 11.07 11.07 0 0 0 3.46.55 1 1 0 0 1 1 1v3.5a1 1 0 0 1-1 1A19.88 19.88 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.07 11.07 0 0 0 .55 3.46 1 1 0 0 1-.27.92l-2.28 2.28z"/>
        </svg>
        Leave Call
      </button>
    </div>
  );
}
