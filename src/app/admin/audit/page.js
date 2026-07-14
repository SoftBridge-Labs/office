'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { inputStyle, btnPrimary, btnDanger, btnGhost, card, Alert } from '../shared';

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [eventFilter, setEventFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const LIMIT = 20;

  const load = useCallback(() => {
    setLoading(true);
    const params = { limit: LIMIT, offset };
    if (eventFilter) params.event = eventFilter;
    api.admin.getAuditLogs(params)
      .then(res => { if (res.success) { setLogs(res.data); setTotal(res.meta?.total || 0); } })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [offset, eventFilter]);

  useEffect(load, [load]);

  const handleExport = async () => {
    try {
      const res = await api.admin.exportAuditLogs();
      if (res.success) {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${Date.now()}.json`;
        a.click();
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.7rem', fontWeight: 700, marginBottom: '0.4rem' }}>Audit Logs</h1>
          <p style={{ color: '#5f6368' }}>Track all admin and workspace activity events.</p>
        </div>
        <button onClick={handleExport} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #dadce0', cursor: 'pointer', fontSize: '0.88rem', backgroundColor: '#fff' }}>⬇ Export JSON</button>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem' }}>
        <input type="text" placeholder="Filter by event name…" value={eventFilter} onChange={e => { setEventFilter(e.target.value); setOffset(0); }} style={{ ...inputStyle, width: '280px' }} />
        <span style={{ color: '#5f6368', fontSize: '0.88rem', alignSelf: 'center' }}>{total} total events</span>
      </div>

      <div style={card}>
        {loading ? <p>Loading…</p> : logs.length === 0 ? <p style={{ color: '#5f6368' }}>No audit log entries.</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #dadce0' }}>
                {['Time', 'Event', 'Actor', 'IP'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#5f6368', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#5f6368', whiteSpace: 'nowrap' }}>{new Date(log.createdAt).toLocaleString()}</td>
                  <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>{log.event}</td>
                  <td style={{ padding: '0.5rem 0.75rem' }}>{log.actor_email || log.uid || '—'}</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#5f6368' }}>{log.ip || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {total > LIMIT && (
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - LIMIT))} style={{ ...btnGhost, padding: '0.4rem 0.85rem' }}>← Prev</button>
            <span style={{ fontSize: '0.85rem', color: '#5f6368' }}>Page {Math.floor(offset / LIMIT) + 1} of {Math.ceil(total / LIMIT)}</span>
            <button disabled={offset + LIMIT >= total} onClick={() => setOffset(offset + LIMIT)} style={{ ...btnGhost, padding: '0.4rem 0.85rem' }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
