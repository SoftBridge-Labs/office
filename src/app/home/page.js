'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import TopNav from '@/app/components/TopNav';
import DashboardCard from './DashboardCard';
import styles from './home.module.css';

const tools = [
  ['Meet', 'Focused video rooms', '/meet', 'teal'],
  ['Calendar', 'Plan the week', '/calendar', 'blue'],
  ['Tasks', 'Keep work moving', '/tasks', 'amber'],
  ['Docs', 'Write together', '/docs', 'coral'],
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
  const [greeting, setGreeting] = useState('Good morning');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGreeting(getGreeting(new Date().getHours()));
    const clock = window.setInterval(() => {
      setGreeting(getGreeting(new Date().getHours()));
    }, 60000);

    const savedUser = localStorage.getItem('sb_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        window.setTimeout(() => setUser(parsedUser), 0);
      } catch {}
    }
    Promise.all([
      api.getDocs().catch(() => ({})),
      api.getTasks().catch(() => ({})),
      api.getWhiteboards().catch(() => ({})),
      api.getEvents().catch(() => ({})),
    ]).then(([docs, tasks, boards, events]) => {
      const taskItems = tasks.data || tasks.tasks || [];
      const today = new Date().toISOString().slice(0, 10);
      setTaskSummary({
        total: taskItems.filter(item => item.completed !== true && item.status !== 'done').length,
        dueToday: taskItems.filter(item => (item.due_date || item.dueDate || '').startsWith(today)).length,
      });
      const eventItems = events.data || events.events || [];
      const upcoming = eventItems
        .filter(item => new Date(item.start_time || item.start || item.startTime) >= new Date())
        .sort((a, b) => new Date(a.start_time || a.start || a.startTime) - new Date(b.start_time || b.start || b.startTime))[0];
      setNextEvent(upcoming || null);
      const items = [
        ...(docs.data || []).map(item => ({ ...item, type: 'Document' })),
        ...(tasks.data || []).map(item => ({ ...item, type: 'Task' })),
        ...(boards.data || []).map(item => ({ ...item, type: 'Whiteboard' })),
      ];
      setRecent(items.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)).slice(0, 3));
    }).catch(() => setRecent([]));
    return () => window.clearInterval(clock);
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'there';
  return <div className={styles.page}>
    <TopNav userProfile={user} isLoggedOut={!user} />
    <main className={styles.main}>
      <p className={styles.kicker}><span /> Workspace overview</p>
      <div className={styles.heading}><h1>{greeting}, {firstName}.</h1><p>A clear view of what needs attention and where your team left off.</p></div>
      <section className={styles.dashboardGrid} aria-label="Workspace overview cards">
        <DashboardCard label="TODAY'S FOCUS" title="Make space for the work that matters." detail="Open your next meeting, review active tasks, or pick up a recent document." href="/calendar" tone="primaryCard"><span className={styles.primaryLink}>Open calendar -&gt;</span></DashboardCard>
        <DashboardCard label="NEXT UP" title={nextEvent?.title || 'No upcoming events'} detail={nextEvent ? new Date(nextEvent.start_time || nextEvent.start || nextEvent.startTime).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : 'Your calendar is clear'} href="/calendar" tone="teal" />
        <DashboardCard label="OPEN TASKS" title={`${taskSummary.total} tasks`} detail={`${taskSummary.dueToday} due today · Keep the momentum`} href="/tasks" tone="amber" />
      </section>
      <div className={styles.sectionTitle}><span>01</span><i /></div>
      <section className={styles.tools}>{tools.map(([name, detail, href, tone]) => <Link key={name} href={href} className={`${styles.toolCard} ${styles[tone]}`}><strong>{name}</strong><span>{detail} <b aria-hidden="true">-&gt;</b></span></Link>)}</section>
      <div className={styles.sectionTitle}><span>02</span><i /></div>
      <section className={styles.recent}>{recent.length ? recent.map(item => <Link className={styles.recentItem} href={item.type === 'Document' ? `/doc/${item._id}` : item.type === 'Task' ? '/tasks' : '/whiteboard'} key={item._id}><strong>{item.title || 'Untitled work'}</strong><span>{item.type} · Recently updated</span></Link>) : <div className={styles.recentItem}><strong>No recent work yet</strong><span>Start with a document, task, or meeting.</span></div>}</section>
    </main>
  </div>;
}
