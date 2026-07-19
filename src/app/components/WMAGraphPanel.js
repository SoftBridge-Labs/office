'use client';

/**
 * WMAGraphPanel — Displays all graph edges connected to a given entity.
 * Renders a list of related entities with app-colored icons and navigation.
 * Embeddable in sidebars (Ping right panel, Docs toolbar, etc.)
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { graphDB } from '@/lib/wma';

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
  ping: (id, meta) => (meta?.channel_id ? `/ping/${meta.channel_id}` : '/ping'),
};

const EDGE_TYPE_LABELS = {
  created_from: 'Created from',
  referenced_in: 'Referenced in',
  distilled_from: 'Distilled from',
  embedded_in: 'Embedded in',
  linked_to: 'Linked to',
  blocked_by: 'Blocked by',
};

const EDGE_TYPE_COLORS = {
  created_from: '#6366f1',
  referenced_in: '#3b82f6',
  distilled_from: '#8b5cf6',
  embedded_in: '#ec4899',
  linked_to: '#10b981',
  blocked_by: '#ef4444',
};

/**
 * @param {Object} props
 * @param {string} props.appName   - The app this entity belongs to (e.g. 'ping', 'docs')
 * @param {string} props.entityId  - The entity's ID
 * @param {boolean} [props.compact] - Render in compact mode (no header)
 * @param {string} [props.className]
 */
export default function WMAGraphPanel({ appName, entityId, compact = false, style = {} }) {
  const router = useRouter();
  const [edges, setEdges] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!appName || !entityId) return;
    const found = graphDB.getEdgesForEntity(appName, String(entityId));
    setEdges(found);
  }, [appName, entityId]);

  const edgeTypes = ['all', ...new Set(edges.map((e) => e.edge_type))];

  const filteredEdges = filter === 'all' ? edges : edges.filter((e) => e.edge_type === filter);

  const navigateToEntity = (edge) => {
    // Determine which side of the edge is the "other" entity
    const isSource = edge.source_app === appName && edge.source_entity_id === String(entityId);
    const targetApp = isSource ? edge.target_app : edge.source_app;
    const targetId = isSource ? edge.target_entity_id : edge.source_entity_id;
    const meta = edge.metadata || {};

    const pathFn = APP_PATHS[targetApp];
    const path = pathFn ? pathFn(targetId, meta) : `/${targetApp}`;
    router.push(path);
  };

  if (!appName || !entityId) return null;

  return (
    <div style={{
      background: 'var(--bg-surface, #fff)',
      borderRadius: compact ? '10px' : '14px',
      border: '1px solid var(--border, #e2e8f0)',
      overflow: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif',
      ...style,
    }}>
      {/* Header */}
      {!compact && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 14px',
          borderBottom: '1px solid var(--border, #e2e8f0)',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.04) 100%)',
        }}>
          <div style={{
            width: '26px', height: '26px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#fff' }}>hub</span>
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
              Graph Links
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #64748b)' }}>
              {edges.length} connection{edges.length !== 1 ? 's' : ''} · WMA
            </div>
          </div>
        </div>
      )}

      {/* Filter chips */}
      {edges.length > 0 && edgeTypes.length > 2 && (
        <div style={{
          display: 'flex',
          gap: '4px',
          padding: '8px 12px',
          overflowX: 'auto',
          borderBottom: '1px solid var(--border, #e2e8f0)',
        }}>
          {edgeTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              style={{
                padding: '3px 8px',
                borderRadius: '6px',
                border: `1px solid ${filter === type ? (EDGE_TYPE_COLORS[type] || '#6366f1') : 'var(--border, #e2e8f0)'}`,
                background: filter === type ? `${EDGE_TYPE_COLORS[type] || '#6366f1'}18` : 'transparent',
                color: filter === type ? (EDGE_TYPE_COLORS[type] || '#6366f1') : 'var(--text-muted, #64748b)',
                fontSize: '0.68rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                textTransform: 'capitalize',
                transition: 'all 0.15s',
              }}
            >
              {type === 'all' ? `All (${edges.length})` : (EDGE_TYPE_LABELS[type] || type)}
            </button>
          ))}
        </div>
      )}

      {/* Edge list */}
      <div style={{ maxHeight: compact ? '200px' : '400px', overflowY: 'auto' }}>
        {filteredEdges.length === 0 ? (
          <div style={{
            padding: '24px 16px',
            textAlign: 'center',
            color: 'var(--text-muted, #64748b)',
            fontSize: '0.78rem',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>hub</span>
            No graph connections yet.
            <br />
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Use WMA actions to link this entity.</span>
          </div>
        ) : (
          filteredEdges.map((edge, idx) => {
            const isSource = edge.source_app === appName && edge.source_entity_id === String(entityId);
            const otherApp = isSource ? edge.target_app : edge.source_app;
            const otherColor = APP_COLORS[otherApp] || '#94a3b8';
            const otherIcon = APP_ICONS[otherApp] || 'link';
            const createdAt = edge.created_at ? new Date(edge.created_at).toLocaleDateString() : '';
            const preview = edge.metadata?.message_preview || edge.metadata?.doc_title || edge.metadata?.action_item || edge.metadata?.url || '';

            return (
              <div
                key={edge.id}
                onClick={() => navigateToEntity(edge)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 14px',
                  borderBottom: idx < filteredEdges.length - 1 ? '1px solid var(--border, #e2e8f0)' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover, #f8fafc)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {/* App icon bubble */}
                <div style={{
                  width: '32px', height: '32px',
                  borderRadius: '10px',
                  background: `${otherColor}18`,
                  border: `1px solid ${otherColor}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '1px',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: otherColor }}>{otherIcon}</span>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: EDGE_TYPE_COLORS[edge.edge_type] || '#6366f1',
                      background: `${EDGE_TYPE_COLORS[edge.edge_type] || '#6366f1'}15`,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      textTransform: 'capitalize',
                    }}>
                      {isSource ? '→' : '←'} {EDGE_TYPE_LABELS[edge.edge_type] || edge.edge_type}
                    </span>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary, #475569)',
                      textTransform: 'capitalize',
                    }}>
                      {otherApp}
                    </span>
                  </div>

                  {preview && (
                    <div style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted, #64748b)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '220px',
                    }}>
                      {preview}
                    </div>
                  )}

                  {createdAt && (
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '2px' }}>{createdAt}</div>
                  )}
                </div>

                {/* Navigate arrow */}
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#cbd5e1', marginTop: '9px', flexShrink: 0 }}>
                  arrow_forward_ios
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
