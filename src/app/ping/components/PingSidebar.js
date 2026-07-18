'use client';

import React from 'react';
import { usePingContext } from '../context/PingContext';
import AppSwitcher from '../../components/AppSwitcher';

const Icon = ({ name, size = 20, className = '', style = {}, ...props }) => (
  <span className={`material-symbols-outlined ${className}`} style={{ fontSize: size, ...style }} {...props}>{name}</span>
);

export default function PingSidebar() {
  const {
    channels,
    loading,
    userProfile,
    activeChannelId, setActiveChannelId,
    showCreateModal, setShowCreateModal,
    showDMModal, setShowDMModal,
    presenceDropdown, setPresenceDropdown,
    channelSearch, setChannelSearch,
    workspaceUsers,
    isConnected, presenceData,
    handleDeleteChannel, handlePresenceUpdate,
    router
  } = usePingContext();

  return (
    <>
    <style>{`
      @media (max-width: 768px) {
        .ping-sidebar {
          display: ${activeChannelId ? 'none' : 'flex'} !important;
          width: 100% !important;
          border-right: none !important;
          padding: 1rem !important;
        }
        .ping-sidebar-header {
          margin-bottom: 1.5rem !important;
        }
        .ping-search-input {
          padding: 12px 16px !important;
          font-size: 1rem !important;
        }
        .ping-channel-item {
          padding: 12px 12px !important;
          font-size: 1rem !important;
          border-radius: 8px !important;
        }
        .ping-section-title {
          font-size: 1rem !important;
          margin-bottom: 0.75rem !important;
        }
        .ping-add-btn {
          font-size: 0.85rem !important;
          padding: 8px !important;
        }
      }
    `}</style>
    <div className="ping-sidebar" style={{ 
      width: '280px', 
      background: '#ffffff', 
      borderRight: '1px solid #eaeaea', 
      display: 'flex', 
      flexDirection: 'column',
      padding: '1.5rem',
      zIndex: 10,
      flexShrink: 0
    }}>
      {/* Ping App Header */}
      <div className="ping-sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => router.push('/home')}>
          <div style={{ width: 36, height: 36, borderRadius: '10px', background: '#fce4ec', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E91E63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>Ping</div>
            <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 500 }}>Workspace Chat</div>
          </div>
        </div>
        <AppSwitcher />
      </div>

      {/* Search Channels */}
      <div style={{ marginBottom: '1rem' }}>
        <input 
          type="text" 
          className="ping-search-input"
          placeholder="Search channels..." 
          value={channelSearch}
          onChange={(e) => setChannelSearch(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #eaeaea', background: '#f8f9fa', fontSize: '0.85rem' }}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Channels */}
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Channels Section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', padding: '0 4px' }}>
                <div className="ping-section-title" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>Channels</div>
                <button className="ping-add-btn" onClick={() => setShowCreateModal(true)} style={{ background: 'transparent', border: 'none', color: '#1a73e8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '2px' }} title="Create new group">
                  <Icon name="add" size={16} /> New Group
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {loading ? (
                  <div style={{ color: '#5f6368', fontSize: '0.85rem', padding: '0 12px' }}>Loading...</div>
                ) : channels.filter(c => c.type !== 'direct' && c.name.toLowerCase().includes(channelSearch.toLowerCase())).length === 0 ? (
                  <div style={{ color: '#5f6368', fontSize: '0.85rem', padding: '0 12px' }}>No channels found.</div>
                ) : (
                  channels.filter(c => c.type !== 'direct' && c.name.toLowerCase().includes(channelSearch.toLowerCase())).map(conv => {
                    const id = conv._id || conv.id;
                    const isActive = activeChannelId === id;
                    const isJoined = userProfile && conv.members?.some(m => m.uid === userProfile.uid);
                    
                    return (
                      <div 
                        key={id}
                        className="conv-item ping-channel-item"
                        onClick={() => setActiveChannelId(id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '6px 8px', borderRadius: '6px',
                          cursor: 'pointer',
                          background: isActive ? '#f3f4f6' : 'transparent',
                          color: isActive ? '#111827' : (isJoined ? '#374151' : '#9ca3af'),
                          opacity: isJoined ? 1 : 0.7
                        }}
                      >
                        <Icon name={conv.isPrivate ? "lock" : "tag"} size={16} style={{ color: isActive ? '#111827' : '#9ca3af' }} />
                        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.9rem', fontWeight: isActive ? 600 : 500 }}>{conv.name}</span>
                        
                        {!isJoined && (
                          <span style={{ fontSize: '0.65rem', background: '#e5e7eb', color: '#374151', padding: '2px 6px', borderRadius: '12px', fontWeight: 600 }}>JOIN</span>
                        )}
                        {isJoined && conv.unreadCount > 0 && (
                          <span style={{ fontSize: '0.65rem', background: '#E91E63', color: '#ffffff', padding: '2px 6px', borderRadius: '12px', fontWeight: 700 }}>{conv.unreadCount}</span>
                        )}

                        {isJoined && conv.members?.find(m => m.uid === userProfile?.uid)?.role === 'owner' && (
                          <div className="delete-conv-btn" onClick={(e) => handleDeleteChannel(id, e)} style={{ opacity: isActive ? 0.7 : 0, transition: 'opacity 0.2s', padding: '2px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <Icon name="delete" size={16} />
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Direct Messages Section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', padding: '0 4px', marginTop: '1rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>Direct me</div>
                <button onClick={() => setShowDMModal(true)} style={{ background: 'transparent', border: 'none', color: '#1a73e8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '2px' }} title="Start new 1-1 chat">
                  <Icon name="add" size={16} /> New Chat
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {loading ? (
                  <div style={{ color: '#5f6368', fontSize: '0.85rem', padding: '0 12px' }}>Loading...</div>
                ) : channels.filter(c => c.type === 'direct' && c.name.toLowerCase().includes(channelSearch.toLowerCase())).length === 0 ? (
                  <div style={{ color: '#5f6368', fontSize: '0.85rem', padding: '0 12px' }}>No direct messages found.</div>
                ) : (
                  channels.filter(c => c.type === 'direct' && c.name.toLowerCase().includes(channelSearch.toLowerCase())).map(conv => {
                    const id = conv._id || conv.id;
                    const isActive = activeChannelId === id;
                    
                    const otherMember = conv.members?.find(m => m.uid !== userProfile?.uid);
                    const otherUid = otherMember ? otherMember.uid : userProfile?.uid;
                    const presence = presenceData[otherUid];
                    
                    // Find user details for avatar
                    const otherUserObj = workspaceUsers.find(u => u.uid === otherUid);
                    
                    return (
                      <div 
                        key={id}
                        className="conv-item ping-channel-item"
                        onClick={() => setActiveChannelId(id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '6px 8px', borderRadius: '6px',
                          cursor: 'pointer',
                          background: isActive ? '#f3f4f6' : 'transparent',
                          color: isActive ? '#111827' : '#374151'
                        }}
                      >
                        <div style={{ position: 'relative', width: 24, height: 24 }}>
                          <div style={{ width: 24, height: 24, borderRadius: '6px', background: '#e5e7eb', color: '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem', overflow: 'hidden' }}>
                            {otherUserObj?.avatar_url ? (
                              <img src={otherUserObj.avatar_url} alt={conv.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              conv.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div style={{ 
                            position: 'absolute', bottom: -2, right: -2, width: 8, height: 8, borderRadius: '50%', 
                            background: (presence?.status === 'online') ? '#10b981' : (presence?.status === 'away' ? '#f59e0b' : (presence?.status === 'dnd' ? '#ef4444' : '#9ca3af')),
                            border: '2px solid #ffffff'
                          }} />
                        </div>
                        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.9rem', fontWeight: isActive ? 600 : 500 }}>{otherUserObj?.name || conv.name}</span>
                        
                        {conv.unreadCount > 0 && (
                          <span style={{ fontSize: '0.65rem', background: '#E91E63', color: '#ffffff', padding: '2px 6px', borderRadius: '12px', fontWeight: 700 }}>{conv.unreadCount}</span>
                        )}

                        <div className="delete-conv-btn" onClick={(e) => handleDeleteChannel(id, e)} style={{ opacity: isActive ? 0.7 : 0, transition: 'opacity 0.2s', padding: '2px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <Icon name="close" size={16} />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
          {/* Inject a tiny style tag for hover effect on conversations */}
          <style>{`
            .conv-item:hover .delete-conv-btn { opacity: 0.7 !important; }
            .conv-item .delete-conv-btn:hover { opacity: 1 !important; color: #d93025 !important; }
          `}</style>
        </div>
      </div>

      {/* User Profile & Presence Area */}
      <div style={{ marginTop: 'auto', paddingTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
        <div style={{ width: 40, height: 40, borderRadius: '8px', background: '#1a73e8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden' }}>
          {userProfile?.avatar_url ? (
            <img src={userProfile?.avatar_url} alt={userProfile?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            userProfile?.name?.charAt(0) || 'U'
          )}
        </div>
        <div style={{ flex: 1, overflow: 'hidden', cursor: 'pointer' }} onClick={() => setPresenceDropdown(!presenceDropdown)}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#202124', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userProfile?.name || 'User'}</div>
          <div style={{ fontSize: '0.75rem', color: isConnected ? (presenceData[userProfile?.uid]?.status === 'offline' ? '#9aa0a6' : (presenceData[userProfile?.uid]?.status === 'away' ? '#f59e0b' : (presenceData[userProfile?.uid]?.status === 'dnd' ? '#ef4444' : '#10b981'))) : '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: isConnected ? (presenceData[userProfile?.uid]?.status === 'offline' ? '#9aa0a6' : (presenceData[userProfile?.uid]?.status === 'away' ? '#f59e0b' : (presenceData[userProfile?.uid]?.status === 'dnd' ? '#ef4444' : '#10b981'))) : '#ef4444' }} />
            {isConnected ? (presenceData[userProfile?.uid]?.status ? presenceData[userProfile?.uid].status.charAt(0).toUpperCase() + presenceData[userProfile?.uid].status.slice(1) : 'Online') : 'Disconnected'}
            <Icon name="expand_more" size={12} />
          </div>
        </div>
        
        {presenceDropdown && (
          <div style={{ position: 'absolute', bottom: '100%', left: 0, width: '100%', background: '#ffffff', border: '1px solid #eaeaea', borderRadius: '8px', padding: '0.5rem', marginBottom: '0.5rem', zIndex: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            {['online', 'away', 'dnd', 'offline'].map(s => (
              <div key={s} onClick={() => handlePresenceUpdate(s)} style={{ padding: '8px', fontSize: '0.85rem', cursor: 'pointer', borderRadius: '4px', textTransform: 'capitalize', color: '#202124' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f3f4'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {s}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
