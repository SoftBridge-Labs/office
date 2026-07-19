/**
 * Workspace Mesh Agent (WMA) — Core Engine
 * SoftBridge Office Suite
 *
 * Provides:
 *  - graphDB      → CRUD for workspace_edges (localStorage-backed)
 *  - wmaExecute   → sequential payload runner with $REFI(n) forward-reference resolution
 *  - WMA_ACTIONS  → action-string → api-call routing map
 *  - MeetingLifecycle → Framework 1 helpers (preMeeting, postMeeting)
 *  - PingWMA      → Framework 2 helpers (createTaskFromMessage, createDocFromMessage)
 *  - BookmarkWMA  → Framework 3 helpers (urlToWhiteboardCard)
 */

import { api } from '@/lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// GRAPH DATABASE (localStorage-backed, consistent with existing offline pattern)
// ─────────────────────────────────────────────────────────────────────────────

const GRAPH_STORAGE_KEY = 'sb_wma_edges';

export const graphDB = {
  /** Load all edges from storage */
  getAll() {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem(GRAPH_STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  },

  /** Persist the full edge list */
  _save(edges) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(GRAPH_STORAGE_KEY, JSON.stringify(edges));
  },

  /**
   * Create a new directed edge.
   * @returns {object} The new edge record
   */
  createEdge({ source_app, source_entity_id, target_app, target_entity_id, edge_type, metadata = {} }) {
    const edge = {
      id: `edge_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      source_app,
      source_entity_id: String(source_entity_id),
      target_app,
      target_entity_id: String(target_entity_id),
      edge_type,
      metadata,
      created_at: new Date().toISOString(),
    };
    const edges = this.getAll();
    edges.push(edge);
    this._save(edges);
    return { success: true, data: edge };
  },

  /** Get all edges where the given entity is source or target */
  getEdgesForEntity(appName, entityId) {
    const id = String(entityId);
    return this.getAll().filter(
      (e) =>
        (e.source_app === appName && e.source_entity_id === id) ||
        (e.target_app === appName && e.target_entity_id === id)
    );
  },

  /** Delete a single edge by id */
  deleteEdge(edgeId) {
    const edges = this.getAll().filter((e) => e.id !== edgeId);
    this._save(edges);
    return { success: true };
  },

  /** Remove all edges related to a specific entity */
  pruneEntity(appName, entityId) {
    const id = String(entityId);
    const edges = this.getAll().filter(
      (e) =>
        !(e.source_app === appName && e.source_entity_id === id) &&
        !(e.target_app === appName && e.target_entity_id === id)
    );
    this._save(edges);
    return { success: true };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// WMA ACTION MAP
// Maps action strings from the JSON payload spec → actual api calls
// ─────────────────────────────────────────────────────────────────────────────

const WMA_ACTIONS = {
  // Docs
  'apps.docs.createDocument': (params) =>
    api.createDoc({ title: params.title || 'Untitled', content: params.content || '', isPublic: false }),

  'apps.docs.updateDocument': (params) =>
    api.updateDoc(params.doc_id, params.updates || {}),

  // Tasks
  'apps.tasks.createTask': (params) =>
    api.createTask({
      title: params.title || 'Untitled Task',
      description: params.description || '',
      status: params.status || 'todo',
      assignee: params.assignee || null,
      due_date: params.due_date || null,
    }),

  'apps.tasks.updateTask': (params) =>
    api.updateTask(params.task_id, params.updates || {}),

  // Calendar
  'apps.calendar.createEvent': (params) =>
    api.createEvent(params),

  'apps.calendar.updateEvent': (params) =>
    api.updateEvent(params.event_id, params.updates || {}),

  // Whiteboard
  'apps.whiteboard.create': (params) =>
    api.createWhiteboard({
      title: params.title || 'Scratchpad',
      content: params.content || '',
    }),

  // Bookmarks
  'apps.bookmarks.create': (params) =>
    api.createBookmark({
      url: params.url || '',
      title: params.title || '',
      description: params.description || '',
      tags: params.tags || [],
    }),

  // Graph edges
  'database.graph.createEdge': (params) =>
    Promise.resolve(
      graphDB.createEdge({
        source_app: params.source_app,
        source_entity_id: params.source_entity_id,
        target_app: params.target_app,
        target_entity_id: params.target_entity_id,
        edge_type: params.edge_type,
        metadata: params.metadata || {},
      })
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// WMA EXECUTOR
// Runs a sequential payload array, resolving $REFI(n) forward references
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} WMAStep
 * @property {string} action  - Action key from WMA_ACTIONS
 * @property {Object} params  - Parameters (may contain $REFI(n) tokens)
 * @property {string} [label] - Human-readable label for toast display
 */

/**
 * Resolve $REFI(n) tokens in a params object.
 * Walks the params tree and replaces any string value matching "$REFI(N)"
 * with the entity ID from step N's result.
 *
 * @param {Object} params   - Raw params from the payload step
 * @param {Array}  results  - Resolved results from prior steps
 * @returns {Object}        - Params with tokens replaced
 */
function resolveRefs(params, results) {
  const REFI_RE = /^\$REFI\((\d+)\)$/;

  function walk(val) {
    if (typeof val === 'string') {
      const m = val.match(REFI_RE);
      if (m) {
        const idx = parseInt(m[1], 10);
        const prior = results[idx];
        if (prior && prior.data) {
          // Return the entity ID — try common id field names
          return prior.data._id || prior.data.id || prior.data.event_id || String(idx);
        }
        return val;
      }
      return val;
    }
    if (Array.isArray(val)) return val.map(walk);
    if (val && typeof val === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(val)) out[k] = walk(v);
      return out;
    }
    return val;
  }

  return walk(params);
}

/**
 * Execute a WMA payload array sequentially.
 *
 * @param {WMAStep[]} payload - Array of action steps
 * @returns {Promise<{ results: Array, edges: Array, errors: Array }>}
 */
export async function wmaExecute(payload) {
  const results = [];
  const edges = [];
  const errors = [];

  for (let i = 0; i < payload.length; i++) {
    const step = payload[i];
    const actionFn = WMA_ACTIONS[step.action];

    if (!actionFn) {
      const err = `[WMA] Unknown action: ${step.action}`;
      console.warn(err);
      errors.push({ step: i, action: step.action, error: err });
      results.push(null);
      continue;
    }

    const resolvedParams = resolveRefs(step.params || {}, results);

    try {
      const result = await actionFn(resolvedParams);
      results.push(result || { success: true, data: {} });

      if (step.action === 'database.graph.createEdge' && result?.data) {
        edges.push(result.data);
      }

      console.debug(`[WMA] Step ${i} (${step.action}) ✓`, result);
    } catch (err) {
      console.error(`[WMA] Step ${i} (${step.action}) ✗`, err);
      errors.push({ step: i, action: step.action, error: err.message });
      results.push(null);
    }
  }

  return { results, edges, errors };
}

// ─────────────────────────────────────────────────────────────────────────────
// FRAMEWORK 1 — MEETING LIFECYCLE
// ─────────────────────────────────────────────────────────────────────────────

export const MeetingLifecycle = {
  /**
   * PRE-MEETING: Auto-generate a Doc + Whiteboard and attach them to the calendar event.
   * @param {Object} event - Created calendar event (must have _id or id)
   * @returns {Promise<{ results, edges, errors, docId, whiteboardId }>}
   */
  async preMeeting(event) {
    const eventId = event?._id || event?.id;
    const eventTitle = event?.title || 'Meeting';

    const payload = [
      // Step 0 — Create meeting notes Doc
      {
        action: 'apps.docs.createDocument',
        label: 'Meeting Notes Doc',
        params: {
          title: `📋 ${eventTitle} — Notes & Agenda`,
          content: `# ${eventTitle}\n\n**Date:** ${event?.start_time || new Date().toISOString()}\n\n## Agenda\n\n- \n\n## Notes\n\n\n\n## Action Items\n\n- [ ] \n`,
        },
      },
      // Step 1 — Create scratchpad Whiteboard
      {
        action: 'apps.whiteboard.create',
        label: 'Scratchpad Whiteboard',
        params: {
          title: `🗒️ ${eventTitle} — Whiteboard`,
          content: '',
        },
      },
      // Step 2 — Attach doc to event
      {
        action: 'apps.calendar.updateEvent',
        label: 'Attach assets to event',
        params: {
          event_id: eventId,
          updates: {
            attached_doc_id: '$REFI(0)',
            attached_whiteboard_id: '$REFI(1)',
          },
        },
      },
      // Step 3 — Edge: doc created_from event
      {
        action: 'database.graph.createEdge',
        label: 'Graph: Doc → Event',
        params: {
          source_app: 'docs',
          source_entity_id: '$REFI(0)',
          target_app: 'calendar',
          target_entity_id: eventId,
          edge_type: 'created_from',
          metadata: { event_title: eventTitle },
        },
      },
      // Step 4 — Edge: whiteboard created_from event
      {
        action: 'database.graph.createEdge',
        label: 'Graph: Whiteboard → Event',
        params: {
          source_app: 'whiteboard',
          source_entity_id: '$REFI(1)',
          target_app: 'calendar',
          target_entity_id: eventId,
          edge_type: 'created_from',
          metadata: { event_title: eventTitle },
        },
      },
    ];

    const execution = await wmaExecute(payload);

    return {
      ...execution,
      docId: execution.results[0]?.data?._id || execution.results[0]?.data?.id,
      whiteboardId: execution.results[1]?.data?._id || execution.results[1]?.data?.id,
    };
  },

  /**
   * POST-MEETING: Synthesize chat messages into Doc, Tasks, and Bookmarks.
   * @param {string} roomId   - Meet room ID
   * @param {Array}  messages - Array of meet chat messages { content, senderName }
   * @param {string} [title]  - Meeting title
   * @returns {Promise<{ results, edges, errors }>}
   */
  async postMeeting(roomId, messages = [], title = 'Meeting') {
    // Extract action items: lines starting with TODO/Action/@mention
    const ACTION_RE = /(?:^|\n)\s*(?:TODO|Action|@\w+)\s*[:\-]\s*(.+)/gi;
    const allText = messages.map((m) => m.content || '').join('\n');

    const actionItems = [];
    let m;
    while ((m = ACTION_RE.exec(allText)) !== null) {
      actionItems.push(m[1].trim());
    }

    // Extract URLs for bookmarks
    const URL_RE = /https?:\/\/[^\s<>"']+/g;
    const urls = [...new Set(allText.match(URL_RE) || [])];

    // Build summary content
    const summaryContent = [
      `# ${title} — Post-Meeting Summary`,
      `\n**Room:** ${roomId}`,
      `**Generated:** ${new Date().toLocaleString()}`,
      `\n## Key Discussion Points\n`,
      messages.slice(0, 30).map((msg) => `- **${msg.senderName || 'Participant'}**: ${msg.content}`).join('\n'),
      actionItems.length ? `\n## Action Items\n${actionItems.map((a) => `- [ ] ${a}`).join('\n')}` : '',
      urls.length ? `\n## Referenced Links\n${urls.map((u) => `- ${u}`).join('\n')}` : '',
    ].join('\n');

    const payload = [
      // Step 0 — Summary doc
      {
        action: 'apps.docs.createDocument',
        label: 'Meeting Summary Doc',
        params: {
          title: `📝 ${title} — Post-Meeting Summary`,
          content: summaryContent,
        },
      },
      // Step 1 — Edge: doc distilled_from meet room
      {
        action: 'database.graph.createEdge',
        label: 'Graph: Summary → Meet Room',
        params: {
          source_app: 'docs',
          source_entity_id: '$REFI(0)',
          target_app: 'meet',
          target_entity_id: roomId,
          edge_type: 'distilled_from',
          metadata: { room_id: roomId, message_count: messages.length },
        },
      },
    ];

    // Add task steps for each action item (max 10)
    actionItems.slice(0, 10).forEach((item, idx) => {
      const taskStepIdx = payload.length;
      payload.push({
        action: 'apps.tasks.createTask',
        label: `Task: ${item.slice(0, 40)}`,
        params: {
          title: item,
          description: `Extracted from meeting: ${title} (Room: ${roomId})`,
          status: 'todo',
        },
      });
      payload.push({
        action: 'database.graph.createEdge',
        label: `Graph: Task ${idx + 1} → Meet`,
        params: {
          source_app: 'tasks',
          source_entity_id: `$REFI(${taskStepIdx})`,
          target_app: 'meet',
          target_entity_id: roomId,
          edge_type: 'distilled_from',
          metadata: { action_item: item },
        },
      });
    });

    // Add bookmark steps for each URL (max 5)
    urls.slice(0, 5).forEach((url, idx) => {
      const bmStepIdx = payload.length;
      payload.push({
        action: 'apps.bookmarks.create',
        label: `Bookmark: ${url.slice(0, 40)}`,
        params: {
          url,
          title: `From ${title}`,
          description: `Referenced during meeting: ${title}`,
          tags: ['meeting', 'auto-captured'],
        },
      });
      payload.push({
        action: 'database.graph.createEdge',
        label: `Graph: Bookmark ${idx + 1} → Meet`,
        params: {
          source_app: 'bookmarks',
          source_entity_id: `$REFI(${bmStepIdx})`,
          target_app: 'meet',
          target_entity_id: roomId,
          edge_type: 'referenced_in',
          metadata: { url },
        },
      });
    });

    return wmaExecute(payload);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// FRAMEWORK 2 — PING CONVERSATION-DRIVEN EXECUTION
// ─────────────────────────────────────────────────────────────────────────────

export const PingWMA = {
  /**
   * Create a Task from a Ping message, with a bi-directional graph edge.
   * @param {Object} msg       - Ping message object { _id, content, channelId, createdAt }
   * @param {string} channelId - Ping channel ID
   * @returns {Promise<{ results, edges, errors, taskId }>}
   */
  async createTaskFromMessage(msg, channelId) {
    const msgId = msg?._id || msg?.id;
    const content = msg?.content || 'Shared from Ping';

    const payload = [
      // Step 0 — Create task
      {
        action: 'apps.tasks.createTask',
        label: 'Task from Ping message',
        params: {
          title: content.length > 120 ? content.slice(0, 117) + '…' : content,
          description: `Shared from Ping channel (${channelId}) at ${new Date(msg?.createdAt || Date.now()).toLocaleString()}\n\nOriginal message:\n${content}`,
          status: 'todo',
        },
      },
      // Step 1 — Edge: task created_from ping message
      {
        action: 'database.graph.createEdge',
        label: 'Graph: Task → Ping Message',
        params: {
          source_app: 'tasks',
          source_entity_id: '$REFI(0)',
          target_app: 'ping',
          target_entity_id: msgId,
          edge_type: 'created_from',
          metadata: { channel_id: channelId, message_preview: content.slice(0, 100) },
        },
      },
    ];

    const execution = await wmaExecute(payload);
    return {
      ...execution,
      taskId: execution.results[0]?.data?._id || execution.results[0]?.data?.id,
    };
  },

  /**
   * Create a Doc from a Ping message, with a bi-directional graph edge.
   * @param {Object} msg       - Ping message object
   * @param {string} channelId - Ping channel ID
   * @param {string} channelName - Ping channel name
   * @returns {Promise<{ results, edges, errors, docId }>}
   */
  async createDocFromMessage(msg, channelId, channelName = 'channel') {
    const msgId = msg?._id || msg?.id;
    const content = msg?.content || '';

    const payload = [
      // Step 0 — Create doc
      {
        action: 'apps.docs.createDocument',
        label: 'Doc from Ping message',
        params: {
          title: `Ping Note — #${channelName}`,
          content: `# Captured from #${channelName}\n\n_Sent at ${new Date(msg?.createdAt || Date.now()).toLocaleString()}_\n\n---\n\n${content}`,
        },
      },
      // Step 1 — Edge: doc created_from ping message
      {
        action: 'database.graph.createEdge',
        label: 'Graph: Doc → Ping Message',
        params: {
          source_app: 'docs',
          source_entity_id: '$REFI(0)',
          target_app: 'ping',
          target_entity_id: msgId,
          edge_type: 'created_from',
          metadata: { channel_id: channelId, channel_name: channelName },
        },
      },
    ];

    const execution = await wmaExecute(payload);
    return {
      ...execution,
      docId: execution.results[0]?.data?._id || execution.results[0]?.data?.id,
    };
  },

  /**
   * Link a Ping message to an existing calendar event.
   * @param {Object} msg       - Ping message object
   * @param {string} channelId - Ping channel ID
   * @param {string} eventId   - Calendar event ID
   */
  async linkMessageToEvent(msg, channelId, eventId) {
    const msgId = msg?._id || msg?.id;
    const payload = [
      {
        action: 'database.graph.createEdge',
        label: 'Graph: Ping Message → Event',
        params: {
          source_app: 'ping',
          source_entity_id: msgId,
          target_app: 'calendar',
          target_entity_id: eventId,
          edge_type: 'referenced_in',
          metadata: { channel_id: channelId },
        },
      },
    ];
    return wmaExecute(payload);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// FRAMEWORK 3 — KNOWLEDGE CONSOLIDATION
// ─────────────────────────────────────────────────────────────────────────────

export const BookmarkWMA = {
  /**
   * Convert a URL into a visual metadata card on a Whiteboard.
   * Uses the existing /workspace/ping/url-security endpoint for preview metadata.
   * @param {string} url         - The URL to embed
   * @param {string} whiteboardId - Target whiteboard ID
   */
  async urlToWhiteboardCard(url, whiteboardId) {
    let preview = { title: url, description: '', favicon: '' };
    try {
      const res = await api.ping.checkUrlSecurity(url);
      if (res?.preview) {
        preview = { ...preview, ...res.preview };
      }
    } catch (e) {
      console.warn('[WMA] Could not fetch URL preview:', e.message);
    }

    const bookmarkPayload = [
      // Step 0 — Create bookmark
      {
        action: 'apps.bookmarks.create',
        label: 'Bookmark from URL',
        params: {
          url,
          title: preview.title || url,
          description: preview.description || '',
          tags: ['whiteboard-embed'],
        },
      },
      // Step 1 — Edge: bookmark embedded_in whiteboard
      {
        action: 'database.graph.createEdge',
        label: 'Graph: Bookmark → Whiteboard',
        params: {
          source_app: 'bookmarks',
          source_entity_id: '$REFI(0)',
          target_app: 'whiteboard',
          target_entity_id: whiteboardId,
          edge_type: 'embedded_in',
          metadata: { url, preview },
        },
      },
    ];

    const execution = await wmaExecute(bookmarkPayload);
    return { ...execution, preview, bookmarkId: execution.results[0]?.data?._id || execution.results[0]?.data?.id };
  },

  /**
   * Spawn a linked Whiteboard from a Doc, with bi-directional edges.
   * @param {Object} doc - Doc object { _id, id, title }
   * @returns {Promise<{ results, edges, errors, whiteboardId }>}
   */
  async spawnWhiteboardFromDoc(doc) {
    const docId = doc?._id || doc?.id;
    const docTitle = doc?.title || 'Document';

    const payload = [
      // Step 0 — Create whiteboard
      {
        action: 'apps.whiteboard.create',
        label: 'Whiteboard from Doc',
        params: {
          title: `🔗 ${docTitle} — Whiteboard`,
          content: '',
        },
      },
      // Step 1 — Edge: whiteboard linked_to doc
      {
        action: 'database.graph.createEdge',
        label: 'Graph: Whiteboard → Doc',
        params: {
          source_app: 'whiteboard',
          source_entity_id: '$REFI(0)',
          target_app: 'docs',
          target_entity_id: docId,
          edge_type: 'linked_to',
          metadata: { doc_title: docTitle },
        },
      },
      // Step 2 — Edge (reverse): doc linked_to whiteboard (bi-directional)
      {
        action: 'database.graph.createEdge',
        label: 'Graph: Doc → Whiteboard (reverse)',
        params: {
          source_app: 'docs',
          source_entity_id: docId,
          target_app: 'whiteboard',
          target_entity_id: '$REFI(0)',
          edge_type: 'linked_to',
          metadata: { doc_title: docTitle },
        },
      },
    ];

    const execution = await wmaExecute(payload);
    return {
      ...execution,
      whiteboardId: execution.results[0]?.data?._id || execution.results[0]?.data?.id,
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY — Build a human-readable entity label for toast/panel display
// ─────────────────────────────────────────────────────────────────────────────

export function buildEntityLabel(action, result) {
  if (!result?.data) return null;
  const id = result.data._id || result.data.id;
  const title = result.data.title || result.data.name || result.data.url || id;

  const APP_MAP = {
    'apps.docs.createDocument': { app: 'docs', icon: 'description', color: '#6366f1', label: 'Doc', path: `/doc/${id}` },
    'apps.tasks.createTask': { app: 'tasks', icon: 'task_alt', color: '#10b981', label: 'Task', path: `/tasks` },
    'apps.whiteboard.create': { app: 'whiteboard', icon: 'dashboard', color: '#f59e0b', label: 'Whiteboard', path: `/whiteboard` },
    'apps.bookmarks.create': { app: 'bookmarks', icon: 'bookmark', color: '#ec4899', label: 'Bookmark', path: `/bookmarks` },
    'apps.calendar.createEvent': { app: 'calendar', icon: 'event', color: '#3b82f6', label: 'Event', path: `/calendar` },
  };

  const meta = APP_MAP[action];
  if (!meta) return null;
  return { ...meta, id, title };
}
