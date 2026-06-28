'use client';

export default function ConfirmModal({ open, title, message, confirmLabel, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        background: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        width: '100%', maxWidth: '380px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        animation: 'slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        padding: '1.5rem'
      }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.5rem', color: '#0f172a', margin: 0 }}>
          {title || 'Confirm Action'}
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.5rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          {message || 'Are you sure you want to proceed?'}
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '0.55rem 1.125rem', borderRadius: '8px',
              border: '1px solid #e2e8f0', background: '#fff',
              fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', color: '#475569',
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '0.55rem 1.125rem', borderRadius: '8px',
              background: '#ef4444', color: '#fff',
              fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', border: 'none',
              transition: 'opacity 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
