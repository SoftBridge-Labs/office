'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { connectTicketSocket } from '@/lib/ticketSocket';

export default function TicketWidgetPage() {
  const searchParams = useSearchParams();
  const organizationId = searchParams.get('organization') || '';
  const workspaceId = searchParams.get('workspace') || '';
  const publicApiKey = searchParams.get('key') || '';
  const title = searchParams.get('title') || 'How can we help?';
  const greeting = searchParams.get('greeting') || 'Send us a message and our team will get back to you.';
  const color = searchParams.get('color') || '#287c68';
  const radius = Number(searchParams.get('radius')) || 16;
  const icon = searchParams.get('icon') || 'S';
  const organizationName = searchParams.get('organizationName') || 'Support';
    const supportBrand = organizationName && !/^support$/i.test(organizationName.trim()) ? `${organizationName.trim()} Support` : 'Support';
    const watermark = <div style={styles.watermark}>Powered by <a href="https://office.softbridgelabs.in/products/tickets" target="_blank" rel="noreferrer">Tickets by SoftBridge Labs</a></div>;
  
  // AI Chat state
  const [aiMessages, setAiMessages] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [aiState, setAiState] = useState('idle');
  const [aiError, setAiError] = useState('');
  const [needsEscalation, setNeedsEscalation] = useState(false);
  
  // Escalation form state
  const [form, setForm] = useState({ email: '', name: '', subject: '', description: '' });
  const [escalationError, setEscalationError] = useState('');
  
  // Human ticket state
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');
  const [continuationId, setContinuationId] = useState(() => (
    typeof window === 'undefined' ? '' : localStorage.getItem('sb_ticket_continuation_id') || ''
  ));
  const [conversation, setConversation] = useState(null);
  const [reply, setReply] = useState('');
  const [replyState, setReplyState] = useState('idle');
  const [statusState, setStatusState] = useState('idle');

  useEffect(() => {
    if (!continuationId) return;
    let active = true;
    const loadConversation = async () => {
      try {
        const response = await api.getPublicTicket(continuationId);
        if (active) {
          const nextConversation = response?.data?.ticket || response?.data || response?.ticket || response;
          if (nextConversation?.status === 'resolved' || nextConversation?.status === 'archived') {
            localStorage.removeItem('sb_ticket_continuation_id');
            setContinuationId('');
            setConversation(null);
            setState('idle');
            return;
          }
          setConversation(nextConversation);
          setState('sent');
        }
      } catch (error) {
        if (active && error.status === 404) {
          localStorage.removeItem('sb_ticket_continuation_id');
          setContinuationId('');
          setConversation(null);
        }
      }
    };
    loadConversation();
    const refreshTimer = window.setInterval(loadConversation, 4000);
    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, [continuationId]);

  useEffect(() => {
    if (!continuationId) return undefined;
    return connectTicketSocket({
      continuationId,
      onEvent: event => {
        if (event.status === 'resolved' || event.ticket?.status === 'resolved' || event.status === 'archived' || event.ticket?.status === 'archived') {
          localStorage.removeItem('sb_ticket_continuation_id');
          setContinuationId('');
          setState('idle');
          setConversation(null);
          return;
        }
        setConversation(current => {
          if (!current) return current;
          const incomingMessage = event.message;
          const messages = incomingMessage
            ? [...(current.messages || []).filter(message => message._id !== incomingMessage._id && message.id !== incomingMessage.id), incomingMessage]
            : current.messages;
          return { ...current, ...event.ticket, status: event.status || event.ticket?.status || current.status, updatedAt: event.updatedAt || current.updatedAt, messages };
        });
      }
    });
  }, [continuationId]);

  const openEscalation = () => {
    const transcript = aiMessages
      .map(message => `${message.senderType === 'customer' ? 'Customer' : 'AI'}: ${message.content}`)
      .join('\n\n');
    setForm(current => current.description.trim() ? current : { ...current, description: transcript });
    setNeedsEscalation(true);
  };

  const sendAiMessage = async event => {
    event.preventDefault();
    if (!userMessage.trim()) return;
    setAiState('sending');
    setAiError('');
    
    const newMessages = [...aiMessages, { role: 'user', content: userMessage, senderType: 'customer' }];
    setAiMessages(newMessages);
    setUserMessage('');
    
    try {
      // Build conversation history for context
      const conversationHistory = aiMessages.map(m => ({
        role: m.role,
        content: m.content
      }));
      conversationHistory.push({ role: 'user', content: userMessage });
      
      // Use public deflect endpoint - make direct request with public headers
      const apiUrl = typeof window !== 'undefined' && window.__ENV__?.NEXT_PUBLIC_API_URL 
        ? window.__ENV__.NEXT_PUBLIC_API_URL 
        : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');
      
      const deflectUrl = `${apiUrl}/api/v1/public/ai/deflect`;
      
      const deflectResponse = await fetch(deflectUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': organizationId,
          'x-ticket-public-key': publicApiKey
        },
        body: JSON.stringify({
          message: userMessage,
          conversation: conversationHistory
        })
      });
      
      if (!deflectResponse.ok) {
        const errorData = await deflectResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to get AI response: ${deflectResponse.statusText}`);
      }
      
      const response = await deflectResponse.json();
      const aiReply = response?.data?.answer || response?.answer || 'Thank you for reaching out. How can I help you further?';
      const shouldEscalate = response?.data?.shouldEscalate || response?.shouldEscalate || false;
      
      setAiMessages(current => [...current, { role: 'assistant', content: aiReply, senderType: 'ai' }]);
      
      if (shouldEscalate) {
        openEscalation();
        setAiState('escalation-ready');
      } else {
        setAiState('idle');
      }
    } catch (err) {
      // On AI error, automatically open human chat
      setAiError(err.message || 'Failed to get a response. Connecting you with a human agent...');
      setAiState('idle');
      // Auto-escalate to human after 1.5 seconds
      setTimeout(() => {
        openEscalation();
      }, 1500);
    }
  };

  const escalateToHuman = async event => {
    event.preventDefault();
    const storageKey = 'sb_ticket_external_id';
    const externalId = localStorage.getItem(storageKey) || `web-${Math.random().toString(36).slice(2, 10)}`;
    const description = form.description.trim();

    if (!externalId || !form.email.trim() || !form.subject.trim() || !description) {
      setEscalationError('Please provide your email, issue subject, and description');
      return;
    }
    
    setState('sending');
    setEscalationError('');
    
    try {
      localStorage.setItem(storageKey, externalId);
      
      const ticketData = {
        email: form.email.trim(),
        name: form.name || 'Customer',
        subject: form.subject.trim(),
        description: description,
        externalId
      };
      
      const response = await api.createPublicTicket(ticketData, { organizationId, publicApiKey, workspaceId });
      const nextContinuationId = response?.continuationId || response?.data?.continuationId;
      
      if (nextContinuationId) {
        localStorage.setItem('sb_ticket_continuation_id', nextContinuationId);
        setContinuationId(nextContinuationId);
      }
      
      setConversation(response?.data?.ticket || response?.data || response?.ticket || null);
      setState('sent');
      setAiMessages([]);
      setNeedsEscalation(false);
    } catch (err) {
      setEscalationError(err.message || 'We could not escalate your request. Please try again.');
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
      setReplyState('idle');
    } catch (err) {
      setError(err.message || 'We could not send your reply. Please try again.');
      setReplyState('idle');
    }
  };

  const updateStatus = async status => {
    setStatusState('saving');
    setError('');
    try {
      const response = await api.updatePublicTicket(continuationId, { status });
      const updated = response?.data?.ticket || response?.data || response?.ticket || response;
      if (status === 'resolved') {
        localStorage.removeItem('sb_ticket_continuation_id');
        setContinuationId('');
        setConversation(null);
        setState('idle');
      } else {
        setConversation(current => ({ ...current, ...updated, status: updated.status || status }));
      }
    } catch (err) {
      setError(err.message || 'We could not update this conversation.');
    } finally {
      setStatusState('idle');
    }
  };

  // AI Chat View (initial state)
  if (!continuationId && !needsEscalation) {
    return <main style={{ ...styles.shell, '--widget-color': color, '--widget-radius': `${radius}px` }}>
      <div style={styles.brand}><span style={styles.brandMark}>{icon}</span><span>{supportBrand}</span></div>
      <div style={styles.conversationContainer}>
        <div style={styles.chatHeader}>
          <h1>{title}</h1>
          <p>{greeting}</p>
        </div>
        
        {aiMessages.length > 0 && <div style={styles.messagesGrid}>
          {aiMessages.map((message, index) => (
            <div key={index} style={{ ...styles.messageRow, justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ ...styles.messageBubble, ...(message.role === 'user' ? styles.customerBubble : styles.supportBubble) }}>
                <div style={styles.messageText}>{message.content}</div>
              </div>
            </div>
          ))}
          {aiState === 'sending' && <div style={{ ...styles.messageRow, justifyContent: 'flex-start' }}>
            <div style={{ ...styles.messageBubble, ...styles.supportBubble }}>
              <div style={styles.typingIndicator}>
                <span style={{...styles.typingDot, animationDelay: '0ms'}}></span>
                <span style={{...styles.typingDot, animationDelay: '150ms'}}></span>
                <span style={{...styles.typingDot, animationDelay: '300ms'}}></span>
              </div>
            </div>
          </div>}
        </div>}
        
        {aiError && <div style={styles.error}>{aiError}</div>}
        
        <form onSubmit={sendAiMessage} style={styles.aiForm}>
          <textarea 
            style={styles.textarea} 
            rows="3" 
            placeholder="Type your message..." 
            value={userMessage} 
            onChange={event => setUserMessage(event.target.value)}
            disabled={aiState === 'sending'}
          />
          <button 
            disabled={aiState === 'sending' || !userMessage.trim() || !organizationId || !publicApiKey} 
            style={styles.submitButton}
          >
            {aiState === 'sending' ? 'Waiting...' : 'Send'} <span>→</span>
          </button>
          {!organizationId || !publicApiKey ? <small style={styles.configuration}>This support form has not been configured yet.</small> : null}
        </form>
        
        <button style={styles.humanButton} onClick={openEscalation}>Connect with Human</button>
        {watermark}
      </div>
    </main>;
  }

  // Escalation Form (needs human)
  if (needsEscalation && !continuationId) {
    return <main style={{ ...styles.shell, '--widget-color': color, '--widget-radius': `${radius}px` }}>
      <div style={styles.brand}><span style={styles.brandMark}>{icon}</span><span>{supportBrand}</span></div>
      <div style={styles.conversationContainer}>
        <div style={styles.escalationHeader}>
          <h2>Connect with a human agent</h2>
          <p>Please provide your details so we can assist you better</p>
        </div>
        
        {escalationError && <div style={styles.error}>{escalationError}</div>}
        
        <form onSubmit={escalateToHuman}>
          <label style={styles.label}>Your email<input style={styles.input} required type="email" placeholder="you@company.com" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></label>
          <label style={styles.label}>Name <span>(optional)</span><input style={styles.input} placeholder="Your name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
          <label style={styles.label}>What can we help with?<input style={styles.input} required placeholder="Short summary" value={form.subject} onChange={event => setForm({ ...form, subject: event.target.value })} /></label>
          <label style={styles.label}>Description<textarea style={styles.textarea} required rows="5" placeholder="Tell us what you need help with" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} /></label>
          <button disabled={state === 'sending'} style={styles.submitButton}>{state === 'sending' ? 'Connecting...' : 'Connect with agent'} <span>→</span></button>
          <small style={styles.privacy}>By contacting us, you agree to receive email updates about this request.</small>
        </form>
        
        <button style={styles.backButton} onClick={() => setNeedsEscalation(false)}>Back to chat</button>
        {watermark}
      </div>
    </main>;
  }

  // Human conversation view (after escalation)
  if (state === 'sent') {
    const messages = conversation?.messages || [];
    return <main style={{ ...styles.shell, '--widget-color': color, '--widget-radius': `${radius}px` }}>
      <div style={styles.brand}><span style={styles.brandMark}>{icon}</span>{supportBrand}</div>
      <div style={styles.conversationContainer}>
        {messages.length > 0 && <div style={styles.messagesGrid}>
          {messages.map(message => {
            const isCustomer = message.senderType === 'customer';
            return <div key={message._id || message.id || `${message.createdAt}-${message.body}`} style={{ ...styles.messageRow, justifyContent: isCustomer ? 'flex-end' : 'flex-start' }}>
              <div style={{ ...styles.messageBubble, ...(isCustomer ? styles.customerBubble : styles.supportBubble) }}>
                <div style={styles.senderLabel}>{isCustomer ? 'You' : message.senderId === 'ai' ? 'AI Support' : 'Support Team'}</div>
                <div style={styles.messageText}>{message.body}</div>
              </div>
            </div>;
          })}
        </div>}
        
        {continuationId && <form onSubmit={sendReply} style={styles.replyForm}>
          <textarea style={styles.textarea} rows="3" placeholder="Add a reply..." value={reply} onChange={event => setReply(event.target.value)} />
          <button disabled={replyState === 'sending' || !reply.trim()} style={styles.submitButton}>{replyState === 'sending' ? 'Sending...' : 'Reply'} <span>→</span></button>
        </form>}
        {continuationId && <button type="button" style={styles.outlineButton} disabled={statusState === 'saving'} onClick={() => updateStatus(conversation?.status === 'resolved' ? 'open' : 'resolved')}>
          {statusState === 'saving' ? 'Saving...' : conversation?.status === 'resolved' ? 'Reopen conversation' : 'Close conversation'}
        </button>}
        
        <button style={styles.outlineButton} onClick={() => { setState('idle'); setConversation(null); setContinuationId(''); setAiMessages([]); setNeedsEscalation(false); }}>Start another conversation</button>
        {watermark}
      </div>
    </main>;
  }

  return null;
}

const styles = {
  shell: { minHeight: '100vh', width: '100%', padding: '18px 16px 24px', background: '#f5f8f6', color: '#17211f', fontFamily: "'DM Sans', sans-serif", fontSize: 14 },
  brand: { display: 'flex', alignItems: 'center', gap: 8, width: '100%', margin: '0 0 18px', color: '#17211f', fontWeight: 800, fontSize: 14 },
  brandMark: { display: 'grid', placeItems: 'center', width: 24, height: 24, borderRadius: 7, color: '#fff', background: 'var(--widget-color)', fontWeight: 800, fontSize: 12 },
  conversationContainer: { maxWidth: 600, margin: '0 auto', padding: '20px 0' },
  chatHeader: { textAlign: 'center', marginBottom: 24, paddingBottom: 16 },
  escalationHeader: { textAlign: 'center', marginBottom: 24, paddingBottom: 16 },
  successHeader: { textAlign: 'center', marginBottom: 30, paddingBottom: 20, borderBottom: '1px solid #dce7e2' },
  successIcon: { display: 'grid', placeItems: 'center', width: 48, height: 48, margin: '0 auto 16px', borderRadius: '50%', color: '#287c68', background: '#e5f5ed', fontSize: 22, fontWeight: 800 },
  messagesGrid: { display: 'flex', flexDirection: 'column', gap: 12, margin: '20px 0', maxHeight: '400px', overflowY: 'auto', paddingRight: 8 },
  messageRow: { display: 'flex', marginBottom: 8 },
  messageBubble: { maxWidth: '75%', padding: '12px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.5, wordWrap: 'break-word' },
  customerBubble: { background: 'var(--widget-color)', color: '#fff', borderBottomLeftRadius: 4 },
  supportBubble: { background: '#f1f6f3', color: '#17211f', borderBottomRightRadius: 4 },
  senderLabel: { fontSize: 11, fontWeight: 700, opacity: 0.8, marginBottom: 4 },
  messageText: { wordWrap: 'break-word' },
  typingIndicator: { display: 'flex', gap: 4, padding: '4px 0' },
  typingDot: { 
    width: 8, 
    height: 8, 
    borderRadius: '50%', 
    background: '#52635d', 
    opacity: 0.6,
    animation: 'typing 1.4s infinite',
    display: 'inline-block'
  },
  label: { display: 'block', marginBottom: 14, color: '#52635d', fontSize: 12, fontWeight: 700 },
  input: { display: 'block', width: '100%', marginTop: 6, padding: '11px 12px', border: '1px solid #dce7e2', borderRadius: 9, background: '#fbfdfc', color: '#17211f', fontSize: 13, outline: 'none' },
  textarea: { display: 'block', width: '100%', marginTop: 6, padding: '11px 12px', border: '1px solid #dce7e2', borderRadius: 9, background: '#fbfdfc', color: '#17211f', fontSize: 13, outline: 'none', resize: 'vertical' },
  error: { marginBottom: 15, padding: 10, borderRadius: 7, color: '#984343', background: '#fff4f4', fontSize: 12 },
  aiForm: { margin: '20px 0' },
  replyForm: { margin: '20px 0', padding: 15, background: '#fbfdfc', borderRadius: 12, border: '1px solid #dce7e2' },
  escalateButton: { marginTop: 16, padding: '10px 16px', border: '1px solid var(--widget-color)', borderRadius: 8, color: '#fff', background: 'var(--widget-color)', fontWeight: 700, fontSize: 12, cursor: 'pointer', width: '100%' },
  humanButton: { marginTop: 12, padding: '10px 16px', border: '1px solid #cde2d8', borderRadius: 8, color: '#52635d', background: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer', width: '100%', transition: 'all 0.2s' },
  backButton: { marginTop: 16, padding: '10px 16px', border: '1px solid #cde2d8', borderRadius: 8, color: 'var(--widget-color)', background: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', width: '100%' },
  outlineButton: { marginTop: 16, padding: '10px 16px', border: '1px solid #cde2d8', borderRadius: 8, color: 'var(--widget-color)', background: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', width: '100%' },
  watermark: { marginTop: 24, color: '#8b9993', fontSize: 10, textAlign: 'center' },
  submitButton: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, width: '100%', padding: 12, marginTop: 10, border: 0, borderRadius: 8, color: '#fff', background: 'var(--widget-color)', fontWeight: 800, fontSize: 12, cursor: 'pointer' },
  privacy: { display: 'block', marginTop: 11, color: '#9aa7a1', fontSize: 10, textAlign: 'center' },
  configuration: { display: 'block', marginTop: 11, color: '#ae7a2c', fontSize: 10, textAlign: 'center' }
};

// Add CSS animation for typing indicator
if (typeof document !== 'undefined') {
  const styleId = 'typing-animation';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes typing {
        0%, 60%, 100% {
          opacity: 0.6;
          transform: translateY(0);
        }
        30% {
          opacity: 1;
          transform: translateY(-10px);
        }
      }
      
      @keyframes typing-alt-1 {
        0%, 60%, 100% { opacity: 0.6; transform: translateY(0); }
        30% { opacity: 1; transform: translateY(-10px); }
      }
      
      @keyframes typing-alt-2 {
        0%, 60%, 100% { opacity: 0.6; transform: translateY(0); }
        45% { opacity: 1; transform: translateY(-10px); }
      }
      
      @keyframes typing-alt-3 {
        0%, 60%, 100% { opacity: 0.6; transform: translateY(0); }
        60% { opacity: 1; transform: translateY(-10px); }
      }
    `;
    document.head.appendChild(style);
  }
}
