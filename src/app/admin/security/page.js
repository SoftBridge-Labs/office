'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { inputStyle, btnPrimary, btnDanger, btnGhost, card, Alert } from '../shared';

export default function SecurityPage() {
  const [policies, setPolicies] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: 'success' });

  useEffect(() => {
    api.admin.getSecurityPolicies().then(res => { if (res.success) setPolicies(res.data || {}); }).catch(console.error);
  }, []);

  const handleUpdatePolicies = async (e) => {
    e.preventDefault();
    try {
      const res = await api.admin.updateSecurityPolicies({
        enforce2FA: policies.enforce_2fa,
        passwordExpirationDays: policies.password_expiration_days,
        sessionTimeoutMinutes: policies.session_timeout_minutes,
      });
      setMsg({ text: res.message, type: res.success ? 'success' : 'error' });
    } catch (e) { setMsg({ text: e.message, type: 'error' }); }
  };

  const handleSSO = async (e) => {
    e.preventDefault();
    try {
      const res = await api.admin.configureSSO({
        ssoProvider: policies.sso_provider,
        entityId: policies.sso_entity_id,
        ssoUrl: policies.sso_url,
        certificate: policies.sso_certificate,
      });
      setMsg({ text: res.message, type: res.success ? 'success' : 'error' });
    } catch (e) { setMsg({ text: e.message, type: 'error' }); }
  };

  if (!policies) return <p>Loading…</p>;

  return (
    <div>
      <h1 style={{ fontSize: '1.7rem', fontWeight: 700, marginBottom: '0.4rem' }}>Security & SSO</h1>
      <p style={{ color: '#5f6368', marginBottom: '2rem' }}>Configure workspace security policies and SSO.</p>

      <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: '1fr', maxWidth: '800px' }}>
        <div style={{ ...card, padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontWeight: 600, fontSize: '1.2rem', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>Security Policies</h3>
          <form onSubmit={handleUpdatePolicies}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', cursor: 'pointer', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <input type="checkbox" checked={!!policies.enforce_2fa} onChange={e => setPolicies(p => ({ ...p, enforce_2fa: e.target.checked }))} style={{ width: '1.2rem', height: '1.2rem' }} />
              <div>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', display: 'block' }}>Enforce 2FA for all members</span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Require two-factor authentication for workspace access</span>
              </div>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Password Expiration (days)</label>
                <input type="number" min="7" max="365" value={policies.password_expiration_days || 90} onChange={e => setPolicies(p => ({ ...p, password_expiration_days: e.target.value }))} style={{ ...inputStyle, width: '100%', fontSize: '1rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Session Timeout (minutes)</label>
                <input type="number" min="30" max="10080" value={policies.session_timeout_minutes || 480} onChange={e => setPolicies(p => ({ ...p, session_timeout_minutes: e.target.value }))} style={{ ...inputStyle, width: '100%', fontSize: '1rem' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button type="submit" style={{ ...btnPrimary, padding: '0.6rem 1.5rem' }}>Save Policies</button>
              <Alert msg={msg.text} type={msg.type} />
            </div>
          </form>
        </div>

        <div style={{ ...card, padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontWeight: 600, fontSize: '1.2rem', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>Single Sign-On (SAML/OIDC)</h3>
          <form onSubmit={handleSSO}>
            <div style={{ display: 'grid', gap: '1.25rem', marginBottom: '1.5rem' }}>
              {[
                ['SSO Provider', 'sso_provider', 'e.g. saml, okta, google'],
                ['Entity ID', 'sso_entity_id', 'e.g. https://accounts.google.com/...'],
                ['SSO URL', 'sso_url', 'e.g. https://accounts.google.com/o/saml2/idp?...'],
              ].map(([label, key, ph]) => (
                <div key={key}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>{label}</label>
                  <input type="text" placeholder={ph} value={policies[key] || ''} onChange={e => setPolicies(p => ({ ...p, [key]: e.target.value }))} style={{ ...inputStyle, width: '100%' }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Certificate</label>
                <textarea value={policies.sso_certificate || ''} onChange={e => setPolicies(p => ({ ...p, sso_certificate: e.target.value }))} placeholder="Paste X.509 certificate…" style={{ ...inputStyle, width: '100%', height: '120px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem' }} />
              </div>
            </div>
            <button type="submit" style={{ ...btnPrimary, padding: '0.6rem 1.5rem' }}>Configure SSO</button>
          </form>
        </div>
      </div>
    </div>
  );
}
