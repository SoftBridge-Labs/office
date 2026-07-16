// API Client for SoftBridge Office Suite (Production Integration)

const getApiUrl = () => {
  if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__.NEXT_PUBLIC_API_URL) return window.__ENV__.NEXT_PUBLIC_API_URL;
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
};
const API_BASE = typeof window !== 'undefined' ? '/api-proxy' : getApiUrl();

function getLocal(key, defaultVal) {
  if (typeof window === 'undefined') return defaultVal;
  const val = localStorage.getItem(`sb_local_${key}`);
  return val ? JSON.parse(val) : defaultVal;
}

function saveLocalItem(key, item) {
  if (typeof window === 'undefined') return item;
  const items = getLocal(key, []);
  const newItem = { ...item, _id: item._id || Math.random().toString(36).substring(2, 10), createdAt: new Date().toISOString() };
  items.push(newItem);
  localStorage.setItem(`sb_local_${key}`, JSON.stringify(items));
  return { success: true, data: newItem };
}

function updateLocalItem(key, id, updates) {
  if (typeof window === 'undefined') return updates;
  const items = getLocal(key, []);
  const idx = items.findIndex(x => x._id === id);
  if (idx !== -1) {
    items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(`sb_local_${key}`, JSON.stringify(items));
    return { success: true, data: items[idx] };
  }
  return { success: false };
}

function deleteLocalItem(key, id) {
  if (typeof window === 'undefined') return { success: true };
  let items = getLocal(key, []);
  items = items.filter(x => x._id !== id);
  localStorage.setItem(`sb_local_${key}`, JSON.stringify(items));
  return { success: true };
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('sb_id_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // Always send the workspace identifier so backend scopes data to the correct org
    const workspaceId = localStorage.getItem('sb_workspace_id') || 'default';
    headers['x-workspace-id'] = workspaceId;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || data.message || `Request failed with status ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return data;
}

export const api = {
  // ─── Sheets CRUD Operations ───────────────────────────────────────────────
  getSheets: () => request('/workspace/forms/sheets/'),
  
  createSheet: (title, columns = null) => request('/workspace/forms/sheets/', {
    method: 'POST',
    body: JSON.stringify({
      title,
      columns: columns || [
        { id: 'col-1', name: 'col-1', label: 'A', type: 'text' },
        { id: 'col-2', name: 'col-2', label: 'B', type: 'text' },
        { id: 'col-3', name: 'col-3', label: 'C', type: 'text' }
      ]
    })
  }),
  
  getSheet: (id) => request(`/workspace/forms/sheets/${id}`),
  getSheetPublic: (id) => request(`/workspace/forms/sheets/${id}/view`),
  
  updateSheet: (id, metadata) => request(`/workspace/forms/sheets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(metadata)
  }),
  
  deleteSheet: (id) => request(`/workspace/forms/sheets/${id}`, {
    method: 'DELETE'
  }),
  
  duplicateSheet: (id) => request(`/workspace/forms/sheets/${id}/duplicate`, {
    method: 'POST'
  }),

  // ─── Sheet Data Operations ────────────────────────────────────────────────
  addRow: (sheetId, cells = {}) => request(`/workspace/forms/sheets/${sheetId}/rows`, {
    method: 'POST',
    body: JSON.stringify({ cells })
  }),
  
  updateRow: (sheetId, rowId, cells) => request(`/workspace/forms/sheets/${sheetId}/rows/${rowId}`, {
    method: 'PUT',
    body: JSON.stringify({ cells })
  }),
  
  deleteRow: (sheetId, rowId) => request(`/workspace/forms/sheets/${sheetId}/rows/${rowId}`, {
    method: 'DELETE'
  }),
  
  bulkUpdateCells: (sheetId, updates) => request(`/workspace/forms/sheets/${sheetId}/cells`, {
    method: 'PUT',
    body: JSON.stringify({ updates })
  }),

  // Export URL with auth token baked in so window.open works
  getExportUrl: (sheetId, format = 'csv') => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('sb_id_token') : '';
    const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
    return `${API_BASE}/workspace/forms/sheets/${sheetId}/export?format=${format}${tokenParam}`;
  },

  // ─── Workspace Form Integrations ──────────────────────────────────────────
  importFormResponses: (sheetId, formId) => request(`/workspace/forms/sheets/${sheetId}/import-form`, {
    method: 'POST',
    body: JSON.stringify({ formId })
  }),
  
  exportToForm: (sheetId) => request(`/workspace/forms/sheets/${sheetId}/export-to-form`, {
    method: 'POST'
  }),

  // ─── Collaboration ────────────────────────────────────────────────────────
  inviteCollaborator: (sheetId, email, role) => request(`/workspace/forms/sheets/${sheetId}/team/invite`, {
    method: 'POST',
    body: JSON.stringify({ email, role })
  }),
  
  acceptInvitation: (token) => request('/workspace/forms/sheets/team/accept', {
    method: 'POST',
    body: JSON.stringify({ token })
  }),
  
  getCollaborators: (sheetId) => request(`/workspace/forms/sheets/${sheetId}/team/collaborators`),
  
  updateCollaboratorRole: (sheetId, targetUid, role) => request(`/workspace/forms/sheets/${sheetId}/team/collaborators/${targetUid}`, {
    method: 'PUT',
    body: JSON.stringify({ role })
  }),
  
  revokeCollaborator: (sheetId, targetUid) => request(`/workspace/forms/sheets/${sheetId}/team/collaborators/${targetUid}`, {
    method: 'DELETE'
  }),

  // ─── Workspace Forms integration ──────────────────────────────────────────
  getForms: () => request('/workspace/forms'),
  
  linkSheetToForm: (formId, sheetId) => request(`/workspace/forms/${formId}/metadata`, {
    method: 'PUT',
    body: JSON.stringify({ attachedSheetId: sheetId })
  }),

  // ─── SoftBridge Account ───────────────────────────────────────────────────
  getAccount: (uid) => fetch(`https://api.softbridgelabs.in/softbridge/profile/${uid}`).then(r => r.json()),

  // ─── Calendar Management ──────────────────────────────────────────────────
  createCalendar: (data) => request('/calendar/calendars', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getCalendars: () => request('/calendar/calendars'),
  deleteCalendar: (id) => request(`/calendar/calendars/${id}`, {
    method: 'DELETE'
  }),

  // ─── Scheduling Links ─────────────────────────────────────────────────────
  createOrUpdateSchedulingLink: (data) => request('/calendar/scheduling-links', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getSchedulingLinks: () => request('/calendar/scheduling-links'),
  deleteSchedulingLink: (id) => request(`/calendar/scheduling-links/${id}`, {
    method: 'DELETE'
  }),

  // ─── Unified Calendar Events ──────────────────────────────────────────────
  createEvent: (data) => request('/calendar/events', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getEvents: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/calendar/events${q ? `?${q}` : ''}`);
  },
  updateEvent: (id, data) => request(`/calendar/events/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  deleteEvent: (id) => request(`/calendar/events/${id}`, {
    method: 'DELETE'
  }),

  // ─── Public Booking System ────────────────────────────────────────────────
  getPublicBooking: (slug, userUid = null) => {
    const q = userUid ? `?user_uid=${userUid}` : '';
    return request(`/calendar/booking/${slug}${q}`);
  },
  getAvailableSlots: (slug, date, userUid = null, timezone = null) => {
    const params = { date };
    if (userUid) params.user_uid = userUid;
    if (timezone) params.timezone = timezone;
    const q = new URLSearchParams(params).toString();
    return request(`/calendar/booking/${slug}/availability?${q}`);
  },
  bookSlot: (slug, data) => request(`/calendar/booking/${slug}/book`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  cancelBooking: (slug, eventId, inviteeEmail) => request(`/calendar/booking/${slug}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ eventId, inviteeEmail })
  }),

  // ─── Team Management & Collaboration ──────────────────────────────────────
  createTeam: (data) => request('/calendar/teams', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getTeams: () => request('/calendar/teams'),
  addTeamMember: (teamId, data) => request(`/calendar/teams/${teamId}/members`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  removeTeamMember: (teamId, uid) => request(`/calendar/teams/${teamId}/members/${uid}`, {
    method: 'DELETE'
  }),
  deleteTeam: (teamId) => request(`/calendar/teams/${teamId}`, {
    method: 'DELETE'
  }),

  // ─── AI v2 – Daily Planner & Briefing ────────────────────────────────────
  getDailySummary: (date, lang = 'en') =>
    request(`/calendar/ai/daily-summary?date=${date}&lang=${lang}`),

  // Check AI usage / tier
  getAiUsage: () => request('/calendar/ai/usage'),

  // Smart slot recommendation
  smartSchedule: (date, durationMinutes) => request('/calendar/ai/smart-schedule', {
    method: 'POST',
    body: JSON.stringify({ date, durationMinutes })
  }),

  // Meeting summarizer
  summarizeMeeting: (title, description) => request('/calendar/ai/summarize-meeting', {
    method: 'POST',
    body: JSON.stringify({ title, description })
  }),

  // Conflict resolver
  resolveConflict: (conflictEvents, targetEvent) => request('/calendar/ai/resolve-conflict', {
    method: 'POST',
    body: JSON.stringify({ conflictEvents, targetEvent })
  }),

  // Meet Room signaling
  joinMeetingRoom: (roomId, data) => request(`/calendar/meet/${roomId}/join`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getMeetingPeers: (roomId) => request(`/calendar/meet/${roomId}/peers`),
  leaveMeetingRoom: (roomId, data) => request(`/calendar/meet/${roomId}/leave`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  endMeetingRoom: (roomId) => request(`/calendar/meet/${roomId}/end`, {
    method: 'POST'
  }),
  checkMeetLimits: (uid) => request(`/calendar/meet/check-limits?uid=${uid}`),
  getMeetMessages: (roomId) => request(`/calendar/meet/${roomId}/chat`),
  sendMeetMessage: (roomId, data) => request(`/calendar/meet/${roomId}/chat`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getMeetReactions: (roomId) => request(`/calendar/meet/${roomId}/reactions`),
  sendMeetReaction: (roomId, data) => request(`/calendar/meet/${roomId}/reactions`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  syncMeetState: (roomId) => request(`/calendar/meet/${roomId}/sync`),
  createMeetPoll: (roomId, data) => request(`/calendar/meet/${roomId}/poll`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  voteMeetPoll: (roomId, data) => request(`/calendar/meet/${roomId}/poll/vote`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getHostedMeetings: (uid) => request(`/calendar/meet/hosted?uid=${uid}`),
  updateMeetPeer: (roomId, data) => request(`/calendar/meet/${roomId}/update-peer`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateMeetSettings: (roomId, data) => request(`/calendar/meet/${roomId}/settings`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // ─── Workspace Bookmarks ──────────────────────────────────────────────────
  getBookmarks: () => request('/workspace/bookmarks').catch((e) => { if (e.status === 403) throw e; return { success: true, data: getLocal('bookmarks', []) }; }),
  createBookmark: (data) => request('/workspace/bookmarks', { method: 'POST', body: JSON.stringify(data) }).catch((e) => { if (e.status === 403) throw e; return saveLocalItem('bookmarks', data); }),
  updateBookmark: (id, data) => request(`/workspace/bookmarks/${id}`, { method: 'PUT', body: JSON.stringify(data) }).catch((e) => { if (e.status === 403) throw e; return updateLocalItem('bookmarks', id, data); }),
  deleteBookmark: (id) => request(`/workspace/bookmarks/${id}`, { method: 'DELETE' }).catch((e) => { if (e.status === 403) throw e; return deleteLocalItem('bookmarks', id); }),

  // ─── Workspace Docs ───────────────────────────────────────────────────────
  getDocs: () => request('/workspace/docs').catch((e) => { if (e.status === 403) throw e; return { success: true, data: getLocal('docs', []) }; }),
  getDoc: (id) => request(`/workspace/docs/${id}`).catch(() => {
    const localDocs = getLocal('docs', []);
    const found = localDocs.find(d => d._id === id);
    return found ? { success: true, data: found } : { success: false, error: 'Document not found' };
  }),
  createDoc: (data) => request('/workspace/docs', { method: 'POST', body: JSON.stringify(data) }).catch((e) => { if (e.status === 403) throw e; return saveLocalItem('docs', data); }),
  updateDoc: (id, data) => request(`/workspace/docs/${id}`, { method: 'PUT', body: JSON.stringify(data) }).catch((e) => { if (e.status === 403) throw e; return updateLocalItem('docs', id, data); }),
  deleteDoc: (id) => request(`/workspace/docs/${id}`, { method: 'DELETE' }).catch((e) => { if (e.status === 403) throw e; return deleteLocalItem('docs', id); }),

  // ─── Workspace Tasks ──────────────────────────────────────────────────────
  getTasks: () => request('/workspace/tasks').catch((e) => { if (e.status === 403) throw e; return { success: true, data: getLocal('tasks', []) }; }),
  createTask: (data) => request('/workspace/tasks', { method: 'POST', body: JSON.stringify(data) }).catch((e) => { if (e.status === 403) throw e; return saveLocalItem('tasks', data); }),
  updateTask: (id, data) => request(`/workspace/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }).catch((e) => { if (e.status === 403) throw e; return updateLocalItem('tasks', id, data); }),
  deleteTask: (id) => request(`/workspace/tasks/${id}`, { method: 'DELETE' }).catch((e) => { if (e.status === 403) throw e; return deleteLocalItem('tasks', id); }),

  // ─── Workspace Whiteboards ────────────────────────────────────────────────
  getWhiteboards: () => request('/workspace/whiteboard').catch((e) => { if (e.status === 403) throw e; return { success: true, data: getLocal('whiteboards', []) }; }),
  createWhiteboard: (data) => request('/workspace/whiteboard', { method: 'POST', body: JSON.stringify(data) }).catch((e) => { if (e.status === 403) throw e; return saveLocalItem('whiteboards', data); }),
  updateWhiteboard: (id, data) => request(`/workspace/whiteboard/${id}`, { method: 'PUT', body: JSON.stringify(data) }).catch((e) => { if (e.status === 403) throw e; return updateLocalItem('whiteboards', id, data); }),
  deleteWhiteboard: (id) => request(`/workspace/whiteboard/${id}`, { method: 'DELETE' }).catch((e) => { if (e.status === 403) throw e; return deleteLocalItem('whiteboards', id); }),

  // ─── Workspace Invitations & Shared ───────────────────────────────────────
  acceptInvite: (data) => request('/workspace/shared/invite/accept', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/workspace/shared/me'),
  getMyWorkspaces: () => request('/workspace/shared/my-workspaces'),
  initWorkspace: () => request('/workspace/shared/init', { method: 'POST' }),
  getAIGuidance: () => request('/workspace/shared/ai/guidance'),

  // ─── Workspace Admin ──────────────────────────────────────────────────────
  admin: {
    // User Management
    listUsers: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/workspace/admin/users${q ? '?' + q : ''}`);
    },
    addUser: (data) => request('/workspace/admin/users', { method: 'POST', body: JSON.stringify(data) }),
    modifyUser: (userId, data) => request(`/workspace/admin/users/${userId}`, { method: 'PUT', body: JSON.stringify(data) }),
    removeUser: (userId) => request(`/workspace/admin/users/${userId}`, { method: 'DELETE' }),
    resendInvite: (userId) => request(`/workspace/admin/users/${userId}/resend`, { method: 'POST' }),
    
    // Billing
    payBill: (data) => request('/workspace/admin/billing/pay', { method: 'POST', body: JSON.stringify(data) }),
    getBillingStatus: () => request('/workspace/admin/billing/status'),
    getBillingCreditHistory: () => request('/workspace/admin/billing/credit-history'),
    createOneTimeOrder: (data) => request('/workspace/admin/billing/one-time', { method: 'POST', body: JSON.stringify(data) }),
    createSubscription: (data) => request('/workspace/admin/billing/subscription', { method: 'POST', body: JSON.stringify(data) }),
    getSubscription: (id) => request(`/workspace/admin/billing/subscription/${id}`),
    cancelSubscription: (id, data) => request(`/workspace/admin/billing/subscription/${id}/cancel`, { method: 'POST', body: JSON.stringify(data || {}) }),
    pauseSubscription: (id) => request(`/workspace/admin/billing/subscription/${id}/pause`, { method: 'POST' }),
    resumeSubscription: (id) => request(`/workspace/admin/billing/subscription/${id}/resume`, { method: 'POST' }),
    verifyPayment: (data) => request('/workspace/admin/billing/verify', { method: 'POST', body: JSON.stringify(data) }),
    createBalanceOrder: (data) => request('/workspace/admin/billing/add-balance', { method: 'POST', body: JSON.stringify(data) }),
    verifyBalancePayment: (data) => request('/workspace/admin/billing/verify-balance', { method: 'POST', body: JSON.stringify(data) }),
    
    // Departments
    listDepartments: () => request('/workspace/admin/departments'),
    createDepartment: (data) => request('/workspace/admin/departments', { method: 'POST', body: JSON.stringify(data) }),
    deleteDepartment: (departmentId) => request(`/workspace/admin/departments/${departmentId}`, { method: 'DELETE' }),
    addPosition: (departmentId, data) => request(`/workspace/admin/departments/${departmentId}/positions`, { method: 'POST', body: JSON.stringify(data) }),
    
    // Apps
    listApps: () => request('/workspace/admin/apps'),
    toggleAppStatus: (appId, data) => request(`/workspace/admin/apps/${appId}/toggle`, { method: 'PUT', body: JSON.stringify(data) }),
    
    // Permissions
    listValidPermissions: () => request('/workspace/admin/permissions/list'),
    updateUserPermissions: (userId, data) => request(`/workspace/admin/permissions/users/${userId}`, { method: 'PUT', body: JSON.stringify(data) }),
    
    // Stats
    getStats: () => request('/workspace/admin/stats'),
    
    // Audit Logs
    getAuditLogs: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/workspace/admin/audit-logs${q ? '?' + q : ''}`);
    },
    exportAuditLogs: () => request('/workspace/admin/audit-logs/export', { method: 'POST' }),
    
    // Security
    getSecurityPolicies: () => request('/workspace/admin/security/policies'),
    updateSecurityPolicies: (data) => request('/workspace/admin/security/policies', { method: 'PUT', body: JSON.stringify(data) }),
    configureSSO: (data) => request('/workspace/admin/security/sso', { method: 'POST', body: JSON.stringify(data) }),
    
    // Groups
    listGroups: () => request('/workspace/admin/groups'),
    createGroup: (data) => request('/workspace/admin/groups', { method: 'POST', body: JSON.stringify(data) }),
    manageGroupMembers: (groupId, data) => request(`/workspace/admin/groups/${groupId}/members`, { method: 'POST', body: JSON.stringify(data) }),
    
    // Domains
    listDomains: () => request('/workspace/admin/domains'),
    addDomain: (data) => request('/workspace/admin/domains', { method: 'POST', body: JSON.stringify(data) }),
    verifyDomain: (domainName) => request(`/workspace/admin/domains/${domainName}/verify`, { method: 'POST' }),
    getDomainPolicy: () => request('/workspace/admin/domains/policy'),
    updateDomainPolicy: (data) => request('/workspace/admin/domains/policy', { method: 'PUT', body: JSON.stringify(data) })
  }
};
