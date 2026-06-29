'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Sidebar        from '@/app/components/Sidebar';
import Notification   from '@/app/components/Notification';
import DateCard       from '@/app/components/calendar/DateCard';
import EventList      from '@/app/components/calendar/EventList';
import AISummaryCard  from '@/app/components/calendar/AISummaryCard';
import CalendarGrid   from '@/app/components/calendar/CalendarGrid';
import AgendaView     from '@/app/components/calendar/AgendaView';
import EventModal     from '@/app/components/calendar/EventModal';
import SettingsModal  from '@/app/components/calendar/SettingsModal';
import ConfirmModal   from '@/app/components/calendar/ConfirmModal';
import styles from './calendar.module.css';

// ─── Helpers ────────────────────────────────────────────────────────────────
function getDaysInMonth(date) {
  const year  = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  const prevTotal = new Date(year, month, 0).getDate();
  const days = [];
  for (let i = first - 1; i >= 0; i--)
    days.push({ day: prevTotal - i, isOutside: true, date: new Date(year, month - 1, prevTotal - i) });
  for (let d = 1; d <= total; d++)
    days.push({ day: d, isOutside: false, date: new Date(year, month, d) });
  for (let n = 1; days.length < 42; n++)
    days.push({ day: n, isOutside: true, date: new Date(year, month + 1, n) });
  return days;
}

const MOCK_PROFILE  = { name: 'Guest User', email: 'guest@softbridgelabs.in', avatar_url: '' };
const MOCK_CALS     = [{ id: 'mock-cal-1', name: 'Personal (Demo)', provider: 'google', provider_email: 'guest@gmail.com' }];
const MOCK_SCHEDS   = [{ id: 'mock-s-1', slug: '15-min-call', title: 'Quick 15 Min Sync', duration: 15 }];

export default function CalendarPage() {
  const router = useRouter();

  // ── Auth / profile ──────────────────────────────────────────────────────
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading]         = useState(true);

  // ── Core data ───────────────────────────────────────────────────────────
  const [calendars, setCalendars]             = useState([]);
  const [schedulingLinks, setSchedulingLinks] = useState([]);
  const [events, setEvents]                   = useState([]);
  const [teams, setTeams]                     = useState([]);

  // ── View state ──────────────────────────────────────────────────────────
  const [view, setView]               = useState('calendar'); // 'calendar' | 'agenda'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // ── Modals ──────────────────────────────────────────────────────────────
  const [showEventModal,  setShowEventModal]  = useState(false);
  const [editingEvent, setEditingEvent]       = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState('calendars');

  // ── Event form ──────────────────────────────────────────────────────────
  const [eventTitle, setEventTitle]         = useState('');
  const [eventDesc, setEventDesc]           = useState('');
  const [eventStart, setEventStart]         = useState('');
  const [eventEnd, setEventEnd]             = useState('');
  const [eventCalendarId, setEventCalendarId] = useState('');
  const [eventLocation, setEventLocation]   = useState('');
  const [eventInvitees, setEventInvitees]   = useState('');
  const [eventAllowGuests, setEventAllowGuests] = useState(true);

  // ── Calendar form ────────────────────────────────────────────────────────
  const [calName, setCalName]       = useState('');
  const [calEmail, setCalEmail]     = useState('');
  const [calProvider, setCalProvider] = useState('google');

  // ── Scheduler form ───────────────────────────────────────────────────────
  const [schedSlug, setSchedSlug]               = useState('');
  const [schedTitle, setSchedTitle]             = useState('');
  const [schedDesc, setSchedDesc]               = useState('');
  const [schedDuration, setSchedDuration]       = useState(15);
  const [schedBuffer, setSchedBuffer]           = useState(5);
  const [schedLimit, setSchedLimit]             = useState(5);
  const [schedVideoProvider, setSchedVideoProvider] = useState('softbridge-meet');
  const [customMeetUrl, setCustomMeetUrl]       = useState('');
  const [schedMeetingType, setSchedMeetingType] = useState('one-on-one');
  const [selectedTeamId, setSelectedTeamId]     = useState('');
  const [schedMemberUids, setSchedMemberUids]   = useState('');
  const [schedOverrides, setSchedOverrides]     = useState([]);
  const [overrideDate, setOverrideDate]         = useState('');
  const [overrideStart, setOverrideStart]       = useState('09:00');
  const [overrideEnd, setOverrideEnd]           = useState('17:00');

  // ── Teams form ────────────────────────────────────────────────────────────
  const [newTeamName, setNewTeamName]       = useState('');
  const [teamMemberUid, setTeamMemberUid]   = useState('');
  const [teamMemberRole, setTeamMemberRole] = useState('member');

  // ── AI summary ────────────────────────────────────────────────────────────
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [eventLoading, setEventLoading] = useState(false);

  // ── Notification ──────────────────────────────────────────────────────────
  const [notif, setNotif] = useState(null);
  const notify = useCallback((message, type = 'info') => {
    setNotif({ message, type });
    setTimeout(() => setNotif(null), 4000);
  }, []);

  // ─── Init ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token') || params.get('idToken');
    const urlUid   = params.get('uid');
    if (urlToken) {
      localStorage.setItem('sb_id_token', urlToken);
      if (urlUid) localStorage.setItem('sb_uid', urlUid);
      window.history.replaceState({}, '', window.location.pathname);
    }
    const token = localStorage.getItem('sb_id_token');
    if (!token) { setIsLoggedOut(true); loadMockData(); setLoading(false); }
    else         { setIsLoggedOut(false); loadUserData(); }
  }, []);

  function loadMockData() {
    setUserProfile(MOCK_PROFILE);
    setCalendars(MOCK_CALS);
    setSchedulingLinks(MOCK_SCHEDS);
    const today = new Date().toISOString().split('T')[0];
    setEvents([
      { id: 'mock-1', title: 'Team Standup', description: 'Daily sync', start_time: `${today}T09:00:00.000Z`, end_time: `${today}T09:30:00.000Z`, location: 'SoftBridge Meet', invitees: [] },
      { id: 'mock-2', title: 'Product Review', description: 'Q3 review session', start_time: `${today}T14:00:00.000Z`, end_time: `${today}T15:00:00.000Z`, location: 'Boardroom A', invitees: [{ name: 'Alice', email: 'alice@co.com' }] },
    ]);
  }

  async function loadUserData() {
    // Hydrate from cache immediately for snappy UX
    ['sb_user_profile','sb_calendars','sb_schedulers','sb_events'].forEach((key, i) => {
      const val = localStorage.getItem(key);
      if (!val) return;
      try {
        const parsed = JSON.parse(val);
        [setUserProfile, setCalendars, setSchedulingLinks, setEvents][i](parsed);
      } catch {}
    });
    const cached = localStorage.getItem('sb_user_profile') && localStorage.getItem('sb_calendars') && localStorage.getItem('sb_events');
    if (cached) setLoading(false);

    try {
      const uid = localStorage.getItem('sb_uid');
      const [acct, calData, schedData, evtsData, teamData] = await Promise.allSettled([
        api.getAccount(uid),
        api.getCalendars(),
        api.getSchedulingLinks(),
        api.getEvents(),
        api.getTeams(),
      ]);
      if (acct.status === 'fulfilled' && acct.value?.user) {
        setUserProfile(acct.value.user);
        localStorage.setItem('sb_user_profile', JSON.stringify(acct.value.user));
      }
      if (calData.status === 'fulfilled' && calData.value?.success) {
        setCalendars(calData.value.calendars || []);
        localStorage.setItem('sb_calendars', JSON.stringify(calData.value.calendars || []));
        if (calData.value.calendars?.[0]) setEventCalendarId(calData.value.calendars[0].id);
      }
      if (schedData.status === 'fulfilled' && schedData.value?.success) {
        setSchedulingLinks(schedData.value.schedulingLinks || []);
        localStorage.setItem('sb_schedulers', JSON.stringify(schedData.value.schedulingLinks || []));
      }
      if (evtsData.status === 'fulfilled' && evtsData.value?.success) {
        setEvents(evtsData.value.events || []);
        localStorage.setItem('sb_events', JSON.stringify(evtsData.value.events || []));
      }
      if (teamData.status === 'fulfilled' && teamData.value?.success) {
        setTeams(teamData.value.teams || []);
      }
    } catch (err) {
      console.error('Data load error:', err);
    } finally {
      setLoading(false);
    }
  }

  // ─── AI Summary ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoggedOut) {
      const today = selectedDate.toISOString().split('T')[0];
      const dayEvts = events.filter(e => new Date(e.start_time).toDateString() === selectedDate.toDateString());
      setAiSummary({ briefingText: `Good morning!\n\nYou have ${dayEvts.length} event(s) on ${today}.`, deepWorkSlots: [{ start: `${today}T10:00:00.000Z`, end: `${today}T12:00:00.000Z` }] });
      return;
    }
    setAiLoading(true);
    api.getDailySummary(selectedDate.toISOString().split('T')[0])
      .then(res => setAiSummary(res.success && res.summary ? res.summary : null))
      .catch(() => setAiSummary(null))
      .finally(() => setAiLoading(false));
  }, [selectedDate, isLoggedOut]);

  // ─── Computed ──────────────────────────────────────────────────────────────
  const daysList = getDaysInMonth(currentDate);
  const selectedDateEvents = events.filter(e => new Date(e.start_time).toDateString() === selectedDate.toDateString());

  // ─── Event Handlers ────────────────────────────────────────────────────────
  async function handleCreateEvent(e) {
    e.preventDefault();
    setEventLoading(true);
    try {
      const attendees = eventInvitees ? eventInvitees.split(',').map(em => ({ name: em.trim().split('@')[0], email: em.trim() })) : [];
      let calId = eventCalendarId || calendars[0]?.id;
      if (!isLoggedOut && (!calId || calId.startsWith('mock-'))) {
        try {
          const r = await api.createCalendar({ name: 'My Calendar', provider: 'google', provider_email: userProfile?.email || 'user@gmail.com' });
          if (r.success && r.calendar) { setCalendars(p => [...p, r.calendar]); calId = r.calendar.id; setEventCalendarId(calId); }
          else { notify('Could not auto-initialize calendar', 'error'); return; }
        } catch { notify('Failed to create calendar', 'error'); return; }
      }
      const payload = { calendar_id: calId, title: eventTitle, description: eventDesc, start_time: new Date(eventStart).toISOString(), end_time: new Date(eventEnd).toISOString(), location: eventLocation, invitees: attendees, allow_guests: eventAllowGuests };
      
      if (editingEvent) {
        if (isLoggedOut) {
          setEvents(p => p.map(ev => ev.id === editingEvent.id ? { ...ev, ...payload } : ev));
        } else {
          try {
            const r = await api.updateEvent(editingEvent.id, payload);
            if (r.success && r.event) {
              setEvents(p => p.map(ev => ev.id === editingEvent.id ? r.event : ev));
            }
          } catch (err) {
            notify(err.message || 'Error updating event', 'error');
            return;
          }
        }
        notify('Event updated', 'success');
      } else {
        if (isLoggedOut) {
          setEvents(p => [...p, { id: `mock-${Date.now()}`, ...payload }]);
        } else {
          try {
            const r = await api.createEvent(payload);
            if (r.success && r.event) setEvents(p => [...p, r.event]);
          } catch (err) {
            notify(err.message || 'Error creating event', 'error');
            return;
          }
        }
        notify('Event created', 'success');
      }
      setShowEventModal(false);
      setEditingEvent(null);
      setEventTitle(''); setEventDesc(''); setEventStart(''); setEventEnd(''); setEventLocation(''); setEventInvitees('');
    } finally {
      setEventLoading(false);
    }
  }

  function handleDeleteEvent(id) {
    setConfirmDeleteId(id);
  }

  async function confirmDeleteEvent() {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    if (isLoggedOut) {
      setEvents(p => p.filter(e => e.id !== id));
      setConfirmDeleteId(null);
      notify('Event deleted', 'success');
      return;
    }
    try {
      const r = await api.deleteEvent(id);
      if (r.success) {
        setEvents(p => p.filter(e => e.id !== id));
        notify('Event deleted', 'success');
      }
    } catch (err) {
      notify(err.message || 'Error deleting event', 'error');
    } finally {
      setConfirmDeleteId(null);
    }
  }

  async function handleAddCalendar(e) {
    e.preventDefault();
    const payload = { name: calName, provider: calProvider, provider_email: calEmail };
    if (isLoggedOut) { setCalendars(p => [...p, { id: `mock-cal-${Date.now()}`, ...payload }]); setCalName(''); setCalEmail(''); return; }
    try { const r = await api.createCalendar(payload); if (r.success && r.calendar) { setCalendars(p => [...p, r.calendar]); setCalName(''); setCalEmail(''); notify('Calendar connected', 'success'); } }
    catch (err) { notify(err.message || 'Error connecting calendar', 'error'); }
  }

  async function handleDeleteCalendar(id) {
    if (isLoggedOut) { setCalendars(p => p.filter(c => c.id !== id)); return; }
    try { const r = await api.deleteCalendar(id); if (r.success) setCalendars(p => p.filter(c => c.id !== id)); }
    catch (err) { notify(err.message || 'Error', 'error'); }
  }

  async function handleAddSchedulingLink(e) {
    e.preventDefault();
    const payload = { slug: schedSlug, title: schedTitle, description: schedDesc, duration: +schedDuration, buffer_time: +schedBuffer, daily_limit: +schedLimit, video_provider: schedVideoProvider, meet_url: schedVideoProvider === 'google-meet' ? customMeetUrl : undefined, meeting_type: schedMeetingType, is_active: true, team_id: selectedTeamId || null, member_uids: schedMemberUids ? schedMemberUids.split(',').map(u => u.trim()) : [], availability_rules: { monday:[{start:'09:00',end:'17:00'}], tuesday:[{start:'09:00',end:'17:00'}], wednesday:[{start:'09:00',end:'17:00'}], thursday:[{start:'09:00',end:'17:00'}], friday:[{start:'09:00',end:'17:00'}] }, availability_overrides: schedOverrides };
    if (isLoggedOut) { setSchedulingLinks(p => [...p, { id: `mock-s-${Date.now()}`, ...payload }]); setSchedSlug(''); setSchedTitle(''); return; }
    try { const r = await api.createOrUpdateSchedulingLink(payload); if (r.success && r.schedulingLink) { setSchedulingLinks(p => [...p, r.schedulingLink]); notify('Scheduling link created', 'success'); setSchedSlug(''); setSchedTitle(''); setSchedDesc(''); setSchedOverrides([]); } }
    catch (err) { notify(err.message || 'Error', 'error'); }
  }

  async function handleDeleteSched(id) {
    if (isLoggedOut) { setSchedulingLinks(p => p.filter(s => s.id !== id)); return; }
    try { const r = await api.deleteSchedulingLink(id); if (r.success) setSchedulingLinks(p => p.filter(s => s.id !== id)); }
    catch (err) { notify(err.message || 'Error', 'error'); }
  }

  async function handleCreateTeam(e) {
    e.preventDefault();
    if (isLoggedOut) { setTeams(p => [...p, { id: `mock-t-${Date.now()}`, name: newTeamName, members: [] }]); setNewTeamName(''); return; }
    try { const r = await api.createTeam({ name: newTeamName }); if (r.success && r.team) { setTeams(p => [...p, { ...r.team, members: [] }]); setNewTeamName(''); notify('Team created', 'success'); } }
    catch (err) { notify(err.message || 'Error', 'error'); }
  }

  async function handleAddTeamMember(teamId) {
    if (!teamMemberUid) return;
    if (isLoggedOut) {
      setTeams(p => p.map(t => t.id === teamId ? { ...t, members: [...(t.members||[]), { user_uid: `mock-${Date.now()}`, email: teamMemberUid, role: teamMemberRole }] } : t));
      setTeamMemberUid(''); return;
    }
    try { const r = await api.addTeamMember(teamId, { email: teamMemberUid, user_uid: teamMemberUid, role: teamMemberRole }); if (r.success) { const ref = await api.getTeams(); if (ref.success) setTeams(ref.teams || []); setTeamMemberUid(''); } }
    catch (err) { notify(err.message || 'Error', 'error'); }
  }

  async function handleRemoveTeamMember(teamId, memberUid) {
    if (isLoggedOut) { setTeams(p => p.map(t => t.id === teamId ? { ...t, members: (t.members||[]).filter(m => m.user_uid !== memberUid) } : t)); return; }
    try { const r = await api.removeTeamMember(teamId, memberUid); if (r.success) { const ref = await api.getTeams(); if (ref.success) setTeams(ref.teams || []); } }
    catch (err) { notify(err.message || 'Error', 'error'); }
  }

  async function handleDeleteTeam(teamId) {
    if (isLoggedOut) { setTeams(p => p.filter(t => t.id !== teamId)); return; }
    try { const r = await api.deleteTeam(teamId); if (r.success) setTeams(p => p.filter(t => t.id !== teamId)); }
    catch (err) { notify(err.message || 'Error', 'error'); }
  }

  function handleAddOverride(e) {
    e.preventDefault();
    if (!overrideDate || !overrideStart || !overrideEnd) return;
    const idx = schedOverrides.findIndex(o => o.date === overrideDate);
    if (idx > -1) { const u = [...schedOverrides]; u[idx].slots.push({ start: overrideStart, end: overrideEnd }); setSchedOverrides(u); }
    else setSchedOverrides(p => [...p, { date: overrideDate, slots: [{ start: overrideStart, end: overrideEnd }] }]);
    setOverrideDate('');
  }

  function handleRemoveOverride(di, si) {
    const u = [...schedOverrides];
    u[di].slots.splice(si, 1);
    if (!u[di].slots.length) u.splice(di, 1);
    setSchedOverrides(u);
  }

  function openSettings(tab = 'calendars') {
    setSettingsInitialTab(tab);
    setShowSettingsModal(true);
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.container}>
      <Notification notification={notif} onDismiss={() => setNotif(null)} />
      <Sidebar userProfile={userProfile} isLoggedOut={isLoggedOut} />

      <main className={styles.main}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.viewToggle}>
            <button className={`${styles.viewBtn} ${view === 'calendar' ? styles.viewBtnActive : ''}`} onClick={() => setView('calendar')}>Calendar</button>
            <button className={`${styles.viewBtn} ${view === 'agenda'   ? styles.viewBtnActive : ''}`} onClick={() => setView('agenda')}>Today</button>
          </div>
          <div className={styles.headerRight}>
            <button className={styles.settingsBtn} onClick={() => openSettings('schedulers')} title="Scheduling settings">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
              </svg>
            </button>
            <button className={styles.createBtn} onClick={() => setShowEventModal(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Event
            </button>
          </div>
        </header>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
          </div>
        ) : (
          <div className={styles.grid}>
            {/* Left panel */}
            <div className={styles.leftPanel}>
              <DateCard selectedDate={selectedDate} />

              <div className={styles.panelCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>Agenda</h3>
                  <span className={styles.badge}>{selectedDateEvents.length}</span>
                </div>
                <EventList
                  events={selectedDateEvents}
                  onDelete={handleDeleteEvent}
                  onEventClick={(evt) => { setEditingEvent(evt); setShowEventModal(true); }}
                />
              </div>
            </div>

            {/* Right panel */}
            <div className={styles.rightPanel}>
              {view === 'calendar' ? (
                <CalendarGrid
                  days={daysList}
                  events={events}
                  selectedDate={selectedDate}
                  currentDate={currentDate}
                  onDaySelect={setSelectedDate}
                  onPrevMonth={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                  onNextMonth={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                  onEventSelect={(evt) => { setEditingEvent(evt); setShowEventModal(true); }}
                />
              ) : (
                <AgendaView events={events} onAddEvent={(date) => { setSelectedDate(date); setShowEventModal(true); }} />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <EventModal
        open={showEventModal}
        onClose={() => { setShowEventModal(false); setEditingEvent(null); }}
        calendars={calendars}
        teams={teams}
        eventTitle={eventTitle} setEventTitle={setEventTitle}
        eventDesc={eventDesc}   setEventDesc={setEventDesc}
        eventStart={eventStart} setEventStart={setEventStart}
        eventEnd={eventEnd}     setEventEnd={setEventEnd}
        eventCalendarId={eventCalendarId} setEventCalendarId={setEventCalendarId}
        eventLocation={eventLocation}     setEventLocation={setEventLocation}
        eventInvitees={eventInvitees}     setEventInvitees={setEventInvitees}
        eventAllowGuests={eventAllowGuests} setEventAllowGuests={setEventAllowGuests}
        onSubmit={handleCreateEvent}
        editingEvent={editingEvent}
        onDelete={handleDeleteEvent}
        loading={eventLoading}
      />
      <SettingsModal
        open={showSettingsModal}
        initialTab={settingsInitialTab}
        onClose={() => setShowSettingsModal(false)}
        data={{
          calendars, schedulingLinks, teams,
          calName, calEmail, calProvider, setCalName, setCalEmail, setCalProvider,
          schedSlug, schedTitle, schedDesc, schedDuration, schedBuffer, schedLimit,
          schedVideoProvider, customMeetUrl, schedMeetingType, selectedTeamId, schedMemberUids,
          schedOverrides, overrideDate, overrideStart, overrideEnd,
          setSchedSlug, setSchedTitle, setSchedDesc, setSchedDuration, setSchedBuffer, setSchedLimit,
          setSchedVideoProvider, setCustomMeetUrl, setSchedMeetingType, setSelectedTeamId, setSchedMemberUids,
          setOverrideDate, setOverrideStart, setOverrideEnd,
          newTeamName, setNewTeamName, teamMemberUid, setTeamMemberUid, teamMemberRole, setTeamMemberRole,
        }}
        handlers={{ onAddCalendar: handleAddCalendar, onDeleteCalendar: handleDeleteCalendar, onAddSchedulingLink: handleAddSchedulingLink, onDeleteSched: handleDeleteSched, onCreateTeam: handleCreateTeam, onAddTeamMember: handleAddTeamMember, onRemoveTeamMember: handleRemoveTeamMember, onDeleteTeam: handleDeleteTeam, onAddOverride: handleAddOverride, onRemoveOverride: handleRemoveOverride }}
      />
      <ConfirmModal
        open={!!confirmDeleteId}
        title="Delete Event"
        message="Are you sure you want to permanently delete this event? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDeleteEvent}
        onCancel={() => setConfirmDeleteId(null)}
      />
      <AISummaryCard summary={aiSummary} loading={aiLoading} />
    </div>
  );
}