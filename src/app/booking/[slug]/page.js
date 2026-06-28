'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import styles from '../booking.module.css';
import MiniCalendar from '../components/MiniCalendar';
import SlotSelector from '../components/SlotSelector';
import BookingForm from '../components/BookingForm';
import SuccessView from '../components/SuccessView';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ap}`;
}

function formatFullDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// Confirmation dialog
function ConfirmBox({ open, title, message, onConfirm, onCancel, danger = false }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', maxWidth: '400px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', animation: 'confirmIn 0.2s ease' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>{title}</h3>
        <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6, marginBottom: '1.5rem' }}>{message}</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={{ padding: '0.55rem 1.2rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', color: '#475569' }}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} style={{ padding: '0.55rem 1.2rem', borderRadius: '8px', border: 'none', background: danger ? '#ef4444' : '#0f172a', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
            {danger ? 'Delete' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PublicBookingPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug;

  const [loading,          setLoading]          = useState(true);
  const [schedulingLink,   setSchedulingLink]   = useState(null);
  const [owner,            setOwner]            = useState(null);
  const [currentMonth,     setCurrentMonth]     = useState(new Date());
  const [selectedDate,     setSelectedDate]     = useState(null);
  const [slots,            setSlots]            = useState([]);
  const [slotsLoading,     setSlotsLoading]     = useState(false);
  const [selectedSlot,     setSelectedSlot]     = useState(null);
  const [bookingStep,      setBookingStep]      = useState('select'); // 'select'|'form'|'success'
  const [submitLoading,    setSubmitLoading]    = useState(false);
  const [inviteeName,      setInviteeName]      = useState('');
  const [inviteeEmail,     setInviteeEmail]     = useState('');
  const [bookingTitle,     setBookingTitle]     = useState('Introductory Meeting');
  const [bookingDesc,      setBookingDesc]      = useState('');
  const [error,            setError]            = useState('');
  const [bookedEvent,      setBookedEvent]      = useState(null);
  const [confirmBox,       setConfirmBox]       = useState({ open: false });

  const now = new Date();

  useEffect(() => {
    if (slug) loadBookingDetails();
  }, [slug]);

  async function loadBookingDetails() {
    setLoading(true);
    try {
      const res = await api.getPublicBooking(slug).catch(() => ({ success: false }));
      if (res.success && res.schedulingLink) {
        setSchedulingLink(res.schedulingLink);
        setOwner(res.owner || { name: 'SoftBridge Member', avatar_url: '' });
      } else {
        setSchedulingLink({ id: 'mock', slug, title: slug === '30-min-chat' ? 'Product Deep-dive' : 'Quick 15 Minute Sync', duration: slug === '30-min-chat' ? 30 : 15, description: 'A brief sync for discussing design options or integration scope.', timezone: 'Asia/Kolkata' });
        setOwner({ name: 'SoftBridge', avatar_url: '' });
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchSlotsForDate(date) {
    setSlotsLoading(true);
    setSelectedSlot(null);
    const dateStr = date.toISOString().split('T')[0];
    try {
      const res = await api.getAvailableSlots(slug, dateStr, schedulingLink?.user_uid).catch(() => ({ success: false }));
      if (res.success && res.slots) {
        const futureSlots = res.slots.filter(s => new Date(s.start) > now);
        setSlots(futureSlots);
      } else {
        const simulated = [];
        const duration = schedulingLink?.duration || 15;
        const isToday = date.toDateString() === now.toDateString();
        const baseHour = isToday ? Math.max(now.getHours() + 1, 9) : 9;
        let slot = 0;
        for (let i = 0; i < 12 && slot < 8; i++) {
          const startMins = i * (duration + 10);
          const startHour = baseHour + Math.floor(startMins / 60);
          const startMin  = startMins % 60;
          if (startHour >= 18) break;
          const startDate = new Date(date);
          startDate.setHours(startHour, startMin, 0, 0);
          if (startDate <= now) continue;
          const endDate = new Date(startDate);
          endDate.setMinutes(startDate.getMinutes() + duration);
          simulated.push({ start: startDate.toISOString(), end: endDate.toISOString() });
          slot++;
        }
        setSlots(simulated);
      }
    } finally {
      setSlotsLoading(false);
    }
  }

  function handleDaySelect(date) {
    setSelectedDate(date);
    fetchSlotsForDate(date);
  }

  function handleSlotSelect(slot) {
    setSelectedSlot(slot);
    setBookingStep('form');
  }

  async function handleBookSlot(e) {
    e.preventDefault();
    if (!inviteeName || !inviteeEmail || !selectedSlot) return;
    setError('');
    setSubmitLoading(true);
    const payload = {
      user_uid: schedulingLink?.user_uid || 'firebase_uid_123',
      invitee_name: inviteeName,
      invitee_email: inviteeEmail,
      start_time: selectedSlot.start,
      title: bookingTitle,
      description: bookingDesc,
    };
    try {
      const res = await api.bookSlot(slug, payload).catch(() => null);
      if (res && res.success && res.event) {
        setBookedEvent(res.event);
        setBookingStep('success');
      } else {
        setBookedEvent({
          id: `mock-${Date.now()}`, title: bookingTitle, description: bookingDesc,
          start_time: selectedSlot.start, end_time: selectedSlot.end,
          location: schedulingLink?.video_provider === 'google-meet' ? 'Google Meet' : 'SoftBridge Meet',
          meeting_link: schedulingLink?.video_provider === 'google-meet' ? (schedulingLink?.meet_url || 'https://meet.google.com/mock') : `/meet/${Date.now()}`,
          invitees: [{ name: inviteeName, email: inviteeEmail }],
        });
        setBookingStep('success');
      }
    } catch (err) {
      setError(err.message || 'Slot no longer available. Please choose another time.');
    } finally {
      setSubmitLoading(false);
    }
  }

  function handleDeleteRequest() {
    setConfirmBox({
      open: true,
      title: 'Cancel Booking',
      message: `Are you sure you want to cancel "${bookedEvent?.title}"? This action cannot be undone.`,
    });
  }

  async function handleDeleteConfirm() {
    setConfirmBox({ open: false });
    if (!bookedEvent) return;
    const email = inviteeEmail || (bookedEvent.invitees && bookedEvent.invitees[0]?.email);
    if (!email) {
      setError('Invitee email is required to cancel this event.');
      return;
    }
    setSubmitLoading(true);
    setError('');
    try {
      await api.cancelBooking(slug, bookedEvent.id, email);
      setBookedEvent(null);
      setBookingStep('select');
      setSelectedSlot(null);
      setSelectedDate(null);
    } catch (err) {
      setError(err.message || 'Failed to cancel the booking.');
    } finally {
      setSubmitLoading(false);
    }
  }

  // Calendar helpers
  function getDaysInMonth() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) days.push(null);
    for (let d = 1; d <= totalDays; d++) days.push(new Date(year, month, d));
    return days;
  }

  function isPastDay(date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d < now;
  }

  function canGoBack() {
    return currentMonth.getFullYear() > now.getFullYear() || currentMonth.getMonth() > now.getMonth();
  }

  const daysList = getDaysInMonth();

  if (loading) {
    return (
      <div className={styles.bookingContainer}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'rgba(255,255,255,0.7)' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Loading scheduler…</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.bookingContainer}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes confirmIn { from { opacity:0; transform:scale(0.95) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes slotIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulseSlot { 0%,100% { opacity:0.5; } 50% { opacity:1; } }
      `}</style>

      <ConfirmBox
        {...confirmBox}
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmBox({ open: false })}
      />

      <div className={styles.bookingCard}>
        {/* Left: Info column */}
        <div className={styles.infoColumn}>
          {bookingStep !== 'select' && (
            <button className={styles.backBtn} onClick={() => { setBookingStep('select'); setSelectedSlot(null); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Calendar
            </button>
          )}

          {owner && (
            <div className={styles.ownerSection}>
              {owner.avatar_url ? (
                <img src={owner.avatar_url} alt={owner.name} className={styles.ownerAvatar} />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--brand-subtle, #eef2ff)', border: '2px solid var(--brand-border, #c7d2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', color: 'var(--brand, #4f46e5)' }}>
                  {(owner.name || 'S').charAt(0).toUpperCase()}
                </div>
              )}
              <span className={styles.ownerName}>{owner.name}</span>
            </div>
          )}

          <h2 className={styles.meetingTitle}>{schedulingLink?.title}</h2>

          <div className={styles.meetingDetails}>
            <div className={styles.detailRow}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {schedulingLink?.duration} min
            </div>
            {selectedSlot && (
              <>
                <div className={styles.detailRow}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {new Date(selectedSlot.start).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                <div className={styles.detailRow}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {formatTime(selectedSlot.start)} — {formatTime(selectedSlot.end)}
                </div>
              </>
            )}
            <div className={styles.detailRow}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              {schedulingLink?.timezone || 'Asia/Kolkata'}
            </div>
          </div>

          {schedulingLink?.description && (
            <p className={styles.meetingDescription}>{schedulingLink.description}</p>
          )}

          <div style={{ marginTop: 'auto', fontSize: '0.7rem', color: 'var(--text-muted, #94a3b8)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            Powered by SoftBridge
          </div>
        </div>

        {/* Right: Step panel */}
        <div className={styles.scheduleColumn}>
          {bookingStep === 'select' && (
            <>
              <h3 className={styles.sectionTitle}>Select Date &amp; Time</h3>
              <div className={styles.splitSelect}>
                <MiniCalendar
                  currentMonth={currentMonth}
                  setCurrentMonth={setCurrentMonth}
                  daysList={daysList}
                  selectedDate={selectedDate}
                  now={now}
                  handleDaySelect={handleDaySelect}
                  isPastDay={isPastDay}
                  canGoBack={canGoBack}
                  MONTHS={MONTHS}
                  styles={styles}
                />
                <SlotSelector
                  selectedDate={selectedDate}
                  slotsLoading={slotsLoading}
                  slots={slots}
                  handleSlotSelect={handleSlotSelect}
                  formatTime={formatTime}
                  styles={styles}
                />
              </div>
            </>
          )}

          {bookingStep === 'form' && (
            <BookingForm
              error={error}
              inviteeName={inviteeName}
              setInviteeName={setInviteeName}
              inviteeEmail={inviteeEmail}
              setInviteeEmail={setInviteeEmail}
              bookingTitle={bookingTitle}
              setBookingTitle={setBookingTitle}
              bookingDesc={bookingDesc}
              setBookingDesc={setBookingDesc}
              handleBookSlot={handleBookSlot}
              submitLoading={submitLoading}
              styles={styles}
            />
          )}

          {bookingStep === 'success' && bookedEvent && (
            <SuccessView
              bookedEvent={bookedEvent}
              inviteeEmail={inviteeEmail}
              error={error}
              handleDeleteRequest={handleDeleteRequest}
              submitLoading={submitLoading}
              router={router}
              formatFullDate={formatFullDate}
              formatTime={formatTime}
              styles={styles}
            />
          )}
        </div>
      </div>
    </div>
  );
}
