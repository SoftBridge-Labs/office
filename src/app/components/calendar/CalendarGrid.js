'use client';

const MONTHS_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

export default function CalendarGrid({
  days,
  events,
  selectedDate,
  currentDate,
  onDaySelect,
  onPrevMonth,
  onNextMonth,
  onEventSelect
}) {
  const cur = currentDate.getMonth();
  const year = currentDate.getFullYear();

  function getEventsForDate(date) {
    return events.filter(e => new Date(e.start_time).toDateString() === date.toDateString());
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      {/* Header / Month Navigator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>
            {MONTHS_SHORT[(cur - 1 + 12) % 12]}
          </span>
          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            {MONTHS_SHORT[cur]} {year}
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>
            {MONTHS_SHORT[(cur + 1) % 12]}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            onClick={onPrevMonth}
            style={{ width: '32px', height: '32px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
          >
            <ChevronLeft />
          </button>
          <button
            onClick={onNextMonth}
            style={{ width: '32px', height: '32px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
          >
            <ChevronRight />
          </button>
        </div>
      </div>

      {/* Days of Week Headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', padding: '0.6rem 0', letterSpacing: '0.05em' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid cells (Google Calendar Style: Explicit lines and strip events) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gridTemplateRows: 'repeat(6, 1fr)',
        flex: 1,
        background: '#e2e8f0', // Grid background is the line color
        gap: '1px', // 1px gaps make the lines
      }}>
        {days.map((item, idx) => {
          const isToday = item.date.toDateString() === new Date().toDateString();
          const isSelected = item.date.toDateString() === selectedDate.toDateString();
          const dayEvts = getEventsForDate(item.date);

          return (
            <div
              key={idx}
              onClick={() => onDaySelect(item.date)}
              style={{
                background: isSelected ? '#f8fafc' : isToday ? '#eff6ff' : '#ffffff',
                padding: '0.5rem 0.25rem',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                cursor: 'pointer',
                opacity: item.isOutside ? 0.45 : 1,
                minHeight: '80px',
                transition: 'background-color 0.1s ease',
                border: isSelected ? '2px solid #3b82f6' : 'none',
                zIndex: isSelected ? 5 : 1
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = isToday ? '#eff6ff' : '#ffffff'; }}
            >
              {/* Day Number */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.25rem' }}>
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: isToday ? '800' : '600',
                  color: isToday ? '#2563eb' : '#334155',
                  padding: '2px 6px',
                  borderRadius: '12px',
                  background: isToday ? '#dbeafe' : 'transparent',
                  lineHeight: '1.2'
                }}>
                  {item.day}
                </span>
              </div>

              {/* Event Strips */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '100%', overflow: 'hidden' }}>
                {dayEvts.slice(0, 3).map(evt => (
                  <div
                    key={evt.id}
                    onClick={(e) => {
                      e.stopPropagation(); // prevent triggering parent onDaySelect
                      if (onEventSelect) onEventSelect(evt);
                    }}
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: '600',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: '#e0f2fe',
                      color: '#0369a1',
                      borderLeft: '3px solid #0ea5e9',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      margin: '0 2px',
                      cursor: 'pointer',
                      transition: 'filter 0.15s'
                    }}
                    title={evt.title}
                    onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.95)'}
                    onMouseLeave={e => e.currentTarget.style.filter = 'none'}
                  >
                    {evt.title}
                  </div>
                ))}
                {dayEvts.length > 3 && (
                  <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 700, paddingLeft: '6px', marginTop: '1px' }}>
                    +{dayEvts.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
