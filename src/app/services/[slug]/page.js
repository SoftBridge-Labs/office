import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from '../services.module.css';

const services = {
  calendar: ['Team calendar', 'Coordinate schedules without the back-and-forth.', 'Share availability, create events, and keep meetings connected to the rest of your work.'],
  docs: ['Collaborative docs', 'A clear home for your team knowledge.', 'Create polished documents, share them with the right people, and keep decisions easy to find.'],
  tasks: ['Project tasks', 'Make priorities visible and progress measurable.', 'Organize work into tasks, set priorities, and keep projects moving with a focused workspace.'],
  meet: ['Video meetings', 'Private, practical meetings for modern teams.', 'Start secure video meetings with chat, screen sharing, and guest-friendly access.'],
  ping: ['Team messaging', 'Conversations that stay connected to work.', 'Use channels, direct messages, presence, reactions, and calls to keep your team aligned.'],
  tickets: ['Customer support', 'Turn every customer question into a useful conversation.', 'Capture requests through an embeddable widget, triage with AI, and help customers from one inbox.'],
  whiteboard: ['Visual whiteboards', 'Think together, wherever your team is.', 'Sketch flows, explore ideas, and collaborate visually on a shared canvas.'],
  booking: ['Booking links', 'Make scheduling effortless for everyone.', 'Publish your availability and let people book the right time without email loops.']
};

export function generateStaticParams() {
  return Object.keys(services).map(slug => ({ slug }));
}

export function generateMetadata({ params }) {
  const service = services[params.slug];
  if (!service) return {};
  return { title: `${service[0]} | SoftBridge Workspace`, description: service[2], alternates: { canonical: `/services/${params.slug}` } };
}

export default function ServicePage({ params }) {
  const service = services[params.slug];
  if (!service) notFound();
  return <main className={styles.page}><header className={styles.header}><Link className={styles.logo} href="/services">SB</Link><span>SoftBridge Workspace</span><Link href="/login">Sign in</Link></header><article className={styles.detail}><p className={styles.eyebrow}>SoftBridge service</p><h1>{service[0]}</h1><h2>{service[1]}</h2><p>{service[2]}</p><div className={styles.actions}><Link className={styles.primary} href="/login">Get started</Link><Link className={styles.secondary} href="/services">Explore all services</Link></div></article></main>;
}
