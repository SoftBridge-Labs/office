'use client';

import React, { useRef, useState, useEffect } from 'react';
import { usePingContext } from '../context/PingContext';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

const Icon = ({ name, size = 20, className = '', style = {}, ...props }) => (
  <span className={`material-symbols-outlined ${className}`} style={{ fontSize: size, ...style }} {...props}>{name}</span>
);

// Ping app icon matching /home style
const PingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E91E63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

export default function PingMainChat() {
  const {
    activeChannel, activeChannelId,
    messages, setMessages,
    inputText, setInputText,
    loadingMore, hasMoreMessages,
    userProfile, workspaceUsers,
    editingMessageId, setEditingMessageId,
    editingMessageContent, setEditingMessageContent,
    isMemberOfActive, isOwnerOrAdmin,
    setShowRightPanel,
    messagesEndRef,
    handleLoadMore, handleSendMessage, handleJoinChannel,
    handleSaveEdit, handleDeleteMessage, handleReaction,
    showSettingsModal, setShowSettingsModal,
    showMoreMenu, setShowMoreMenu,
    handleUpdateChannelSettings,
    setChannels,
    socket
  } = usePingContext();

  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const videoInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const audioInputRef = useRef(null);

  // Lightbox state
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [lightboxType, setLightboxType] = useState(null);

  // Settings form state
  const [settingsName, setSettingsName] = useState('');
  const [settingsOnlyAdmins, setSettingsOnlyAdmins] = useState(false);


  // WebRTC State
  const [callState, setCallState] = useState('idle'); // idle, ringing, incoming, connected
  const [callTarget, setCallTarget] = useState(null); // { uid, name }
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const localStream = useRef(null);

  const endCall = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (localStream.current) {
      localStream.current.getTracks().forEach(t => t.stop());
      localStream.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (callTarget && socket) {
      socket.emit('webrtc_signal', { targetUid: callTarget.uid, type: 'call_end' });
    }
    setCallState('idle');
    setCallTarget(null);
  };

  useEffect(() => {
    if (!socket) return;
    
    const handleSignal = async ({ senderUid, type, payload }) => {
      const sender = workspaceUsers.find(u => u.uid === senderUid) || { uid: senderUid, name: 'Someone' };

      if (type === 'call_init') {
        if (callState !== 'idle') {
           socket.emit('webrtc_signal', { targetUid: senderUid, type: 'call_reject', payload: { reason: 'busy' } });
           return;
        }
        setCallTarget(sender);
        setCallState('incoming');
        const audio = new Audio('/ringtone.mp3');
        audio.play().catch(e => {}); 
      }
      
      if (type === 'call_reject' || type === 'call_end') {
        endCall();
      }

      if (type === 'call_accept') {
        setCallState('connected');
        peerConnection.current = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        
        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('webrtc_signal', { targetUid: senderUid, type: 'ice_candidate', payload: event.candidate });
          }
        };

        peerConnection.current.ontrack = (event) => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
        };

        if (localStream.current) {
          localStream.current.getTracks().forEach(track => peerConnection.current.addTrack(track, localStream.current));
        }

        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        socket.emit('webrtc_signal', { targetUid: senderUid, type: 'offer', payload: offer });
      }

      if (type === 'offer') {
        setCallState('connected');
        peerConnection.current = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        
        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('webrtc_signal', { targetUid: senderUid, type: 'ice_candidate', payload: event.candidate });
          }
        };

        peerConnection.current.ontrack = (event) => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
        };

        if (localStream.current) {
          localStream.current.getTracks().forEach(track => peerConnection.current.addTrack(track, localStream.current));
        }

        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(payload));
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socket.emit('webrtc_signal', { targetUid: senderUid, type: 'answer', payload: answer });
      }

      if (type === 'answer') {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(payload));
      }

      if (type === 'ice_candidate') {
        try {
          if (peerConnection.current) {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(payload));
          }
        } catch (e) {
          console.error('Error adding ICE candidate', e);
        }
      }
    };

    socket.on('webrtc_signal', handleSignal);
    return () => socket.off('webrtc_signal', handleSignal);
  }, [socket, callState, workspaceUsers]);

  const initiateCall = async () => {
    if (activeChannel?.type !== 'direct') return;
    const otherMember = activeChannel.members.find(m => m.uid !== userProfile.uid);
    if (!otherMember) return;
    const target = workspaceUsers.find(u => u.uid === otherMember.uid) || { uid: otherMember.uid, name: 'User' };
    
    setCallTarget(target);
    setCallState('ringing');
    
    try {
      localStream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) localVideoRef.current.srcObject = localStream.current;
      socket.emit('webrtc_signal', { targetUid: target.uid, type: 'call_init' });
    } catch (err) {
      alert('Could not access camera/microphone');
      setCallState('idle');
      setCallTarget(null);
    }
  };

  const acceptCall = async () => {
    if (!callTarget) return;
    try {
      localStream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) localVideoRef.current.srcObject = localStream.current;
      socket.emit('webrtc_signal', { targetUid: callTarget.uid, type: 'call_accept' });
      setCallState('connected');
    } catch (err) {
      alert('Could not access camera/microphone');
      endCall();
    }
  };

  const openSettings = () => {
    setSettingsName(activeChannel?.name || '');
    setSettingsOnlyAdmins(activeChannel?.settings?.onlyAdminsCanPost || false);
    setShowSettingsModal(true);
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const tempId = 'temp_' + Date.now();
    try {
      setIsUploading(true);
      const res = await api.cdn.uploadFile(file);
      if (res && res.success) {
        const url = api.cdn.getViewUrl(res.result.fileName);
        const attachment = {
          url,
          fileType: type,
          fileName: res.result.fileName,
          fileId: res.result.fileId,
          size: file.size
        };
        const msgPayload = {
          channelId: activeChannelId,
          content: `Attached ${type}`,
          attachments: [attachment]
        };
        setMessages(prev => [...prev, {
          _id: tempId,
          ...msgPayload,
          senderUid: userProfile?.uid,
          senderName: userProfile?.name || 'You',
          createdAt: new Date().toISOString()
        }]);

        const serverRes = await api.ping.sendMessage(msgPayload);
        if (serverRes && serverRes.success && serverRes.data) {
          setMessages(prev => {
            if (prev.some(m => m._id === serverRes.data._id && m._id !== tempId)) {
              return prev.filter(m => m._id !== tempId);
            }
            return prev.map(m => m._id === tempId ? serverRes.data : m);
          });
        }
      }
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
      setMessages(prev => prev.filter(m => m._id !== tempId));
    } finally {
      setIsUploading(false);
      e.target.value = null;
    }
  };

  const shareToTasks = async (msg) => {
    setShowMoreMenu(false);
    try {
      await api.createTask({
        title: `From Ping: ${msg?.content || 'Shared message'}`,
        description: `Shared from #${activeChannel?.name} at ${new Date(msg?.createdAt).toLocaleString()}`,
        status: 'todo',
      });
      alert('Created as a task! Opening Tasks...');
      router.push('/tasks');
    } catch (err) {
      alert('Failed to create task: ' + err.message);
    }
  };

  const shareToDoc = async (msg) => {
    setShowMoreMenu(false);
    try {
      await api.createDoc({
        title: `Ping note: ${activeChannel?.name}`,
        content: msg?.content || '',
      });
      alert('Saved as a document! Opening Docs...');
      router.push('/docs');
    } catch (err) {
      alert('Failed to create doc: ' + err.message);
    }
  };

  const shareToMeet = () => {
    setShowMoreMenu(false);
    router.push('/meet?action=new_meet');
  };

  const addToCalendar = (msg) => {
    setShowMoreMenu(false);
    
    // Very simple date extraction (fallback to today)
    const content = msg?.content || '';
    let extractedDate = new Date();
    if (content.toLowerCase().includes('tomorrow')) {
      extractedDate.setDate(extractedDate.getDate() + 1);
    }
    
    const params = new URLSearchParams({
      action: 'new_event',
      title: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
      date: extractedDate.toISOString()
    });
    router.push(`/calendar?${params.toString()}`);
  };

  const firstUnreadIndex = messages.findIndex(msg => 
    msg.senderUid !== userProfile?.uid && 
    msg.type !== 'system' &&
    (!msg.readBy || !msg.readBy.some(r => r.uid === userProfile?.uid))
  );
  const unreadCount = firstUnreadIndex !== -1 ? messages.length - firstUnreadIndex : 0;
  let hasRenderedDivider = false;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Mark messages as read if we have unread ones and the channel is active
    if (activeChannelId && unreadCount > 0) {
       api.ping.markAllRead(activeChannelId).catch(err => {
           if (err.message !== 'Access denied') console.error('Failed to mark as read', err);
       });
       
       // Update channels context to clear unreadCount locally
       setChannels(prev => prev.map(c => 
         (c._id || c.id) === activeChannelId ? { ...c, unreadCount: 0 } : c
       ));

       // Mark local messages as read so the local unreadCount drops to 0
       setMessages(prev => prev.map(m => {
         const hasRead = m.readBy && m.readBy.some(r => r.uid === userProfile?.uid);
         if (m.senderUid !== userProfile?.uid && !hasRead && m.type !== 'system') {
           const newReads = [...(m.readBy || [])];
           newReads.push({ uid: userProfile?.uid, readAt: new Date().toISOString() });
           return { ...m, readBy: newReads };
         }
         return m;
       }));
    }
  }, [messages, activeChannelId, unreadCount, setChannels, setMessages, userProfile]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', background: '#ffffff', position: 'relative' }}>
      {/* Header */}
      <div style={{ height: '60px', display: 'flex', alignItems: 'center', padding: '0 2rem', gap: '1rem', borderBottom: '1px solid #e5e7eb', flexShrink: 0, background: '#ffffff' }}>
        {/* Ping branding + channel name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PingIcon />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#E91E63', letterSpacing: '0.02em' }}>Ping</span>
          {activeChannel && (
            <>
              <span style={{ color: '#d1d5db', fontSize: '1rem' }}>/</span>
              <h1 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: '#111827' }}>
                {activeChannel.type === 'direct' ? (() => {
                  const other = activeChannel.members?.find(m => m.uid !== userProfile?.uid);
                  const otherObj = workspaceUsers.find(u => u.uid === (other?.uid || userProfile?.uid));
                  return otherObj?.name || activeChannel.name;
                })() : `# ${activeChannel.name}`}
              </h1>
            </>
          )}
          {!activeChannel && <h1 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: '#9ca3af' }}>Select a conversation</h1>}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
          
          {activeChannelId && (
            <button onClick={activeChannel?.type === 'direct' ? initiateCall : () => router.push('/meet?action=new_meet')} style={{ background: '#E91E63', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(233, 30, 99, 0.2)' }}>
              <Icon name="videocam" size={15} /> Call
            </button>
          )}
<button onClick={() => setShowRightPanel(prev => !prev)} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151', padding: '6px 12px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <Icon name="info" size={15} /> Details
          </button>

          {activeChannelId && (
            <button onClick={openSettings} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151', padding: '6px 12px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <Icon name="settings" size={15} /> Settings
            </button>
          )}

          <div style={{ position: 'relative' }}>
            <Icon name="search" size={15} style={{ position: 'absolute', top: 8, left: 8, color: '#9ca3af' }} />
            <input type="text" placeholder="Search..." style={{ background: '#f9fafb', border: '1px solid #e5e7eb', padding: '6px 12px 6px 30px', borderRadius: '6px', fontSize: '0.82rem', width: '140px' }} />
          </div>
        </div>
      </div>

      {/* Chat History */}
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: '#ffffff' }}>
        {activeChannelId && hasMoreMessages && messages.length > 0 && (
          <div style={{ textAlign: 'center' }}>
            <button onClick={handleLoadMore} disabled={loadingMore} style={{ background: '#f3f4f6', border: 'none', padding: '8px 16px', borderRadius: '16px', fontSize: '0.8rem', color: '#4b5563', cursor: loadingMore ? 'not-allowed' : 'pointer' }}>
              {loadingMore ? 'Loading...' : 'Load older messages'}
            </button>
          </div>
        )}
        {!activeChannelId ? (
          <div style={{ margin: 'auto', textAlign: 'center', color: '#6b7280' }}>
            <Icon name="forum" size={64} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <h3>Select a conversation to start chatting</h3>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ margin: 'auto', color: '#6b7280', fontSize: '0.9rem', textAlign: 'center' }}>
            <Icon name="waving_hand" size={48} style={{ color: '#111827', marginBottom: '1rem' }} />
            <h3 style={{ color: '#111827' }}>No messages yet</h3>
            <p>Be the first to speak in #{activeChannel?.name}.</p>
          </div>
        ) : (
          messages.map(msg => {
            if (msg.type === 'system') {
              const targetUser = workspaceUsers.find(u => (u.uid || u._id) === msg.systemData?.targetUser);
              const targetName = targetUser?.name || 'A user';
              return (
                <div key={msg._id} style={{ alignSelf: 'center', margin: '0.5rem 0', color: '#9ca3af', fontSize: '0.85rem', fontWeight: 500 }}>
                  <Icon name="info" size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  {targetName} {msg.content}
                </div>
              );
            }

            const isMe = msg.senderUid === userProfile?.uid;
            const sender = workspaceUsers.find(u => (u.uid || u._id) === msg.senderUid);
            const displayName = msg.senderName || sender?.name || (isMe ? userProfile?.name || 'You' : `User (${msg.senderUid})`);
            const displayAvatar = msg.senderAvatar || sender?.avatar_url || (isMe ? userProfile?.avatar_url : null);
            
            const isFirstUnread = firstUnreadIndex !== -1 && !hasRenderedDivider && messages.indexOf(msg) >= firstUnreadIndex;
            if (isFirstUnread) hasRenderedDivider = true;

            return (
              <React.Fragment key={msg._id}>
                {isFirstUnread && (
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%', margin: '1rem 0' }}>
                    <div style={{ flex: 1, height: '1px', background: '#ef4444' }} />
                    <div style={{ padding: '4px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '16px', color: '#b91c1c', fontSize: '0.75rem', fontWeight: 600, margin: '0 1rem' }}>
                      {unreadCount} Unread Message{unreadCount > 1 ? 's' : ''} Since {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ flex: 1, height: '1px', background: '#ef4444' }} />
                  </div>
                )}
                <div className="message-container" style={{ display: 'flex', gap: '1rem', alignSelf: 'flex-start', width: '100%', position: 'relative' }}>
                <div
                  style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f3f4f6', color: '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 'bold', overflow: 'hidden', cursor: 'default' }}
                >
                  {displayAvatar ? (
                    <img src={displayAvatar} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (displayName || 'U').charAt(0).toUpperCase()
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827' }}>{displayName}</span>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div style={{ color: '#374151', fontSize: '0.95rem', lineHeight: 1.5, position: 'relative' }}>
                    {editingMessageId === msg._id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '300px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px' }}>
                        <textarea
                          value={editingMessageContent}
                          onChange={e => setEditingMessageContent(e.target.value)}
                          style={{ width: '100%', border: 'none', background: 'transparent', color: '#111827', outline: 'none', resize: 'none', fontSize: '0.95rem' }}
                          autoFocus
                        />
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => setEditingMessageId(null)} style={{ background: '#f3f4f6', border: 'none', color: '#374151', borderRadius: '4px', padding: '4px 12px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
                          <button onClick={handleSaveEdit} style={{ background: '#111827', border: 'none', color: '#ffffff', borderRadius: '4px', padding: '4px 12px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>Save</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div style={{ marginBottom: '8px', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {msg.attachments.map((att, i) => (
                              <React.Fragment key={i}>
                                {att.fileType === 'image' && (
                                  <img
                                    src={att.url}
                                    alt="uploaded"
                                    onClick={() => { setLightboxUrl(att.url); setLightboxType('image'); }}
                                    style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'zoom-in' }}
                                  />
                                )}
                                {att.fileType === 'video' && (
                                  <video
                                    src={att.url}
                                    onClick={() => { setLightboxUrl(att.url); setLightboxType('video'); }}
                                    style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'zoom-in' }}
                                  />
                                )}
                                {att.fileType === 'audio' && <audio src={att.url} controls style={{ width: '100%', maxWidth: '300px' }} />}
                              </React.Fragment>
                            ))}
                          </div>
                        )}
                        {msg.content}
                        {msg.isEdited && <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: '8px' }}>(edited)</span>}
                      </>
                    )}

                    <div className="reaction-trigger" style={{ position: 'absolute', top: -10, right: 0, background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '2px', display: 'flex', gap: '2px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', color: '#4b5563' }}>
                      <span onClick={() => handleReaction(msg._id, '👍')} style={{ padding: '4px', fontSize: '1rem', background: 'transparent', borderRadius: '4px' }} onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>👍</span>
                      <span onClick={() => handleReaction(msg._id, '❤️')} style={{ padding: '4px', fontSize: '1rem', background: 'transparent', borderRadius: '4px' }} onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>❤️</span>
                      {isMe && !msg._id.startsWith('temp_') && (
                        <>
                          <span onClick={() => { setEditingMessageId(msg._id); setEditingMessageContent(msg.content); }} style={{ padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '4px' }} title="Edit" onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><Icon name="edit" size={16} /></span>
                          <span onClick={() => handleDeleteMessage(msg._id)} style={{ padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '4px' }} title="Delete" onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><Icon name="delete" size={16} style={{ color: '#ef4444' }} /></span>
                        </>
                      )}
                      <span onClick={() => shareToTasks(msg)} style={{ padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '4px' }} title="Share to Tasks" onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><Icon name="task_alt" size={16} /></span>
                      <span onClick={() => shareToDoc(msg)} style={{ padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '4px' }} title="Save to Docs" onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><Icon name="description" size={16} /></span>
                      <span onClick={shareToMeet} style={{ padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '4px' }} title="Schedule a Meet" onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><Icon name="videocam" size={16} /></span>
                      <span onClick={() => addToCalendar(msg)} style={{ padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '4px' }} title="Add to Calendar" onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><Icon name="event" size={16} /></span>
                    </div>

                    {msg.reactions && msg.reactions.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                        {msg.reactions.map((r, i) => (
                          <span key={i} style={{ fontSize: '0.8rem', background: '#f3f4f6', padding: '2px 8px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>{r.emoji}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      {activeChannelId && (
        <div style={{ padding: '0 2rem 2rem 2rem', background: '#ffffff' }}>
          {!isMemberOfActive ? (
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#111827' }}>You are viewing a public channel</h3>
              <p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '0.9rem' }}>Join this channel to participate in the conversation.</p>
              <button onClick={handleJoinChannel} style={{ background: '#111827', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Join Channel</button>
            </div>
          ) : (() => {
            const canPost = !activeChannel?.settings?.onlyAdminsCanPost ||
              ['owner', 'admin'].includes(activeChannel?.members?.find(m => m.uid === userProfile?.uid)?.role);

            return (
              <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', background: canPost ? '#ffffff' : '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', minHeight: '120px' }}>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }
                  }}
                  placeholder={canPost ? 'Write a message...' : 'Only admins can send messages in this channel.'}
                  disabled={!canPost}
                  style={{ flex: 1, background: 'transparent', border: 'none', color: '#111827', fontSize: '0.95rem', outline: 'none', resize: 'none', minHeight: '60px' }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="file" accept="video/*" ref={videoInputRef} style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'video')} />
                    <button type="button" disabled={isUploading || !canPost} onClick={() => canPost && videoInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px 10px', fontSize: '0.82rem', color: '#4b5563', cursor: (canPost && !isUploading) ? 'pointer' : 'not-allowed', fontWeight: 500 }}>
                      <Icon name="videocam" size={16} /> {isUploading ? 'Uploading...' : 'Video'}
                    </button>

                    <input type="file" accept="image/*" ref={imageInputRef} style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'image')} />
                    <button type="button" disabled={isUploading || !canPost} onClick={() => canPost && imageInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px 10px', fontSize: '0.82rem', color: '#4b5563', cursor: (canPost && !isUploading) ? 'pointer' : 'not-allowed', fontWeight: 500 }}>
                      <Icon name="image" size={16} /> {isUploading ? 'Uploading...' : 'Photo'}
                    </button>

                    <input type="file" accept="audio/*" ref={audioInputRef} style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'audio')} />
                    <button type="button" disabled={isUploading || !canPost} onClick={() => canPost && audioInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px 10px', fontSize: '0.82rem', color: '#4b5563', cursor: (canPost && !isUploading) ? 'pointer' : 'not-allowed', fontWeight: 500 }}>
                      <Icon name="mic" size={16} /> Audio
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    style={{ background: inputText.trim() ? '#111827' : '#e5e7eb', border: 'none', color: inputText.trim() ? '#ffffff' : '#9ca3af', width: 36, height: 36, borderRadius: '12px', cursor: inputText.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                  >
                    <Icon name="arrow_upward" size={20} />
                  </button>
                </div>
              </form>
            );
          })()}
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && activeChannel && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowSettingsModal(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', width: '420px', maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#111827' }}>Channel Settings</h2>
              <button onClick={() => setShowSettingsModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center' }}>
                <Icon name="close" size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Channel Name</label>
                <input
                  value={settingsName}
                  onChange={e => setSettingsName(e.target.value)}
                  disabled={!isOwnerOrAdmin}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', background: isOwnerOrAdmin ? '#fff' : '#f9fafb', boxSizing: 'border-box' }}
                />
              </div>

              {activeChannel.type !== 'direct' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>Only admins can post</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>Members can read but not send messages</div>
                  </div>
                  <div
                    onClick={() => isOwnerOrAdmin && setSettingsOnlyAdmins(prev => !prev)}
                    style={{ width: '40px', height: '22px', borderRadius: '11px', background: settingsOnlyAdmins ? '#111827' : '#e5e7eb', position: 'relative', cursor: isOwnerOrAdmin ? 'pointer' : 'not-allowed', transition: 'background 0.2s', flexShrink: 0 }}
                  >
                    <div style={{ position: 'absolute', top: '3px', left: settingsOnlyAdmins ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <Icon name="lock" size={16} style={{ color: '#6b7280' }} />
                <div style={{ fontSize: '0.85rem', color: '#374151' }}>
                  <span style={{ fontWeight: 600 }}>Privacy: </span>
                  {activeChannel.isPrivate ? 'Private channel' : 'Public channel'}
                </div>
              </div>

              {!isOwnerOrAdmin && (
                <div style={{ padding: '10px 12px', background: '#fef9c3', border: '1px solid #fde047', borderRadius: '8px', fontSize: '0.8rem', color: '#713f12' }}>
                  Only channel owners and admins can modify settings.
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowSettingsModal(false)} style={{ padding: '8px 16px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontWeight: 500, cursor: 'pointer', fontSize: '0.9rem' }}>Cancel</button>
                {isOwnerOrAdmin && (
                  <button
                    onClick={() => handleUpdateChannelSettings({ name: settingsName, settings: { onlyAdminsCanPost: settingsOnlyAdmins } })}
                    style={{ padding: '8px 20px', background: '#111827', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
                  >
                    Save Changes
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          onClick={() => { setLightboxUrl(null); setLightboxType(null); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <button
            onClick={() => { setLightboxUrl(null); setLightboxType(null); }}
            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
          >
            <Icon name="close" size={22} style={{ color: '#fff' }} />
          </button>
          {lightboxType === 'image' && (
            <img
              src={lightboxUrl}
              alt="preview"
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '8px', objectFit: 'contain', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
            />
          )}
          {lightboxType === 'video' && (
            <video
              src={lightboxUrl}
              controls
              autoPlay
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
            />
          )}
        </div>
      )}

      <style>{`
        .reaction-trigger { opacity: 0; transition: opacity 0.15s; }
        .message-container:hover .reaction-trigger { opacity: 1 !important; }
      `}</style>

      {/* WebRTC Call Modal */}
      {callState !== 'idle' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
          <div style={{ color: '#fff', textAlign: 'center', marginBottom: '20px' }}>
            {callState === 'ringing' && <h2>Calling {callTarget?.name}...</h2>}
            {callState === 'incoming' && <h2>Incoming call from {callTarget?.name}...</h2>}
            {callState === 'connected' && <h2>In call with {callTarget?.name}</h2>}
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '300px', height: '200px', background: '#000', borderRadius: '12px', border: '2px solid #374151', objectFit: 'cover' }} />
            {callState === 'connected' && (
              <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '600px', height: '400px', background: '#000', borderRadius: '12px', border: '2px solid #E91E63', objectFit: 'cover' }} />
            )}
          </div>

          <div style={{ marginTop: '30px', display: 'flex', gap: '20px' }}>
            {callState === 'incoming' && (
              <button onClick={acceptCall} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '30px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="call" /> Accept
              </button>
            )}
            <button onClick={endCall} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '30px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="call_end" /> {callState === 'incoming' ? 'Reject' : 'End Call'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
