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
      <h1 style={{ fontSize: '1.7rem', fontWeight: 700, marginBottom: '0.4rem', color: '#1e293b' }}>App Configuration</h1>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>Enable or disable workspace applications for your organization.</p>
      <Alert msg={msg.text} type={msg.type} />
      <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {apps.map(app => (
          <div key={app.app_id} style={{ ...card, padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', borderRadius: '8px' }}>
            <div>
              <div style={{ fontWeight: 600, textTransform: 'capitalize', fontSize: '1.1rem', color: '#1e293b', marginBottom: '0.3rem' }}>{app.app_id}</div>
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 600, backgroundColor: app.enabled ? '#dcfce7' : '#fee2e2', color: app.enabled ? '#166534' : '#991b1b', textTransform: 'uppercase' }}>
                {app.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <button onClick={() => toggle(app.app_id, app.enabled)} style={{ ...(app.enabled ? btnGhost : btnPrimary), border: app.enabled ? '1px solid #e2e8f0' : 'none', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              {app.enabled ? 'Disable' : 'Enable'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
