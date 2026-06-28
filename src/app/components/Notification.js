'use client';

export default function Notification({ notification, onDismiss }) {
  if (!notification) return null;

  const styles = {
    success: { bg: 'var(--success-bg)', border: 'var(--success)', color: '#065f46' },
    error:   { bg: 'var(--danger-bg)',  border: 'var(--danger)',  color: '#991b1b' },
    info:    { bg: 'var(--brand-subtle)', border: 'var(--brand)', color: '#3730a3' },
  };
  const s = styles[notification.type] || styles.info;

  return (
    <div style={{
      position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.75rem 1rem',
      background: s.bg,
      border: `1px solid ${s.border}`,
      color: s.color,
      borderRadius: 'var(--radius-md)',
      fontSize: '0.85rem', fontWeight: 500,
      boxShadow: 'var(--shadow-lg)',
      maxWidth: '360px', minWidth: '240px',
      animation: 'slideIn 0.2s ease both',
    }}>
      <span style={{ flex: 1, lineHeight: 1.4 }}>{notification.message}</span>
      <button
        onClick={onDismiss}
        style={{ color: s.color, opacity: 0.6, fontSize: '1rem', padding: '0 2px', lineHeight: 1 }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
