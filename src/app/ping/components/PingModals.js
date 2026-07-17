'use client';

import React from 'react';
import { usePingContext } from '../context/PingContext';

export default function PingModals() {
  const {
    showCreateModal, setShowCreateModal,
    showDMModal, setShowDMModal,
    viewProfileModal, setViewProfileModal,
    newChannelName, setNewChannelName,
    newChannelPrivate, setNewChannelPrivate,
    userSearch, setUserSearch,
    workspaceUsers,
    presenceData,
    handleCreateChannel, handleCreateDM
  } = usePingContext();

  return (
    <>
      {/* Create Channel Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ width: '400px', background: '#ffffff', borderRadius: '12px', border: '1px solid #eaeaea', padding: '1.5rem', boxShadow: '0 12px 24px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginTop: 0, fontSize: '1.25rem', color: '#202124' }}>Create a channel</h2>
            <form onSubmit={handleCreateChannel}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#5f6368', marginBottom: '0.5rem', fontWeight: 500 }}>Channel Name</label>
                <input type="text" value={newChannelName} onChange={e => setNewChannelName(e.target.value)} placeholder="e.g. general" style={{ width: '100%', background: '#f8f9fa', border: '1px solid #eaeaea', padding: '10px 12px', borderRadius: '6px', color: '#202124', fontSize: '0.95rem' }} />
              </div>
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" id="isPrivate" checked={newChannelPrivate} onChange={e => setNewChannelPrivate(e.target.checked)} />
                <label htmlFor="isPrivate" style={{ fontSize: '0.9rem', color: '#5f6368' }}>Make private</label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ background: 'transparent', border: 'none', color: '#5f6368', cursor: 'pointer', padding: '8px 16px', borderRadius: '6px' }}>Cancel</button>
                <button type="submit" style={{ background: '#1a73e8', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New DM Modal */}
      {showDMModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ width: '400px', background: '#ffffff', borderRadius: '12px', border: '1px solid #eaeaea', padding: '1.5rem', boxShadow: '0 12px 24px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginTop: 0, fontSize: '1.25rem', color: '#202124' }}>New Direct Message</h2>
            <div style={{ marginBottom: '1rem' }}>
              <input 
                type="text" 
                placeholder="Search user..." 
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ width: '100%', background: '#f8f9fa', border: '1px solid #eaeaea', padding: '10px 12px', borderRadius: '6px', color: '#202124', fontSize: '0.95rem', marginBottom: '1rem' }} 
              />
              <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {workspaceUsers
                  .filter(u => 
                    !userSearch || 
                    (u.name && u.name.toLowerCase().includes(userSearch.toLowerCase())) || 
                    (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase()))
                  )
                  .map(u => (
                    <div 
                      key={u.uid || u._id} 
                      onClick={() => handleCreateDM(u.uid || u._id)}
                      style={{ padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f1f3f4'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ position: 'relative', width: 32, height: 32 }}>
                        <div style={{ width: '100%', height: '100%', borderRadius: '8px', background: '#1a73e8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden' }}>
                          {u.avatar_url ? <img src={u.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (u.name || 'U').charAt(0)}
                        </div>
                        {presenceData && presenceData[u.uid || u._id] && (
                          <div style={{
                            position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: '50%', border: '2px solid #fff',
                            background: presenceData[u.uid || u._id].status === 'online' ? '#10b981' : presenceData[u.uid || u._id].status === 'away' ? '#f59e0b' : '#9ca3af'
                          }} title={presenceData[u.uid || u._id].status} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#5f6368' }}>{u.email}</div>
                      </div>
                    </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" onClick={() => setShowDMModal(false)} style={{ background: 'transparent', border: 'none', color: '#5f6368', cursor: 'pointer', padding: '8px 16px', borderRadius: '6px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* View Profile Modal */}
      {viewProfileModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ width: '320px', background: '#ffffff', borderRadius: '12px', border: '1px solid #eaeaea', padding: '2rem', boxShadow: '0 12px 24px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#1a73e8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '2rem', margin: '0 auto 1rem', overflow: 'hidden' }}>
              {viewProfileModal.avatar_url ? <img src={viewProfileModal.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (viewProfileModal.name || 'U').charAt(0)}
            </div>
            <h2 style={{ marginTop: 0, marginBottom: '4px', fontSize: '1.25rem', color: '#202124' }}>{viewProfileModal.name}</h2>
            <div style={{ color: '#5f6368', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{viewProfileModal.email}</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button onClick={() => { handleCreateDM(viewProfileModal.uid || viewProfileModal._id); setViewProfileModal(null); }} style={{ width: '100%', background: '#1a73e8', border: 'none', color: '#fff', cursor: 'pointer', padding: '10px 16px', borderRadius: '6px', fontWeight: 600 }}>Message</button>
              <button type="button" onClick={() => setViewProfileModal(null)} style={{ background: '#f8f9fa', border: '1px solid #eaeaea', color: '#5f6368', cursor: 'pointer', padding: '10px 16px', borderRadius: '6px', fontWeight: 600 }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
