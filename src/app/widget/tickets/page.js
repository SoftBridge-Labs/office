'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { connectTicketSocket } from '@/lib/ticketSocket';

export default function TicketWidgetPage() {
  const searchParams = useSearchParams();
  const organizationId = searchParams.get('organization') || '';
  const publicApiKey = searchParams.get('key') || '';
  const title = searchParams.get('title') || 'How can we help?';
  const greeting = searchParams.get('greeting') || 'Send us a message and our team will get back to you.';
  const color = searchParams.get('color') || '#287c68';
  const radius = Number(searchParams.get('radius')) || 16;
  const icon = searchParams.get('icon') || 'S';
  const organizationName = searchParams.get('organizationName') || 'Support';
  const [form, setForm] = useState({ email: '', name: '', subject: '', description: '' });
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');
  const [continuationId, setContinuationId] = useState(() => (
    typeof window === 'undefined' ? '' : localStorage.getItem('sb_ticket_continuation_id') || ''
  ));
  const [conversation, setConversation] = useState(null);
  const [reply, setReply] = useState('');
  const [replyState, setReplyState] = useState('idle');

  useEffect(() => {
    if (!continuationId) return;
    let active = true;
    api.getPublicTicket(continuationId)
      .then(response => {
        if (active) {
          setConversation(response?.data?.ticket || response?.data || response?.ticket || response);
          setState('sent');
        }
      })
      .catch(() => {
        if (active) {
          localStorage.removeItem('sb_ticket_continuation_id');
          setContinuationId('');
          setConversation(null);
        }
      });
    return () => { active = false; };
  }, [continuationId]);

  useEffect(() => {
    if (!continuationId) return undefined;
    return connectTicketSocket({
      continuationId,
      onEvent: event => setConversation(current => current ? { ...current, status: event.status, updatedAt: event.updatedAt, messages: event.message ? [...(current.messages || []), event.message] : current.messages } : current)
    });
  }, [continuationId]);

  const submit = async event => {
    event.preventDefault();
    setState('sending');
    setError('');
    try {
      const storageKey = 'sb_ticket_external_id';
      const externalId = localStorage.getItem(storageKey) || `web-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(storageKey, externalId);
      const response = await api.createPublicTicket({ ...form, externalId }, { organizationId, publicApiKey });
      const nextContinuationId = response?.continuationId || response?.data?.continuationId;
      if (nextContinuationId) {
        localStorage.setItem('sb_ticket_continuation_id', nextContinuationId);
        setContinuationId(nextContinuationId);
      }
      setConversation(response?.data?.ticket || response?.data || response?.ticket || null);
      setState('sent');
      setForm({ email: '', name: '', subject: '', description: '' });
    } catch (err) {
      setError(err.message || 'We could not send your message. Please try again.');
      setState('idle');
    }
  };

  const sendReply = async event => {
    event.preventDefault();
    if (!continuationId || !reply.trim()) return;
    setReplyState('sending');
    setError('');
    try {
      const response = await api.addPublicTicketMessage(continuationId, reply.trim());
      const message = response?.data?.message || response?.data;
      setConversation(current => current ? { ...current, messages: [...(current.messages || []), message] } : conversation);
      setReply('');
      setReplyState('sent');
    } catch (err) {
      setError(err.message || 'We could not send your reply. Please try again.');
      setReplyState('idle');
    }
  };

  if (state === 'sent') {
    const messages = conversation?.messages || [];
    return <main style={{ ...styles.shell, '--widget-color': color, '--widget-radius': `${radius}px` }}><div style={styles.brand}><span style={styles.brandMark}>{icon}</span>{organizationName} Support</div><div style={styles.success}><div style={{ ...styles.successIcon, color }}>✓</div><h1>Message received</h1><p>AI support will respond first. A human will join when needed.</p>{messages.length > 0 && <div style={styles.messages}>{messages.map(message => <div key={message._id || message.id || `${message.createdAt}-${message.body}`} style={{ ...styles.message, ...(message.senderType === 'customer' ? styles.customerMessage : {}) }}><small>{message.senderType === 'customer' ? 'You' : message.senderId === 'ai' ? 'AI support' : 'Support'}</small><span>{message.body}</span></div>)}</div>}{continuationId && <form onSubmit={sendReply}><textarea style={styles.textarea} rows="3" placeholder="Add a reply..." value={reply} onChange={event => setReply(event.target.value)} /><button disabled={replyState === 'sending' || !reply.trim()} style={styles.submitButton}>{replyState === 'sending' ? 'Sending...' : 'Reply'} <span>→</span></button></form>}<button style={styles.outlineButton} onClick={() => { setState('idle'); setConversation(null); }}>Start another conversation</button></div></main>;
  }

  return <main style={{ ...styles.shell, '--widget-color': color, '--widget-radius': `${radius}px` }}>
    <div style={styles.brand}><span style={styles.brandMark}>{icon}</span><span>{organizationName} Support</span></div>
    <section style={styles.card}>
      <div style={styles.header}><div style={{ ...styles.avatar, background: color }}>{icon}</div><div><h1>{title}</h1><p>{greeting}</p></div></div>
      {error && <div style={styles.error}>{error}</div>}
      <form onSubmit={submit}>
        <label style={styles.label}>Your email<input style={styles.input} required type="email" placeholder="you@company.com" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></label>
        <label style={styles.label}>Name <span>(optional)</span><input style={styles.input} placeholder="Your name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
        <label style={styles.label}>What can we help with?<input style={styles.input} required placeholder="Short summary" value={form.subject} onChange={event => setForm({ ...form, subject: event.target.value })} /></label>
        <label style={styles.label}>Message<textarea style={styles.textarea} required rows="5" placeholder="Tell us a little more..." value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} /></label>
        <button disabled={state === 'sending' || !organizationId || !publicApiKey} style={styles.submitButton}>{state === 'sending' ? 'Sending...' : 'Send message'} <span>→</span></button>
        {!organizationId || !publicApiKey ? <small style={styles.configuration}>This support form has not been configured yet.</small> : <small style={styles.privacy}>By contacting us, you agree to receive email updates about this request.</small>}
      </form>
    </section>
  </main>;
}

const styles = {
  shell: { minHeight: '100vh', width: '100%', padding: '18px 16px 24px', background: '#f5f8f6', color: '#17211f', fontFamily: "'DM Sans', sans-serif", fontSize: 14 },
  brand: { display: 'flex', alignItems: 'center', gap: 8, width: '100%', margin: '0 0 18px', color: '#17211f', fontWeight: 800, fontSize: 14 },
  brandMark: { display: 'grid', placeItems: 'center', width: 24, height: 24, borderRadius: 7, color: '#fff', background: 'var(--widget-color)', fontWeight: 800, fontSize: 12 },
  powered: { marginLeft: 'auto', color: '#99a69f', fontSize: 10, fontWeight: 500 },
  card: { width: '100%', minHeight: 'calc(100vh - 78px)', margin: 0, padding: '22px clamp(18px, 5vw, 42px)', border: '1px solid #dce7e2', borderRadius: 'var(--widget-radius)', background: '#fff', boxShadow: '0 12px 35px rgba(37,76,62,.08)' },
  header: { display: 'flex', gap: 12, marginBottom: 24 },
  avatar: { display: 'grid', placeItems: 'center', flex: '0 0 auto', width: 40, height: 40, borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 800 },
  headerTitle: {},
  h1: {},
  label: { display: 'block', marginBottom: 14, color: '#52635d', fontSize: 12, fontWeight: 700 },
  input: { display: 'block', width: '100%', marginTop: 6, padding: '11px 12px', border: '1px solid #dce7e2', borderRadius: 9, background: '#fbfdfc', color: '#17211f', fontSize: 13, outline: 'none' },
  textarea: { display: 'block', width: '100%', marginTop: 6, padding: '11px 12px', border: '1px solid #dce7e2', borderRadius: 9, background: '#fbfdfc', color: '#17211f', fontSize: 13, outline: 'none', resize: 'vertical' },
  error: { marginBottom: 15, padding: 10, borderRadius: 7, color: '#984343', background: '#fff4f4', fontSize: 12 },
  success: { maxWidth: 470, margin: '0 auto', padding: '55px 25px', border: '1px solid #dce7e2', borderRadius: 16, background: '#fff', textAlign: 'center', boxShadow: '0 12px 35px rgba(37,76,62,.08)' },
  successIcon: { display: 'grid', placeItems: 'center', width: 48, height: 48, margin: '0 auto 16px', borderRadius: '50%', color: '#287c68', background: '#e5f5ed', fontSize: 22, fontWeight: 800 },
  outlineButton: { marginTop: 22, padding: '10px 13px', border: '1px solid #cde2d8', borderRadius: 7, color: '#287c68', background: '#fff', fontWeight: 700, fontSize: 11 },
  submitButton: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, width: '100%', padding: 12, border: 0, borderRadius: 8, color: '#fff', background: 'var(--widget-color)', fontWeight: 800, fontSize: 12 },
  messages: { display: 'grid', gap: 8, margin: '20px 0', textAlign: 'left' },
  message: { padding: '9px 11px', borderRadius: 10, color: '#52635d', background: '#f1f6f3', fontSize: 12 },
  customerMessage: { color: '#fff', background: 'var(--widget-color)', justifySelf: 'end' },
  privacy: { display: 'block', marginTop: 11, color: '#9aa7a1', fontSize: 10, textAlign: 'center' },
  configuration: { display: 'block', marginTop: 11, color: '#ae7a2c', fontSize: 10, textAlign: 'center' }
};
