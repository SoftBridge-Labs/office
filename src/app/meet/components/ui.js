import React from 'react';

// ─── Design Tokens ──────────────────────────────────────────────────────────
export const C = {
  bg:        '#13141b',
  sidebar:   '#0f1017',
  panel:     '#1a1b25',
  card:      '#1f2030',
  border:    'rgba(255,255,255,0.07)',
  text:      '#e8eaf0',
  muted:     '#6b7280',
  accent:    '#4f7ef7',
  accentHov: '#6b93ff',
  danger:    '#ef4444',
  success:   '#10b981',
  amber:     '#f59e0b',
  violet:    '#7c3aed',
};

// ─── Reusable UI Atoms ───────────────────────────────────────────────────────
export const Avatar = ({ name, avatar_url, size = 32, color }) => {
  if (avatar_url) {
    return (
      <img
        src={avatar_url}
        alt={name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, userSelect: 'none' }}
      />
    );
  }
  const palette = ['#4f7ef7','#7c3aed','#ec4899','#14b8a6','#f59e0b','#ef4444','#10b981','#6366f1'];
  const bg = color || palette[(name || 'U').charCodeAt(0) % palette.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.4, color: '#fff', userSelect: 'none'
    }}>
      {(name || 'U').charAt(0).toUpperCase()}
    </div>
  );
};

export const IconBtn = ({ icon, label, active, danger, onClick, size = 42, badge, style: extraStyle = {} }) => (
  <button
    onClick={onClick}
    title={label}
    style={{
      width: size, height: size,
      borderRadius: '50%',
      border: 'none',
      background: danger ? C.danger : active ? 'rgba(79,126,247,0.2)' : 'rgba(255,255,255,0.07)',
      color: danger ? '#fff' : active ? C.accent : C.text,
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative',
      transition: 'all 0.18s cubic-bezier(.4,0,.2,1)',
      flexShrink: 0,
      ...extraStyle
    }}
    onMouseEnter={e => {
      e.currentTarget.style.background = danger ? '#dc2626' : active ? 'rgba(79,126,247,0.35)' : 'rgba(255,255,255,0.13)';
      e.currentTarget.style.transform = 'scale(1.08)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background = danger ? C.danger : active ? 'rgba(79,126,247,0.2)' : 'rgba(255,255,255,0.07)';
      e.currentTarget.style.transform = 'scale(1)';
    }}
  >
    <span className="material-symbols-outlined" style={{ fontSize: size * 0.44 }}>{icon}</span>
    {badge && (
      <span style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: '50%', background: C.danger, border: `2px solid ${C.bg}` }} />
    )}
  </button>
);

export const PillBtn = ({ icon, label, active, onClick, color }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: '0.45rem',
      padding: '0 1rem', height: '40px',
      borderRadius: '20px', border: 'none', cursor: 'pointer',
      background: active ? (color || 'rgba(79,126,247,0.2)') : 'rgba(255,255,255,0.07)',
      color: active ? (color ? '#fff' : C.accent) : C.muted,
      fontSize: '0.8rem', fontWeight: 600,
      transition: 'all 0.18s',
      whiteSpace: 'nowrap'
    }}
    onMouseEnter={e => { e.currentTarget.style.background = active ? (color || 'rgba(79,126,247,0.3)') : 'rgba(255,255,255,0.11)'; e.currentTarget.style.color = '#fff'; }}
    onMouseLeave={e => { e.currentTarget.style.background = active ? (color || 'rgba(79,126,247,0.2)') : 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = active ? (color ? '#fff' : C.accent) : C.muted; }}
  >
    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>{icon}</span>
    {label}
  </button>
);

// Toggle switch
export const Toggle = ({ checked, onChange, label }) => (
  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: '0.5rem' }}>
    <span style={{ fontSize: '0.83rem', color: C.text }}>{label}</span>
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 36, height: 20, borderRadius: 10, flexShrink: 0,
        background: checked ? C.accent : 'rgba(255,255,255,0.1)',
        position: 'relative', transition: 'background 0.2s', cursor: 'pointer'
      }}
    >
      <div style={{
        position: 'absolute', top: 2, left: checked ? 18 : 2,
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.4)'
      }} />
    </div>
  </label>
);

// Custom modal wrapper
export const Modal = ({ children, onClose, title, width = 480 }) => (
  <div
    onClick={onClose}
    style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease'
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        width, maxWidth: 'calc(100vw - 2rem)',
        maxHeight: '88vh',
        background: C.panel,
        borderRadius: '20px',
        border: `1px solid ${C.border}`,
        boxShadow: '0 32px 80px rgba(0,0,0,0.9)',
        display: 'flex', flexDirection: 'column',
        animation: 'modalIn 0.25s cubic-bezier(.4,0,.2,1)'
      }}
    >
      <div style={{
        padding: '1.25rem 1.5rem',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0
      }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: C.text }}>{title}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', padding: 4, borderRadius: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>close</span>
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
        {children}
      </div>
    </div>
  </div>
);

// Sidebar drawer
export const Drawer = ({ children, title, onClose, width = 360 }) => (
  <div className="meet-panel" style={{
    width, flexShrink: 0,
    background: C.sidebar,
    borderLeft: `1px solid ${C.border}`,
    display: 'flex', flexDirection: 'column',
    height: '100%',
    animation: 'slideInRight 0.25s cubic-bezier(.4,0,.2,1)'
  }}>
    <div style={{
      padding: '1.25rem 1.5rem',
      borderBottom: `1px solid ${C.border}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      flexShrink: 0
    }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: C.text }}>{title}</h3>
      <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', color: C.muted, cursor: 'pointer', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>close</span>
      </button>
    </div>
    <div style={{ flex: 1, overflowY: 'auto' }}>{children}</div>
  </div>
);
