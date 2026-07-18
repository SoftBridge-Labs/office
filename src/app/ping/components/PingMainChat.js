'use client';

import React, { useRef, useState, useEffect } from 'react';
import { usePingContext } from '../context/PingContext';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import PingAttachment from './PingAttachment';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
    activeUnreadCount,
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
  const [isScanningUrl, setIsScanningUrl] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  useEffect(() => {
    let interval = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const videoInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
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
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  const toggleMic = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream.current) {
      const videoTrack = localStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  };

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
    setIsMicMuted(false);
    setIsVideoMuted(false);
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
        const audio = new Audio('/sounds/ringtone.mp3');
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

  const handleFileSelect = (e, type) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setPendingAttachments(prev => [...prev, ...files.map(file => ({ file, type, id: Date.now() + Math.random() }))]);
    e.target.value = null;
  };

  const removePendingAttachment = (id) => {
    setPendingAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleAudioRecord = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `audio_${Date.now()}.webm`, { type: 'audio/webm' });
        setPendingAttachments(prev => [...prev, { file, type: 'audio', id: Date.now() }]);
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      alert('Could not access microphone');
    }
  };

  const onFormSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && pendingAttachments.length === 0) return;
    
    // URL Security Check
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = inputText.match(urlRegex) || [];
    let linkPreviews = [];
    
    if (urls.length > 0) {
      setIsScanningUrl(true);
      for (let url of urls) {
        try {
          const securityRes = await api.ping.checkUrlSecurity(url);
          if (securityRes.success) {
            if (securityRes.verdict !== 'SAFE') {
              alert(`Cannot send message. The link ${url} is marked as ${securityRes.verdictEmoji} ${securityRes.verdict}.`);
              setIsScanningUrl(false);
              return;
            }
            if (securityRes.preview) {
              linkPreviews.push(securityRes.preview);
            }
          }
        } catch (err) {
          console.error('URL security check failed:', err);
        }
      }
      setIsScanningUrl(false);
    }
    
    setIsUploading(true);

    let uploadedAttachments = [];
    
    if (pendingAttachments.length > 0) {
      for (let att of pendingAttachments) {
        try {
          const res = await api.cdn.uploadFile(att.file);
          if (res && res.success) {
            const url = api.cdn.getViewUrl(res.result.fileName);
            uploadedAttachments.push({
              url,
              fileType: att.type,
              fileName: res.result.fileName,
              originalName: att.file.name,
              fileId: res.result.fileId,
              size: att.file.size
            });
          }
        } catch (err) {
          console.error('Upload failed', err);
        }
      }
    }
    
    const content = inputText.trim() || (uploadedAttachments.length ? 'Sent attachments' : '');
    const tempId = 'temp_' + Date.now();
    const msgPayload = { channelId: activeChannelId, content, attachments: uploadedAttachments, linkPreviews };
    
    setInputText('');
    setPendingAttachments([]);
    setIsUploading(false);
    
    setMessages(prev => [...prev, {
      _id: tempId,
      ...msgPayload,
      senderUid: userProfile?.uid,
      senderName: userProfile?.name || 'You',
      createdAt: new Date().toISOString()
    }]);

    try {
      const serverRes = await api.ping.sendMessage(msgPayload);
      if (serverRes && serverRes.success && serverRes.data) {
        setMessages(prev => {
          if (prev.some(m => m._id === serverRes.data._id && m._id !== tempId)) {
             return prev.filter(m => m._id !== tempId);
          }
          return prev.map(m => m._id === tempId ? serverRes.data : m);
        });
      }
    } catch (err) {
      alert('Failed to send message: ' + err.message);
      setMessages(prev => prev.filter(m => m._id !== tempId));
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

  const unreadCount = activeUnreadCount || 0;
  const firstUnreadIndex = unreadCount > 0 ? Math.max(0, messages.length - unreadCount) : -1;
  let hasRenderedDivider = false;

  useEffect(() => {
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
  }, [activeChannelId, unreadCount, setChannels, setMessages, userProfile]);

  return (
    <>
    <style>{`
      @media (max-width: 768px) {
        .ping-main {
          display: ${activeChannelId ? 'flex' : 'none'} !important;
          width: 100% !important;
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 20;
        }
        .ping-back-btn {
          display: flex !important;
          padding: 8px !important;
          margin-right: -4px !important;
        }
        .ping-main-header {
          padding: 0 0.5rem !important;
        }
        .ping-channel-name {
          max-width: 120px !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }
        .ping-header-actions {
          gap: 4px !important;
        }
        .ping-header-action-text {
          display: none !important;
        }
        .ping-header-btn {
          padding: 8px !important;
        }
        .ping-search-box, .ping-settings-btn {
          display: none !important;
        }
        .ping-msg-avatar {
          width: 28px !important;
          height: 28px !important;
        }
        .ping-msg-bubble {
          padding: 8px 12px !important;
          border-radius: 18px !important;
          font-size: 0.95rem !important;
        }
        .ping-input-toolbar-advanced {
          display: none !important;
        }
        .ping-input-container {
          padding: 8px !important;
        }
      }
    `}</style>
    <div className="ping-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', background: '#ffffff', position: 'relative' }}>
      {/* Header */}
      <div className="ping-main-header" style={{ height: '60px', display: 'flex', alignItems: 'center', padding: '0 2rem', gap: '1rem', borderBottom: '1px solid #e5e7eb', flexShrink: 0, background: '#ffffff' }}>
        <button 
          className="ping-back-btn" 
          onClick={() => setActiveChannelId(null)}
          style={{ display: 'none', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', alignItems: 'center', color: '#1a73e8' }}
        >
          <Icon name="arrow_back_ios" size={24} />
        </button>
        {/* Ping branding + channel name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PingIcon />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#E91E63', letterSpacing: '0.02em' }}>Ping</span>
          {activeChannel && (
            <>
              <span style={{ color: '#d1d5db', fontSize: '1rem' }}>/</span>
              <h1 className="ping-channel-name" style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: '#111827' }}>
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

        <div className="ping-header-actions" style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
          
          {activeChannelId && (
            <button className="ping-header-btn" onClick={activeChannel?.type === 'direct' ? initiateCall : () => router.push('/meet?action=new_meet')} style={{ background: '#E91E63', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(233, 30, 99, 0.2)' }}>
              <Icon name="videocam" size={18} /> <span className="ping-header-action-text">Call</span>
            </button>
          )}
          <button className="ping-header-btn" onClick={() => setShowRightPanel(prev => !prev)} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151', padding: '6px 12px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <Icon name="info" size={18} /> <span className="ping-header-action-text">Details</span>
          </button>

          {activeChannelId && (
            <button className="ping-settings-btn ping-header-btn" onClick={openSettings} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151', padding: '6px 12px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <Icon name="settings" size={18} /> <span className="ping-header-action-text">Settings</span>
            </button>
          )}

          <div className="ping-search-box" style={{ position: 'relative' }}>
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
                  className="ping-msg-avatar"
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
                  <div className="ping-msg-bubble" style={{ color: '#374151', fontSize: '0.95rem', lineHeight: 1.5, position: 'relative' }}>
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
                              <PingAttachment
                                key={i}
                                att={att}
                                setLightboxUrl={setLightboxUrl}
                                setLightboxType={setLightboxType}
                              />
                            ))}
                          </div>
                        )}
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                          a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" style={{ color: '#E91E63', textDecoration: 'underline' }} />
                        }}>
                          {msg.content}
                        </ReactMarkdown>
                        {msg.isEdited && <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: '8px' }}>(edited)</span>}
                        {msg.linkPreviews && msg.linkPreviews.length > 0 && (
                          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {msg.linkPreviews.map((lp, i) => (
                              <a key={i} href={lp.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', gap: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', textDecoration: 'none', color: 'inherit', background: '#f9fafb', maxWidth: '400px', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'} onMouseLeave={e => e.currentTarget.style.background = '#f9fafb'}>
                                {lp.image && <img src={lp.image} alt="preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lp.title}</div>
                                  <div style={{ fontSize: '0.75rem', color: '#6b7280', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{lp.description}</div>
                                  <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 'auto', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{new URL(lp.url).hostname}</div>
                                </div>
                              </a>
                            ))}
                          </div>
                        )}
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
        <div className="ping-input-container" style={{ padding: '0 2rem 2rem 2rem', background: '#ffffff' }}>
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
              <form onSubmit={onFormSubmit} style={{ display: 'flex', flexDirection: 'column', background: canPost ? '#ffffff' : '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', minHeight: '120px' }}>
                {isScanningUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: '#fef3c7', color: '#92400e', borderRadius: '8px', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 500 }}>
                    <Icon name="policy" size={16} /> Scanning links for security...
                  </div>
                )}
                {pendingAttachments.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {pendingAttachments.map(att => (
                      <div key={att.id} style={{ position: 'relative', background: '#f3f4f6', borderRadius: '8px', padding: '8px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #e5e7eb' }}>
                        <Icon name={att.type === 'image' ? 'image' : att.type === 'video' ? 'videocam' : att.type === 'audio' ? 'mic' : 'insert_drive_file'} size={16} />
                        <span style={{ fontSize: '0.8rem', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.file.name || `Recorded Audio`}</span>
                        <button type="button" onClick={() => removePendingAttachment(att.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#ef4444' }}><Icon name="close" size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
                {isRecording ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px', padding: '0 16px', minHeight: '60px', background: '#fef2f2', borderRadius: '12px', border: '1px dashed #fca5a5' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
                    <span style={{ fontSize: '1rem', fontWeight: 600, color: '#ef4444', fontVariantNumeric: 'tabular-nums' }}>
                      Recording... {formatRecordingTime(recordingDuration)}
                    </span>
                    <button type="button" onClick={handleAudioRecord} style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="stop" size={18} /> Stop
                    </button>
                    <style>{`
                      @keyframes pulse {
                        0% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.5; transform: scale(1.2); }
                        100% { opacity: 1; transform: scale(1); }
                      }
                    `}</style>
                  </div>
                ) : (
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onFormSubmit(e); }
                    }}
                    placeholder={canPost ? 'Write a message...' : 'Only admins can send messages in this channel.'}
                    disabled={!canPost}
                    style={{ flex: 1, background: 'transparent', border: 'none', color: '#111827', fontSize: '0.95rem', outline: 'none', resize: 'none', minHeight: '60px' }}
                  />
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <div className="ping-input-toolbar-advanced" style={{ display: 'flex', gap: '8px' }}>
                    <input type="file" accept="video/*" ref={videoInputRef} style={{ display: 'none' }} onChange={(e) => handleFileSelect(e, 'video')} />
                    <button type="button" disabled={isUploading || !canPost} onClick={() => canPost && videoInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px 10px', fontSize: '0.82rem', color: '#4b5563', cursor: (canPost && !isUploading) ? 'pointer' : 'not-allowed', fontWeight: 500 }}>
                      <Icon name="videocam" size={16} /> Video
                    </button>

                    <input type="file" accept="image/*" ref={imageInputRef} style={{ display: 'none' }} onChange={(e) => handleFileSelect(e, 'image')} />
                    <button type="button" disabled={isUploading || !canPost} onClick={() => canPost && imageInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px 10px', fontSize: '0.82rem', color: '#4b5563', cursor: (canPost && !isUploading) ? 'pointer' : 'not-allowed', fontWeight: 500 }}>
                      <Icon name="image" size={16} /> Photo
                    </button>

                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => handleFileSelect(e, 'file')} />
                    <button type="button" disabled={isUploading || !canPost} onClick={() => canPost && fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px 10px', fontSize: '0.82rem', color: '#4b5563', cursor: (canPost && !isUploading) ? 'pointer' : 'not-allowed', fontWeight: 500 }}>
                      <Icon name="attach_file" size={16} /> Attach
                    </button>

                    <button type="button" disabled={isUploading || !canPost} onClick={() => canPost && handleAudioRecord()} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: isRecording ? '#fef2f2' : 'transparent', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px', fontSize: '0.82rem', color: isRecording ? '#ef4444' : '#4b5563', cursor: (canPost && !isUploading) ? 'pointer' : 'not-allowed', fontWeight: 500, borderColor: isRecording ? '#fca5a5' : '#e5e7eb' }}>
                      <Icon name="mic" size={16} />
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={(!inputText.trim() && pendingAttachments.length === 0) || isUploading || isScanningUrl}
                    style={{ background: (inputText.trim() || pendingAttachments.length > 0) ? '#111827' : '#e5e7eb', border: 'none', color: (inputText.trim() || pendingAttachments.length > 0) ? '#ffffff' : '#9ca3af', width: 36, height: 36, borderRadius: '12px', cursor: (inputText.trim() || pendingAttachments.length > 0) && !isUploading && !isScanningUrl ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                  >
                    {isScanningUrl ? <Icon name="policy" size={20} /> : isUploading ? <Icon name="hourglass_empty" size={20} /> : <Icon name="arrow_upward" size={20} />}
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
            {callState === 'connected' && (
              <>
                <button onClick={toggleMic} style={{ background: isMicMuted ? '#fef2f2' : '#f3f4f6', color: isMicMuted ? '#ef4444' : '#374151', border: 'none', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <Icon name={isMicMuted ? 'mic_off' : 'mic'} size={24} />
                </button>
                <button onClick={toggleVideo} style={{ background: isVideoMuted ? '#fef2f2' : '#f3f4f6', color: isVideoMuted ? '#ef4444' : '#374151', border: 'none', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <Icon name={isVideoMuted ? 'videocam_off' : 'videocam'} size={24} />
                </button>
              </>
            )}
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
    </>
  );
}
