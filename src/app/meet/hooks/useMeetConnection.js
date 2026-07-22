import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { encryptPayload, decryptPayload } from '@/lib/crypto';
import { io } from 'socket.io-client';

const getApiUrl = () => {
  if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__.NEXT_PUBLIC_API_URL) return window.__ENV__.NEXT_PUBLIC_API_URL;
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
};

export function useMeetConnection({ id, router, searchParams, encryptionKeyRef, activePanel, setActivePanel }) {
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
  const [networkPing, setNetworkPing] = useState(0);

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
  const dataConns = useRef({});
  const screenTrackRef = useRef(null);
  const hasJoinedRoomRef = useRef(false);
  const socketRef = useRef(null);

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

  // 2b. Load Socket.io connection for real-time signaling/reactions
  useEffect(() => {
    if (!authorized || !userProfile) return;

    const url = getApiUrl();
    const socket = io(`${url}/workspace/ping`, {
      auth: { token: userProfile.uid || 'guest' },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_meet', id);
    });

    // Deduplicate reactions seen via data channel vs socket
    const seenReactionIds = new Set();

    socket.on('meet_reaction', (data) => {
      const rid = data.id || `${data.sender}-${data.emoji}-${Date.now()}`;
      if (seenReactionIds.has(rid)) return; // already shown via data channel
      seenReactionIds.add(rid);
      setTimeout(() => seenReactionIds.delete(rid), 5000); // cleanup after 5s
      setFloatingReactions(prev => {
        const newE = { id: rid, emoji: data.emoji, sender: data.sender };
        return [...prev, newE].slice(-10);
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [authorized, userProfile, id]);

  const optimalVideo = { width: { ideal: 640, max: 1280 }, height: { ideal: 480, max: 720 }, frameRate: { ideal: 30, max: 60 } };

  // 3. Media
  useEffect(() => {
    if (!authorized) return;
    let local = null;
    
    const createEmptyStream = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1; canvas.height = 1;
      const vTrack = canvas.captureStream().getVideoTracks()[0];
      if (vTrack) { vTrack.enabled = false; vTrack.isDummy = true; }
      
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const dest = ctx.createMediaStreamDestination();
      const aTrack = dest.stream.getAudioTracks()[0];
      if (aTrack) { aTrack.enabled = false; aTrack.isDummy = true; }
      
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

    // Default ICE config — STUN only, used as fallback if TURN credential fetch fails
    const defaultIceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ];

    // Cleanup refs — must survive the async boundary
    let syncInterval = null;
    let destroyed = false;

    const setupPeer = (peer) => {

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
          else if (err.message?.includes('Ended')) { router.push('/home'); }
          else setAccessDenied(true);
        }
      });

      peer.on('error', () => {});

      const handleIncomingData = async (data) => {
        try {
          if (typeof data === 'string') data = JSON.parse(data);
        } catch (e) {}

        if (data.type === 'reaction') {
          setFloatingReactions(prev => {
            const newE = { id: data.id || `${data.sender}-${Date.now()}`, emoji: data.emoji, sender: data.sender };
            return [...prev, newE].slice(-10);
          });
        } else if (data.type === 'chat') {
          let text = data.text;
          if (data.isEncrypted && encryptionKeyRef.current) {
            const dec = await decryptPayload(text, encryptionKeyRef.current);
            text = dec || '[Encrypted]';
          }
          setChatMessages(prev => [...prev, {
            id: data.id,
            sender: data.sender,
            text,
            timestamp: data.timestamp,
            decrypted: !!encryptionKeyRef.current
          }]);
        } else if (data.type === 'handRaise') {
          setRemoteStreams(prev => {
            if (!prev[data.peerId]) return prev;
            return { ...prev, [data.peerId]: { ...prev[data.peerId], isHandRaised: data.isHandRaised } };
          });
        }
      };

      peer.on('connection', (conn) => {
        conn.on('data', handleIncomingData);
        dataConns.current[conn.peer] = conn;
      });

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

      syncInterval = setInterval(async () => {
        if (!peerInstance.current || peerInstance.current.destroyed || !hasJoinedRoomRef.current) return;
        try {
          const res = await api.syncMeetState(id);
          if (!res.success) return;

          if (res.peers) {
            const amIHere = res.peers.find(p => p.peerId === myPeerId);
            if (!amIHere) { router.push('/home'); return; }

            res.peers.forEach(other => {
              if (other.peerId !== myPeerId && !activeCalls.current[other.peerId] && myPeerId < other.peerId) {
                const call = peerInstance.current.call(other.peerId, myStream);
                if (call) {
                  activeCalls.current[other.peerId] = call;
                  call.on('stream', s => setRemoteStreams(prev => ({ ...prev, [other.peerId]: { stream: s, name: other.name || 'Participant', avatar_url: other.avatar_url, isVideoOff: other.isVideoOff || false, isMuted: other.isMuted || false, isHandRaised: other.isHandRaised || false, isScreenSharing: other.isScreenSharing || false } })));
                  call.on('close', () => handleDisconnect(other.peerId));
                  call.on('error', () => handleDisconnect(other.peerId));
                }

                if (!dataConns.current[other.peerId]) {
                  const conn = peerInstance.current.connect(other.peerId);
                  conn.on('data', handleIncomingData);
                  dataConns.current[other.peerId] = conn;
                }
              }
            });

            const activePeerIds = res.peers.map(p => p.peerId);
            setRemoteStreams(prev => {
              const updated = { ...prev };
              let changed = false;
              Object.keys(updated).forEach(pId => { if (!activePeerIds.includes(pId)) { delete updated[pId]; if (activeCalls.current[pId]) { try { activeCalls.current[pId].close(); } catch {} delete activeCalls.current[pId]; } if (dataConns.current[pId]) { try { dataConns.current[pId].close(); } catch {} delete dataConns.current[pId]; } changed = true; } });
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

          // Meet reactions are handled purely client-side/peer-to-peer, no backend sync.

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
    };

    const startPeer = (iceServers) => {
      if (destroyed) return;
      const peer = new window.Peer(myPeerId, {
        debug: 1,
        config: {
          iceServers,
          iceCandidatePoolSize: 10,
        }
      });
      peerInstance.current = peer;
      setupPeer(peer);
    };

    // Fetch temporary TURN credentials from Cloudflare via our Next.js API route
    fetch('/api/turn')
      .then(r => r.json())
      .then(res => {
        if (res.success && res.iceServers) {
          startPeer(res.iceServers);
        } else {
          console.warn('[Meet] TURN credentials unavailable, falling back to STUN only');
          startPeer(defaultIceServers);
        }
      })
      .catch(() => {
        console.warn('[Meet] Could not reach TURN credential endpoint, falling back to STUN only');
        startPeer(defaultIceServers);
      });

    return () => {
      destroyed = true;
      if (syncInterval) clearInterval(syncInterval);
      peerInstance.current?.destroy();
      if (myPeerIdRef.current) api.leaveMeetingRoom(id, { peerId: myPeerIdRef.current }).catch(() => {});
    };
  }, [peerLoaded, myStream, userProfile, id]);

  const fetchChatAndReactions = async () => {
    try {
      const cr = await api.getMeetMessages(id);
      if (cr.success) setChatMessages(cr.messages);
    } catch {}
  };

  // Meeting timer & Ping
  useEffect(() => {
    const t = setInterval(() => setMeetingTimer(p => p + 1), 1000);
    const pingTimer = setInterval(async () => {
      let total = 0;
      let count = 0;
      for (const call of Object.values(activeCalls.current)) {
        if (call.peerConnection) {
          try {
            const stats = await call.peerConnection.getStats();
            stats.forEach(report => {
              // Extract round trip time from the active candidate pair
              if (report.type === 'candidate-pair' && report.state === 'succeeded' && report.currentRoundTripTime !== undefined) {
                total += (report.currentRoundTripTime * 1000);
                count++;
              }
            });
          } catch (e) {}
        }
      }
      if (count > 0) setNetworkPing(Math.round(total / count));
    }, 3000);
    return () => { clearInterval(t); clearInterval(pingTimer); };
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
  const toggleMic = async () => {
    const bs = roomSettings.blockedPeers?.[myPeerIdRef.current] || {};
    if (roomSettings.blockMic || bs.mic) return;
    const at = myStream?.getAudioTracks()[0];
    
    // If we have a dummy track (or no track), request real mic access
    if (myStream && (!at || at.isDummy)) {
      try {
        const ts = await navigator.mediaDevices.getUserMedia({ audio: true });
        const nat = ts.getAudioTracks()[0];
        if (at) myStream.removeTrack(at); // remove dummy
        myStream.addTrack(nat);
        setMicActive(true);
        notifyPeerStateChange({ isMuted: false });
        // Replace in active connections
        Object.values(activeCalls.current).forEach(call => {
          if (!call.peerConnection) return;
          const transceiver = call.peerConnection.getTransceivers().find(t => t.receiver && t.receiver.track && t.receiver.track.kind === 'audio');
          if (transceiver && transceiver.sender) {
            transceiver.sender.replaceTrack(nat).catch(e => console.error("Audio replaceTrack error:", e));
          }
        });
      } catch (err) {
        console.error("Failed to get real mic:", err);
      }
    } else if (at) {
      at.enabled = !at.enabled; 
      setMicActive(at.enabled); 
      notifyPeerStateChange({ isMuted: !at.enabled }); 
    }
  };

  const toggleVideo = async () => {
    const bs = roomSettings.blockedPeers?.[myPeerIdRef.current] || {};
    if (roomSettings.blockCam || bs.cam) return;
    const vt = myStream?.getVideoTracks()[0];
    
    // If we have a dummy track (or no track), request real camera access
    if (myStream && (!vt || vt.isDummy)) {
      try {
        const ts = await navigator.mediaDevices.getUserMedia({ video: optimalVideo });
        const nv = ts.getVideoTracks()[0];
        if (vt) myStream.removeTrack(vt); // remove dummy
        myStream.addTrack(nv); 
        setVideoActive(true); 
        notifyPeerStateChange({ isVideoOff: false });
        Object.values(activeCalls.current).forEach(call => {
          if (!call.peerConnection) return;
          const transceiver = call.peerConnection.getTransceivers().find(t => t.receiver && t.receiver.track && t.receiver.track.kind === 'video');
          if (transceiver && transceiver.sender) {
            transceiver.sender.replaceTrack(nv).catch(e => console.error("Video replaceTrack error:", e));
          }
        });
      } catch (err) {
        console.error("Failed to get real camera:", err);
      }
    } else if (vt) {
      vt.enabled = !vt.enabled; 
      setVideoActive(vt.enabled); 
      notifyPeerStateChange({ isVideoOff: !vt.enabled }); 
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
    Object.values(dataConns.current).forEach(conn => {
      if (conn.open) conn.send(JSON.stringify({ type: 'handRaise', peerId: myPeerIdRef.current, isHandRaised: next }));
    });
    // Send to server in background without awaiting
    notifyPeerStateChange({ isHandRaised: next }).catch(() => {});
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const pt = newMessage.trim(); setNewMessage('');
    let ct = pt;
    if (encryptionKeyRef.current) { const enc = await encryptPayload(pt, encryptionKeyRef.current); if (enc) ct = enc; }
    
    const msgData = {
      id: `local-${Date.now()}`,
      sender: userProfile?.name || 'Teammate',
      text: ct,
      timestamp: new Date().toISOString(),
      isEncrypted: !!encryptionKeyRef.current
    };
    
    // Broadcast via Data Channels instantly
    Object.values(dataConns.current).forEach(conn => {
      if (conn.open) conn.send(JSON.stringify({ ...msgData, type: 'chat' }));
    });
    // Update local UI
    setChatMessages(prev => [...prev, { ...msgData, text: pt, decrypted: true }]);
    
    // Send to server in background
    api.sendMeetMessage(id, { sender: userProfile?.name || 'Teammate', text: ct, isEncrypted: !!encryptionKeyRef.current }).catch(() => {});
  };

  const handleSendReaction = (emoji) => {
    setShowReactionPicker(false);
    const reactionId = `${userProfile?.uid || 'guest'}-${Date.now()}`;
    const sender = userProfile?.name || 'You';
    const payload = JSON.stringify({ type: 'reaction', id: reactionId, emoji, sender });

    // ── Always broadcast via PeerJS data channels (pure P2P, instant, no backend) ──
    let sentViaPeer = false;
    Object.values(dataConns.current).forEach(conn => {
      if (conn.open) { conn.send(payload); sentViaPeer = true; }
    });

    // ── Also broadcast via Socket.io if connected (reaches peers who joined later) ──
    if (socketRef.current?.connected) {
      socketRef.current.emit('meet_reaction', { roomId: id, emoji, sender, id: reactionId });
    }

    // Show locally immediately
    setFloatingReactions(prev => [...prev, { id: reactionId, emoji, sender }].slice(-10));
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

  useEffect(() => {
    const handleUnload = () => {
      const token = localStorage.getItem('sb_id_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      headers['x-workspace-id'] = localStorage.getItem('sb_workspace_id') || 'default';

      if (isHostUser) {
        fetch(`/api-proxy/calendar/meet/${id}/end`, { method: 'POST', headers, keepalive: true, body: JSON.stringify({}) }).catch(()=>{});
      } else if (myPeerIdRef.current) {
        fetch(`/api-proxy/calendar/meet/${id}/leave`, { method: 'POST', headers, keepalive: true, body: JSON.stringify({ peerId: myPeerIdRef.current }) }).catch(()=>{});
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [id, isHostUser]);


  const endCall = async () => {
    endCallAudioRef.current?.play().catch(() => {});
    peerInstance.current?.destroy();
    try {
      if (isHostUser) await api.endMeetingRoom(id);
      else if (myPeerIdRef.current) await api.leaveMeetingRoom(id, { peerId: myPeerIdRef.current });
    } catch(e) {}
    router.push('/home');
  };

  return {
    authorized, setAuthorized, accessDenied, setAccessDenied, peerLoaded,
    myStream, remoteStreams, micActive, videoActive, isScreenSharing,
    statusMsg, userProfile, setUserProfile, meetLimits, isHandRaised,
    isHostUser, setIsHostUser, roomSettings, meetingTimer, floatingReactions,
    showReactionPicker, setShowReactionPicker, chatMessages, newMessage,
    setNewMessage, chatEndRef, unreadCount, setUnreadCount, polls, showPollModal,
    setShowPollModal, pollForm, setPollForm, toggleMic, toggleVideo,
    toggleScreenShare, toggleHandRaise, handleSendMessage, handleSendReaction,
    toggleBlockPeer, toggleGlobal, endCall, activeCalls, myPeerIdRef,
    remotePeerIds: Object.keys(remoteStreams), networkPing
  };
}