'use client';

import React from 'react';
import { usePingContext } from '../context/PingContext';

const Icon = ({ name, size = 20, className = '', style = {}, ...props }) => (
  <span className={`material-symbols-outlined ${className}`} style={{ fontSize: size, ...style }} {...props}>{name}</span>
);

export default function PingRightPanel() {
  const {
    showRightPanel, setShowRightPanel,
    activeChannel,
    workspaceUsers,
    inviteTab, setInviteTab,
    userSearch, setUserSearch,
    selectedDept, setSelectedDept,
    departments,
    handleInviteUser, handleInviteDept,
    handleCopyLink, copySuccess
  } = usePingContext();

  if (!showRightPanel) return null;

  return (
    <div style={{ 
      width: '320px', 
      background: '#ffffff', 
      borderLeft: '1px solid #e5e7eb', 
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: 0 }}>Details</h2>
        <Icon name="close" size={20} style={{ color: '#6b7280', cursor: 'pointer' }} onClick={() => setShowRightPanel(false)} />
      </div>
      
      {activeChannel && (
        <div>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827', marginBottom: '1rem', marginTop: 0 }}>Main info</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
              <div style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="person" size={16} /> Creator</div>
              <div style={{ color: '#111827', fontWeight: 500 }}>
                {(() => {
                  const creator = workspaceUsers.find(u => (u.uid || u._id) === activeChannel.createdBy);
                  return creator ? creator.name : 'Unknown';
                })()}
              </div>
            </div>
            {activeChannel.createdAt && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
                <div style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="event" size={16} /> Created on</div>
                <div style={{ color: '#111827', fontWeight: 500 }}>{new Date(activeChannel.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
              <div style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="lock" size={16} /> Privacy</div>
              {activeChannel.isPrivate ? (
                <div style={{ background: '#fef2f2', color: '#991b1b', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Icon name="lock" size={12} /> Private</div>
              ) : (
                <div style={{ background: '#f0fdf4', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Icon name="public" size={12} /> Public</div>
              )}
            </div>
          </div>

          {activeChannel.description && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>Topic</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#4b5563', lineHeight: 1.6 }}>
                {activeChannel.description}
              </p>
            </div>
          )}

          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Users <span style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563' }}>{activeChannel.members?.length || 0}</span>
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {activeChannel.members?.slice(0,4).map((m, i) => {
                const u = workspaceUsers.find(wu => wu.uid === m.uid);
                return (
                  <div key={i} style={{ position: 'relative', height: '120px', borderRadius: '12px', overflow: 'hidden', background: '#f3f4f6' }}>
                    {u?.avatar_url ? (
                      <img src={u.avatar_url} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', color: '#9ca3af' }}>{u?.name?.charAt(0) || 'U'}</div>
                    )}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', padding: '16px 8px 8px 8px', color: '#fff' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u?.name || 'User'}</div>
                      <div style={{ fontSize: '0.65rem', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u?.email || 'email@hidden'}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <button style={{ width: '100%', padding: '8px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginTop: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
              <Icon name="group" size={16} /> Show all users
            </button>
          </div>

          {activeChannel.type !== 'direct' && (
            <div style={{ marginTop: '1.5rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="person_add" size={18} /> Add members
              </h3>
              
              <div style={{ display: 'flex', gap: '4px', marginBottom: '1rem', background: '#e5e7eb', padding: '4px', borderRadius: '8px' }}>
                <button onClick={() => setInviteTab('user')} style={{ flex: 1, padding: '4px 0', border: 'none', background: inviteTab === 'user' ? '#fff' : 'transparent', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, color: inviteTab === 'user' ? '#111827' : '#6b7280', cursor: 'pointer', boxShadow: inviteTab === 'user' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}>User</button>
                <button onClick={() => setInviteTab('dept')} style={{ flex: 1, padding: '4px 0', border: 'none', background: inviteTab === 'dept' ? '#fff' : 'transparent', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, color: inviteTab === 'dept' ? '#111827' : '#6b7280', cursor: 'pointer', boxShadow: inviteTab === 'dept' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}>Dept</button>
                <button onClick={() => setInviteTab('link')} style={{ flex: 1, padding: '4px 0', border: 'none', background: inviteTab === 'link' ? '#fff' : 'transparent', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, color: inviteTab === 'link' ? '#111827' : '#6b7280', cursor: 'pointer', boxShadow: inviteTab === 'link' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}>Link</button>
              </div>

              {inviteTab === 'user' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                  />
                  <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {workspaceUsers.filter(u => u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase())).slice(0,5).map(u => (
                      <div key={u.uid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '6px', borderRadius: '6px', border: '1px solid #f3f4f6' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                        <button onClick={() => handleInviteUser(u.uid)} disabled={activeChannel.members?.some(m => m.uid === u.uid)} style={{ border: 'none', background: activeChannel.members?.some(m => m.uid === u.uid) ? '#e5e7eb' : '#111827', color: activeChannel.members?.some(m => m.uid === u.uid) ? '#9ca3af' : '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: activeChannel.members?.some(m => m.uid === u.uid) ? 'default' : 'pointer' }}>
                          {activeChannel.members?.some(m => m.uid === u.uid) ? 'Added' : 'Add'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {inviteTab === 'dept' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}>
                    <option value="">Select a department...</option>
                    {departments?.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <button onClick={handleInviteDept} disabled={!selectedDept} style={{ width: '100%', padding: '6px 10px', border: 'none', background: selectedDept ? '#111827' : '#e5e7eb', color: selectedDept ? '#fff' : '#9ca3af', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 500, cursor: selectedDept ? 'pointer' : 'default' }}>Add All</button>
                </div>
              )}

              {inviteTab === 'link' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: 1.4 }}>Anyone with this link can join the channel.</div>
                  <button onClick={handleCopyLink} style={{ width: '100%', padding: '6px 10px', border: '1px solid #e5e7eb', background: copySuccess ? '#f0fdf4' : '#fff', color: copySuccess ? '#166534' : '#374151', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}>
                    <Icon name={copySuccess ? 'check' : 'link'} size={16} /> {copySuccess ? 'Copied!' : 'Copy Invite Link'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
