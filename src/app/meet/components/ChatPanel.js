import React from 'react';
import { C, Drawer } from './ui';

export default function ChatPanel({
  onClose,
  chatMessages,
  userProfile,
  chatEndRef,
  newMessage,
  setNewMessage,
  handleSendMessage
}) {
  return (
    <Drawer title="Chat Room" onClose={onClose}>
      {/* Messages */}
      <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', minHeight: 0, overflowY: 'auto', height: 'calc(100vh - 56px - 70px - 4rem)' }}>
        {chatMessages.length === 0 ? (
          <div style={{ textAlign: 'center', color: C.muted, fontSize: '0.85rem', marginTop: '3rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem', color: C.muted }}>chat_bubble_outline</span>
            No messages yet. Say hello!
          </div>
        ) : chatMessages.map((msg, idx) => {
          const isMe = msg.sender === (userProfile?.name || 'You');
          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: '0.25rem' }}>
              {!isMe && <span style={{ fontSize: '0.7rem', color: C.muted, paddingLeft: '0.5rem', fontWeight: 600 }}>{msg.sender}</span>}
              <div style={{
                maxWidth: '82%', padding: '0.65rem 0.9rem',
                background: isMe ? C.accent : C.card,
                borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                fontSize: '0.875rem', color: '#f1f5f9',
                wordBreak: 'break-word',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}>
                {msg.text}
              </div>
              <span style={{ fontSize: '0.65rem', color: C.muted, paddingLeft: isMe ? 0 : '0.5rem', paddingRight: isMe ? '0.5rem' : 0 }}>
                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </span>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>
      {/* Input */}
      <form onSubmit={handleSendMessage} style={{ padding: '0.85rem 1rem', borderTop: `1px solid ${C.border}`, display: 'flex', gap: '0.6rem', alignItems: 'center', flexShrink: 0, background: C.sidebar }}>
        <input
          type="text" placeholder="Message..."
          value={newMessage} onChange={e => setNewMessage(e.target.value)}
          style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: '0.6rem 1rem', color: C.text, fontSize: '0.87rem', outline: 'none' }}
        />
        <button type="submit" style={{ width: 38, height: 38, borderRadius: '50%', background: C.accent, border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>send</span>
        </button>
      </form>
    </Drawer>
  );
}
