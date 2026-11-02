import { io } from 'socket.io-client';
import { getAccessToken } from './auth';

export function connectTicketSocket({ ticketId, continuationId, onEvent }) {
  if (typeof window === 'undefined') return () => {};
  const baseUrl = window.__ENV__?.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || window.location.origin;
  const socket = io(`${baseUrl}/workspace/tickets`, {
    transports: ['websocket', 'polling'],
    auth: { token: continuationId || localStorage.getItem('sb_uid') || getAccessToken() || '' }
  });
  socket.on('connect', () => socket.emit('join_ticket', { ticketId, continuationId }));
  socket.on('ticket_event', event => {
    const normalizedEvent = event?.data || event;
    if (normalizedEvent) onEvent(normalizedEvent);
  });
  socket.on('connect_error', error => console.warn('Ticket realtime connection failed:', error.message));
  return () => socket.disconnect();
}
