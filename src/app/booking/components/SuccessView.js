'use client';

export default function SuccessView({
  bookedEvent,
  inviteeEmail,
  error,
  handleDeleteRequest,
  submitLoading,
  router,
  formatFullDate,
  formatTime,
  styles
}) {
  return (
    <div className={styles.successView}>
      <div className={styles.successIcon}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <h3 className={styles.successTitle}>Booking Confirmed!</h3>
      {error && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          background: 'var(--danger-bg, #fef2f2)',
          border: '1px solid var(--danger, #ef4444)',
          color: '#991b1b',
          fontSize: '0.85rem',
          fontWeight: 500,
          width: '100%',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary, #475569)', textAlign: 'center', lineHeight: 1.6 }}>
        A calendar invite has been sent to <strong>{inviteeEmail}</strong>.
      </p>

      <div className={styles.successDetails}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px', opacity: 0.5 }}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <div><strong>Topic:</strong> {bookedEvent.title}</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px', opacity: 0.5 }}>
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <div><strong>Time:</strong> {formatFullDate(bookedEvent.start_time)} at {formatTime(bookedEvent.start_time)}</div>
        </div>
        {bookedEvent.meeting_link && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px', opacity: 0.5 }}>
              <path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.82v6.36a1 1 0 0 1-1.447.894L15 14"/>
              <rect x="1" y="6" width="15" height="12" rx="2"/>
            </svg>
            <div>
              <strong>Link:</strong>{' '}
              <a href={bookedEvent.meeting_link} target="_blank" rel="noopener noreferrer" className={styles.meetLink}>
                {bookedEvent.meeting_link}
              </a>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
        <button
          type="button"
          onClick={handleDeleteRequest}
          disabled={submitLoading}
          style={{
            flex: 1,
            padding: '0.7rem',
            borderRadius: '8px',
            border: '1px solid var(--danger, #ef4444)',
            background: 'transparent',
            color: 'var(--danger, #ef4444)',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.15s',
            opacity: submitLoading ? 0.5 : 1
          }}
          onMouseEnter={e => !submitLoading && (e.currentTarget.style.background = 'var(--danger-bg, #fef2f2)')}
          onMouseLeave={e => !submitLoading && (e.currentTarget.style.background = 'transparent')}
        >
          {submitLoading ? 'Cancelling...' : 'Cancel Booking'}
        </button>
        <button
          type="button"
          className={styles.submitBtn}
          style={{
            flex: 2,
            padding: '0.75rem',
            background: 'var(--brand, #4f46e5)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
          onClick={() => router.push('/calendar')}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
