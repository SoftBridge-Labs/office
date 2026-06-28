'use client';

export default function MeetHeader({ statusMsg, remotePeerIds = [], id }) {
  return (
    <div style={{
      padding: '1.25rem 2rem',
      background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: remotePeerIds.length > 0 ? '#10b981' : '#f59e0b',
          boxShadow: remotePeerIds.length > 0 ? '0 0 12px #10b981' : '0 0 12px #f59e0b',
        }} />
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e4e4e7' }}>
          {statusMsg}
        </span>
      </div>
      <div style={{
        fontSize: '0.85rem',
        color: '#a1a1aa',
        fontWeight: 500,
        background: 'rgba(255,255,255,0.06)',
        padding: '0.4rem 0.85rem',
        borderRadius: '20px',
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center'
      }}>
        {id && id.startsWith('internal-') && (
          <span style={{
            fontSize: '0.7rem',
            background: '#3b82f6',
            color: '#fff',
            padding: '0.15rem 0.5rem',
            borderRadius: '4px',
            fontWeight: 700,
            marginRight: '0.25rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Internal Office Meet
          </span>
        )}
        <span>Room ID: <span style={{ color: '#fff', fontWeight: 700 }}>{id}</span></span>
      </div>
    </div>
  );
}
