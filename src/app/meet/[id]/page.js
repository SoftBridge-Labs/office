'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { encryptPayload, decryptPayload } from '@/lib/crypto';
import VideoGrid from '../components/VideoGrid';

// ─── Design Tokens ──────────────────────────────────────────────────────────
const C = {
  bg:        '#13141b',
  sidebar:   '#0f1017',
  panel:     '#1a1b25',
  card:      '#1f2030',
  border:    'rgba(255,255,255,0.07)',
  text:      '#e8eaf0',
  muted:     '#6b7280',
  accent:    '#4f7ef7',
  accentHov: '#6b93ff',
  danger:    '#ef4444',
  success:   '#10b981',
  amber:     '#f59e0b',
  violet:    '#7c3aed',
};

// ─── Reusable UI Atoms ───────────────────────────────────────────────────────
const Avatar = ({ name, avatar_url, size = 32, color }) => {
  if (avatar_url) {
    return (
      <img
        src={avatar_url}
        alt={name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, userSelect: 'none' }}
      />
    );
  }
  const palette = ['#4f7ef7','#7c3aed','#ec4899','#14b8a6','#f59e0b','#ef4444','#10b981','#6366f1'];
  const bg = color || palette[(name || 'U').charCodeAt(0) % palette.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.4, color: '#fff', userSelect: 'none'
    }}>
      {(name || 'U').charAt(0).toUpperCase()}
    </div>
  );
};

const IconBtn = ({ icon, label, active, danger, onClick, size = 42, badge, style: extraStyle = {} }) => (
  <button
    onClick={onClick}
    title={label}
    style={{
      width: size, height: size,
      borderRadius: '50%',
      border: 'none',
      background: danger ? C.danger : active ? 'rgba(79,126,247,0.2)' : 'rgba(255,255,255,0.07)',
      color: danger ? '#fff' : active ? C.accent : C.text,
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative',
      transition: 'all 0.18s cubic-bezier(.4,0,.2,1)',
      flexShrink: 0,
      ...extraStyle
    }}
    onMouseEnter={e => {
      e.currentTarget.style.background = danger ? '#dc2626' : active ? 'rgba(79,126,247,0.35)' : 'rgba(255,255,255,0.13)';
      e.currentTarget.style.transform = 'scale(1.08)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background = danger ? C.danger : active ? 'rgba(79,126,247,0.2)' : 'rgba(255,255,255,0.07)';
      e.currentTarget.style.transform = 'scale(1)';
    }}
  >
    <span className="material-symbols-outlined" style={{ fontSize: size * 0.44 }}>{icon}</span>
    {badge && (
      <span style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: '50%', background: C.danger, border: `2px solid ${C.bg}` }} />
    )}
  </button>
);

const PillBtn = ({ icon, label, active, onClick, color }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: '0.45rem',
      padding: '0 1rem', height: '40px',
      borderRadius: '20px', border: 'none', cursor: 'pointer',
      background: active ? (color || 'rgba(79,126,247,0.2)') : 'rgba(255,255,255,0.07)',
      color: active ? (color ? '#fff' : C.accent) : C.muted,
      fontSize: '0.8rem', fontWeight: 600,
      transition: 'all 0.18s',
      whiteSpace: 'nowrap'
    }}
    onMouseEnter={e => { e.currentTarget.style.background = active ? (color || 'rgba(79,126,247,0.3)') : 'rgba(255,255,255,0.11)'; e.currentTarget.style.color = '#fff'; }}
    onMouseLeave={e => { e.currentTarget.style.background = active ? (color || 'rgba(79,126,247,0.2)') : 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = active ? (color ? '#fff' : C.accent) : C.muted; }}
  >
    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>{icon}</span>
    {label}
  </button>
);

// Toggle switch
const Toggle = ({ checked, onChange, label }) => (
  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: '0.5rem' }}>
    <span style={{ fontSize: '0.83rem', color: C.text }}>{label}</span>
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 36, height: 20, borderRadius: 10, flexShrink: 0,
        background: checked ? C.accent : 'rgba(255,255,255,0.1)',
        position: 'relative', transition: 'background 0.2s', cursor: 'pointer'
      }}
    >
      <div style={{
        position: 'absolute', top: 2, left: checked ? 18 : 2,
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.4)'
      }} />
    </div>
  </label>
);

// Custom modal wrapper
const Modal = ({ children, onClose, title, width = 480 }) => (
  <div
    onClick={onClose}
    style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease'
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        width, maxWidth: 'calc(100vw - 2rem)',
        maxHeight: '88vh',
        background: C.panel,
        borderRadius: '20px',
        border: `1px solid ${C.border}`,
        boxShadow: '0 32px 80px rgba(0,0,0,0.9)',
        display: 'flex', flexDirection: 'column',
        animation: 'modalIn 0.25s cubic-bezier(.4,0,.2,1)'
      }}
    >
      <div style={{
        padding: '1.25rem 1.5rem',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0
      }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: C.text }}>{title}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', padding: 4, borderRadius: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>close</span>
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
        {children}
      </div>
    </div>
  </div>
);

// Sidebar drawer
const Drawer = ({ children, title, onClose, width = 360 }) => (
  <div style={{
    width, flexShrink: 0,
    background: C.sidebar,
    borderLeft: `1px solid ${C.border}`,
    display: 'flex', flexDirection: 'column',
    height: '100%',
    animation: 'slideInRight 0.25s cubic-bezier(.4,0,.2,1)'
  }}>
    <div style={{
      padding: '1.25rem 1.5rem',
      borderBottom: `1px solid ${C.border}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      flexShrink: 0
    }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: C.text }}>{title}</h3>
      <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', color: C.muted, cursor: 'pointer', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>close</span>
      </button>
    </div>
    <div style={{ flex: 1, overflowY: 'auto' }}>{children}</div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MeetPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const encryptionKeyRef = useRef(null);

  // Encryption key from URL hash
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let hash = window.location.hash.replace('#', '');
      if (!hash) {
        hash = Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, '0')).join('');
        window.history.replaceState(null, null, `#${hash}`);
      }
      encryptionKeyRef.current = id + '-' + hash;
    }
  }, [id]);

  const initMic = searchParams.get('mic') !== 'false';
  const initVideo = searchParams.get('video') === 'true';

  // Core state
  const [authorized, setAuthorized] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [peerLoaded, setPeerLoaded] = useState(false);
  const [myStream, setMyStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [micActive, setMicActive] = useState(initMic);
  const [videoActive, setVideoActive] = useState(initVideo);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Initializing...');
  const [userProfile, setUserProfile] = useState(null);
  const [meetLimits, setMeetLimits] = useState(null);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isHostUser, setIsHostUser] = useState(false);
  const [roomSettings, setRoomSettings] = useState({ allowGuests: true, blockMic: false, blockCam: false, blockedPeers: {} });
  const [meetingTimer, setMeetingTimer] = useState(0);
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  // Panel state — only one open at a time
  const [activePanel, setActivePanel] = useState(null); // 'chat' | 'participants' | 'polls' | 'settings' | null

  // Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Polls
  const [polls, setPolls] = useState([]);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollForm, setPollForm] = useState({ type: 'Poll', question: '', options: ['', ''], correctIdx: 0 });

  // Peer refs
  const peerInstance = useRef(null);
  const myPeerIdRef = useRef(null);
  const activeCalls = useRef({});
  const screenTrackRef = useRef(null);
  const hasJoinedRoomRef = useRef(false);

  // Audio refs
  const joinAudioRef = useRef(null);
  const messageAudioRef = useRef(null);
  const pollAudioRef = useRef(null);
  const ssStartAudioRef = useRef(null);
  const ssStopAudioRef = useRef(null);
  const handRaiseAudioRef = useRef(null);
  const endCallAudioRef = useRef(null);
  const errorAudioRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      joinAudioRef.current = new Audio('/sounds/join.mp3');
      messageAudioRef.current = new Audio('/sounds/message.mp3');
      pollAudioRef.current = new Audio('/sounds/notification.mp3');
      ssStartAudioRef.current = new Audio('/sounds/screenshare-start.mp3');
      ssStopAudioRef.current = new Audio('/sounds/screenshare-stop.mp3');
      handRaiseAudioRef.current = new Audio('/sounds/hand-raise.mp3');
      endCallAudioRef.current = new Audio('/sounds/end-call.mp3');
      errorAudioRef.current = new Audio('/sounds/error.mp3');
    }
  }, []);

  // Join sound
  const previousStreamCount = useRef(0);
  useEffect(() => {
    const count = Object.keys(remoteStreams).length;
    if (count > previousStreamCount.current && previousStreamCount.current > 0) {
      joinAudioRef.current?.play().catch(() => {});
    }
    previousStreamCount.current = count;
  }, [remoteStreams]);

  // Message notification
  const previousMessageCount = useRef(0);
  useEffect(() => {
    if (chatMessages.length > previousMessageCount.current && previousMessageCount.current > 0) {
      const last = chatMessages[chatMessages.length - 1];
      if (last.sender !== (userProfile?.name || 'You')) {
        messageAudioRef.current?.play().catch(() => {});
        if (activePanel !== 'chat') setUnreadCount(c => c + 1);
      }
    }
    previousMessageCount.current = chatMessages.length;
  }, [chatMessages, userProfile, activePanel]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Clear unread when chat opens
  useEffect(() => {
    if (activePanel === 'chat') setUnreadCount(0);
  }, [activePanel]);

  const notifyPeerStateChange = async (states) => {
    if (myPeerIdRef.current) {
      try { await api.updateMeetPeer(id, { peerId: myPeerIdRef.current, ...states }); } catch {}
    }
  };

  // 1. Auth check
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('sb_id_token');
    if (!token) {
      const displayName = localStorage.getItem('sb_meet_display_name');
      if (!displayName) { router.push(`/meet?code=${id}`); } else {
        const guestUid = localStorage.getItem('sb_uid') || `guest-${Math.random().toString(36).substring(2, 7)}`;
        localStorage.setItem('sb_uid', guestUid);
        setUserProfile({ uid: guestUid, name: displayName, email: 'guest@softbridge.com' });
        setAuthorized(true);
      }
      return;
    }
    const uid = localStorage.getItem('sb_uid') || 'user-1';
    const resolve = (res) => {
      if (res.success && res.user) {
        const displayName = localStorage.getItem('sb_meet_display_name') || res.user.name || 'Teammate';
        const profile = { ...res.user, name: displayName };
        setUserProfile(profile); checkMeetAccess(profile);
      } else {
        const dn = localStorage.getItem('sb_meet_display_name');
        if (!dn) { router.push(`/meet?code=${id}`); } else {
          const gid = localStorage.getItem('sb_uid') || `guest-${Math.random().toString(36).substring(2, 7)}`;
          localStorage.setItem('sb_uid', gid);
          setUserProfile({ uid: gid, name: dn, email: 'guest@softbridge.com' });
          setAuthorized(true);
        }
      }
    };
    api.getAccount(uid).then(resolve).catch(() => {
      const cp = localStorage.getItem('sb_user_profile');
      if (cp) {
        const user = JSON.parse(cp);
        const dn = localStorage.getItem('sb_meet_display_name') || user.name || 'Teammate';
        const profile = { ...user, name: dn };
        setUserProfile(profile); checkMeetAccess(profile);
      } else resolve({ success: false });
    });
  }, [id, router]);

  const checkMeetAccess = async (user) => {
    if (id.startsWith('SoftBridgeCalendar-')) {
      setAuthorized(true);
      try {
        const syncRes = await api.syncMeetState(id);
        if (!syncRes.peers || syncRes.peers.length === 0 || syncRes.peers[0].uid === user.uid) setIsHostUser(true);
      } catch {}
      return;
    }
    try {
      const [eventsRes, calsRes] = await Promise.all([api.getEvents(), api.getCalendars()]);
      const myEvents = eventsRes.success ? eventsRes.events || [] : [];
      const myCals = calsRes.success ? calsRes.calendars || [] : [];
      const evt = myEvents.find(e => e.id === id || e.location?.includes(id) || e.meeting_link?.includes(id));
      if (!evt) { if (id.startsWith('internal-')) { setAuthorized(true); setIsHostUser(true); } else setAccessDenied(true); return; }
      const isHost = myCals.some(c => c.id === evt.calendar_id);
      const isInvitee = evt.invitees?.some(inv => inv.email?.toLowerCase() === user.email?.toLowerCase());
      if (isHost) setIsHostUser(true);
      if (isInvitee || isHost || evt.allow_guests !== false) setAuthorized(true); else setAccessDenied(true);
    } catch {
      setAuthorized(true);
    }
  };

  // 2. Load PeerJS
  useEffect(() => {
    if (!authorized) return;
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/peerjs@1.4.7/dist/peerjs.min.js';
    s.async = true;
    s.onload = () => setPeerLoaded(true);
    document.body.appendChild(s);
    return () => { try { document.body.removeChild(s); } catch {} };
  }, [authorized]);

  const optimalVideo = { width: { ideal: 640, max: 1280 }, height: { ideal: 480, max: 720 }, frameRate: { ideal: 30, max: 60 } };

  // 3. Media
  useEffect(() => {
    if (!authorized) return;
    let local = null;
    
    const createEmptyStream = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1; canvas.height = 1;
      const vTrack = canvas.captureStream().getVideoTracks()[0];
      if (vTrack) vTrack.enabled = false;
      
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const dest = ctx.createMediaStreamDestination();
      const aTrack = dest.stream.getAudioTracks()[0];
      if (aTrack) aTrack.enabled = false;
      
      const tracks = [];
      if (aTrack) tracks.push(aTrack);
      if (vTrack) tracks.push(vTrack);
      return new MediaStream(tracks);
    };

    navigator.mediaDevices.getUserMedia({ video: optimalVideo, audio: true })
      .then(stream => {
        stream.getAudioTracks()[0] && (stream.getAudioTracks()[0].enabled = micActive);
        stream.getVideoTracks()[0] && (stream.getVideoTracks()[0].enabled = videoActive);
        setMyStream(stream); local = stream;
        setStatusMsg('Connecting...');
      })
      .catch(() => navigator.mediaDevices.getUserMedia({ video: false, audio: true }).then(stream => {
        stream.getAudioTracks()[0] && (stream.getAudioTracks()[0].enabled = micActive);
        setMyStream(stream); local = stream; setVideoActive(false); setStatusMsg('Connecting (Audio only)...');
      }).catch(() => {
        // Fallback to empty stream if they block both mic and cam
        const emptyStream = createEmptyStream();
        setMyStream(emptyStream); local = emptyStream;
        setVideoActive(false); setMicActive(false);
        setStatusMsg('Connecting (View only)...');
      }));
    return () => { local?.getTracks().forEach(t => t.stop()); };
  }, [authorized]);

  // 4. PeerJS + sync
  useEffect(() => {
    if (!peerLoaded || !myStream || !userProfile) return;
    const myPeerId = `sb-${id}-${userProfile.uid || 'guest'}-${Math.random().toString(36).substr(2, 5)}`;
    myPeerIdRef.current = myPeerId;
    const peer = new window.Peer(myPeerId, { debug: 1, config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] } });

    const handleDisconnect = (pId) => {
      setRemoteStreams(prev => { const next = { ...prev }; delete next[pId]; return next; });
      if (activeCalls.current[pId]) { try { activeCalls.current[pId].close(); } catch {} delete activeCalls.current[pId]; }
    };

    peer.on('open', async (rid) => {
      peerInstance.current = peer;
      try {
        const joinRes = await api.joinMeetingRoom(id, { peerId: rid, uid: userProfile.uid, name: userProfile.name || 'Teammate', avatar_url: userProfile.avatar_url });
        if (joinRes.success) {
          hasJoinedRoomRef.current = true;
          if (joinRes.limits) setMeetLimits(joinRes.limits);
          setStatusMsg('Waiting for others...');
          fetchChatAndReactions();
          api.updateMeetPeer(id, { peerId: rid, isVideoOff: !videoActive, isMuted: !micActive, avatar_url: userProfile.avatar_url }).catch(() => {});
        }
      } catch (err) {
        if (err.message?.includes('limit')) { alert(err.message); router.push('/meet'); }
        else if (err.message?.includes('Ended')) { alert('This meeting has ended.'); router.push('/meet'); }
        else setAccessDenied(true);
      }
    });

    peer.on('error', () => {});
    peer.on('call', (call) => {
      call.answer(myStream);
      activeCalls.current[call.peer] = call;
      call.on('stream', (s) => {
        api.syncMeetState(id).then(res => {
          const mp = res.peers?.find(p => p.peerId === call.peer);
          setRemoteStreams(prev => ({ ...prev, [call.peer]: { stream: s, name: mp?.name || 'Participant', avatar_url: mp?.avatar_url, isVideoOff: mp?.isVideoOff || false, isMuted: mp?.isMuted || false, isHandRaised: mp?.isHandRaised || false, isScreenSharing: mp?.isScreenSharing || false } }));
        }).catch(() => setRemoteStreams(prev => ({ ...prev, [call.peer]: { stream: s, name: 'Participant', isVideoOff: false, isMuted: false } })));
      });
      call.on('close', () => handleDisconnect(call.peer));
      call.on('error', () => handleDisconnect(call.peer));
    });

    const syncInterval = setInterval(async () => {
      if (!peerInstance.current || peerInstance.current.destroyed || !hasJoinedRoomRef.current) return;
      try {
        const res = await api.syncMeetState(id);
        if (!res.success) return;

        if (res.peers) {
          const amIHere = res.peers.find(p => p.peerId === myPeerId);
          if (!amIHere) { alert('The meeting was ended by the host.'); router.push('/calendar'); return; }

          res.peers.forEach(other => {
            if (other.peerId !== myPeerId && !activeCalls.current[other.peerId] && myPeerId < other.peerId) {
              const call = peerInstance.current.call(other.peerId, myStream);
              if (call) {
                activeCalls.current[other.peerId] = call;
                call.on('stream', s => setRemoteStreams(prev => ({ ...prev, [other.peerId]: { stream: s, name: other.name || 'Participant', avatar_url: other.avatar_url, isVideoOff: other.isVideoOff || false, isMuted: other.isMuted || false, isHandRaised: other.isHandRaised || false, isScreenSharing: other.isScreenSharing || false } })));
                call.on('close', () => handleDisconnect(other.peerId));
                call.on('error', () => handleDisconnect(other.peerId));
              }
            }
          });

          const activePeerIds = res.peers.map(p => p.peerId);
          setRemoteStreams(prev => {
            const updated = { ...prev };
            let changed = false;
            Object.keys(updated).forEach(pId => { if (!activePeerIds.includes(pId)) { delete updated[pId]; if (activeCalls.current[pId]) { try { activeCalls.current[pId].close(); } catch {} delete activeCalls.current[pId]; } changed = true; } });
            res.peers.forEach(p => { if (updated[p.peerId]) { updated[p.peerId] = { ...updated[p.peerId], name: p.name || 'Participant', avatar_url: p.avatar_url, isScreenSharing: p.isScreenSharing || false, isHandRaised: p.isHandRaised || false, isMuted: p.isMuted || false, isVideoOff: p.isVideoOff || false }; changed = true; } });
            return changed ? updated : prev;
          });

          const others = res.peers.filter(p => p.peerId !== myPeerId).length;
          setStatusMsg(others === 0 ? 'Waiting for others...' : `${others + 1} in call`);
        }

        if (res.messages) {
          let msgs = res.messages;
          if (encryptionKeyRef.current) {
            msgs = await Promise.all(msgs.map(async m => {
              if (m.isEncrypted && !m.decrypted) { const pt = await decryptPayload(m.text, encryptionKeyRef.current); return { ...m, text: pt || '[Encrypted]', decrypted: !!pt }; }
              return m;
            }));
          }
          setChatMessages(msgs);
        }

        if (res.reactions?.length) {
          const now = Date.now();
          const incoming = res.reactions.filter(r => now - new Date(r.timestamp).getTime() < 5000);
          setFloatingReactions(prev => {
            const ids = prev.map(p => p.id);
            const newE = incoming.map(r => ({ id: `${r.sender}-${r.timestamp}`, emoji: r.emoji, sender: r.sender })).filter(n => !ids.includes(n.id));
            return [...prev, ...newE].slice(-10);
          });
        }

        if (res.polls) {
          let pp = res.polls;
          if (encryptionKeyRef.current) {
            pp = await Promise.all(pp.map(async poll => {
              if (poll.isEncrypted && !poll.decrypted) {
                const pq = await decryptPayload(poll.question, encryptionKeyRef.current);
                const po = await Promise.all(poll.options.map(async opt => { const pt = await decryptPayload(opt.text, encryptionKeyRef.current); return { ...opt, text: pt || '[Encrypted]' }; }));
                return { ...poll, question: pq || '[Encrypted]', options: po, decrypted: true };
              }
              return poll;
            }));
          }
          setPolls(prev => {
            const hasNew = pp.some(p => p.active && !prev.find(x => x.id === p.id));
            if (hasNew) { pollAudioRef.current?.play().catch(() => {}); setActivePanel('polls'); }
            return pp;
          });
        }

        if (res.settings) {
          setRoomSettings(res.settings);
          const bs = res.settings.blockedPeers?.[myPeerId] || {};
          if (res.settings.blockMic || bs.mic) {
            const at = myStream?.getAudioTracks()[0];
            if (at?.enabled) { at.enabled = false; setMicActive(false); api.updateMeetPeer(id, { peerId: myPeerId, isMuted: true }).catch(() => {}); }
          }
          if (res.settings.blockCam || bs.cam) {
            const vt = myStream?.getVideoTracks()[0];
            if (vt?.enabled) { vt.enabled = false; setVideoActive(false); api.updateMeetPeer(id, { peerId: myPeerId, isVideoOff: true }).catch(() => {}); }
          }
        }
      } catch {}
    }, 1500);

    return () => {
      clearInterval(syncInterval);
      peerInstance.current?.destroy();
      if (myPeerIdRef.current) api.leaveMeetingRoom(id, { peerId: myPeerIdRef.current }).catch(() => {});
    };
  }, [peerLoaded, myStream, userProfile, id]);

  const fetchChatAndReactions = async () => {
    try {
      const [cr, rr] = await Promise.all([api.getMeetMessages(id), api.getMeetReactions(id)]);
      if (cr.success) setChatMessages(cr.messages);
    } catch {}
  };

  // Meeting timer
  useEffect(() => {
    const t = setInterval(() => setMeetingTimer(p => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // AFK
  useEffect(() => {
    let afkTimer;
    const LIMIT = 300000;
    const reset = () => { clearTimeout(afkTimer); afkTimer = setTimeout(afk, LIMIT); };
    const afk = () => {
      if (myStream) {
        let ch = false;
        const vt = myStream.getVideoTracks()[0]; if (vt?.enabled) { vt.enabled = false; setVideoActive(false); ch = true; }
        const at = myStream.getAudioTracks()[0]; if (at?.enabled) { at.enabled = false; setMicActive(false); ch = true; }
        if (ch) { notifyPeerStateChange({ isVideoOff: true, isMuted: true }); }
      }
    };
    ['mousemove', 'keydown', 'click'].forEach(ev => window.addEventListener(ev, reset));
    afkTimer = setTimeout(afk, LIMIT);
    return () => { ['mousemove', 'keydown', 'click'].forEach(ev => window.removeEventListener(ev, reset)); clearTimeout(afkTimer); };
  }, [myStream]);

  // Floating reactions cleanup
  useEffect(() => {
    if (floatingReactions.length > 0) {
      const t = setTimeout(() => setFloatingReactions(p => p.slice(1)), 3500);
      return () => clearTimeout(t);
    }
  }, [floatingReactions]);

  const fmt = (sec) => `${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`;

  // Controls
  const toggleMic = () => {
    const bs = roomSettings.blockedPeers?.[myPeerIdRef.current] || {};
    if (roomSettings.blockMic || bs.mic) return;
    const at = myStream?.getAudioTracks()[0];
    if (at) { at.enabled = !at.enabled; setMicActive(at.enabled); notifyPeerStateChange({ isMuted: !at.enabled }); }
  };

  const toggleVideo = async () => {
    const bs = roomSettings.blockedPeers?.[myPeerIdRef.current] || {};
    if (roomSettings.blockCam || bs.cam) return;
    const vt = myStream?.getVideoTracks()[0];
    if (vt) { vt.enabled = !vt.enabled; setVideoActive(vt.enabled); notifyPeerStateChange({ isVideoOff: !vt.enabled }); }
    else if (myStream) {
      try {
        const ts = await navigator.mediaDevices.getUserMedia({ video: optimalVideo });
        const nv = ts.getVideoTracks()[0];
        if (nv) {
          myStream.addTrack(nv); setVideoActive(true); notifyPeerStateChange({ isVideoOff: false });
          Object.values(activeCalls.current).forEach(call => {
            const s = call.peerConnection.getSenders().find(s => s.track?.kind === 'video' || s.track === null);
            if (s) s.replaceTrack(nv);
          });
        }
      } catch {}
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const ss = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const st = ss.getVideoTracks()[0];
        screenTrackRef.current = st;
        if (myStream) { const ov = myStream.getVideoTracks()[0]; if (ov) { myStream.removeTrack(ov); ov.stop(); } myStream.addTrack(st); }
        Object.values(activeCalls.current).forEach(call => {
          const sender = call.peerConnection.getSenders().find(s => s.track?.kind === 'video' || s.track === null);
          if (sender) sender.replaceTrack(st);
        });
        st.onended = () => stopScreenSharing();
        setIsScreenSharing(true); ssStartAudioRef.current?.play().catch(() => {}); notifyPeerStateChange({ isScreenSharing: true });
      } catch { errorAudioRef.current?.play().catch(() => {}); }
    } else stopScreenSharing();
  };

  const stopScreenSharing = async () => {
    screenTrackRef.current?.stop(); screenTrackRef.current = null;
    try {
      const cs = await navigator.mediaDevices.getUserMedia({ video: videoActive ? optimalVideo : false, audio: true });
      const nv = cs.getVideoTracks()[0];
      if (myStream) { const ot = myStream.getVideoTracks()[0]; if (ot) { myStream.removeTrack(ot); ot.stop(); } if (nv) myStream.addTrack(nv); }
      Object.values(activeCalls.current).forEach(call => {
        const sender = call.peerConnection.getSenders().find(s => s.track?.kind === 'video' || s.track === null);
        if (sender && nv) sender.replaceTrack(nv);
      });
      setIsScreenSharing(false); ssStopAudioRef.current?.play().catch(() => {}); notifyPeerStateChange({ isScreenSharing: false });
    } catch { errorAudioRef.current?.play().catch(() => {}); }
  };

  const toggleHandRaise = async () => {
    const next = !isHandRaised; setIsHandRaised(next);
    if (next) handRaiseAudioRef.current?.play().catch(() => {});
    await notifyPeerStateChange({ isHandRaised: next });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const pt = newMessage.trim(); setNewMessage('');
    let ct = pt;
    if (encryptionKeyRef.current) { const enc = await encryptPayload(pt, encryptionKeyRef.current); if (enc) ct = enc; }
    try {
      const res = await api.sendMeetMessage(id, { sender: userProfile?.name || 'Teammate', text: ct, isEncrypted: !!encryptionKeyRef.current });
      if (res.success) setChatMessages(prev => [...prev, { ...res.message, text: pt, decrypted: true }]);
    } catch {}
  };

  const handleSendReaction = async (emoji) => {
    setShowReactionPicker(false);
    try {
      await api.sendMeetReaction(id, { emoji, sender: userProfile?.name || 'Teammate' });
      setFloatingReactions(prev => [...prev, { id: `local-${Date.now()}`, emoji, sender: userProfile?.name || 'You' }]);
    } catch { errorAudioRef.current?.play().catch(() => {}); }
  };

  const toggleBlockPeer = async (pId, device) => {
    const cur = roomSettings.blockedPeers?.[pId] || {};
    try {
      const res = await api.updateMeetSettings(id, { blockedPeers: { [pId]: { ...cur, [device]: !cur[device] } } });
      if (res.success) setRoomSettings(res.settings);
    } catch {}
  };

  const toggleGlobal = async (key, val) => {
    try {
      const res = await api.updateMeetSettings(id, { [key]: val });
      if (res.success) setRoomSettings(res.settings);
    } catch {}
  };

  const endCall = () => {
    endCallAudioRef.current?.play().catch(() => {});
    peerInstance.current?.destroy();
    if (isHostUser) api.endMeetingRoom(id).catch(() => {});
    else if (myPeerIdRef.current) api.leaveMeetingRoom(id, { peerId: myPeerIdRef.current }).catch(() => {});
    router.push('/calendar');
  };

  const togglePanel = (name) => setActivePanel(p => p === name ? null : name);
  const remotePeerIds = Object.keys(remoteStreams);

  // ─── Access Denied ────────────────────────────────────────────────────────
  if (accessDenied) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: C.bg, color: C.text, gap: '1.25rem', textAlign: 'center', padding: '2rem' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: C.danger }}>lock</span>
      </div>
      <h2 style={{ fontWeight: 800, fontSize: '1.4rem', color: C.danger, margin: 0 }}>Access Restricted</h2>
      <p style={{ color: C.muted, maxWidth: 380, fontSize: '0.9rem', margin: 0 }}>This meeting is private. You need an invitation to join this room.</p>
      <button onClick={() => router.push('/calendar')} style={{ padding: '0.65rem 1.75rem', background: C.accent, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>Go to Calendar</button>
    </div>
  );

  if (!authorized) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: C.bg, color: C.muted }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${C.accent}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: '0.9rem' }}>Authenticating...</span>
      </div>
    </div>
  );

  // ─── Main Layout ──────────────────────────────────────────────────────────
  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: C.bg,
      color: C.text,
      fontFamily: "'Inter', -apple-system, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>

      {/* ── Top Bar ── */}
      <div style={{
        height: 56,
        background: C.sidebar,
        borderBottom: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 1.25rem',
        gap: '1rem',
        flexShrink: 0,
        zIndex: 10
      }}>
        {/* Back */}
        <button onClick={endCall} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: 6 }}
          onMouseEnter={e => e.currentTarget.style.color = C.text} onMouseLeave={e => e.currentTarget.style.color = C.muted}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>arrow_back</span>
        </button>

        {/* Logo */}
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${C.accent}, #7c3aed)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: '#fff' }}>video_call</span>
        </div>

        {/* Room name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {id?.replace('SoftBridgeCalendar-', '').replace('internal-', '') || 'Meeting'}
          </div>
        </div>

        {/* Timer + Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, padding: '3px 12px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.success, animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: C.success }}>{fmt(meetingTimer)}</span>
          </div>
          <span style={{ fontSize: '0.78rem', color: C.muted }}>{statusMsg}</span>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <IconBtn icon="content_copy" label="Copy link" size={34} onClick={() => { if (typeof window !== 'undefined') { navigator.clipboard.writeText(window.location.href); } }} />
          {userProfile && <Avatar name={userProfile.name} avatar_url={userProfile.avatar_url} size={32} />}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>

        {/* ── Video Area ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minWidth: 0 }}>

          {/* Video Grid */}
          <VideoGrid
            remotePeerIds={remotePeerIds}
            remoteStreams={remoteStreams}
            localStream={myStream}
            videoActive={videoActive}
            micActive={micActive}
            userProfile={userProfile}
            isLocalScreenSharing={isScreenSharing}
          />

          {/* Floating Reactions */}
          <div style={{ position: 'absolute', bottom: '7rem', left: '1.5rem', pointerEvents: 'none', zIndex: 20, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {floatingReactions.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', padding: '0.35rem 0.75rem', borderRadius: 20, border: `1px solid ${C.border}`, animation: 'floatUp 3.5s ease-out forwards', fontSize: '0.82rem' }}>
                <span style={{ fontSize: '1.1rem' }}>{r.emoji}</span>
                <span style={{ color: '#d4d4d8', fontWeight: 600 }}>{r.sender}</span>
              </div>
            ))}
          </div>

          {/* ── Control Bar ── */}
          <div style={{
            position: 'absolute', bottom: '1.25rem', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(15,16,23,0.92)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${C.border}`,
            borderRadius: '28px',
            padding: '0.75rem 1.5rem',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
            zIndex: 10,
            flexWrap: 'wrap',
            maxWidth: 'calc(100% - 3rem)'
          }}>
            {/* Mic */}
            <IconBtn icon={micActive ? 'mic' : 'mic_off'} label={micActive ? 'Mute' : 'Unmute'} active={micActive} danger={!micActive} onClick={toggleMic} />
            {/* Camera */}
            <IconBtn icon={videoActive ? 'videocam' : 'videocam_off'} label={videoActive ? 'Stop camera' : 'Start camera'} active={videoActive} danger={!videoActive} onClick={toggleVideo} />
            {/* Screen share */}
            <IconBtn icon={isScreenSharing ? 'stop_screen_share' : 'screen_share'} label={isScreenSharing ? 'Stop sharing' : 'Share screen'} active={isScreenSharing} onClick={toggleScreenShare} style={{ background: isScreenSharing ? `rgba(16,185,129,0.2)` : undefined, color: isScreenSharing ? C.success : C.text }} />

            <div style={{ width: 1, height: 28, background: C.border, marginLeft: 4, marginRight: 4 }} />

            {/* Raise hand */}
            <IconBtn icon="back_hand" label={isHandRaised ? 'Lower hand' : 'Raise hand'} active={isHandRaised} onClick={toggleHandRaise} style={{ background: isHandRaised ? 'rgba(245,158,11,0.2)' : undefined, color: isHandRaised ? C.amber : C.text }} />

            {/* Reactions */}
            <div style={{ position: 'relative' }}>
              <IconBtn icon="add_reaction" label="Reactions" active={showReactionPicker} onClick={() => setShowReactionPicker(p => !p)} />
              {showReactionPicker && (
                <div style={{
                  position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(15,16,23,0.95)', backdropFilter: 'blur(16px)',
                  border: `1px solid ${C.border}`, borderRadius: 16,
                  padding: '0.6rem 0.85rem',
                  display: 'flex', gap: '0.5rem',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                  animation: 'modalIn 0.18s ease'
                }}>
                  {['👍','👏','🎉','❤️','🔥','💡','😮','🙌'].map(e => (
                    <button key={e} onClick={() => handleSendReaction(e)} style={{ fontSize: '1.35rem', background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.15s', borderRadius: 8, padding: '4px' }}
                      onMouseEnter={el => el.currentTarget.style.transform = 'scale(1.3)'}
                      onMouseLeave={el => el.currentTarget.style.transform = 'none'}>
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ width: 1, height: 28, background: C.border, marginLeft: 4, marginRight: 4 }} />

            {/* Participants */}
            <PillBtn icon="group" label={`Participants${remotePeerIds.length > 0 ? ` (${remotePeerIds.length + 1})` : ''}`} active={activePanel === 'participants'} onClick={() => togglePanel('participants')} />
            {/* Chat */}
            <div style={{ position: 'relative' }}>
              <PillBtn icon="chat" label="Chat" active={activePanel === 'chat'} onClick={() => togglePanel('chat')} />
              {unreadCount > 0 && activePanel !== 'chat' && (
                <div style={{ position: 'absolute', top: -4, right: -4, background: C.danger, color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</div>
              )}
            </div>
            {/* Polls */}
            <PillBtn icon="poll" label="Polls" active={activePanel === 'polls'} onClick={() => togglePanel('polls')} />
            {/* Settings */}
            <PillBtn icon="settings" label="Settings" active={activePanel === 'settings'} onClick={() => togglePanel('settings')} />

            <div style={{ width: 1, height: 28, background: C.border, marginLeft: 4, marginRight: 4 }} />

            {/* End call */}
            <button onClick={endCall} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0 1.25rem', height: 42,
              background: C.danger, color: '#fff', border: 'none',
              borderRadius: 21, cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem',
              transition: 'all 0.18s'
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
              onMouseLeave={e => e.currentTarget.style.background = C.danger}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>call_end</span>
              {isHostUser ? 'End' : 'Leave'}
            </button>
          </div>
        </div>

        {/* ── Side Panels ── */}
        {activePanel === 'chat' && (
          <Drawer title="Chat Room" onClose={() => setActivePanel(null)}>
            {/* Messages */}
            <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', minHeight: 0, overflowY: 'auto', height: 'calc(100vh - 56px - 70px - 4rem)' }}>
              {chatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', color: C.muted, fontSize: '0.85rem', marginTop: '3rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem', color: '#374151' }}>chat_bubble_outline</span>
                  No messages yet. Say hello!
                </div>
              ) : chatMessages.map((msg, idx) => {
                const isMe = msg.sender === (userProfile?.name || 'You');
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: '0.25rem' }}>
                    {!isMe && <span style={{ fontSize: '0.7rem', color: C.muted, paddingLeft: '0.5rem', fontWeight: 600 }}>{msg.sender}</span>}
                    <div style={{
                      maxWidth: '82%', padding: '0.65rem 0.9rem',
                      background: isMe ? C.accent : C.card,
                      borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      fontSize: '0.875rem', color: '#f1f5f9',
                      wordBreak: 'break-word',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}>
                      {msg.text}
                    </div>
                    <span style={{ fontSize: '0.65rem', color: '#374151', paddingLeft: isMe ? 0 : '0.5rem', paddingRight: isMe ? '0.5rem' : 0 }}>
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
            {/* Input */}
            <form onSubmit={handleSendMessage} style={{ padding: '0.85rem 1rem', borderTop: `1px solid ${C.border}`, display: 'flex', gap: '0.6rem', alignItems: 'center', flexShrink: 0, background: C.sidebar }}>
              <input
                type="text" placeholder="Message..."
                value={newMessage} onChange={e => setNewMessage(e.target.value)}
                style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: '0.6rem 1rem', color: C.text, fontSize: '0.87rem', outline: 'none' }}
              />
              <button type="submit" style={{ width: 38, height: 38, borderRadius: '50%', background: C.accent, border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>send</span>
              </button>
            </form>
          </Drawer>
        )}

        {activePanel === 'participants' && (
          <Drawer title={`Participants — ${remotePeerIds.length + 1}`} onClose={() => setActivePanel(null)}>
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Host controls */}
              {isHostUser && (
                <div style={{ background: 'rgba(79,126,247,0.07)', border: `1px solid rgba(79,126,247,0.18)`, borderRadius: 12, padding: '1rem', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.85rem' }}>Host Controls</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <Toggle checked={roomSettings.allowGuests !== false} onChange={v => toggleGlobal('allowGuests', v)} label="Allow guests" />
                    <Toggle checked={!!roomSettings.blockMic} onChange={v => toggleGlobal('blockMic', v)} label="Mute all microphones" />
                    <Toggle checked={!!roomSettings.blockCam} onChange={v => toggleGlobal('blockCam', v)} label="Disable all cameras" />
                  </div>
                </div>
              )}

              {/* Self */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: C.card, borderRadius: 12, border: `1px solid ${C.border}` }}>
                <div style={{ position: 'relative' }}>
                  <Avatar name={userProfile?.name} avatar_url={userProfile?.avatar_url} size={36} color={C.accent} />
                  {isHandRaised && <span style={{ position: 'absolute', bottom: -3, right: -3, fontSize: '0.75rem' }}>✋</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.87rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userProfile?.name || 'You'}</div>
                  <div style={{ fontSize: '0.7rem', color: C.accent }}>{isHostUser ? 'Host · You' : 'You'}</div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {!micActive && <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', color: C.danger }}>mic_off</span>}
                  {!videoActive && <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', color: C.muted }}>videocam_off</span>}
                </div>
              </div>

              {/* Remote peers */}
              {remotePeerIds.map(pId => {
                const item = remoteStreams[pId] || {};
                const blocked = roomSettings.blockedPeers?.[pId] || {};
                return (
                  <div key={pId} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: `1px solid rgba(255,255,255,0.04)` }}>
                    <div style={{ position: 'relative' }}>
                      <Avatar name={item.name || 'P'} avatar_url={item.avatar_url} size={36} />
                      {item.isHandRaised && <span style={{ position: 'absolute', bottom: -3, right: -3, fontSize: '0.75rem' }}>✋</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.87rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name || 'Participant'}</div>
                      <div style={{ fontSize: '0.7rem', color: C.muted }}>{item.isScreenSharing ? 'Screen sharing' : 'Connected'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {item.isMuted && <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', color: C.danger }}>mic_off</span>}
                      {item.isVideoOff && <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', color: C.muted }}>videocam_off</span>}
                      {isHostUser && (
                        <>
                          <button onClick={() => toggleBlockPeer(pId, 'mic')} style={{ background: blocked.mic ? C.danger : 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>{blocked.mic ? 'mic_off' : 'mic'}</span>
                          </button>
                          <button onClick={() => toggleBlockPeer(pId, 'cam')} style={{ background: blocked.cam ? C.danger : 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>{blocked.cam ? 'videocam_off' : 'videocam'}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Drawer>
        )}

        {activePanel === 'polls' && (
          <Drawer title="Polls & Quizzes" onClose={() => setActivePanel(null)}>
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {isHostUser && (
                <button
                  onClick={() => setShowPollModal(true)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem', background: 'rgba(79,126,247,0.15)', border: `1px dashed rgba(79,126,247,0.4)`, borderRadius: 12, color: C.accent, cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.18s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,126,247,0.25)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(79,126,247,0.15)'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>add_circle</span>
                  Create Poll / Quiz
                </button>
              )}
              {polls.length === 0 && (
                <div style={{ textAlign: 'center', color: C.muted, fontSize: '0.85rem', marginTop: '2rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem', color: '#374151' }}>poll</span>
                  No active polls
                </div>
              )}
              {polls.map((poll, i) => {
                const totalVotes = poll.options.reduce((s, o) => s + o.votes.length, 0);
                return (
                  <div key={poll.id || i} style={{ background: C.card, borderRadius: 14, padding: '1rem', border: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: poll.type === 'Quiz' ? C.amber : C.accent }}>{poll.type || 'Poll'}</span>
                      {!poll.active && <span style={{ fontSize: '0.65rem', color: C.muted, background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 10 }}>Ended</span>}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.85rem', color: C.text }}>{poll.question}</div>
                    {poll.options.map((opt, idx) => {
                      const pct = totalVotes === 0 ? 0 : Math.round((opt.votes.length / totalVotes) * 100);
                      const myVote = opt.votes.includes(userProfile?.uid);
                      const isQuiz = poll.type === 'Quiz';
                      const isCorrect = isQuiz && poll.correctOptionIndex === idx;
                      const closed = isQuiz && !poll.active;
                      let barColor = C.accent;
                      let bg = myVote ? 'rgba(79,126,247,0.15)' : 'rgba(255,255,255,0.04)';
                      let border = myVote ? `1px solid rgba(79,126,247,0.4)` : `1px solid transparent`;
                      if (closed) { if (isCorrect) { barColor = C.success; bg = 'rgba(16,185,129,0.1)'; border = `1px solid rgba(16,185,129,0.3)`; } else if (myVote) { barColor = C.danger; bg = 'rgba(239,68,68,0.1)'; border = `1px solid rgba(239,68,68,0.3)`; } }
                      return (
                        <div key={idx} style={{ marginBottom: '0.6rem' }}>
                          <button onClick={() => poll.active && api.voteMeetPoll(id, { pollId: poll.id, optionIndex: idx, uid: userProfile?.uid })} style={{ width: '100%', textAlign: 'left', padding: '0.6rem 0.85rem', background: bg, border, borderRadius: 9, color: C.text, cursor: poll.active ? 'pointer' : 'default', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', transition: 'all 0.18s' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {opt.text}
                              {closed && isCorrect && <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', color: C.success }}>check_circle</span>}
                            </span>
                            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: C.muted }}>{pct}%</span>
                          </button>
                          <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 2, transition: 'width 0.4s ease' }} />
                          </div>
                        </div>
                      );
                    })}
                    {isHostUser && poll.active && (
                      <button onClick={() => api.createMeetPoll(id, { action: 'close', pollId: poll.id })} style={{ marginTop: '0.5rem', width: '100%', padding: '0.55rem', background: 'rgba(239,68,68,0.15)', color: C.danger, border: `1px solid rgba(239,68,68,0.3)`, borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                        End {poll.type || 'Poll'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </Drawer>
        )}

        {activePanel === 'settings' && (
          <Drawer title="Meeting Settings" onClose={() => setActivePanel(null)}>
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Share */}
              <div style={{ background: C.card, borderRadius: 12, padding: '1rem', border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.85rem' }}>Share Meeting</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input readOnly value={typeof window !== 'undefined' ? window.location.href : id} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '0.5rem 0.75rem', color: C.text, fontSize: '0.78rem', outline: 'none' }} />
                  <button onClick={() => { if (typeof window !== 'undefined') navigator.clipboard.writeText(window.location.href); }} style={{ background: C.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '0 0.85rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>Copy</button>
                </div>
              </div>
              {/* E2EE Info */}
              <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: C.success }}>lock</span>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: C.success }}>End-to-End Encrypted</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: C.muted, lineHeight: 1.5 }}>All chat messages and polls are encrypted with a key derived from your meeting URL hash. Keys are never stored on the server.</p>
              </div>
              {/* Host moderator settings */}
              {isHostUser && (
                <div style={{ background: 'rgba(79,126,247,0.07)', border: `1px solid rgba(79,126,247,0.18)`, borderRadius: 12, padding: '1rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.85rem' }}>Moderation</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <Toggle checked={roomSettings.allowGuests !== false} onChange={v => toggleGlobal('allowGuests', v)} label="Allow guest access" />
                    <Toggle checked={!!roomSettings.blockMic} onChange={v => toggleGlobal('blockMic', v)} label="Mute all microphones" />
                    <Toggle checked={!!roomSettings.blockCam} onChange={v => toggleGlobal('blockCam', v)} label="Disable all cameras" />
                  </div>
                </div>
              )}
              {/* Limits */}
              {meetLimits && (
                <div style={{ background: C.card, borderRadius: 12, padding: '1rem', border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Usage</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem', color: C.muted }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Meetings remaining</span>
                      <span style={{ color: C.text, fontWeight: 600 }}>{meetLimits.meetingsRemaining ?? '∞'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Plan</span>
                      <span style={{ color: C.accent, fontWeight: 600, textTransform: 'capitalize' }}>{meetLimits.isPremium ? 'Premium' : 'Free'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Drawer>
        )}
      </div>

      {/* ── Poll Creation Modal ── */}
      {showPollModal && (
        <Modal title={`Create ${pollForm.type}`} onClose={() => setShowPollModal(false)}>
          {/* Type selector */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {['Poll', 'Quiz'].map(t => (
              <button key={t} onClick={() => setPollForm(f => ({ ...f, type: t }))} style={{ flex: 1, padding: '0.6rem', borderRadius: 10, border: pollForm.type === t ? (t === 'Quiz' ? `1px solid ${C.amber}` : `1px solid ${C.accent}`) : `1px solid ${C.border}`, background: pollForm.type === t ? (t === 'Quiz' ? 'rgba(245,158,11,0.15)' : 'rgba(79,126,247,0.15)') : 'transparent', color: pollForm.type === t ? (t === 'Quiz' ? C.amber : C.accent) : C.muted, cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', transition: 'all 0.18s' }}>
                {t === 'Poll' ? '📊 Poll' : '🧠 Quiz'}
              </button>
            ))}
          </div>

          {/* Question */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', color: C.muted, marginBottom: '0.4rem', fontWeight: 600 }}>Question</label>
            <input type="text" placeholder={`${pollForm.type} question...`} value={pollForm.question} onChange={e => setPollForm(f => ({ ...f, question: e.target.value }))}
              style={{ width: '100%', padding: '0.75rem 0.9rem', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {/* Options */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', color: C.muted, marginBottom: '0.6rem', fontWeight: 600 }}>Options {pollForm.type === 'Quiz' && '(select correct answer)'}</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {pollForm.options.map((opt, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                  {pollForm.type === 'Quiz' && (
                    <button onClick={() => setPollForm(f => ({ ...f, correctIdx: idx }))} style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${pollForm.correctIdx === idx ? C.success : C.border}`, background: pollForm.correctIdx === idx ? C.success : 'transparent', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {pollForm.correctIdx === idx && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                    </button>
                  )}
                  <input type="text" placeholder={`Option ${idx + 1}`} value={opt} onChange={e => { const opts = [...pollForm.options]; opts[idx] = e.target.value; setPollForm(f => ({ ...f, options: opts })); }}
                    style={{ flex: 1, padding: '0.6rem 0.85rem', background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, fontSize: '0.87rem', outline: 'none' }} />
                  {pollForm.options.length > 2 && (
                    <button onClick={() => { const opts = pollForm.options.filter((_, i) => i !== idx); setPollForm(f => ({ ...f, options: opts, correctIdx: Math.min(f.correctIdx, opts.length - 1) })); }} style={{ background: 'none', border: 'none', color: C.danger, cursor: 'pointer', display: 'flex', padding: 2 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>remove_circle</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
            {pollForm.options.length < 4 && (
              <button onClick={() => setPollForm(f => ({ ...f, options: [...f.options, ''] }))} style={{ marginTop: '0.75rem', background: 'none', border: 'none', color: C.accent, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add_circle</span> Add option
              </button>
            )}
          </div>

          <button
            onClick={async () => {
              const validOpts = pollForm.options.filter(o => o.trim());
              if (!pollForm.question.trim() || validOpts.length < 2) return;
              let cq = pollForm.question, co = validOpts;
              if (encryptionKeyRef.current) {
                const eq = await encryptPayload(pollForm.question, encryptionKeyRef.current); if (eq) cq = eq;
                co = await Promise.all(validOpts.map(async o => { const eo = await encryptPayload(o, encryptionKeyRef.current); return eo || o; }));
              }
              await api.createMeetPoll(id, { action: 'create', type: pollForm.type, question: cq, options: co, correctOptionIndex: pollForm.type === 'Quiz' ? pollForm.correctIdx : undefined, isEncrypted: !!encryptionKeyRef.current });
              setPollForm({ type: 'Poll', question: '', options: ['', ''], correctIdx: 0 });
              setShowPollModal(false);
            }}
            style={{ width: '100%', padding: '0.85rem', background: pollForm.type === 'Quiz' ? C.amber : C.accent, color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', transition: 'opacity 0.18s' }}
          >
            🚀 Launch {pollForm.type}
          </button>
        </Modal>
      )}

      {/* ── Global Styles ── */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Inter', -apple-system, sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

        @keyframes floatUp {
          0% { opacity: 0; transform: translateY(16px) scale(0.9); }
          10% { opacity: 1; transform: translateY(0) scale(1); }
          85% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-60px) scale(0.95); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.94) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes audioBar {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1.5); }
        }

        .meet-control-btn {
          transition: all 0.18s cubic-bezier(.4,0,.2,1);
        }
        .meet-control-btn:hover {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}
