import React from 'react';
import { C, Modal } from './ui';
import { api } from '@/lib/api';
import { encryptPayload } from '@/lib/crypto';

export default function PollModal({
  showPollModal,
  setShowPollModal,
  pollForm,
  setPollForm,
  id,
  encryptionKeyRef
}) {
  if (!showPollModal) return null;

  const handleCreate = async () => {
    const validOpts = pollForm.options.filter(o => o.trim());
    if (!pollForm.question.trim() || validOpts.length < 2) return;
    let cq = pollForm.question, co = validOpts;
    if (encryptionKeyRef.current) {
      const eq = await encryptPayload(pollForm.question, encryptionKeyRef.current); if (eq) cq = eq;
      co = await Promise.all(validOpts.map(async o => { const eo = await encryptPayload(o, encryptionKeyRef.current); return eo || o; }));
    }
    await api.createMeetPoll(id, { action: 'create', type: pollForm.type, question: cq, options: co, correctOptionIndex: pollForm.type === 'Quiz' ? pollForm.correctIdx : undefined, isEncrypted: !!encryptionKeyRef.current });
    setPollForm({ type: 'Poll', question: '', options: ['', ''], correctIdx: 0 });
    setShowPollModal(false);
  };

  return (
    <Modal title={`Create ${pollForm.type}`} onClose={() => setShowPollModal(false)}>
      {/* Type selector */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {['Poll', 'Quiz'].map(t => (
          <button key={t} onClick={() => setPollForm(f => ({ ...f, type: t }))} style={{ flex: 1, padding: '0.6rem', borderRadius: 10, border: pollForm.type === t ? (t === 'Quiz' ? `1px solid ${C.amber}` : `1px solid ${C.accent}`) : `1px solid ${C.border}`, background: pollForm.type === t ? (t === 'Quiz' ? 'rgba(245,158,11,0.15)' : 'rgba(79,126,247,0.15)') : 'transparent', color: pollForm.type === t ? (t === 'Quiz' ? C.amber : C.accent) : C.muted, cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', transition: 'all 0.18s' }}>
            {t === 'Poll' ? '📊 Poll' : '🧠 Quiz'}
          </button>
        ))}
      </div>

      {/* Question */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ display: 'block', fontSize: '0.78rem', color: C.muted, marginBottom: '0.4rem', fontWeight: 600 }}>Question</label>
        <input type="text" placeholder={`${pollForm.type} question...`} value={pollForm.question} onChange={e => setPollForm(f => ({ ...f, question: e.target.value }))}
          style={{ width: '100%', padding: '0.75rem 0.9rem', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
      </div>

      {/* Options */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.78rem', color: C.muted, marginBottom: '0.6rem', fontWeight: 600 }}>Options {pollForm.type === 'Quiz' && '(select correct answer)'}</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {pollForm.options.map((opt, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              {pollForm.type === 'Quiz' && (
                <button onClick={() => setPollForm(f => ({ ...f, correctIdx: idx }))} style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${pollForm.correctIdx === idx ? C.success : C.border}`, background: pollForm.correctIdx === idx ? C.success : 'transparent', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {pollForm.correctIdx === idx && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                </button>
              )}
              <input type="text" placeholder={`Option ${idx + 1}`} value={opt} onChange={e => { const opts = [...pollForm.options]; opts[idx] = e.target.value; setPollForm(f => ({ ...f, options: opts })); }}
                style={{ flex: 1, padding: '0.6rem 0.85rem', background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, fontSize: '0.87rem', outline: 'none' }} />
              {pollForm.options.length > 2 && (
                <button onClick={() => { const opts = pollForm.options.filter((_, i) => i !== idx); setPollForm(f => ({ ...f, options: opts, correctIdx: Math.min(f.correctIdx, opts.length - 1) })); }} style={{ background: 'none', border: 'none', color: C.danger, cursor: 'pointer', display: 'flex', padding: 2 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>remove_circle</span>
                </button>
              )}
            </div>
          ))}
        </div>
        {pollForm.options.length < 4 && (
          <button onClick={() => setPollForm(f => ({ ...f, options: [...f.options, ''] }))} style={{ marginTop: '0.75rem', background: 'none', border: 'none', color: C.accent, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add_circle</span> Add option
          </button>
        )}
      </div>

      <button
        onClick={handleCreate}
        style={{ width: '100%', padding: '0.85rem', background: pollForm.type === 'Quiz' ? C.amber : C.accent, color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', transition: 'opacity 0.18s' }}
      >
        🚀 Launch {pollForm.type}
      </button>
    </Modal>
  );
}
