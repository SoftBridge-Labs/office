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

      <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: '1fr', maxWidth: '800px' }}>
        <div style={{ ...card, padding: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontWeight: 600, fontSize: '1.2rem', color: '#1e293b' }}>Domain Restriction Policy</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.25rem' }}>Control who can be invited to your workspace based on their email domain.</p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select value={policy} onChange={handlePolicyChange} style={{ ...inputStyle, width: '100%', maxWidth: '400px', fontSize: '1rem' }}>
              <option value="allow_all">Allow everyone (default)</option>
              <option value="restrict_to_domains">Allow emails with verified domains only</option>
            </select>
            <Alert msg={msg.text} type={msg.type} />
          </div>
        </div>

        <div style={{ ...card, padding: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontWeight: 600, fontSize: '1.2rem', color: '#1e293b' }}>Add Domain</h3>
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem' }}>
            <input type="text" placeholder="yourdomain.com" value={domainName} onChange={e => setDomain(e.target.value)} required style={{ ...inputStyle, flex: 1, fontSize: '1rem' }} />
            <button type="submit" style={{ ...btnPrimary, padding: '0.6rem 1.5rem', whiteSpace: 'nowrap' }}>Add Domain</button>
          </form>
        </div>

        <div style={{ ...card, padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontWeight: 600, fontSize: '1.2rem', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>Registered Domains</h3>
          {domains.length === 0 ? <p style={{ color: '#64748b', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>No domains registered.</p> : domains.map(d => (
            <div key={d.id} style={{ padding: '1.5rem', marginBottom: '1rem', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#1e293b', marginBottom: '0.25rem' }}>{d.domain_name}</div>
                  <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '12px', fontWeight: 600, backgroundColor: d.status === 'verified' ? '#dcfce7' : '#fef2f2', color: d.status === 'verified' ? '#166534' : '#991b1b', textTransform: 'uppercase' }}>
                    {d.status}
                  </span>
                </div>
                {d.status !== 'verified' && (
                  <button onClick={() => handleVerify(d)} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', backgroundColor: '#f8fafc', color: '#334155', fontWeight: 500 }}>
                    Verify DNS
                  </button>
                )}
              </div>
              {d.status !== 'verified' && (
                <div style={{ marginTop: '1.25rem', fontSize: '0.85rem', backgroundColor: '#fef3c7', padding: '1rem', borderRadius: '8px', border: '1px solid #fde68a', color: '#92400e' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Action Required: Add a TXT record to your DNS</p>
                  <p style={{ margin: 0, display: 'grid', gridTemplateColumns: '80px 1fr', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ color: '#b45309' }}>Host/Name:</span>
                    <code style={{ backgroundColor: '#fefce8', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #fde047' }}>_softbridge-verification.{d.domain_name}</code>
                    <span style={{ color: '#b45309' }}>Value/Token:</span>
                    <code style={{ backgroundColor: '#fefce8', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #fde047', wordBreak: 'break-all' }}>{d.verification_token}</code>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
