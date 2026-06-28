'use client';

function fmt(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function initials(name, email) {
  const src = name || email || '?';
  return src.substring(0, 2).toUpperCase();
}

const EVENT_COLORS = ['#e0f2fe', '#fce7f3', '#d1fae5', '#fef3c7', '#e0e7ff'];
const EVENT_TEXT   = ['#0369a1', '#831843', '#065f46', '#78350f', '#3730a3'];
const BORDER_COLORS = ['#0ea5e9', '#ec4899', '#10b981', '#f59e0b', '#6366f1'];

export default function EventList({ events, onDelete, onEventClick }) {
  if (events.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted, #64748b)' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 0.75rem', display: 'block', opacity: 0.5 }}>
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <div style={{ fontSize: '0.85rem', fontWeight: 650 }}>No events today</div>
        <div style={{ fontSize: '0.78rem', marginTop: '0.25rem', opacity: 0.7 }}>Your schedule is clear</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {events.map((evt, idx) => {
        const ci = idx % EVENT_COLORS.length;
        return (
          <div
            key={evt.id}
            onClick={() => onEventClick && onEventClick(evt)}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
              padding: '0.75rem 1rem',
              background: 'var(--bg-muted, #f8fafc)',
              border: '1px solid var(--border, #e2e8f0)',
              borderLeft: `4px solid ${BORDER_COLORS[ci]}`,
              borderRadius: '8px',
              position: 'relative',
              cursor: onEventClick ? 'pointer' : 'default',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--bg-hover, #f1f5f9)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--bg-muted, #f8fafc)';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
              background: BORDER_COLORS[ci], marginTop: '5px',
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary, #0f172a)', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {evt.title}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span>{fmt(evt.start_time)}</span>
                {evt.end_time && <><span style={{ opacity: 0.4 }}>—</span><span>{fmt(evt.end_time)}</span></>}
              </div>
              {evt.location && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #475569)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ opacity: 0.7 }}>
                    <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{evt.location}</span>
                </div>
              )}
              {evt.invitees?.length > 0 && (
                <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem' }}>
                  {evt.invitees.slice(0, 4).map((inv, i) => (
                    <div key={i} title={inv.name || inv.email} style={{
                      width: '20px', height: '20px', borderRadius: '50%', fontSize: '0.58rem',
                      fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: EVENT_COLORS[i % EVENT_COLORS.length],
                      color: EVENT_TEXT[i % EVENT_TEXT.length],
                      border: '1.5px solid var(--bg-surface, #ffffff)',
                      marginLeft: i > 0 ? '-6px' : 0,
                    }}>
                      {initials(inv.name, inv.email)}
                    </div>
                  ))}
                  {evt.invitees.length > 4 && (
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', fontSize: '0.58rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--border, #e2e8f0)', color: 'var(--text-secondary, #475569)', marginLeft: '-6px', border: '1.5px solid var(--bg-surface, #ffffff)' }}>
                      +{evt.invitees.length - 4}
                    </div>
                  )}
                </div>
              )}
            </div>
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // prevent edit modal trigger
                  onDelete(evt.id);
                }}
                title="Delete event"
                style={{
                  color: 'var(--text-muted, #94a3b8)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  lineHeight: 1,
                  fontSize: '1.1rem',
                  marginLeft: '0.5rem'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted, #94a3b8)'; e.currentTarget.style.background = 'none'; }}
              >
                ×
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
