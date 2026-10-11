'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import TopNav from '@/app/components/TopNav';
import DashboardCard from './DashboardCard';
import styles from './home.module.css';

const allTools = [
  ['Ping', 'Instant messaging', '/ping', 'indigo'],
  ['Meet', 'Focused video rooms', '/meet', 'teal'],
  ['Calendar', 'Plan the week', '/calendar', 'blue'],
  ['Tasks', 'Keep work moving', '/tasks', 'amber'],
  ['Docs', 'Write together', '/docs', 'coral'],
  ['Whiteboard', 'Brainstorm ideas', '/whiteboard', 'pink'],
  ['Booking', 'Share availability', '/booking', 'emerald'],
];

function getGreeting(hour) {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [recent, setRecent] = useState([]);
  const [nextEvent, setNextEvent] = useState(null);
  const [taskSummary, setTaskSummary] = useState({ total: 0, dueToday: 0 });
  const [recentApps, setRecentApps] = useState([]);
  const [showAllTools, setShowAllTools] = useState(false);
  const [greeting, setGreeting] = useState('Good morning');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGreeting(getGreeting(new Date().getHours()));
    const clock = window.setInterval(() => {
      setGreeting(getGreeting(new Date().getHours()));
    }, 60000);

    const savedUser = localStorage.getItem('sb_user') || localStorage.getItem('sb_user_profile');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        window.setTimeout(() => setUser(parsedUser), 0);
      } catch {}
    } else {
      const uid = localStorage.getItem('sb_uid');
      if (uid) {
        api.getAccount(uid).then(acct => {
          if (acct?.user) setUser(acct.user);
        }).catch(() => {});
      }
    }

    try {
      const storedApps = localStorage.getItem('sb_recent_apps');
      if (storedApps) {
        const parsed = JSON.parse(storedApps);
        const mapped = parsed.map(name => allTools.find(t => t[0] === name)).filter(Boolean);
        // Fill the rest with remaining tools if we have less than 4
        const remaining = allTools.filter(t => !mapped.includes(t));
        setRecentApps([...mapped, ...remaining].slice(0, 4));
      } else {
        setRecentApps(allTools.slice(0, 4));
      }
    } catch {
      setRecentApps(allTools.slice(0, 4));
    }
    Promise.all([
      api.getDocs().catch(() => ({})),
      api.getTasks().catch(() => ({})),
      api.getWhiteboards().catch(() => ({})),
      api.getEvents().catch(() => ({})),
    ]).then(([docs, tasks, boards, events]) => {
      const rawTasks = tasks?.data || tasks?.tasks || (Array.isArray(tasks) ? tasks : []);
      const taskItems = Array.isArray(rawTasks) ? rawTasks : [];
      const today = new Date().toISOString().slice(0, 10);
      setTaskSummary({
        total: taskItems.filter(item => item && item.completed !== true && item.status !== 'done').length,
        dueToday: taskItems.filter(item => item && (item.due_date || item.dueDate || '').startsWith(today)).length,
      });
      const rawEvents = events?.data || events?.events || (Array.isArray(events) ? events : []);
      const eventItems = Array.isArray(rawEvents) ? rawEvents : [];
      const upcoming = eventItems
        .filter(item => item && new Date(item.start_time || item.start || item.startTime) >= new Date())
        .sort((a, b) => new Date(a.start_time || a.start || a.startTime) - new Date(b.start_time || b.start || b.startTime))[0];
      setNextEvent(upcoming || null);
      const docsList = Array.isArray(docs?.data) ? docs.data : (Array.isArray(docs) ? docs : []);
      const boardsList = Array.isArray(boards?.data) ? boards.data : (Array.isArray(boards) ? boards : []);
      const items = [
        ...docsList.map(item => ({ ...item, type: 'Document' })),
        ...taskItems.map(item => ({ ...item, type: 'Task' })),
        ...boardsList.map(item => ({ ...item, type: 'Whiteboard' })),
      ];
      setRecent(items.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)).slice(0, 3));
    }).catch(() => setRecent([]));
    return () => window.clearInterval(clock);
  }, []);

  const handleAppClick = (appName) => {
    try {
      let stored = [];
      const raw = localStorage.getItem('sb_recent_apps');
      if (raw) stored = JSON.parse(raw);
      stored = [appName, ...stored.filter(n => n !== appName)].slice(0, 4);
      localStorage.setItem('sb_recent_apps', JSON.stringify(stored));
    } catch {}
  };

  const firstName = user?.name?.split(' ')[0] || 'there';
  const displayedTools = showAllTools ? allTools : recentApps;

  return <div className={styles.page}>
    <TopNav userProfile={user} isLoggedOut={!user} />
    <main className={styles.main}>
      <p className={styles.kicker}><span /> Workspace overview</p>
      <div className={styles.heading}><h1>{greeting}, {firstName}.</h1><p>A clear view of what needs attention and where your team left off.</p></div>
      <section className={styles.dashboardGrid} aria-label="Workspace overview cards">
        <DashboardCard label="TODAY'S FOCUS" title="Make space for the work that matters." detail="Open your next meeting, review active tasks, or pick up a recent document." href="/calendar" tone="primaryCard">
          <span className={styles.primaryLink} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            Open calendar
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </span>
        </DashboardCard>
        <DashboardCard label="NEXT UP" title={nextEvent?.title || 'No upcoming events'} detail={nextEvent ? new Date(nextEvent.start_time || nextEvent.start || nextEvent.startTime).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : 'Your calendar is clear'} href="/calendar" tone="teal" />
        <DashboardCard label="OPEN TASKS" title={`${taskSummary.total} tasks`} detail={`${taskSummary.dueToday} due today · Keep the momentum`} href="/tasks" tone="amber" />
      </section>
      <div className={styles.sectionTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
        <div><span>01</span><i /> <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted, #94a3b8)', marginLeft: '0.5rem', fontWeight: 600 }}>{showAllTools ? 'All Apps' : 'Recently Explored'}</span></div>
        <button onClick={() => setShowAllTools(!showAllTools)} style={{ background: 'none', border: 'none', color: 'var(--brand, #4f46e5)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>{showAllTools ? 'Show less' : 'Explore all apps'}</button>
      </div>
      <section className={styles.tools}>
        {displayedTools.map(([name, detail, href, tone]) => (
          <Link onClick={() => handleAppClick(name)} key={name} href={href} className={`${styles.toolCard} ${styles[tone]}`}>
            <strong>{name}</strong>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {detail}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </span>
          </Link>
        ))}
      </section>
      <div className={styles.sectionTitle}><span>02</span><i /></div>
      <section className={styles.recent}>{recent.length ? recent.map(item => <Link className={styles.recentItem} href={item.type === 'Document' ? `/doc/${item._id}` : item.type === 'Task' ? '/tasks' : '/whiteboard'} key={item._id}><strong>{item.title || 'Untitled work'}</strong><span>{item.type} · Recently updated</span></Link>) : <div className={styles.recentItem}><strong>No recent work yet</strong><span>Start with a document, task, or meeting.</span></div>}</section>
    </main>
  </div>;
}
