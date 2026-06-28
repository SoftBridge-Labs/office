'use client';

function Spinner({ size = 14, color = '#ffffff' }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes modalSpin { to { transform: rotate(360deg); } }
      `}} />
      <span style={{
        width: `${size}px`, height: `${size}px`,
        border: `2px solid rgba(255,255,255,0.3)`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'modalSpin 0.7s linear infinite',
        display: 'inline-block',
        verticalAlign: 'middle',
        marginRight: '6px',
        flexShrink: 0
      }} />
    </>
  );
}

export default function BookingForm({
  error,
  inviteeName,
  setInviteeName,
  inviteeEmail,
  setInviteeEmail,
  bookingTitle,
  setBookingTitle,
  bookingDesc,
  setBookingDesc,
  handleBookSlot,
  submitLoading,
  styles
}) {
  return (
    <div className={styles.formContainer}>
      <h3 className={styles.sectionTitle}>Confirm Your Details</h3>
      {error && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          background: 'var(--danger-bg, #fef2f2)',
          border: '1px solid var(--danger, #ef4444)',
          color: '#991b1b',
          fontSize: '0.85rem',
          fontWeight: 500
        }}>
          {error}
        </div>
      )}
      <form onSubmit={handleBookSlot} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className={styles.formGroup}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Your Name</label>
          <input
            type="text"
            className={styles.formInput}
            value={inviteeName}
            onChange={e => setInviteeName(e.target.value)}
            placeholder="Jane Doe"
            required
            autoFocus
            style={{
              width: '100%',
              padding: '0.65rem 0.75rem',
              border: '1px solid var(--border, #e2e8f0)',
              borderRadius: '8px',
              fontSize: '0.875rem',
              outline: 'none',
              background: '#fff'
            }}
          />
        </div>
        <div className={styles.formGroup}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Email Address</label>
          <input
            type="email"
            className={styles.formInput}
            value={inviteeEmail}
            onChange={e => setInviteeEmail(e.target.value)}
            placeholder="jane@example.com"
            required
            style={{
              width: '100%',
              padding: '0.65rem 0.75rem',
              border: '1px solid var(--border, #e2e8f0)',
              borderRadius: '8px',
              fontSize: '0.875rem',
              outline: 'none',
              background: '#fff'
            }}
          />
        </div>
        <div className={styles.formGroup}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Meeting Topic</label>
          <input
            type="text"
            className={styles.formInput}
            value={bookingTitle}
            onChange={e => setBookingTitle(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.65rem 0.75rem',
              border: '1px solid var(--border, #e2e8f0)',
              borderRadius: '8px',
              fontSize: '0.875rem',
              outline: 'none',
              background: '#fff'
            }}
          />
        </div>
        <div className={styles.formGroup}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Notes (optional)</label>
          <textarea
            className={styles.formTextarea}
            value={bookingDesc}
            onChange={e => setBookingDesc(e.target.value)}
            placeholder="Provide any helpful context…"
            rows="3"
            style={{
              width: '100%',
              padding: '0.65rem 0.75rem',
              border: '1px solid var(--border, #e2e8f0)',
              borderRadius: '8px',
              fontSize: '0.875rem',
              outline: 'none',
              resize: 'vertical',
              background: '#fff'
            }}
          />
        </div>
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={submitLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.625rem',
            opacity: submitLoading ? 0.85 : 1,
            padding: '0.75rem',
            background: 'var(--brand, #4f46e5)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          {submitLoading ? (
            <>
              <Spinner size={15} />
              Scheduling…
            </>
          ) : 'Confirm Meeting Slot'}
        </button>
      </form>
    </div>
  );
}
