import React from 'react';
import { C, Drawer } from './ui';
import { api } from '@/lib/api';

export default function PollsPanel({
  onClose,
  isHostUser,
  setShowPollModal,
  polls,
  userProfile,
  id
}) {
  return (
    <Drawer title="Polls & Quizzes" onClose={onClose}>
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {isHostUser && (
          <button
            onClick={() => setShowPollModal(true)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem', background: 'rgba(79,126,247,0.15)', border: `1px dashed rgba(79,126,247,0.4)`, borderRadius: 12, color: C.accent, cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.18s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,126,247,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(79,126,247,0.15)'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>add_circle</span>
            Create Poll / Quiz
          </button>
        )}
        {polls.length === 0 && (
          <div style={{ textAlign: 'center', color: C.muted, fontSize: '0.85rem', marginTop: '2rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem', color: '#374151' }}>poll</span>
            No active polls
          </div>
        )}
        {polls.map((poll, i) => {
          const totalVotes = poll.options.reduce((s, o) => s + o.votes.length, 0);
          return (
            <div key={poll.id || i} style={{ background: C.card, borderRadius: 14, padding: '1rem', border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: poll.type === 'Quiz' ? C.amber : C.accent }}>{poll.type || 'Poll'}</span>
                {!poll.active && <span style={{ fontSize: '0.65rem', color: C.muted, background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 10 }}>Ended</span>}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.85rem', color: C.text }}>{poll.question}</div>
              {poll.options.map((opt, idx) => {
                const pct = totalVotes === 0 ? 0 : Math.round((opt.votes.length / totalVotes) * 100);
                const myVote = opt.votes.includes(userProfile?.uid);
                const isQuiz = poll.type === 'Quiz';
                const isCorrect = isQuiz && poll.correctOptionIndex === idx;
                const closed = isQuiz && !poll.active;
                let barColor = C.accent;
                let bg = myVote ? 'rgba(79,126,247,0.15)' : 'rgba(255,255,255,0.04)';
                let border = myVote ? `1px solid rgba(79,126,247,0.4)` : `1px solid transparent`;
                if (closed) { if (isCorrect) { barColor = C.success; bg = 'rgba(16,185,129,0.1)'; border = `1px solid rgba(16,185,129,0.3)`; } else if (myVote) { barColor = C.danger; bg = 'rgba(239,68,68,0.1)'; border = `1px solid rgba(239,68,68,0.3)`; } }
                return (
                  <div key={idx} style={{ marginBottom: '0.6rem' }}>
                    <button onClick={() => poll.active && api.voteMeetPoll(id, { pollId: poll.id, optionIndex: idx, uid: userProfile?.uid })} style={{ width: '100%', textAlign: 'left', padding: '0.6rem 0.85rem', background: bg, border, borderRadius: 9, color: C.text, cursor: poll.active ? 'pointer' : 'default', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', transition: 'all 0.18s' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {opt.text}
                        {closed && isCorrect && <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', color: C.success }}>check_circle</span>}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '0.8rem', color: C.muted }}>{pct}%</span>
                    </button>
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 2, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                );
              })}
              {isHostUser && poll.active && (
                <button onClick={() => api.createMeetPoll(id, { action: 'close', pollId: poll.id })} style={{ marginTop: '0.5rem', width: '100%', padding: '0.55rem', background: 'rgba(239,68,68,0.15)', color: C.danger, border: `1px solid rgba(239,68,68,0.3)`, borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                  End {poll.type || 'Poll'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </Drawer>
  );
}
