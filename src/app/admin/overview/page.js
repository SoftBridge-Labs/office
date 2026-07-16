'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { inputStyle, btnPrimary, btnDanger, btnGhost, card, Alert } from '../shared';

export default function OverviewPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.admin.getStats()
      .then(res => { if (res.success) setStats(res.data); })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  const statCard = (label, value, color = '#1a73e8') => (
    <div style={{ padding: '1.25rem 1.5rem', border: '1px solid #dadce0', borderRadius: '10px', backgroundColor: '#fff', textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', fontWeight: 700, color }}>{value ?? '–'}</div>
      <div style={{ fontSize: '0.82rem', color: '#5f6368', marginTop: '0.3rem' }}>{label}</div>
    </div>
  );

  return (
    <div>
      <h1 style={{ fontSize: '1.7rem', fontWeight: 700, marginBottom: '0.4rem' }}>Workspace Overview</h1>
      <p style={{ color: '#5f6368', marginBottom: '2rem' }}>Real-time workspace health and usage statistics.</p>
      <Alert msg={err} type="error" />
      {loading ? <p>Loading…</p> : stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.25rem' }}>
          {statCard('Total Members', stats.members?.total)}
          {statCard('Active Members', stats.members?.active, '#137333')}
          {statCard('Departments', stats.departments, '#8e24aa')}
          {statCard('Disabled Apps', stats.enabledApps?.length, '#f57c00')}
          {statCard('Audit Events (30d)', stats.auditActivity30d, '#d93025')}
          {stats.subscription && statCard('Billing Plan', stats.subscription.plan?.toUpperCase(), '#1a73e8')}
        </div>
      )}
    </div>
  );
}
