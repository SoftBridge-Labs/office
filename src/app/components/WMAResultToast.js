'use client';

/**
 * WMAResultToast — Floating glassmorphism panel that appears after a WMA operation.
 * Shows the entity chain created and graph edges, with deep-link navigation buttons.
 * Auto-dismisses after 8 seconds.
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { buildEntityLabel } from '@/lib/wma';

// ── App icon map ────────────────────────────────────────────────────────────
const APP_COLORS = {
  docs: '#6366f1',
  tasks: '#10b981',
  whiteboard: '#f59e0b',
  bookmarks: '#ec4899',
  calendar: '#3b82f6',
  meet: '#ef4444',
  ping: '#E91E63',
};

const APP_ICONS = {
  docs: 'description',
  tasks: 'task_alt',
  whiteboard: 'dashboard',
  bookmarks: 'bookmark',
  calendar: 'event',
  meet: 'videocam',
  ping: 'chat',
};

const APP_PATHS = {
  docs: (id) => `/doc/${id}`,
  tasks: () => `/tasks`,
  whiteboard: () => `/whiteboard`,
  bookmarks: () => `/bookmarks`,
  calendar: () => `/calendar`,
  meet: () => `/meet`,
  ping: (id, meta) => `/ping/${meta?.channel_id || ''}`,
};

const EDGE_TYPE_LABELS = {
  created_from: 'Created from',
  referenced_in: 'Referenced in',
  distilled_from: 'Distilled from',
  embedded_in: 'Embedded in',
  linked_to: 'Linked to',
  blocked_by: 'Blocked by',
};

// ── Component ───────────────────────────────────────────────────────────────
export default function WMAResultToast({ execution, payload = [], onDismiss, title = 'Workspace Mesh Agent' }) {
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef(null);
  const progressRef = useRef(null);
  const DURATION = 8000;

  useEffect(() => {
    if (!visible) return;

    const start = Date.now();
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(pct);
      if (pct === 0) clearInterval(progressRef.current);
    }, 50);

    timerRef.current = setTimeout(() => {
      handleDismiss();
    }, DURATION);

    return () => {
      clearTimeout(timerRef.current);
      clearInterval(progressRef.current);
    };
  }, [visible]);

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  if (!visible || !execution) return null;

  const { results = [], edges = [], errors = [] } = execution;

  // Pair results with their action steps
  const entities = payload
    .map((step, i) => ({ step, result: results[i] }))
    .filter(({ step, result }) => result?.data && !step.action.startsWith('database.graph'))
    .map(({ step, result }) => buildEntityLabel(step.action, result))
    .filter(Boolean);

  const successCount = results.filter((r) => r?.success).length;
  const hasErrors = errors.length > 0;

  return (
    <>
      <style>{`
        @keyframes wma-slide-in {
          from { transform: translateX(calc(100% + 24px)); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes wma-fade-out {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(calc(100% + 24px)); }
        }
        .wma-toast { animation: wma-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .wma-entity-chip:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.15) !important; }
        .wma-edge-row:hover { background: rgba(255,255,255,0.08) !important; }
        .wma-nav-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .wma-close-btn:hover { background: rgba(255,255,255,0.15) !important; }
      `}</style>

      <div
        className="wma-toast"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          width: '380px',
          background: 'linear-gradient(135deg, rgba(15,23,42,0.97) 0%, rgba(30,41,59,0.97) 100%)',
          border: '1px solid rgba(99,102,241,0.35)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
          overflow: 'hidden',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Progress bar */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0,
          height: '2px',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
          transition: 'width 0.05s linear',
          borderRadius: '16px 16px 0 0',
        }} />

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '14px 16px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          {/* WMA icon */}
          <div style={{
            width: '32px', height: '32px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 12px rgba(99,102,241,0.4)',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#fff' }}>hub</span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c7d2fe', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {title}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '1px' }}>
              {successCount} action{successCount !== 1 ? 's' : ''} completed{hasErrors ? ` · ${errors.length} error${errors.length !== 1 ? 's' : ''}` : ''}
            </div>
          </div>

          <button
            className="wma-close-btn"
            onClick={handleDismiss}
            style={{
              width: '24px', height: '24px',
              borderRadius: '8px',
              border: 'none',
              background: 'rgba(255,255,255,0.07)',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
              flexShrink: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
          </button>
        </div>

        {/* Entity chips */}
        {entities.length > 0 && (
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
              Created Assets
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {entities.map((entity, idx) => (
                <button
                  key={idx}
                  className="wma-entity-chip"
                  onClick={() => {
                    const path = APP_PATHS[entity.app]?.(entity.id) || `/${entity.app}`;
                    router.push(path);
                    handleDismiss();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 10px',
                    borderRadius: '8px',
                    border: `1px solid ${entity.color}33`,
                    background: `${entity.color}1A`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: `0 2px 8px ${entity.color}20`,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 13, color: entity.color }}>{entity.icon}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e2e8f0', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entity.title}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: entity.color, fontWeight: 700 }}>↗</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Graph edges */}
        {edges.length > 0 && (
          <div style={{ padding: '0 16px 12px', borderTop: entities.length > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none', paddingTop: entities.length > 0 ? '12px' : '0' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
              Graph Connections
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {edges.slice(0, 4).map((edge, idx) => (
                <div
                  key={idx}
                  className="wma-edge-row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 8px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.03)',
                    transition: 'background 0.15s',
                  }}
                >
                  {/* Source */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 12, color: APP_COLORS[edge.source_app] || '#94a3b8' }}>
                      {APP_ICONS[edge.source_app] || 'circle'}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'capitalize' }}>{edge.source_app}</span>
                  </div>
                  {/* Arrow + edge type */}
                  <div style={{
                    fontSize: '0.62rem',
                    color: '#475569',
                    background: 'rgba(99,102,241,0.15)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    whiteSpace: 'nowrap',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}>
                    → {EDGE_TYPE_LABELS[edge.edge_type] || edge.edge_type}
                  </div>
                  {/* Target */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 12, color: APP_COLORS[edge.target_app] || '#94a3b8' }}>
                      {APP_ICONS[edge.target_app] || 'circle'}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'capitalize' }}>{edge.target_app}</span>
                  </div>
                </div>
              ))}
              {edges.length > 4 && (
                <div style={{ fontSize: '0.68rem', color: '#475569', padding: '2px 8px' }}>
                  +{edges.length - 4} more edges
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error state */}
        {hasErrors && (
          <div style={{ padding: '8px 16px 12px' }}>
            {errors.map((err, idx) => (
              <div key={idx} style={{
                fontSize: '0.7rem',
                color: '#f87171',
                background: 'rgba(239,68,68,0.1)',
                padding: '4px 8px',
                borderRadius: '6px',
                marginBottom: '4px',
              }}>
                ⚠ Step {err.step}: {err.error}
              </div>
            ))}
          </div>
        )}

        {/* Footer hint */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          fontSize: '0.67rem',
          color: '#334155',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 11, color: '#475569' }}>schedule</span>
          Auto-dismissing · Click any asset to navigate
        </div>
      </div>
    </>
  );
}
