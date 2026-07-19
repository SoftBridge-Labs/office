'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { inputStyle, btnPrimary, btnDanger, btnGhost, card, Alert } from '../shared';

export default function DepartmentsPage() {
  const [depts, setDepts] = useState([]);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState({ text: '', type: 'success' });
  const [posTitle, setPosTitle] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  const load = useCallback(() => {
    api.admin.listDepartments().then(res => { if (res.success) setDepts(res.data); }).catch(console.error);
  }, []);

  useEffect(load, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.admin.createDepartment({ name });
      setMsg({ text: res.message, type: res.success ? 'success' : 'error' });
      if (res.success) { setName(''); load(); }
    } catch (e) { setMsg({ text: e.message, type: 'error' }); }
  };

  const handleDelete = async (id) => {
    if (!await window.confirmAsync('Are you sure you want to delete this department? All positions inside will also be removed.')) return;
    try {
      const res = await api.admin.deleteDepartment(id);
      setMsg({ text: res.message, type: res.success ? 'success' : 'error' });
      if (res.success) load();
    } catch (e) { setMsg({ text: e.message, type: 'error' }); }
  };

  const handleAddPos = async (e) => {
    e.preventDefault();
    if (!selectedDept) return;
    try {
      const res = await api.admin.addPosition(selectedDept, { title: posTitle });
      setMsg({ text: res.message, type: res.success ? 'success' : 'error' });
      if (res.success) { setPosTitle(''); load(); }
    } catch (e) { setMsg({ text: e.message, type: 'error' }); }
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.7rem', fontWeight: 700, marginBottom: '0.4rem' }}>Departments & Positions</h1>
      <p style={{ color: '#5f6368', marginBottom: '2rem' }}>Organize your workspace into departments.</p>

      <div style={card}>
        <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Create Department</h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '0.75rem' }}>
          <input type="text" placeholder="e.g. Engineering" value={name} onChange={e => setName(e.target.value)} required style={{ ...inputStyle, flex: 1 }} />
          <button type="submit" style={btnPrimary}>Create</button>
        </form>
        <Alert msg={msg.text} type={msg.type} />
      </div>

      {depts.length > 0 && (
        <div style={card}>
          <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Add Position to Department</h3>
          <form onSubmit={handleAddPos} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)} required style={{ ...inputStyle, flex: '1', minWidth: '160px' }}>
              <option value="">Select Department</option>
              {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <input type="text" placeholder="Position title" value={posTitle} onChange={e => setPosTitle(e.target.value)} required style={{ ...inputStyle, flex: 1 }} />
            <button type="submit" style={btnPrimary}>Add Position</button>
          </form>
        </div>
      )}

      <div style={card}>
        <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>All Departments</h3>
        {depts.length === 0 ? <p style={{ color: '#5f6368' }}>No departments yet.</p> : depts.map(d => (
          <div key={d.id} style={{ padding: '0.75rem', marginBottom: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600 }}>{d.name}</div>
              <button onClick={() => handleDelete(d.id)} style={{ ...btnDanger, padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}>Delete</button>
            </div>
            {d.positions && d.positions.length > 0 && (
              <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {d.positions.map(p => (
                  <span key={p.id} style={{ fontSize: '0.78rem', padding: '0.2rem 0.5rem', backgroundColor: '#e8eaed', borderRadius: '12px' }}>{p.title}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
