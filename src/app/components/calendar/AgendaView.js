'use client';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function fmt(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

const ROW_ACCENTS = ['#6366f1','#10b981','#f59e0b','#3b82f6','#ec4899'];

export default function AgendaView({ events, onAddEvent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto' }}>
      {[0,1,2,3,4].map(offset => {
        const target = new Date();
        target.setDate(new Date().getDate() + offset);
        const dayEvts = events.filter(e => new Date(e.start_time).toDateString() === target.toDateString());
        const accent  = ROW_ACCENTS[offset % ROW_ACCENTS.length];
        const isToday = offset === 0;

        return (
          <div key={offset} style={{
            display: 'flex',
            gap: '1.25rem',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            background: isToday ? 'var(--bg-muted)' : 'transparent',
            border: `1px solid ${isToday ? 'var(--border)' : 'transparent'}`,
            transition: 'background 0.15s',
          }}>
            {/* Date column */}
            <div style={{ minWidth: '90px', display: 'flex', flexDirection: 'column', borderRight: `2px solid ${accent}`, paddingRight: '1rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {DAYS[target.getDay()].substring(0, 3)}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: isToday ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1, marginTop: '0.15rem' }}>
                {target.getDate()}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                {MONTHS[target.getMonth()]}
              </div>
            </div>

            {/* Events column */}
            <div style={{ flex: 1, display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {dayEvts.length === 0 ? (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-disabled)', fontStyle: 'italic' }}>No events</span>
              ) : (
                dayEvts.map(evt => (
                  <div key={evt.id} style={{
                    display: 'flex', flexDirection: 'column', gap: '0.1rem',
                    padding: '0.5rem 0.875rem',
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    minWidth: '120px', maxWidth: '200px',
                    boxShadow: 'var(--shadow-xs)',
                  }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {evt.title}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {fmt(evt.start_time)}
                    </div>
                  </div>
                ))
              )}
              <button
                onClick={() => onAddEvent(target)}
                style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  border: '1px dashed var(--border-strong)', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', flexShrink: 0,
                  transition: 'all 0.15s',
                }}
                title="Add event"
                onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
              >
                +
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
