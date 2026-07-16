'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { inputStyle, btnPrimary, btnDanger, btnGhost, card, Alert } from '../shared';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [authorityLevel, setAuthorityLevel] = useState('employee');
  const [selectedDepts, setSelectedDepts] = useState([]);
  const [reportsTo, setReportsTo] = useState('');
  
  const [msg, setMsg] = useState({ text: '', type: 'success' });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Edit State
  const [editingUserId, setEditingUserId] = useState(null);
  const [editData, setEditData] = useState({});

  // Pagination State
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.admin.listUsers({ limit, offset }).catch(() => ({ success: false, data: [] })),
      api.admin.listDepartments().catch(() => ({ success: false, data: [] }))
    ]).then(([usersRes, deptsRes]) => {
      if (usersRes.success) {
        setUsers(usersRes.data);
        if (usersRes.meta) setTotal(usersRes.meta.total);
      }
      if (deptsRes.success) setDepartmentsList(deptsRes.data);
    }).catch(e => setMsg({ text: e.message, type: 'error' }))
      .finally(() => setLoading(false));
  }, [limit, offset]);

  useEffect(load, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setMsg({ text: '', type: 'success' });
    try {
      const payload = { 
        email, 
        role, 
        departments: selectedDepts, 
        authority_level: authorityLevel, 
        reports_to_uid: reportsTo || null 
      };
      const res = await api.admin.addUser(payload);
      setMsg({ text: res.message, type: res.success ? 'success' : 'error' });
      if (res.success) { 
        setEmail(''); 
        setSelectedDepts([]); 
        setAuthorityLevel('employee'); 
        setReportsTo(''); 
        load(); 
      }
    } catch (e) { setMsg({ text: e.message, type: 'error' }); }
  };

  const handleRemove = async (userId) => {
    if (!confirm('Are you sure you want to remove this member from the workspace?')) return;
    try {
      const res = await api.admin.removeUser(userId);
      setMsg({ text: res.message, type: res.success ? 'success' : 'error' });
      if (res.success) load();
    } catch (e) { setMsg({ text: e.message, type: 'error' }); }
  };

  const handleResend = async (userId) => {
    try {
      const res = await api.admin.resendInvite(userId);
      setMsg({ text: res.message, type: res.success ? 'success' : 'error' });
    } catch (e) { setMsg({ text: e.message, type: 'error' }); }
  };

  // Inline Editing
  const startEdit = (u) => {
    setEditingUserId(u.id);
    setEditData({
      role: u.role,
      authority_level: u.authority_level || 'employee',
      departments: u.departments || [],
      reports_to_uid: u.reports_to_uid || ''
    });
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditData({});
  };

  const saveEdit = async (userId) => {
    try {
      const payload = {
        role: editData.role,
        authority_level: editData.authority_level,
        departments: editData.departments,
        reports_to_uid: editData.reports_to_uid || null
      };
      const res = await api.admin.modifyUser(userId, payload);
      setMsg({ text: res.message, type: res.success ? 'success' : 'error' });
      if (res.success) {
        setEditingUserId(null);
        load();
      }
    } catch (e) {
      setMsg({ text: e.message, type: 'error' });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.7rem', fontWeight: 700, marginBottom: '0.4rem', color: '#1e293b' }}>Team Directory</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Manage members, structure, and roles across your workspace.</p>
        </div>
      </div>

      <div style={{ ...card, marginBottom: '2rem', padding: '1.5rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <h3 style={{ marginBottom: '1rem', fontWeight: 600, fontSize: '1.1rem', color: '#334155' }}>Invite New Member</h3>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.3rem' }}>Email Address</label>
              <input type="email" placeholder="colleague@example.com" value={email} onChange={e => setEmail(e.target.value)} required style={{ ...inputStyle, width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.3rem' }}>System Role</label>
              <select value={role} onChange={e => setRole(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.3rem' }}>Authority Level / Position</label>
              <select value={authorityLevel} onChange={e => setAuthorityLevel(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
                <optgroup label="Standard Levels">
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="director">Director</option>
                  <option value="executive">Executive</option>
                </optgroup>
                {departmentsList.some(d => d.positions && d.positions.length > 0) && (
                  <optgroup label="Department Positions">
                    {departmentsList.flatMap(d => d.positions || []).map(p => (
                      <option key={p.id} value={p.title}>{p.title}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.3rem' }}>Reports To</label>
              <select value={reportsTo} onChange={e => setReportsTo(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
                <option value="">(None)</option>
                {users.map(u => <option key={u.uid} value={u.uid}>{u.name || u.email}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.3rem' }}>Department</label>
              <select value={selectedDepts[0] || ''} onChange={e => setSelectedDepts(e.target.value ? [e.target.value] : [])} style={{ ...inputStyle, width: '100%' }}>
                <option value="">(None)</option>
                {departmentsList.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" style={{ ...btnPrimary, alignSelf: 'flex-start', padding: '0.6rem 1.5rem' }}>Send Invitation</button>
        </form>
        <div style={{ marginTop: '1rem' }}><Alert msg={msg.text} type={msg.type} /></div>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontWeight: 600, fontSize: '1.1rem', color: '#334155' }}>All Members <span style={{ color: '#94a3b8', fontWeight: 400 }}>({users.length})</span></h3>
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ ...inputStyle, width: '250px', marginBottom: 0 }}
          />
        </div>
        
        {loading ? <p style={{ color: '#64748b' }}>Loading directory…</p> : users.length === 0 ? <p style={{ color: '#64748b' }}>No members yet.</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  {['User', 'Role', 'Authority & Reporting', 'Departments', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.75rem', color: '#64748b', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.filter(u => !searchQuery || (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) || (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))).map(u => {
                  const isEditing = editingUserId === u.id;
                  
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s', backgroundColor: isEditing ? '#f8fafc' : 'transparent' }}>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div style={{ fontWeight: 500, color: '#1e293b' }}>{u.name || 'Unknown Name'}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{u.email}</div>
                      </td>
                      
                      {/* ROLE */}
                      <td style={{ padding: '1rem 0.75rem' }}>
                        {isEditing ? (
                          <select value={editData.role} onChange={e => setEditData({...editData, role: e.target.value})} style={{ ...inputStyle, padding: '0.3rem', fontSize: '0.85rem' }}>
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        ) : (
                          <span style={{ padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: u.role === 'admin' ? '#dbeafe' : '#f1f5f9', color: u.role === 'admin' ? '#1d4ed8' : '#334155' }}>
                            {u.role}
                          </span>
                        )}
                      </td>
                      
                      {/* AUTHORITY & REPORTING */}
                      <td style={{ padding: '1rem 0.75rem' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <select value={editData.authority_level} onChange={e => setEditData({...editData, authority_level: e.target.value})} style={{ ...inputStyle, padding: '0.3rem', fontSize: '0.85rem' }}>
                              <optgroup label="Standard Levels">
                                <option value="employee">Employee</option>
                                <option value="manager">Manager</option>
                                <option value="director">Director</option>
                                <option value="executive">Executive</option>
                              </optgroup>
                              {departmentsList.some(d => d.positions && d.positions.length > 0) && (
                                <optgroup label="Department Positions">
                                  {departmentsList.flatMap(d => d.positions || []).map(p => (
                                    <option key={p.id} value={p.title}>{p.title}</option>
                                  ))}
                                </optgroup>
                              )}
                            </select>
                            <select value={editData.reports_to_uid} onChange={e => setEditData({...editData, reports_to_uid: e.target.value})} style={{ ...inputStyle, padding: '0.3rem', fontSize: '0.85rem' }}>
                              <option value="">Reports To (None)</option>
                              {users.filter(x => x.id !== u.id).map(mgr => <option key={mgr.uid} value={mgr.uid}>{mgr.name || mgr.email}</option>)}
                            </select>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span style={{ fontSize: '0.85rem', color: '#334155', textTransform: 'capitalize', fontWeight: 500 }}>
                              {u.authority_level || 'Employee'}
                            </span>
                            {u.reports_to_uid && (
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                Reports to: {users.find(x => x.uid === u.reports_to_uid)?.name || 'Unknown'}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      
                      {/* DEPARTMENTS */}
                      <td style={{ padding: '1rem 0.75rem', fontSize: '0.85rem', color: '#475569' }}>
                        {isEditing ? (
                          <select value={editData.departments[0] || ''} onChange={e => setEditData({...editData, departments: e.target.value ? [e.target.value] : []})} style={{ ...inputStyle, padding: '0.3rem', fontSize: '0.85rem' }}>
                            <option value="">(None)</option>
                            {departmentsList.map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                            {u.departments && Array.isArray(u.departments) && u.departments.length > 0 
                              ? u.departments.map(id => (
                                  <span key={id} style={{ padding: '0.1rem 0.5rem', backgroundColor: '#e2e8f0', borderRadius: '4px', fontSize: '0.75rem', color: '#1e293b' }}>
                                    {departmentsList.find(d => d.id === id)?.name || id}
                                  </span>
                                ))
                              : <span style={{ color: '#94a3b8' }}>None</span>}
                          </div>
                        )}
                      </td>
                      
                      {/* STATUS */}
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: u.status === 'active' ? '#dcfce7' : '#fee2e2', color: u.status === 'active' ? '#166534' : '#991b1b' }}>
                          {u.status}
                        </span>
                      </td>
                      
                      {/* ACTIONS */}
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {isEditing ? (
                            <>
                              <button onClick={() => saveEdit(u.id)} style={{ ...btnPrimary, padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>Save</button>
                              <button onClick={cancelEdit} style={{ ...btnGhost, padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>Cancel</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(u)} style={{ ...btnGhost, padding: '0.3rem 0.75rem', fontSize: '0.8rem', border: '1px solid #e2e8f0' }}>Edit</button>
                              {u.status === 'invited' && (
                                <button onClick={() => handleResend(u.id)} style={{ ...btnGhost, padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>Resend</button>
                              )}
                              <button onClick={() => handleRemove(u.id)} style={{ ...btnDanger, padding: '0.3rem 0.75rem', fontSize: '0.8rem', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #fca5a5' }}>Remove</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {total > limit && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} users</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setOffset(Math.max(0, offset - limit))} disabled={offset === 0} style={{ ...btnGhost, padding: '0.3rem 0.75rem', fontSize: '0.85rem', border: '1px solid #e2e8f0', opacity: offset === 0 ? 0.5 : 1 }}>Previous</button>
                  <button onClick={() => setOffset(offset + limit)} disabled={offset + limit >= total} style={{ ...btnGhost, padding: '0.3rem 0.75rem', fontSize: '0.85rem', border: '1px solid #e2e8f0', opacity: offset + limit >= total ? 0.5 : 1 }}>Next</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
