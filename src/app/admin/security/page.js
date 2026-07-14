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

      <div style={card}>
        <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Security Policies</h3>
        <form onSubmit={handleUpdatePolicies}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={!!policies.enforce_2fa} onChange={e => setPolicies(p => ({ ...p, enforce_2fa: e.target.checked }))} />
            <span style={{ fontSize: '0.9rem' }}>Enforce 2FA for all members</span>
          </label>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>Password Expiration (days)</label>
            <input type="number" min="7" max="365" value={policies.password_expiration_days || 90} onChange={e => setPolicies(p => ({ ...p, password_expiration_days: e.target.value }))} style={{ ...inputStyle, width: '120px' }} />
          </div>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>Session Timeout (minutes)</label>
            <input type="number" min="30" max="10080" value={policies.session_timeout_minutes || 480} onChange={e => setPolicies(p => ({ ...p, session_timeout_minutes: e.target.value }))} style={{ ...inputStyle, width: '120px' }} />
          </div>
          <button type="submit" style={btnPrimary}>Save Policies</button>
          <Alert msg={msg.text} type={msg.type} />
        </form>
      </div>

      <div style={card}>
        <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Single Sign-On (SAML/OIDC)</h3>
        <form onSubmit={handleSSO}>
          {[
            ['SSO Provider', 'sso_provider', 'e.g. saml, okta, google'],
            ['Entity ID', 'sso_entity_id', 'e.g. https://accounts.google.com/...'],
            ['SSO URL', 'sso_url', 'e.g. https://accounts.google.com/o/saml2/idp?...'],
          ].map(([label, key, ph]) => (
            <div key={key} style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>{label}</label>
              <input type="text" placeholder={ph} value={policies[key] || ''} onChange={e => setPolicies(p => ({ ...p, [key]: e.target.value }))} style={inputStyle} />
            </div>
          ))}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>Certificate</label>
            <textarea value={policies.sso_certificate || ''} onChange={e => setPolicies(p => ({ ...p, sso_certificate: e.target.value }))} placeholder="Paste X.509 certificate…" style={{ ...inputStyle, height: '100px', resize: 'vertical' }} />
          </div>
          <button type="submit" style={btnPrimary}>Configure SSO</button>
        </form>
      </div>
    </div>
  );
}
