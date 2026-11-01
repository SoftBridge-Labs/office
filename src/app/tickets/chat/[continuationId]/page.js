'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { connectTicketSocket } from '@/lib/ticketSocket';
import styles from './chat.module.css';

function getTicket(response) {
  return response?.data?.ticket || response?.data || response?.ticket || response;
}

function getMessages(ticket) {
  return Array.isArray(ticket?.messages) ? ticket.messages : [];
}

export default function TicketChatPage() {
  const { continuationId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [state, setState] = useState('loading');
  const [replyState, setReplyState] = useState('idle');
  const [error, setError] = useState('');
  const [isCompanyUser] = useState(() => (
    typeof window !== 'undefined' && Boolean(localStorage.getItem('sb_id_token'))
  ));

  const loadTicket = useCallback(async () => {
    if (!continuationId) return;
    setState('loading');
    setError('');
    try {
      const response = await api.getPublicTicket(continuationId);
      setTicket(getTicket(response));
      setState('ready');
    } catch (err) {
      setError(err.message || 'This support conversation is no longer available.');
      setState('error');
    }
  }, [continuationId]);

  useEffect(() => {
    const timer = window.setTimeout(loadTicket, 0);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sb_ticket_continuation_id', continuationId || '');
    }
    return () => window.clearTimeout(timer);
  }, [continuationId, loadTicket]);

  useEffect(() => {
    if (!continuationId) return undefined;
    return connectTicketSocket({ continuationId, onEvent: () => loadTicket() });
  }, [continuationId, loadTicket]);

  const sendReply = async event => {
    event.preventDefault();
    const body = reply.trim();
    if (!body || !continuationId) return;
    setReplyState('sending');
    setError('');
    try {
      await api.addPublicTicketMessage(continuationId, body);
      setReply('');
      await loadTicket();
      setReplyState('sent');
    } catch (err) {
      setError(err.message || 'We could not send your reply.');
      setReplyState('idle');
    }
  };

  const messages = getMessages(ticket);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark}>S</span>
          <span>{ticket?.organizationName || 'Support'} Support</span>
        </Link>
        {isCompanyUser && <Link href="/tickets" className={styles.workspaceLink}>Open Tickets workspace</Link>}
      </header>

      <section className={styles.card}>
        {state === 'loading' && <p className={styles.status}>Loading your conversation...</p>}
        {state === 'error' && (
          <div className={styles.status}>
            <h1>Conversation unavailable</h1>
            <p>{error}</p>
            <button type="button" className={styles.secondaryButton} onClick={loadTicket}>Try again</button>
          </div>
        )}
        {state === 'ready' && ticket && (
          <>
            <div className={styles.titleBlock}>
              <span className={styles.eyebrow}>Support conversation</span>
              <h1>{ticket.subject || 'Your support request'}</h1>
              <p>{ticket.status === 'resolved' ? 'This request is resolved, but you can reply to reopen it.' : 'Our support team will respond here.'}</p>
            </div>
            <div className={styles.messages}>
              {messages.length === 0 && <p className={styles.empty}>No messages yet.</p>}
              {messages.map(message => {
                const isCustomer = message.senderType === 'customer';
                return (
                  <article className={`${styles.message} ${isCustomer ? styles.customerMessage : ''}`} key={message._id || message.id || `${message.createdAt}-${message.body}`}>
                    <div className={styles.messageMeta}>{isCustomer ? 'You' : message.senderId === 'ai' ? 'AI support' : message.senderType === 'system' ? 'System' : 'Support team'}</div>
                    <div className={styles.bubble}>{message.body}</div>
                  </article>
                );
              })}
            </div>
            {error && <div className={styles.error}>{error}</div>}
            <form className={styles.replyBox} onSubmit={sendReply}>
              <textarea value={reply} onChange={event => setReply(event.target.value)} placeholder="Write a reply..." rows={4} maxLength={10000} />
              <div className={styles.replyFooter}>
                <span>Replies are sent securely to the support team.</span>
                <button type="submit" className={styles.primaryButton} disabled={replyState === 'sending' || !reply.trim()}>
                  {replyState === 'sending' ? 'Sending...' : 'Send reply'}
                </button>
              </div>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
