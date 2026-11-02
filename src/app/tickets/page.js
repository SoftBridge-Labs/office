'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import TopNav from '@/app/components/TopNav';
import WorkspaceGreeting from '@/app/components/WorkspaceGreeting';
import PushNotificationManager from '@/app/ping/components/PushNotificationManager';
import { api } from '@/lib/api';
import { connectTicketSocket } from '@/lib/ticketSocket';
import styles from './tickets.module.css';

const STATUSES = ['open', 'pending', 'resolved'];
const statusClass = { open: 'open', pending: 'pending', resolved: 'resolved', archived: 'archived' };
const LAUNCHER_OPTIONS = [
  { value: 'fab', label: 'Floating button', icon: 'chat_bubble', description: 'Bottom-right support bubble' },
  { value: 'sidebar', label: 'Side tab', icon: 'side_navigation', description: 'Vertical tab on the screen edge' },
  { value: 'bottom-bar', label: 'Bottom bar', icon: 'bottom_panel', description: 'Full-width support prompt' },
  { value: 'inline', label: 'Inline button', icon: 'touch_app', description: 'Button beside your script tag' }
];
const ICON_OPTIONS = [
  { value: 'S', label: 'Lettermark' },
  { value: '✦', label: 'Spark' },
  { value: '?', label: 'Question' },
  { value: '☻', label: 'Smile' },
  { value: '✉', label: 'Envelope' },
  { value: '●', label: 'Dot' }
];

function responseItems(response) {
  if (Array.isArray(response)) return response;
  return response?.data?.tickets || response?.data || response?.tickets || [];
}

function responseItem(response) {
  return response?.data?.ticket || response?.data || response?.ticket || response;
}

function ticketId(ticket) {
  return ticket?._id || ticket?.id;
}

function customerLabel(customer) {
  if (!customer) return 'Customer';
  if (typeof customer === 'string') return customer;
  const value = customer.name || customer.email || customer.externalId;
  return typeof value === 'string' || typeof value === 'number' ? String(value) : 'Customer';
}

function customerEmail(customer, fallback) {
  if (customer && typeof customer === 'object') return customer.email || customer.externalId || customerLabel(customer);
  if (fallback && typeof fallback === 'object') return fallback.email || fallback.externalId || customerLabel(fallback);
  return typeof customer === 'string' || typeof customer === 'number'
    ? String(customer)
    : typeof fallback === 'string' || typeof fallback === 'number'
      ? String(fallback)
      : 'No email provided';
}

export default function TicketsPage({ initialTab = 'inbox' }) {
  const [userProfile] = useState(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('sb_user');
    try { return stored ? JSON.parse(stored) : null; } catch { return null; }
  });
  const [tab, setTab] = useState(initialTab);
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [filters, setFilters] = useState({ status: '', priority: '', assignedTo: '', search: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ externalId: '', email: '', name: '', subject: '', description: '' });
  const [reply, setReply] = useState('');
  const [aiDraft, setAiDraft] = useState({
    customSystemPrompt: '',
    serviceDescription: '',
    kbContextSnippets: '',
    escalationPolicy: '',
    triageGuidelines: ''
  });
  const [publicKey, setPublicKey] = useState('');
  const [launcherStyle, setLauncherStyle] = useState('fab');
  const [widgetTheme, setWidgetTheme] = useState({
    title: 'How can we help?',
    greeting: 'Send us a message and our team will get back to you.',
    color: '#287c68',
    width: '430',
    radius: '16',
    icon: 'S'
  });
  const [loading, setLoading] = useState(true);
  const [configLoading, setConfigLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [organizationName, setOrganizationName] = useState('Support');
  const [members, setMembers] = useState([]);
  const [emailUsage, setEmailUsage] = useState([]);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const assignedTo = filters.assignedTo === '__me__'
        ? (typeof window !== 'undefined' ? localStorage.getItem('sb_uid') || '' : '')
        : filters.assignedTo;
      const response = await api.getTickets({ status: filters.status, priority: filters.priority, assignedTo, limit: 100, offset: 0 });
      setTickets(responseItems(response));
    } catch (err) {
      setError(err.message || 'Unable to load tickets.');
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.priority, filters.assignedTo]);

  useEffect(() => {
    const timer = window.setTimeout(loadTickets, 0);
    return () => window.clearTimeout(timer);
  }, [loadTickets]);

  useEffect(() => {
    if (tab !== 'settings' && tab !== 'automation') return;
    let active = true;
    const loadConfig = async () => {
      setConfigLoading(true);
      try {
        const response = await api.getAiConfig();
        if (!active) return;
        const config = responseItem(response) || {};
        if (tab === 'settings' && !config.publicApiKey) {
          const generatedResponse = await api.generateTicketApiKey();
          const generatedConfig = responseItem(generatedResponse) || {};
          config.publicApiKey = generatedResponse.apiKey || generatedConfig.publicApiKey;
        }
        setPublicKey(config.publicApiKey || '');
        setOrganizationName(config.organizationName || 'Support');
        setLauncherStyle(config.widgetLauncherStyle || 'fab');
        setWidgetTheme({
          title: config.widgetTitle || 'How can we help?',
          greeting: config.widgetGreeting || 'Send us a message and our team will get back to you.',
          color: config.widgetColor || '#287c68',
          width: String(config.widgetWidth || 430),
          radius: String(config.widgetRadius || 16),
          icon: config.widgetIcon || 'S'
        });
        setAiDraft({
          customSystemPrompt: config.customSystemPrompt || '',
          serviceDescription: config.serviceDescription || '',
          kbContextSnippets: (config.kbContextSnippets || []).join('\n'),
          escalationPolicy: config.escalationPolicy || '',
          triageGuidelines: config.triageGuidelines || ''
        });
      } catch (err) {
        if (active) setError(err.message || 'Unable to load widget settings.');
      } finally {
        if (active) setConfigLoading(false);
      }
    };
    loadConfig();
    return () => { active = false; };
  }, [tab]);

  useEffect(() => {
    let active = true;
    Promise.allSettled([api.getTicketMembers(), api.getEmailUsage(100)]).then(([membersResult, usageResult]) => {
      if (!active) return;
      if (membersResult.status === 'fulfilled') setMembers(responseItems(membersResult.value));
      if (usageResult.status === 'fulfilled') setEmailUsage(responseItems(usageResult.value));
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selected) return undefined;
    return connectTicketSocket({
      ticketId: ticketId(selected),
      onEvent: event => {
        if (event.message) setMessages(current => current.some(item => item._id === event.message._id) ? current : [...current, event.message]);
        setSelected(current => current ? { ...current, status: event.status, updatedAt: event.updatedAt } : current);
        loadTickets();
      }
    });
  }, [selected, loadTickets]);

  const visibleTickets = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    if (!query) return tickets;
    return tickets.filter(ticket => [ticket.subject, ticket.summary, ticket.customer?.name, ticket.customer?.email].some(value => String(value || '').toLowerCase().includes(query)));
  }, [tickets, filters.search]);

  const counts = useMemo(() => Object.fromEntries(STATUSES.map(status => [status, tickets.filter(ticket => ticket.status === status).length])), [tickets]);

  const openTicket = async (ticket) => {
    setError('');
    try {
      const response = await api.getTicket(ticketId(ticket));
      const detail = responseItem(response);
      setSelected(detail);
      setMessages(detail.messages || []);
      if (!detail.messages) {
        const messageResponse = await api.getTicketMessages(ticketId(ticket));
        setMessages(responseItems(messageResponse));
      }
    } catch (err) {
      setError(err.message || 'Unable to load ticket details.');
    }
  };

  const createTicket = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const customer = await api.upsertCustomer({ externalId: form.externalId, email: form.email || undefined, name: form.name || undefined });
      const customerData = responseItem(customer);
      await api.createTicket({ customerId: customerData._id || customerData.id, subject: form.subject, description: form.description });
      setForm({ externalId: '', email: '', name: '', subject: '', description: '' });
      setShowCreate(false);
      await loadTickets();
    } catch (err) {
      setError(err.message || 'Unable to create ticket.');
    } finally {
      setSaving(false);
    }
  };

  const updateTicket = async (updates) => {
    if (!selected) return;
    setSaving(true);
    try {
      const response = await api.updateTicket(ticketId(selected), updates);
      const updated = responseItem(response);
      setSelected(current => ({ ...current, ...updated }));
      setTickets(current => current.map(ticket => ticketId(ticket) === ticketId(selected) ? { ...ticket, ...updated } : ticket));
    } catch (err) {
      setError(err.message || 'Unable to update ticket.');
    } finally {
      setSaving(false);
    }
  };

  const sendReply = async (event) => {
    event.preventDefault();
    if (!selected || !reply.trim()) return;
    setSaving(true);
    try {
      const response = await api.addTicketMessage(ticketId(selected), { body: reply.trim(), senderType: 'agent', isInternal: false });
      setMessages(current => [...current, responseItem(response)]);
      setReply('');
    } catch (err) {
      setError(err.message || 'Unable to send reply.');
    } finally {
      setSaving(false);
    }
  };

  const archiveSelected = async () => {
    if (!selected || !window.confirm('Archive this ticket?')) return;
    setSaving(true);
    try {
      await api.archiveTicket(ticketId(selected));
      setSelected(null);
      setMessages([]);
      await loadTickets();
    } catch (err) {
      setError(err.message || 'Unable to archive ticket.');
    } finally {
      setSaving(false);
    }
  };

  const rotatePublicKey = async () => {
    setSaving(true);
    setError('');
    try {
      const response = await api.generateTicketApiKey();
      const config = responseItem(response) || {};
      setPublicKey(response.apiKey || config.publicApiKey || '');
      setCopied(false);
    } catch (err) {
      setError(err.message || 'Unable to generate a new public key.');
    } finally {
      setSaving(false);
    }
  };

  const saveAiConfig = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await api.updateAiConfig({
        ...aiDraft,
        kbContextSnippets: aiDraft.kbContextSnippets.split('\n').map(item => item.trim()).filter(Boolean)
      });
      const savedConfig = responseItem(response) || {};
      setAiDraft(current => ({ ...current, kbContextSnippets: (savedConfig.kbContextSnippets || []).join('\n') }));
    } catch (err) {
      setError(err.message || 'Unable to save AI configuration.');
    } finally {
      setSaving(false);
    }
  };

  const copyEmbed = async () => {
    const organizationId = typeof window !== 'undefined' ? localStorage.getItem('sb_uid') || '' : '';
    const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('sb_workspace_id') || '' : '';
    const attributes = [
      ['data-organization-id', organizationId],
      ['data-workspace-id', workspaceId],
      ['data-public-key', publicKey],
      ['data-launcher-style', launcherStyle],
      ['data-widget-title', widgetTheme.title],
      ['data-widget-greeting', widgetTheme.greeting],
      ['data-widget-color', widgetTheme.color],
      ['data-widget-width', widgetTheme.width],
      ['data-widget-radius', widgetTheme.radius],
      ['data-widget-icon', widgetTheme.icon]
      ,['data-organization-name', organizationName]
    ].map(([name, value]) => `${name}="${String(value).replaceAll('"', '&quot;')}"`).join(' ');
    const snippet = `<script src="${window.location.origin}/widget/tickets.js" ${attributes}></script>`;
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const saveWidgetAppearance = async () => {
    setSaving(true);
    setError('');
    try {
      await api.updateAiConfig({
        widgetLauncherStyle: launcherStyle,
        widgetTitle: widgetTheme.title.trim() || 'How can we help?',
        widgetGreeting: widgetTheme.greeting.trim() || 'Send us a message and our team will get back to you.',
        widgetColor: widgetTheme.color,
        widgetWidth: Number(widgetTheme.width) || 430,
        widgetRadius: Number(widgetTheme.radius) || 16,
        widgetIcon: widgetTheme.icon || 'S'
      });
    } catch (err) {
      setError(err.message || 'Unable to save widget appearance.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <TopNav userProfile={userProfile} isLoggedOut={!userProfile} />
      <PushNotificationManager context="ticket" />
      <main className={styles.main}>
        <WorkspaceGreeting userProfile={userProfile} context="Tickets" />
        <div className={styles.hero}>
          <div>
            <div className={styles.eyebrow}>Customer support</div>
            <h1>Turn every question into a conversation.</h1>
            <p>Capture conversations from your website, keep your team in sync, and resolve customers faster.</p>
          </div>
          <div className={styles.heroActions}>
            <span className={styles.live}><i /> Support inbox live</span>
            <button className={styles.primaryButton} onClick={() => { setTab('inbox'); setShowCreate(true); }}>New ticket <b>+</b></button>
          </div>
        </div>

        <nav className={styles.tabs} aria-label="Ticket workspace sections">
          <Link className={tab === 'inbox' ? styles.activeTab : ''} href="/tickets"><span className="material-symbols-outlined">inbox</span>Inbox <em>{tickets.length}</em></Link>
          <Link className={tab === 'settings' ? styles.activeTab : ''} href="/tickets/install"><span className="material-symbols-outlined">code</span>Install widget</Link>
          <Link className={tab === 'automation' ? styles.activeTab : ''} href="/tickets/automation"><span className="material-symbols-outlined">auto_awesome</span>AI & automation</Link>
        </nav>

        {error && <div className={styles.error} role="alert"><span className="material-symbols-outlined">error</span>{error}<button onClick={() => setError('')}>×</button></div>}
        <div className={styles.usageBanner}>
          <span><strong>{emailUsage.filter(item => item.status === 'sent').length}</strong> support emails used</span>
          <span>Usage is recorded for end-of-day billing.</span>
          <Link href="/admin/billing">View credits and billing</Link>
        </div>

        {tab === 'inbox' && <section className={styles.inboxLayout}>
          <div className={styles.inboxColumn}>
            <div className={styles.inboxToolbar}>
              <div className={styles.inboxTitle}><h2>Inbox</h2><span>{visibleTickets.length} conversations</span></div>
              <div className={styles.searchBox}><span className="material-symbols-outlined">search</span><input aria-label="Search tickets" placeholder="Search conversations" value={filters.search} onChange={event => setFilters(current => ({ ...current, search: event.target.value }))} /></div>
              <div className={styles.filterRow}>
                <select aria-label="Filter by status" value={filters.status} onChange={event => setFilters(current => ({ ...current, status: event.target.value }))}><option value="">All statuses</option><option value="open">Open</option><option value="pending">Pending</option><option value="resolved">Resolved</option></select>
                <select aria-label="Filter by priority" value={filters.priority} onChange={event => setFilters(current => ({ ...current, priority: event.target.value }))}><option value="">All priorities</option><option value="urgent">Urgent</option><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select>
                <select aria-label="Filter by assignment" value={filters.assignedTo} onChange={event => setFilters(current => ({ ...current, assignedTo: event.target.value }))}><option value="">All assignments</option><option value="__me__">Assigned to Me</option><option value="unassigned">Unassigned</option>{members.map(member => <option key={member.uid || member.id} value={member.uid || member.id}>{member.name || member.email}</option>)}</select>
              </div>
            </div>
            <div className={styles.statRow}>{STATUSES.map(status => <div key={status} className={styles.stat}><strong>{counts[status]}</strong><span className={`${styles.dot} ${styles[statusClass[status]]}`} />{status}</div>)}</div>
            {showCreate && <form className={styles.createCard} onSubmit={createTicket}>
              <div className={styles.cardHeading}><div><span className={styles.sectionKicker}>Manual intake</span><h3>Create a customer ticket</h3></div><button type="button" className={styles.iconButton} onClick={() => setShowCreate(false)}>×</button></div>
              <div className={styles.formGrid}><input required placeholder="Customer ID *" value={form.externalId} onChange={event => setForm({ ...form, externalId: event.target.value })} /><input type="email" placeholder="Email address" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /><input placeholder="Customer name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></div>
              <input required placeholder="What can we help with? *" value={form.subject} onChange={event => setForm({ ...form, subject: event.target.value })} />
              <textarea required rows="3" placeholder="Describe the issue..." value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} />
              <button disabled={saving} className={styles.primaryButton} type="submit">{saving ? 'Creating...' : 'Create ticket'}</button>
            </form>}
            <div className={styles.ticketList}>
              {loading ? <div className={styles.emptyState}><span className="material-symbols-outlined">hourglass_top</span><p>Loading conversations...</p></div> : visibleTickets.length === 0 ? <div className={styles.emptyState}><span className="material-symbols-outlined">inbox</span><p>No conversations yet</p><small>New website conversations will appear here.</small></div> : visibleTickets.map(ticket => {
                const id = ticketId(ticket);
                return <button key={id} onClick={() => openTicket(ticket)} className={`${styles.ticketRow} ${selected && ticketId(selected) === id ? styles.selectedRow : ''}`}>
                  <div className={styles.avatar}>{customerLabel(ticket.customer).slice(0, 1).toUpperCase()}</div><div className={styles.ticketContent}><div className={styles.ticketTop}><strong>{customerLabel(ticket.customer)}</strong><time>{ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'New'}</time></div><h3>{ticket.subject || 'Untitled ticket'}</h3><p>{ticket.summary || ticket.description || 'No preview available'}</p><div className={styles.ticketMeta}><span className={`${styles.badge} ${styles[statusClass[ticket.status] || 'open']}`}>{ticket.status || 'open'}</span><span>{ticket.priority || 'normal'} priority</span>{ticket.assignedTo && <span>Assigned</span>}</div></div>
                </button>;
              })}</div>
          </div>
          {selected ? <section className={styles.conversation}>
            <header className={styles.conversationHeader}><div className={styles.customerHeader}><div className={`${styles.avatar} ${styles.large}`}>{customerLabel(selected.customer).slice(0, 1).toUpperCase()}</div><div><h2>{customerLabel(selected.customer)}</h2><p>{customerEmail(selected.customer, selected.customerId)}</p></div></div><div className={styles.conversationActions}><select aria-label="Update ticket status" value={selected.status || 'open'} disabled={saving} onChange={event => updateTicket({ status: event.target.value })}><option value="open">Open</option><option value="pending">Pending</option><option value="resolved">Resolved</option></select><select aria-label="Set ticket priority" value={selected.priority || 'normal'} disabled={saving} onChange={event => updateTicket({ priority: event.target.value })}><option value="low">Low priority</option><option value="normal">Normal priority</option><option value="high">High priority</option><option value="urgent">Urgent priority</option></select><select aria-label="Assign ticket" value={selected.assignedTo || ''} disabled={saving} onChange={event => updateTicket({ assignedTo: event.target.value || null })}><option value="">Unassigned</option>{members.map(member => <option key={member.uid || member.id} value={member.uid || member.id}>{member.name || member.email}</option>)}</select><button title="Archive ticket" onClick={archiveSelected}><span className="material-symbols-outlined">archive</span></button></div></header>
            <div className={styles.subjectBar}><div><span className={styles.sectionKicker}>Ticket conversation</span><h2>{selected.subject || 'Ticket'}</h2></div><span className={`${styles.badge} ${styles[statusClass[selected.status] || 'open']}`}>{selected.priority || 'normal'} priority</span></div>
            <div className={styles.messages}>{messages.length === 0 ? <div className={styles.emptyState}><span className="material-symbols-outlined">chat_bubble_outline</span><p>No messages yet</p></div> : messages.map((message, index) => <div key={message._id || message.id || index} className={`${styles.message} ${message.senderType === 'agent' || message.senderId === 'ai' ? styles.agentMessage : ''}`}><div className={styles.messageLabel}>{message.senderId === 'ai' ? 'AI support' : message.senderType === 'agent' ? 'You' : message.senderType || 'Customer'} {message.isInternal && <span>Internal note</span>}</div><div className={styles.messageBubble}>{message.body}</div></div>)}</div>
            <form className={styles.replyBox} onSubmit={sendReply}><textarea required rows="3" placeholder="Reply to customer..." value={reply} onChange={event => setReply(event.target.value)} /><div><span>↵ Send with Enter</span><button disabled={saving} className={styles.primaryButton} type="submit"><span className="material-symbols-outlined">send</span>Send reply</button></div></form>
          </section> : <section className={styles.noConversation}><span className="material-symbols-outlined">forum</span><h2>Select a conversation</h2><p>Choose a customer conversation from your inbox to read the thread and reply.</p></section>}
        </section>}

        {tab === 'settings' && <section className={styles.settingsLayout}>
          <div className={styles.settingsIntro}><span className={styles.sectionKicker}>Widget studio</span><h2>Build a support experience that feels like your product.</h2><p>Choose the launcher, tune the appearance, and copy one installation snippet. Your customers get a full-size, focused support form on every screen.</p><div className={styles.installSteps}><div><b>01</b><span>Configure</span><small>Choose the look and launcher.</small></div><div><b>02</b><span>Save</span><small>Keep your settings on the workspace.</small></div><div><b>03</b><span>Install</span><small>Paste the snippet before &lt;/body&gt;.</small></div></div></div>
          <div className={styles.settingsCard}><div className={styles.cardHeading}><div><span className={styles.sectionKicker}>Installation</span><h3>Connect your website</h3></div><span className={styles.connected}><i />{configLoading ? 'Loading key' : publicKey ? 'Ready' : 'Unavailable'}</span></div><label>Public API key<input readOnly value={publicKey} placeholder={configLoading ? 'Loading workspace key...' : 'No key returned by server'} /></label><p className={styles.helpText}>Your key is tenant-scoped and safe to use in the public embed snippet.</p><div className={styles.keyActions}><button type="button" disabled={saving || configLoading} onClick={rotatePublicKey} className={styles.secondaryButton}>{saving ? 'Generating...' : 'Generate new key'}</button></div><div className={styles.launcherHeading}><span>Launcher style</span><small>How should customers open support?</small></div><div className={styles.launcherGrid}>{LAUNCHER_OPTIONS.map(option => <button type="button" key={option.value} className={`${styles.launcherOption} ${launcherStyle === option.value ? styles.launcherSelected : ''}`} onClick={() => setLauncherStyle(option.value)}><strong>{option.label}</strong><small>{option.description}</small></button>)}</div><div className={styles.launcherHeading}><span>Widget appearance</span><small>Make it match your brand.</small></div><div className={styles.customizationGrid}><label>Title<input value={widgetTheme.title} onChange={event => setWidgetTheme({ ...widgetTheme, title: event.target.value })} /></label><label>Greeting<input value={widgetTheme.greeting} onChange={event => setWidgetTheme({ ...widgetTheme, greeting: event.target.value })} /></label><label>Accent color<input type="color" value={widgetTheme.color} onChange={event => setWidgetTheme({ ...widgetTheme, color: event.target.value })} /></label><label>Panel width<input type="number" min="320" max="640" value={widgetTheme.width} onChange={event => setWidgetTheme({ ...widgetTheme, width: event.target.value })} /></label><label>Corner radius<input type="number" min="0" max="32" value={widgetTheme.radius} onChange={event => setWidgetTheme({ ...widgetTheme, radius: event.target.value })} /></label></div><div className={styles.iconHeading}><span>Support icon</span><small>Select the icon shown in the widget.</small></div><div className={styles.iconGrid}>{ICON_OPTIONS.map(option => <button type="button" key={option.value} aria-label={option.label} className={`${styles.iconOption} ${widgetTheme.icon === option.value ? styles.iconSelected : ''}`} onClick={() => setWidgetTheme({ ...widgetTheme, icon: option.value })}><b>{option.value}</b><span>{option.label}</span></button>)}</div><button type="button" disabled={saving} onClick={saveWidgetAppearance} className={styles.saveAppearance}>{saving ? 'Saving...' : 'Save appearance'}</button><div className={styles.codeBlock}><div><span>Embed this on your website</span><button disabled={!publicKey} onClick={copyEmbed}><span className="material-symbols-outlined">{copied ? 'check' : 'content_copy'}</span>{copied ? 'Copied' : 'Copy code'}</button></div><pre>{`<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget/tickets.js"\n  data-organization-id="${typeof window !== 'undefined' ? localStorage.getItem('sb_uid') || 'your-firebase-uid' : 'your-firebase-uid'}"\n  data-public-key="${publicKey || 'your-public-key'}"\n  data-launcher-style="${launcherStyle}"\n  data-widget-icon="${widgetTheme.icon}"></script>`}</pre></div><a className={styles.previewLink} href="/widget/tickets" target="_blank" rel="noreferrer">Preview customer widget <span>↗</span></a></div>
        </section>}

        {tab === 'automation' && <form className={styles.automationCard} onSubmit={saveAiConfig}><div className={styles.automationHero}><span className="material-symbols-outlined">auto_awesome</span><div><span className={styles.sectionKicker}>AI assistance</span><h2>Configure how AI helps your customers.</h2><p>These instructions power customer deflection, ticket triage, and agent summaries. Keep them specific to your product and escalation process.</p></div></div><div className={styles.aiForm}><label>Service description<textarea rows="3" placeholder="What does your company or product do?" value={aiDraft.serviceDescription} onChange={event => setAiDraft({ ...aiDraft, serviceDescription: event.target.value })} /></label><label>Customer-facing system prompt<textarea rows="4" placeholder="Be concise, friendly, and..." value={aiDraft.customSystemPrompt} onChange={event => setAiDraft({ ...aiDraft, customSystemPrompt: event.target.value })} /></label><label>Knowledge base snippets<textarea rows="4" placeholder="One fact per line, such as: Password resets are available in Settings." value={aiDraft.kbContextSnippets} onChange={event => setAiDraft({ ...aiDraft, kbContextSnippets: event.target.value })} /></label><div className={styles.aiTwoCol}><label>Escalation policy<textarea rows="4" placeholder="When should AI hand off to an agent?" value={aiDraft.escalationPolicy} onChange={event => setAiDraft({ ...aiDraft, escalationPolicy: event.target.value })} /></label><label>Triage guidelines<textarea rows="4" placeholder="How should urgency and categories be assigned?" value={aiDraft.triageGuidelines} onChange={event => setAiDraft({ ...aiDraft, triageGuidelines: event.target.value })} /></label></div></div><div className={styles.automationFooter}><span>Changes apply to new AI requests immediately.</span><button disabled={saving} className={styles.primaryButton} type="submit">{saving ? 'Saving...' : 'Save AI configuration'} <span className="material-symbols-outlined">save</span></button></div></form>}
      </main>
    </div>
  );
}
