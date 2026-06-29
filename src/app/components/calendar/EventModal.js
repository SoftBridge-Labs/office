'use client';

import { useEffect, useState } from 'react';

const inputStyle = {
  width: '100%',
  padding: '0.65rem 0.75rem',
  border: '1px solid var(--border, #e2e8f0)',
  borderRadius: '8px',
  background: 'var(--bg-muted, #f8fafc)',
  fontSize: '0.875rem',
  color: 'var(--text-primary, #0f172a)',
  transition: 'border-color 0.15s, background 0.15s',
  outline: 'none'
};

const focusHandlers = {
  onFocus: e => {
    e.target.style.borderColor = 'var(--brand, #6366f1)';
    e.target.style.background = '#fff';
    e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
  },
  onBlur: e => {
    e.target.style.borderColor = 'var(--border, #e2e8f0)';
    e.target.style.background = 'var(--bg-muted, #f8fafc)';
    e.target.style.boxShadow = 'none';
  },
};

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

export default function EventModal({
  open,
  onClose,
  calendars = [],
  teams = [],
  eventTitle, setEventTitle,
  eventDesc, setEventDesc,
  eventStart, setEventStart,
  eventEnd, setEventEnd,
  eventCalendarId, setEventCalendarId,
  eventLocation, setEventLocation,
  eventInvitees, setEventInvitees,
  eventAllowGuests, setEventAllowGuests,
  onSubmit,
  editingEvent,
  onDelete,
  loading = false
}) {
  const [videoProvider, setVideoProvider] = useState('none');

  // Update state fields when editingEvent changes
  useEffect(() => {
    if (editingEvent) {
      setEventTitle(editingEvent.title || '');
      setEventDesc(editingEvent.description || '');
      
      const formatToInputDate = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };
      setEventStart(formatToInputDate(editingEvent.start_time));
      setEventEnd(formatToInputDate(editingEvent.end_time));
      setEventCalendarId(editingEvent.calendar_id || '');
      setEventLocation(editingEvent.location || '');
      setEventInvitees(editingEvent.invitees ? editingEvent.invitees.map(i => i.email).join(', ') : '');

      setEventAllowGuests(editingEvent.allow_guests !== false);

      if (editingEvent.location?.includes('/meet/internal-')) {
        setVideoProvider('internal-meet');
      } else if (editingEvent.location?.includes('/meet/SoftBridgeCalendar-')) {
        setVideoProvider('softbridge-meet');
      } else if (editingEvent.location?.includes('meet.google.com')) {
        setVideoProvider('google-meet');
      } else {
        setVideoProvider('none');
      }
    } else if (open) {
      setEventTitle('');
      setEventDesc('');
      setEventStart('');
      setEventEnd('');
      setEventCalendarId(calendars[0]?.id || '');
      setEventLocation('');
      setEventInvitees('');
      setVideoProvider('none');
      setEventAllowGuests(true);
    }
  }, [editingEvent, open]);

  const handleVideoProviderChange = (val) => {
    setVideoProvider(val);
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    if (val === 'softbridge-meet') {
      const meetId = `SoftBridgeCalendar-${Math.random().toString(36).substring(2, 10)}`;
      setEventLocation(`${origin}/meet/${meetId}`);
    } else if (val === 'internal-meet') {
      const meetId = `internal-${Math.random().toString(36).substring(2, 10)}`;
      setEventLocation(`${origin}/meet/${meetId}`);
    } else if (val === 'google-meet') {
      setEventLocation('https://meet.google.com/mock-meet');
    } else {
      setEventLocation('');
    }
  };

  if (!open) return null;

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div style={{
        background: 'var(--bg-surface, #ffffff)',
        borderRadius: '16px',
        width: '100%', maxWidth: '480px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        animation: 'slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
        border: '1px solid var(--border, #e2e8f0)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border, #e2e8f0)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
            {editingEvent ? 'Edit Event Details' : 'Create New Event'}
          </h3>
          <button onClick={onClose} style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted, #64748b)', fontSize: '1.25rem', border: 'none', background: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover, #f1f5f9)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >×</button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary, #475569)', marginBottom: '0.4rem' }}>Event Title *</label>
            <input style={inputStyle} {...focusHandlers} type="text" placeholder="e.g. Weekly Design Alignment" value={eventTitle} onChange={e => setEventTitle(e.target.value)} required autoFocus />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary, #475569)', marginBottom: '0.4rem' }}>Description</label>
            <textarea style={{ ...inputStyle, resize: 'vertical' }} {...focusHandlers} rows="2" placeholder="Provide event context or video links..." value={eventDesc} onChange={e => setEventDesc(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary, #475569)', marginBottom: '0.4rem' }}>Start Time *</label>
              <input style={inputStyle} {...focusHandlers} type="datetime-local" value={eventStart} onChange={e => setEventStart(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary, #475569)', marginBottom: '0.4rem' }}>End Time *</label>
              <input style={inputStyle} {...focusHandlers} type="datetime-local" value={eventEnd} onChange={e => setEventEnd(e.target.value)} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary, #475569)', marginBottom: '0.4rem' }}>Calendar</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={eventCalendarId} onChange={e => setEventCalendarId(e.target.value)}>
                {calendars.map(cal => <option key={cal.id} value={cal.id}>{cal.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary, #475569)', marginBottom: '0.4rem' }}>Video Provider</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={videoProvider} onChange={e => handleVideoProviderChange(e.target.value)}>
                <option value="none">None (No Video Call)</option>
                <option value="softbridge-meet">SoftBridge Meet</option>
                <option value="internal-meet">Internal Office Meeting</option>
                <option value="google-meet">Google Meet</option>
              </select>
            </div>
          </div>

          {(videoProvider === 'softbridge-meet' || videoProvider === 'internal-meet') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-muted, #f8fafc)', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border, #e2e8f0)' }}>
              <input
                type="checkbox"
                id="allowGuestsCheckbox"
                checked={eventAllowGuests}
                onChange={e => setEventAllowGuests(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="allowGuestsCheckbox" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary, #475569)', cursor: 'pointer' }}>
                Allow unauthorized / guest users to join this meeting room
              </label>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary, #475569)', marginBottom: '0.4rem' }}>Location / Call Link</label>
            <input style={inputStyle} {...focusHandlers} type="text" placeholder="Auto-populated or custom location" value={eventLocation} onChange={e => setEventLocation(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary, #475569)', marginBottom: '0.4rem' }}>Invite Entire Team (Optional)</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value=""
                onChange={e => {
                  const selectedTeamId = e.target.value;
                  if (!selectedTeamId) return;
                  const team = teams.find(t => t.id === selectedTeamId);
                  if (team && team.members) {
                    const emails = team.members.map(m => m.email).filter(Boolean);
                    if (emails.length > 0) {
                      const current = eventInvitees ? eventInvitees.split(',').map(x => x.trim()) : [];
                      const merged = Array.from(new Set([...current, ...emails])).filter(Boolean).join(', ');
                      setEventInvitees(merged);
                    }
                  }
                }}
              >
                <option value="">— Select a Team —</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary, #475569)', marginBottom: '0.4rem' }}>Invitees (comma separated emails)</label>
              <input style={inputStyle} {...focusHandlers} type="text" placeholder="e.g. coworker@softbridge.com, partner@co.com" value={eventInvitees} onChange={e => setEventInvitees(e.target.value)} />
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem', justifyContent: 'space-between' }}>
            {editingEvent && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(editingEvent.id);
                  onClose();
                }}
                style={{
                  padding: '0.65rem 1rem',
                  background: 'none',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#ef4444',
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                Delete Event
              </button>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', flex: 1, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '0.65rem 1.25rem',
                  background: 'none',
                  border: '1px solid var(--border, #e2e8f0)',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary, #475569)',
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover, #f1f5f9)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '0.65rem 1.5rem',
                  background: 'var(--text-primary, #0f172a)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'opacity 0.15s',
                  opacity: loading ? 0.7 : 1
                }}
                onMouseEnter={e => { if(!loading) e.currentTarget.style.opacity = '0.88'; }}
                onMouseLeave={e => { if(!loading) e.currentTarget.style.opacity = '1'; }}
              >
                {loading && <Spinner />}
                {editingEvent ? 'Save Changes' : 'Schedule Event'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
