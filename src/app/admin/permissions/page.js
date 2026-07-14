'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { inputStyle, btnPrimary, btnDanger, btnGhost, card, Alert } from '../shared';

export default function PermissionsPage() {
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [validPerms, setValidPerms] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [msg, setMsg] = useState({ text: '', type: 'success' });

  useEffect(() => {
    Promise.all([api.admin.listUsers(), api.admin.listValidPermissions()])
      .then(([uRes, pRes]) => {
        if (uRes.success) setUsers(uRes.data);
        if (pRes.success) setValidPerms(pRes.data);
      }).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const res = await api.admin.updateUserPermissions(selectedUser, { permissions });
      setMsg({ text: res.message + (res.warnings ? ` (${res.warnings})` : ''), type: res.success ? 'success' : 'error' });
    } catch (e) { setMsg({ text: e.message, type: 'error' }); }
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.7rem', fontWeight: 700, marginBottom: '0.4rem' }}>Permissions</h1>
      <p style={{ color: '#5f6368', marginBottom: '2rem' }}>Assign fine-grained permissions to specific members.</p>

      <div style={card}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>Select Member</label>
            <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} required style={inputStyle}>
              <option value="">Choose a member…</option>
              {users.map(u => <option key={u.id} value={u.uid || u.id}>{u.email} ({u.role})</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600 }}>Permissions</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
              {validPerms.map(p => (
                <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={permissions.includes(p)}
                    onChange={e => setPermissions(prev => e.target.checked ? [...prev, p] : prev.filter(x => x !== p))}
                  />
                  {p.replace(/_/g, ' ')}
                </label>
              ))}
            </div>
          </div>
          <button type="submit" style={btnPrimary}>Save Permissions</button>
          <Alert msg={msg.text} type={msg.type} />
        </form>
      </div>
    </div>
  );
}
