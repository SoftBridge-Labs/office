'use client';

export default function MiniCalendar({
  currentMonth,
  setCurrentMonth,
  daysList,
  selectedDate,
  now,
  handleDaySelect,
  isPastDay,
  canGoBack,
  MONTHS,
  styles
}) {
  return (
    <div className={styles.miniCalendar}>
      <div className={styles.calendarNav}>
        <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            disabled={!canGoBack()}
            style={{ opacity: canGoBack() ? 1 : 0.25, cursor: canGoBack() ? 'pointer' : 'not-allowed' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.weekdayHeader}>
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <span key={d}>{d}</span>)}
      </div>

      <div className={styles.daysGrid}>
        {daysList.map((day, idx) => {
          if (!day) return <div key={idx} />;
          const isPast     = isPastDay(day);
          const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
          const isToday    = day.toDateString() === now.toDateString();
          return (
            <div
              key={idx}
              className={`${styles.dayCell} ${isSelected ? styles.dayCellSelected : ''} ${isPast ? styles.dayCellDisabled : ''} ${isToday && !isSelected ? styles.dayCellToday : ''}`}
              onClick={() => !isPast && handleDaySelect(day)}
            >
              {day.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
