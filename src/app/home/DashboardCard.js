'use client';

import Link from 'next/link';
import styles from './home.module.css';

export default function DashboardCard({ label, title, detail, href, tone = 'teal', children }) {
  return <Link href={href} className={`${styles.dashboardCard} ${styles[tone]}`}><span className={styles.cardLabel}>{label}</span><strong>{title}</strong><span className={styles.cardDetail}>{detail}</span>{children}</Link>;
}
