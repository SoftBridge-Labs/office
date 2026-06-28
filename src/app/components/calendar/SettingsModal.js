'use client';

import { useEffect, useState } from 'react';

const inputStyle = {
  width: '100%',
  padding: '0.65rem 0.75rem',
  border: '1px solid var(--border, #e2e8f0)',
  borderRadius: '8px',
  background: 'var(--bg-muted, #f8fafc)',
  fontSize: '0.875rem',
  color: 'var(--text-primary, #0f172a)',
  transition: 'border-color 0.15s, background 0.15s',
  outline: 'none'
};

const focusHandlers = {
  onFocus: e => {
    e.target.style.borderColor = 'var(--brand, #6366f1)';
    e.target.style.background = '#fff';
    e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
  },
  onBlur: e => {
    e.target.style.borderColor = 'var(--border, #e2e8f0)';
    e.target.style.background = 'var(--bg-muted, #f8fafc)';
    e.target.style.boxShadow = 'none';
  },
};

function Spinner({ size = 14, color = '#ffffff' }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes modalSpin { to { transform: rotate(360deg); } }
      `}} />
      <span style={{
        width: `${size}px`, height: `${size}px`,
        border: `2px solid rgba(255,255,255,0.3)`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'modalSpin 0.7s linear infinite',
        display: 'inline-block',
        verticalAlign: 'middle',
        marginRight: '6px',
        flexShrink: 0
      }} />
    </>
  );
}

export default function SettingsModal({
  open,
  initialTab = 'calendars',
  onClose,
  data = {},
  handlers = {}
}) {
  const [activeTab, setActiveTab] = useState('booking');
  const [calLoading, setCalLoading] = useState(false);
  const [schedLoading, setSchedLoading] = useState(false);
  const [teamLoading, setTeamLoading] = useState(false);
  const [memberLoadingTeamId, setMemberLoadingTeamId] = useState(null);

  useEffect(() => {
    if (open) {
      const normalized = (initialTab === 'teams') ? 'teams' : 'booking';
      setActiveTab(normalized);
    }
  }, [open, initialTab]);

  if (!open) return null;

  const {
    calendars = [], schedulingLinks = [], teams = [],
    calName = '', calEmail = '', calProvider = 'google', setCalName, setCalEmail, setCalProvider,
    schedSlug = '', schedTitle = '', schedDesc = '', schedDuration = 15, schedBuffer = 5, schedLimit = 5,
    schedVideoProvider = 'softbridge-meet', customMeetUrl = '', schedMeetingType = 'one-on-one', selectedTeamId = '', schedMemberUids = '',
    schedOverrides = [], overrideDate = '', overrideStart = '09:00', overrideEnd = '17:00',
    setSchedSlug, setSchedTitle, setSchedDesc, setSchedDuration, setSchedBuffer, setSchedLimit,
    setSchedVideoProvider, setCustomMeetUrl, setSchedMeetingType, setSelectedTeamId, setSchedMemberUids,
    setOverrideDate, setOverrideStart, setOverrideEnd,
    newTeamName = '', setNewTeamName, teamMemberUid = '', setTeamMemberUid, teamMemberRole = 'member', setTeamMemberRole,
  } = data;

  const {
    onAddCalendar, onDeleteCalendar, onAddSchedulingLink, onDeleteSched,
    onCreateTeam, onAddTeamMember, onRemoveTeamMember, onDeleteTeam,
    onAddOverride, onRemoveOverride
  } = handlers;

  const handleCalSubmit = async (e) => {
    e.preventDefault();
    setCalLoading(true);
    try { await onAddCalendar(e); } finally { setCalLoading(false); }
  };

  const handleSchedSubmit = async (e) => {
    e.preventDefault();
    setSchedLoading(true);
    try { await onAddSchedulingLink(e); } finally { setSchedLoading(false); }
  };

  const handleTeamSubmit = async (e) => {
    e.preventDefault();
    setTeamLoading(true);
    try { await onCreateTeam(e); } finally { setTeamLoading(false); }
  };

  const handleAddMemberSubmit = async (teamId) => {
    setMemberLoadingTeamId(teamId);
    try { await onAddTeamMember(teamId); } finally { setMemberLoadingTeamId(null); }
  };

  const tabs = [
    { id: 'booking', label: 'Booking Links', icon: 'link' },
    { id: 'teams', label: 'Teams & Orgs', icon: 'group' },
  ];

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div style={{
        background: 'var(--bg-surface, #ffffff)',
        borderRadius: '16px',
        width: '100%', maxWidth: '720px',
        maxHeight: '90vh',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        animation: 'slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
        border: '1px solid var(--border, #e2e8f0)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border, #e2e8f0)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--brand, #6366f1)' }}>settings</span>
            Workspace Settings
          </h3>
          <button onClick={onClose} style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted, #64748b)', fontSize: '1.25rem', border: 'none', background: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover, #f1f5f9)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >×</button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border, #e2e8f0)', background: 'var(--bg-muted, #f8fafc)', padding: '0 1rem' }}>
          {tabs.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '1rem 1.25rem',
                  border: 'none', background: 'none',
                  borderBottom: active ? '2px solid var(--brand, #6366f1)' : '2px solid transparent',
                  color: active ? 'var(--brand, #6366f1)' : 'var(--text-secondary, #475569)',
                  fontWeight: active ? 600 : 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panel */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          
          {/* Calendars tab removed */}

          {/* 2. Booking Links Tab */}
          {activeTab === 'booking' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>Active Scheduling Links</h4>
                {schedulingLinks.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', italic: true }}>No scheduling links configured.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {schedulingLinks.map(link => (
                      <div key={link.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-muted, #f8fafc)', border: '1px solid var(--border, #e2e8f0)', borderRadius: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{link.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/{link.slug} • {link.duration} mins</div>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            title="Open in new tab"
                            onClick={() => window.open(`/booking/${link.slug}`, '_blank')}
                            style={{ border: 'none', background: 'none', color: 'var(--brand, #6366f1)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '6px', borderRadius: '4px' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--brand-subtle, #eef2ff)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>open_in_new</span>
                          </button>
                          <button
                            type="button"
                            title="Copy link"
                            onClick={() => {
                              const url = window.location.origin + `/booking/${link.slug}`;
                              navigator.clipboard.writeText(url);
                              alert('Link copied to clipboard!');
                            }}
                            style={{ border: 'none', background: 'none', color: 'var(--text-secondary, #475569)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '6px', borderRadius: '4px' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover, #f1f5f9)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>content_copy</span>
                          </button>
                          <button
                            type="button"
                            title="Delete link"
                            onClick={() => onDeleteSched(link.id)}
                            style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '6px', borderRadius: '4px' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border, #e2e8f0)' }} />

              <form onSubmit={handleSchedSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Create Scheduling Link</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem' }}>Link Slug</label>
                    <input style={inputStyle} {...focusHandlers} type="text" placeholder="e.g. 15-min-sync" value={schedSlug} onChange={e => setSchedSlug(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem' }}>Event Title</label>
                    <input style={inputStyle} {...focusHandlers} type="text" placeholder="e.g. Quick Sync Call" value={schedTitle} onChange={e => setSchedTitle(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem' }}>Description</label>
                  <textarea style={{ ...inputStyle, resize: 'vertical' }} {...focusHandlers} rows="2" placeholder="e.g. Let's sync up regarding workspace features..." value={schedDesc} onChange={e => setSchedDesc(e.target.value)} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem' }}>Duration (mins)</label>
                    <input style={inputStyle} type="number" min="5" max="1440" value={schedDuration} onChange={e => setSchedDuration(parseInt(e.target.value) || 15)} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem' }}>Buffer Time (mins)</label>
                    <input style={inputStyle} type="number" min="0" max="120" value={schedBuffer} onChange={e => setSchedBuffer(parseInt(e.target.value) || 0)} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem' }}>Daily Limit</label>
                    <input style={inputStyle} type="number" min="1" max="100" value={schedLimit} onChange={e => setSchedLimit(parseInt(e.target.value) || 5)} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem' }}>Meeting Type</label>
                    <select style={inputStyle} value={schedMeetingType} onChange={e => setSchedMeetingType(e.target.value)}>
                      <option value="one-on-one">One-on-One</option>
                      <option value="collective">Collective (Joint)</option>
                      <option value="round-robin">Round Robin</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem' }}>Video Provider</label>
                    <select style={inputStyle} value={schedVideoProvider} onChange={e => setSchedVideoProvider(e.target.value)}>
                      <option value="softbridge-meet">SoftBridge Meet</option>
                      <option value="google-meet">Google Meet</option>
                      <option value="custom">Custom Meeting Link</option>
                    </select>
                  </div>
                </div>

                {schedVideoProvider === 'custom' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem' }}>Custom Meeting URL</label>
                    <input style={inputStyle} {...focusHandlers} type="url" placeholder="https://zoom.us/j/..." value={customMeetUrl} onChange={e => setCustomMeetUrl(e.target.value)} required />
                  </div>
                )}

                {schedMeetingType !== 'one-on-one' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem' }}>Select Team</label>
                      <select style={inputStyle} value={selectedTeamId} onChange={e => setSelectedTeamId(e.target.value)}>
                        <option value="">— Select a Team —</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem' }}>Members (Comma separated UIDs)</label>
                      <input style={inputStyle} {...focusHandlers} type="text" placeholder="uid_1, uid_2" value={schedMemberUids} onChange={e => setSchedMemberUids(e.target.value)} />
                    </div>
                  </div>
                )}

                {/* Overrides form */}
                <div style={{ background: 'var(--bg-muted, #f8fafc)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border, #e2e8f0)', marginTop: '0.5rem' }}>
                  <h5 style={{ fontWeight: 600, fontSize: '0.825rem', marginBottom: '0.5rem' }}>Date Overrides</h5>
                  {schedOverrides.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      {schedOverrides.map((ov, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', border: '1px solid var(--border, #e2e8f0)', padding: '2px 8px', borderRadius: '16px', fontSize: '0.75rem' }}>
                          <span>{ov.date}: {ov.startTime}-{ov.endTime}</span>
                          <button type="button" onClick={() => onRemoveOverride(index)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', fontWeight: 'bold' }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'end' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.2rem' }}>Date</label>
                      <input style={{ ...inputStyle, padding: '0.4rem' }} type="date" value={overrideDate} onChange={e => setOverrideDate(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.2rem' }}>Start</label>
                      <input style={{ ...inputStyle, padding: '0.4rem' }} type="time" value={overrideStart} onChange={e => setOverrideStart(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.2rem' }}>End</label>
                      <input style={{ ...inputStyle, padding: '0.4rem' }} type="time" value={overrideEnd} onChange={e => setOverrideEnd(e.target.value)} />
                    </div>
                    <button type="button" onClick={onAddOverride} style={{ padding: '0.5rem 0.75rem', background: 'var(--brand, #6366f1)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                      Add
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={schedLoading} style={{ alignSelf: 'flex-start', padding: '0.6rem 1.25rem', background: 'var(--text-primary, #0f172a)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', opacity: schedLoading ? 0.7 : 1 }}>
                  {schedLoading && <Spinner />}
                  Create Booking Link
                </button>
              </form>
            </div>
          )}

          {/* 3. Teams Tab */}
          {activeTab === 'teams' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>Your Teams</h4>
                {teams.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', italic: true }}>You are not in any teams.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {teams.map(team => (
                      <div key={team.id} style={{ padding: '1rem', background: 'var(--bg-muted, #f8fafc)', border: '1px solid var(--border, #e2e8f0)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{team.name}</span>
                          <button
                            onClick={() => onDeleteTeam(team.id)}
                            style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '4px' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>delete</span>
                          </button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.75rem' }}>
                          {team.members && team.members.map(member => (
                            <div key={member.user_uid || member.uid || member.email} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.775rem', background: '#fff', padding: '4px 8px', borderRadius: '4px', border: '1px dashed var(--border, #e2e8f0)' }}>
                              <span>{member.email || member.user_uid || member.uid} ({member.role})</span>
                              <button onClick={() => onRemoveTeamMember(team.id, member.user_uid || member.uid)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                            </div>
                          ))}
                        </div>

                        {/* Add member form */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr auto', gap: '0.5rem', alignItems: 'end' }}>
                          <div>
                            <input
                              style={{ ...inputStyle, padding: '0.4rem' }}
                              type="text"
                              placeholder="Member email or UID"
                              value={selectedTeamId === team.id ? teamMemberUid : ''}
                              onChange={e => {
                                setSelectedTeamId(team.id);
                                setTeamMemberUid(e.target.value);
                              }}
                            />
                          </div>
                          <div>
                            <select
                              style={{ ...inputStyle, padding: '0.4rem' }}
                              value={selectedTeamId === team.id ? teamMemberRole : 'member'}
                              onChange={e => {
                                setSelectedTeamId(team.id);
                                setTeamMemberRole(e.target.value);
                              }}
                            >
                              <option value="member">Member</option>
                              <option value="editor">Editor</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            disabled={memberLoadingTeamId === team.id}
                            onClick={() => handleAddMemberSubmit(team.id)}
                            style={{ padding: '0.45rem 0.75rem', background: 'var(--brand, #6366f1)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.775rem', fontWeight: 600, cursor: 'pointer', opacity: memberLoadingTeamId === team.id ? 0.7 : 1 }}
                          >
                            {memberLoadingTeamId === team.id ? <Spinner size={10} /> : 'Add'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border, #e2e8f0)' }} />

              <form onSubmit={handleTeamSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Create New Team</h4>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem' }}>Team Name</label>
                  <input style={inputStyle} {...focusHandlers} type="text" placeholder="e.g. Product Marketing" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} required />
                </div>
                <button type="submit" disabled={teamLoading} style={{ alignSelf: 'flex-start', padding: '0.6rem 1.25rem', background: 'var(--text-primary, #0f172a)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', opacity: teamLoading ? 0.7 : 1 }}>
                  {teamLoading && <Spinner />}
                  Create Team
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
