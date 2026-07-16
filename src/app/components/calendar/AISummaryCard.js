'use client';

import { useState } from 'react';

function DeepWorkChip({ slot }) {
  const fmt = (iso) => new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      fontSize: '0.72rem', fontWeight: 700,
      padding: '0.25rem 0.6rem', borderRadius: '99px',
      background: 'rgba(99, 102, 241, 0.08)', color: '#6366f1',
      border: '1px solid rgba(99, 102, 241, 0.15)',
    }}>
      {fmt(slot.start)} – {fmt(slot.end)}
    </span>
  );
}

export default function AISummaryCard({ summary, loading }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: '#6366f1',
          color: '#ffffff',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4), 0 8px 10px -6px rgba(79, 70, 229, 0.4)',
          zIndex: 1000,
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'none'}
        title="AI Daily Briefing"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"/>
          <path d="M12 8v4l3 3"/>
        </svg>
      </button>

      {/* Slide-out Briefing Panel */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.15)',
            backdropFilter: 'blur(4px)',
            zIndex: 1500,
            display: 'flex',
            justifyContent: 'flex-end',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '360px',
              height: '100%',
              background: '#ffffff',
              boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.08)',
              borderLeft: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              padding: '1.75rem',
              animation: 'slideLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              boxSizing: 'border-box'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5">
                    <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"/><path d="M12 8v4l3 3"/>
                  </svg>
                </div>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>AI Assistant</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '1.2rem', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >×</button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {[90, 75, 85, 60].map((w, i) => (
                    <div key={i} style={{ height: '11px', background: '#e2e8f0', borderRadius: '99px', width: `${w}%`, animation: 'pulse 1.5s infinite', opacity: 0.6 }} />
                  ))}
                </div>
              ) : summary ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {summary.briefingStructure ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '-0.25rem' }}>Daily Planner Briefing</div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', margin: '0' }}>
                        {summary.briefingStructure.title}
                      </h4>
                      <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#475569', margin: 0 }}>
                        {summary.briefingStructure.overview}
                      </p>
                      {summary.briefingStructure.principles?.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Key Principles</span>
                          {summary.briefingStructure.principles.map((p, idx) => (
                            <div key={idx} style={{ paddingLeft: '0.75rem', borderLeft: '3px solid #6366f1' }}>
                              <strong style={{ fontSize: '0.82rem', color: '#1e293b', display: 'block', marginBottom: '0.15rem' }}>{p.heading}</strong>
                              <span style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>{p.text}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {summary.briefingStructure.conclusion && (
                        <p style={{ fontSize: '0.82rem', fontStyle: 'italic', color: '#64748b', lineHeight: 1.5, marginTop: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                          {summary.briefingStructure.conclusion}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Daily Planner Briefing</div>
                      <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#334155', whiteSpace: 'pre-line', margin: 0 }}>
                        {summary.briefingText}
                      </p>
                    </div>
                  )}
                  {summary.deepWorkSlots?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
                        Suggested Focus Windows
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {summary.deepWorkSlots.map((slot, i) => (
                          <div key={i}><DeepWorkChip slot={slot} /></div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  Connect a calendar feed to generate your customized AI briefing planner.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
