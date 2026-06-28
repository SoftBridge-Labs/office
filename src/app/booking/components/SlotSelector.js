'use client';

export default function SlotSelector({
  selectedDate,
  slotsLoading,
  slots = [],
  handleSlotSelect,
  formatTime,
  styles
}) {
  return (
    <div>
      <h4 style={{
        fontSize: '0.8rem',
        fontWeight: 700,
        marginBottom: '0.875rem',
        color: 'var(--text-secondary, #475569)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : 'Available Times'}
      </h4>
      {!selectedDate ? (
        <div className={styles.emptyState}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 0.5rem', display: 'block', opacity: 0.4 }}>
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Pick a date on the left
        </div>
      ) : slotsLoading ? (
        <div className={styles.slotsContainer}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ height: '42px', borderRadius: '8px', background: 'var(--border, #e2e8f0)', animation: 'pulseSlot 1.2s infinite', animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      ) : slots.length === 0 ? (
        <div className={styles.emptyState}>No available slots for this day</div>
      ) : (
        <div className={styles.slotsContainer}>
          {slots.map((slot, i) => (
            <button
              key={i}
              type="button"
              className={styles.slotBtn}
              onClick={() => handleSlotSelect(slot)}
              style={{ animationDelay: `${i * 0.04}s`, animation: 'slotIn 0.25s ease both' }}
            >
              {formatTime(slot.start)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
