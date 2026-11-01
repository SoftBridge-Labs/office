import Link from 'next/link';
import styles from './services.module.css';

const services = [
  ['calendar', 'Team calendar', 'Plan meetings, share availability, and keep every schedule in one place.'],
  ['docs', 'Collaborative docs', 'Write, organize, and share living documents with your team.'],
  ['tasks', 'Project tasks', 'Turn plans into accountable work with priorities and sprint-friendly task boards.'],
  ['meet', 'Video meetings', 'Meet privately with reliable video, chat, screen sharing, and guest access.'],
  ['ping', 'Team messaging', 'Keep conversations, channels, presence, and quick calls together in Ping.'],
  ['tickets', 'Customer support', 'Collect customer requests, automate triage, and resolve conversations faster.'],
  ['whiteboard', 'Visual whiteboards', 'Explore ideas together with a flexible collaborative canvas.'],
  ['booking', 'Booking links', 'Let customers and teammates book time from a simple public scheduling page.']
];

export const metadata = {
  title: 'SoftBridge Workspace Services',
  description: 'Explore SoftBridge tools for calendars, documents, tasks, meetings, messaging, customer support, whiteboards, and booking.',
  alternates: { canonical: '/services' }
};

export default function ServicesPage() {
  return <main className={styles.page}>
    <header className={styles.header}><span className={styles.logo}>SB</span><span>SoftBridge Workspace</span><Link href="/login">Sign in</Link></header>
    <section className={styles.hero}><p className={styles.eyebrow}>One calm workspace</p><h1>Everything your team needs to move work forward.</h1><p>SoftBridge brings planning, collaboration, communication, and customer support into one secure workspace.</p></section>
    <section className={styles.grid} aria-label="SoftBridge services">{services.map(([slug, title, description]) => <Link className={styles.card} key={slug} href={`/services/${slug}`}><span className={styles.icon}>{title.slice(0, 1)}</span><h2>{title}</h2><p>{description}</p><span className={styles.learn}>Learn more →</span></Link>)}</section>
  </main>;
}
