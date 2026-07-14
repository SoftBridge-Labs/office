'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { inputStyle, btnPrimary, btnDanger, btnGhost, card, Alert } from '../shared';

export default function DomainsPage() {
  const [domains, setDomains] = useState([]);
  const [domainName, setDomain] = useState('');
  const [policy, setPolicy] = useState('allow_all');
  const [msg, setMsg] = useState({ text: '', type: 'success' });

  const load = useCallback(() => {
    api.admin.listDomains().then(res => { if (res.success) setDomains(res.data); }).catch(console.error);
    api.admin.getDomainPolicy().then(res => { if (res.success) setPolicy(res.data.domain_restriction); }).catch(console.error);
  }, []);

  useEffect(load, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await api.admin.addDomain({ domainName });
      setMsg({ text: res.message, type: res.success ? 'success' : 'error' });
      if (res.success) { setDomain(''); load(); }
    } catch (e) { setMsg({ text: e.message, type: 'error' }); }
  };

  const handlePolicyChange = async (e) => {
    const newPolicy = e.target.value;
    try {
      const res = await api.admin.updateDomainPolicy({ domain_restriction: newPolicy });
      if (res.success) {
        setPolicy(newPolicy);
        setMsg({ text: 'Domain policy updated successfully.', type: 'success' });
      }
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    }
  };

  const handleVerify = async (d) => {
    try {
      const res = await api.admin.verifyDomain(d.domain_name);
      setMsg({ text: res.message, type: res.success ? 'success' : 'error' });
      if (res.success) load();
    } catch (e) { setMsg({ text: e.message, type: 'error' }); }
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.7rem', fontWeight: 700, marginBottom: '0.4rem' }}>Domain Management</h1>
      <p style={{ color: '#5f6368', marginBottom: '2rem' }}>Add and verify custom domains for your workspace.</p>

      <div style={card}>
        <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Domain Restriction Policy</h3>
        <p style={{ color: '#5f6368', fontSize: '0.9rem', marginBottom: '1rem' }}>Control who can be invited to your workspace based on their email domain.</p>
        <select value={policy} onChange={handlePolicyChange} style={{ ...inputStyle, width: '100%', maxWidth: '400px' }}>
          <option value="allow_all">Allow everyone (default)</option>
          <option value="restrict_to_domains">Allow emails with verified domains only</option>
        </select>
        <Alert msg={msg.text} type={msg.type} />
      </div>

      <div style={card}>
        <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Add Domain</h3>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.75rem' }}>
          <input type="text" placeholder="yourdomain.com" value={domainName} onChange={e => setDomain(e.target.value)} required style={{ ...inputStyle, flex: 1 }} />
          <button type="submit" style={btnPrimary}>Add Domain</button>
        </form>
      </div>

      <div style={card}>
        <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Registered Domains</h3>
        {domains.length === 0 ? <p style={{ color: '#5f6368' }}>No domains registered.</p> : domains.map(d => (
          <div key={d.id} style={{ padding: '1rem', marginBottom: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{d.domain_name}</div>
                <span style={{ fontSize: '0.78rem', padding: '0.2rem 0.5rem', borderRadius: '12px', fontWeight: 600, backgroundColor: d.status === 'verified' ? '#e6f4ea' : '#fce8e6', color: d.status === 'verified' ? '#137333' : '#d93025' }}>
                  {d.status}
                </span>
              </div>
              {d.status !== 'verified' && (
                <button onClick={() => handleVerify(d)} style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem', borderRadius: '5px', border: '1px solid #dadce0', cursor: 'pointer', backgroundColor: 'transparent', color: '#202124' }}>
                  Verify DNS
                </button>
              )}
            </div>
            {d.status !== 'verified' && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', backgroundColor: '#fff3cd', padding: '0.5rem 0.75rem', borderRadius: '6px', color: '#856404' }}>
                Add TXT record: <code>{d.verification_token}</code> to <code>_softbridge-verification.{d.domain_name}</code>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
