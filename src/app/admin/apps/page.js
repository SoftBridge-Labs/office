'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { inputStyle, btnPrimary, btnDanger, btnGhost, card, Alert } from '../shared';

export default function AppsPage() {
  const [apps, setApps] = useState([]);
  const [msg, setMsg] = useState({ text: '', type: 'success' });

  const load = useCallback(() => {
    api.admin.listApps().then(res => { if (res.success) setApps(res.data); }).catch(console.error);
  }, []);

  useEffect(load, [load]);

  const toggle = async (appId, current) => {
    try {
      const res = await api.admin.toggleAppStatus(appId, { enabled: !current });
      setMsg({ text: res.message, type: res.success ? 'success' : 'error' });
      if (res.success) load();
    } catch (e) { setMsg({ text: e.message, type: 'error' }); }
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.7rem', fontWeight: 700, marginBottom: '0.4rem' }}>App Configuration</h1>
      <p style={{ color: '#5f6368', marginBottom: '2rem' }}>Enable or disable workspace applications for your organization.</p>
      <Alert msg={msg.text} type={msg.type} />
      <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {apps.map(app => (
          <div key={app.app_id} style={{ ...card, marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{app.app_id}</div>
              <div style={{ fontSize: '0.78rem', color: app.enabled ? '#137333' : '#d93025', marginTop: '0.2rem' }}>{app.enabled ? 'Enabled' : 'Disabled'}</div>
            </div>
            <button onClick={() => toggle(app.app_id, app.enabled)} style={{ ...(app.enabled ? btnDanger : btnPrimary), padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
              {app.enabled ? 'Disable' : 'Enable'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
