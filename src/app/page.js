'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

const tools = [
  { name: 'Meet', detail: 'Focused video rooms', tone: 'teal', href: '/meet', iconSrc: '/Icons/Meet.png' },
  { name: 'Calendar', detail: 'Plan the week', tone: 'blue', href: '/calendar', iconSrc: '/Icons/Calender.png' },
  { name: 'Tasks', detail: 'Keep work moving', tone: 'amber', href: '/tasks', iconSrc: '/Icons/Tasks.png' },
  { name: 'Docs', detail: 'Write together', tone: 'coral', href: '/docs', iconSrc: '/Icons/Docs.png' },
];

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem('sb_user')) router.replace('/home');
  }, [router]);

  return (
    <main className={styles.landing}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/"><span className={styles.brandMark}>S</span><span>SoftBridge <em>Workspace</em></span></Link>
        <nav className={styles.nav} aria-label="Primary navigation"><Link href="/pricing">Plans</Link><Link className={styles.signIn} href="/login">Sign in <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '4px' }}><path d="M5 12h14M12 5l7 7-7 7"/></svg></Link></nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span /> THE CALM WORKSPACE FOR BUSY TEAMS</p>
          <h1>Work clearly.<br /><strong>Move together.</strong></h1>
          <p className={styles.lede}>A focused home for conversations, schedules, documents, and the small decisions that keep a team moving.</p>
          <div className={styles.actions}><Link className={styles.primaryAction} href="/login">Open Workspace <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '6px' }}><path d="M5 12h14M12 5l7 7-7 7"/></svg></Link><Link className={styles.secondaryAction} href="/pricing">View plans</Link></div>
          <p className={styles.note}>One account. One shared view of the work.</p>
        </div>

        <div className={styles.workspacePreview} aria-label="Workspace preview">
          <div className={styles.previewTop}><span className={styles.previewDot} /><span>Monday, 26 September</span><span className={styles.liveStatus}>● All systems ready</span></div>
          <div className={styles.previewBody}>
            <aside className={styles.previewRail}><b>SB</b><img src="/Icons/Home.png" alt="" width="18" height="18" style={{ objectFit: 'contain' }} /><img src="/Icons/Calender.png" alt="" width="18" height="18" style={{ objectFit: 'contain' }} /><img src="/Icons/Tasks.png" alt="" width="18" height="18" style={{ objectFit: 'contain' }} /><img src="/Icons/Docs.png" alt="" width="18" height="18" style={{ objectFit: 'contain' }} /></aside>
            <div className={styles.previewMain}>
              <div className={styles.previewHeading}><div><small>YOUR WORKSPACE</small><h2>Good morning, team.</h2></div><span className={styles.avatar}>AK</span></div>
              <div className={styles.previewGrid}>
                <div className={`${styles.previewCard} ${styles.meetingCard}`}><small>NEXT UP</small><strong>Product review</strong><span>10:30 - 11:15 · Meet</span><button type="button">Join room</button></div>
                <div className={styles.previewCard}><small>THIS WEEK</small><strong>12 tasks</strong><span>4 due today</span><div className={styles.progress}><i /></div></div>
                <div className={`${styles.previewCard} ${styles.wideCard}`}><small>RECENTLY OPENED</small><strong>Launch notes / Q4</strong><span>Edited by Anika and 3 others</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.tools}>
        <div className={styles.sectionLabel}><span>01</span><p>Everything in reach</p><span className={styles.rule} /></div>
        <div className={styles.toolsIntro}><h2>Less hunting.<br />More doing.</h2><p>Your everyday tools, arranged around the way work actually happens. Pick up where you left off without losing the thread.</p></div>
        <div className={styles.toolGrid}>{tools.map((tool, index) => <Link className={`${styles.tool} ${styles[tool.tone]}`} href={tool.href} key={tool.name}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}><span className={styles.toolNumber}>0{index + 1}</span><img src={tool.iconSrc} alt="" width="26" height="26" style={{ objectFit: 'contain' }} /></div><h3>{tool.name}</h3><p>{tool.detail}</p><span className={styles.toolArrow} aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span></Link>)}</div>
      </section>

      <footer className={styles.footer}><span>© {new Date().getFullYear()} SoftBridge Labs</span><span>Built for thoughtful work</span><div><a href="https://softbridgelabs.in/legal/privacy.html">Privacy</a><a href="https://softbridgelabs.in/legal/terms.html">Terms</a></div></footer>
    </main>
  );
}
