'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import MeetHeader from '../components/MeetHeader';
import VideoGrid from '../components/VideoGrid';
import ControlPanel from '../components/ControlPanel';

export default function MeetPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initial media states from lobby params
  const initMic = searchParams.get('mic') !== 'false';
  const initVideo = searchParams.get('video') !== 'false';

  const [authorized, setAuthorized] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [peerLoaded, setPeerLoaded] = useState(false);
  const [myStream, setMyStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // { peerId: { stream, name } }
  const [micActive, setMicActive] = useState(initMic);
  const [videoActive, setVideoActive] = useState(initVideo);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Initializing meeting...');
  const [userProfile, setUserProfile] = useState(null);
  const [meetLimits, setMeetLimits] = useState(null);

  // New Drawer States
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [floatingReactions, setFloatingReactions] = useState([]); // Array of { id, emoji, sender }
  const [meetingTimer, setMeetingTimer] = useState(0); // Elapsed meeting time in seconds
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isHostUser, setIsHostUser] = useState(false);
  const [roomSettings, setRoomSettings] = useState({ allowGuests: true, blockMic: false, blockCam: false, blockedPeers: {} });
  const [showSettings, setShowSettings] = useState(false);

  const localVideoRef = useRef(null);
  const peerInstance = useRef(null);
  const myPeerIdRef = useRef(null);
  const activeCalls = useRef({}); // { peerId: call }
  const screenTrackRef = useRef(null);

  const notifyPeerStateChange = async (states) => {
    if (myPeerIdRef.current) {
      try {
        await api.updateMeetPeer(id, { peerId: myPeerIdRef.current, ...states });
      } catch (e) {
        console.error('Failed to notify state change:', e);
      }
    }
  };

  // 1. Auth & Invite check
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('sb_id_token');
    
    if (!token) {
      const displayName = localStorage.getItem('sb_meet_display_name');
      if (!displayName) {
        // Redirect guest to choose their display name first
        router.push(`/meet?code=${id}`);
      } else {
        const guestUid = localStorage.getItem('sb_uid') || `guest-${Math.random().toString(36).substring(2, 7)}`;
        localStorage.setItem('sb_uid', guestUid);
        const guestProfile = { uid: guestUid, name: displayName, email: 'guest@softbridge.com' };
        setUserProfile(guestProfile);
        setAuthorized(true);
      }
      return;
    }

    const uid = localStorage.getItem('sb_uid') || 'user-1';
    api.getAccount(uid)
      .then(res => {
        if (res.success && res.user) {
          const displayName = localStorage.getItem('sb_meet_display_name') || res.user.name || 'Teammate';
          const profile = { ...res.user, name: displayName };
          setUserProfile(profile);
          checkMeetAccess(profile);
        } else {
          const displayName = localStorage.getItem('sb_meet_display_name');
          if (!displayName) {
            router.push(`/meet?code=${id}`);
          } else {
            const guestUid = localStorage.getItem('sb_uid') || `guest-${Math.random().toString(36).substring(2, 7)}`;
            localStorage.setItem('sb_uid', guestUid);
            const guestProfile = { uid: guestUid, name: displayName, email: 'guest@softbridge.com' };
            setUserProfile(guestProfile);
            setAuthorized(true);
          }
        }
      })
      .catch(() => {
        const cachedProfile = localStorage.getItem('sb_user_profile');
        if (cachedProfile) {
          const user = JSON.parse(cachedProfile);
          const displayName = localStorage.getItem('sb_meet_display_name') || user.name || 'Teammate';
          const profile = { ...user, name: displayName };
          setUserProfile(profile);
          checkMeetAccess(profile);
        } else {
          const displayName = localStorage.getItem('sb_meet_display_name');
          if (!displayName) {
            router.push(`/meet?code=${id}`);
          } else {
            const guestUid = localStorage.getItem('sb_uid') || `guest-${Math.random().toString(36).substring(2, 7)}`;
            localStorage.setItem('sb_uid', guestUid);
            const guestProfile = { uid: guestUid, name: displayName, email: 'guest@softbridge.com' };
            setUserProfile(guestProfile);
            setAuthorized(true);
          }
        }
      });
  }, []);

  const checkMeetAccess = async (user) => {
    const isGuestAllowedRoom = id.startsWith('SoftBridgeCalendar-');
    if (isGuestAllowedRoom) {
      setAuthorized(true);
      try {
        const calendarsRes = await api.getCalendars();
        if (calendarsRes.success && calendarsRes.calendars) {
          const syncRes = await api.syncMeetState(id);
          if (!syncRes.peers || syncRes.peers.length === 0 || syncRes.peers[0].uid === user.uid) {
            setIsHostUser(true);
          }
        }
      } catch {}
      return;
    }

    try {
      const [eventsRes, calendarsRes] = await Promise.all([
        api.getEvents(),
        api.getCalendars()
      ]);
      
      const myEvents = eventsRes.success && eventsRes.events ? eventsRes.events : [];
      const myCalendars = calendarsRes.success && calendarsRes.calendars ? calendarsRes.calendars : [];

      const matchedEvent = myEvents.find(e => 
        e.id === id || 
        (e.location && e.location.includes(id)) || 
        (e.meeting_link && e.meeting_link.includes(id))
      );

      if (!matchedEvent) {
        if (id.startsWith('internal-')) {
          setAuthorized(true);
          setIsHostUser(true);
          return;
        }
        setAccessDenied(true);
        return;
      }

      const isInvitee = matchedEvent.invitees && matchedEvent.invitees.some(inv => 
        inv.email?.toLowerCase() === user.email?.toLowerCase()
      );
      const isHost = myCalendars.some(cal => cal.id === matchedEvent.calendar_id);

      if (isHost) {
        setIsHostUser(true);
      }

      if (isInvitee || isHost || matchedEvent.allow_guests !== false) {
        setAuthorized(true);
      } else {
        setAccessDenied(true);
      }
    } catch (err) {
      console.error('Error checking invite access:', err);
      const localEvents = JSON.parse(localStorage.getItem('sb_events') || '[]');
      const localCalendars = JSON.parse(localStorage.getItem('sb_calendars') || '[]');

      const matchedEvent = localEvents.find(e => 
        e.id === id || 
        (e.location && e.location.includes(id)) || 
        (e.meeting_link && e.meeting_link.includes(id))
      );

      if (!matchedEvent) {
        if (id.startsWith('internal-')) {
          setAuthorized(true);
          setIsHostUser(true);
          return;
        }
        setAccessDenied(true);
        return;
      }

      const isInvitee = matchedEvent.invitees && matchedEvent.invitees.some(inv => 
        inv.email?.toLowerCase() === user.email?.toLowerCase()
      );
      const isHost = localCalendars.some(cal => cal.id === matchedEvent.calendar_id);

      if (isHost) {
        setIsHostUser(true);
      }

      if (isInvitee || isHost || matchedEvent.allow_guests !== false) {
        setAuthorized(true);
      } else {
        setAccessDenied(true);
      }
    }
  };

  // 2. Load PeerJS CDN script
  useEffect(() => {
    if (!authorized) return;

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/peerjs@1.4.7/dist/peerjs.min.js';
    script.async = true;
    script.onload = () => setPeerLoaded(true);
    document.body.appendChild(script);

    return () => {
      try {
        document.body.removeChild(script);
      } catch {}
    };
  }, [authorized]);

  // 3. Request User Media
  useEffect(() => {
    if (!authorized) return;

    let localStreamInstance = null;
    navigator.mediaDevices.getUserMedia({ video: videoActive, audio: true })
      .then((stream) => {
        // Apply initial mic preference
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = micActive;
        }
        // Apply initial video preference
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = videoActive;
        }
        
        setMyStream(stream);
        localStreamInstance = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(e => console.log(e));
        }
        setStatusMsg('Connecting to signaling broker...');
      })
      .catch((err) => {
        console.error('Failed to get camera/mic, trying audio only', err);
        navigator.mediaDevices.getUserMedia({ video: false, audio: true })
          .then((stream) => {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
              audioTrack.enabled = micActive;
            }
            setMyStream(stream);
            localStreamInstance = stream;
            setVideoActive(false);
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
              localVideoRef.current.play().catch(e => console.log(e));
            }
            setStatusMsg('Connected (Audio Only)');
          })
          .catch((err2) => {
            console.error('Failed to get audio', err2);
            setStatusMsg('Media access denied. Please allow microphone permissions.');
          });
      });

    return () => {
      if (localStreamInstance) {
        localStreamInstance.getTracks().forEach(track => track.stop());
      }
    };
  }, [authorized]);

  // 4. PeerJS connection & signaling loop
  useEffect(() => {
    if (!peerLoaded || !myStream || !userProfile) return;

    const myPeerId = `sb-${id}-${userProfile.uid || 'guest'}-${Math.random().toString(36).substr(2, 5)}`;
    myPeerIdRef.current = myPeerId;

    const peer = new window.Peer(myPeerId, {
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    peer.on('open', async (registeredId) => {
      console.log('PeerJS ready with ID:', registeredId);
      peerInstance.current = peer;

      try {
        const joinRes = await api.joinMeetingRoom(id, {
          peerId: registeredId,
          uid: userProfile.uid,
          name: userProfile.name || 'Teammate'
        });
        if (joinRes.success) {
          if (joinRes.limits) {
            setMeetLimits(joinRes.limits);
          }
          setStatusMsg('Looking for participants...');
          fetchChatAndReactions();
        }
      } catch (err) {
        console.error('Failed to join meeting broker:', err);
        if (err.message && err.message.includes('limit')) {
          alert(err.message);
          router.push('/meet');
        }
      }
    });

    peer.on('error', (err) => {
      console.warn('PeerJS connection error (handled):', err.message);
    });

    peer.on('call', (call) => {
      console.log('Incoming call from peer:', call.peer);
      call.answer(myStream);
      activeCalls.current[call.peer] = call;

      call.on('stream', (userRemoteStream) => {
        // Lookup peer's real name from signaling server immediately
        api.syncMeetState(id).then(res => {
          const matchedPeer = res.peers?.find(p => p.peerId === call.peer);
          const peerName = matchedPeer ? matchedPeer.name : 'Participant';
          setRemoteStreams(prev => ({
            ...prev,
            [call.peer]: { stream: userRemoteStream, name: peerName }
          }));
        }).catch(() => {
          setRemoteStreams(prev => ({
            ...prev,
            [call.peer]: { stream: userRemoteStream, name: 'Participant' }
          }));
        });
      });

      call.on('close', () => {
        handlePeerDisconnect(call.peer);
      });

      call.on('error', () => {
        handlePeerDisconnect(call.peer);
      });
    });

    // 4.5 Consolidated Sync Polling Loop (Combinations to speed up server responses)
    const syncInterval = setInterval(async () => {
      if (!peerInstance.current || peerInstance.current.destroyed) return;

      try {
        const res = await api.syncMeetState(id);
        if (res.success) {
          // 1. Sync peers & establish WebRTC connections unidirectionally (Lexicographical ordering)
          if (res.peers) {
            res.peers.forEach(otherUser => {
              if (otherUser.peerId !== myPeerId && !activeCalls.current[otherUser.peerId]) {
                if (myPeerId < otherUser.peerId) {
                  console.log('Calling peer (Lexicographically smaller):', otherUser.peerId);
                  const call = peerInstance.current.call(otherUser.peerId, myStream);
                  if (call) {
                    activeCalls.current[otherUser.peerId] = call;
                    call.on('stream', (userRemoteStream) => {
                      setRemoteStreams(prev => ({
                        ...prev,
                        [otherUser.peerId]: { stream: userRemoteStream, name: otherUser.name || 'Participant' }
                      }));
                    });
                    call.on('close', () => {
                      handlePeerDisconnect(otherUser.peerId);
                    });
                    call.on('error', () => {
                      handlePeerDisconnect(otherUser.peerId);
                    });
                  }
                }
              }
            });

            // Sync peer list changes (remove disconnected)
            const activePeerIds = res.peers.map(p => p.peerId);
            setRemoteStreams(prev => {
              const updated = { ...prev };
              let changed = false;
              
              Object.keys(updated).forEach(pId => {
                if (!activePeerIds.includes(pId)) {
                  delete updated[pId];
                  if (activeCalls.current[pId]) {
                    try { activeCalls.current[pId].close(); } catch {}
                    delete activeCalls.current[pId];
                  }
                  changed = true;
                }
              });

              res.peers.forEach(p => {
                if (updated[p.peerId]) {
                  updated[p.peerId] = {
                    ...updated[p.peerId],
                    name: p.name || 'Participant',
                    isScreenSharing: p.isScreenSharing || false,
                    isHandRaised: p.isHandRaised || false,
                    isMuted: p.isMuted || false,
                    isVideoOff: p.isVideoOff || false
                  };
                  changed = true;
                }
              });

              return changed ? updated : prev;
            });

            const othersCount = res.peers.filter(p => p.peerId !== myPeerId).length;
            if (othersCount === 0) {
              setStatusMsg('Waiting for others to join...');
            } else {
              setStatusMsg(`In call with ${othersCount} participant(s)`);
            }
          }

          // 2. Sync chats
          if (res.messages) {
            setChatMessages(res.messages);
          }

          // 3. Sync reactions
          if (res.reactions && res.reactions.length > 0) {
            const now = Date.now();
            const incoming = res.reactions.filter(r => (now - new Date(r.timestamp).getTime()) < 5000);
            
            setFloatingReactions(prev => {
              const ids = prev.map(p => p.id);
              const newEntries = incoming
                .map(r => ({ id: `${r.sender}-${r.timestamp}`, emoji: r.emoji, sender: r.sender }))
                .filter(n => !ids.includes(n.id));
              return [...prev, ...newEntries].slice(-10);
            });
          }

          // 4. Sync moderation settings
          if (res.settings) {
            setRoomSettings(res.settings);
            
            // Check if host has muted/blocked us
            const blockedState = res.settings.blockedPeers?.[myPeerId] || {};
            if (res.settings.blockMic || blockedState.mic) {
              const audioTrack = myStream?.getAudioTracks()[0];
              if (audioTrack && audioTrack.enabled) {
                audioTrack.enabled = false;
                setMicActive(false);
                api.updateMeetPeer(id, { peerId: myPeerId, isMuted: true }).catch(() => {});
              }
            }
            if (res.settings.blockCam || blockedState.cam) {
              const videoTrack = myStream?.getVideoTracks()[0];
              if (videoTrack && videoTrack.enabled) {
                videoTrack.enabled = false;
                setVideoActive(false);
                api.updateMeetPeer(id, { peerId: myPeerId, isVideoOff: true }).catch(() => {});
              }
            }
          }
        }
      } catch (err) {
        console.error('Error during consolidated meeting sync:', err);
      }
    }, 4000);

    const handlePeerDisconnect = (pId) => {
      setRemoteStreams(prev => {
        const next = { ...prev };
        delete next[pId];
        return next;
      });
      if (activeCalls.current[pId]) {
        try { activeCalls.current[pId].close(); } catch {}
        delete activeCalls.current[pId];
      }
    };

    return () => {
      clearInterval(syncInterval);
      if (peerInstance.current) {
        peerInstance.current.destroy();
      }
      if (myPeerIdRef.current) {
        api.leaveMeetingRoom(id, { peerId: myPeerIdRef.current }).catch(() => {});
      }
    };
  }, [peerLoaded, myStream, userProfile, id]);

  // Sync Chat Messages and Reactions from backend
  const fetchChatAndReactions = async () => {
    try {
      const [chatRes, reactionsRes] = await Promise.all([
        api.getMeetMessages(id),
        api.getMeetReactions(id)
      ]);
      
      if (chatRes.success) {
        setChatMessages(chatRes.messages);
      }
      if (reactionsRes.success && reactionsRes.reactions.length > 0) {
        // Trigger floating animations for any new reactions
        const now = Date.now();
        const incoming = reactionsRes.reactions.filter(r => (now - new Date(r.timestamp).getTime()) < 5000);
        
        setFloatingReactions(prev => {
          const ids = prev.map(p => p.id);
          const newEntries = incoming
            .map(r => ({ id: `${r.sender}-${r.timestamp}`, emoji: r.emoji, sender: r.sender }))
            .filter(n => !ids.includes(n.id));
          return [...prev, ...newEntries].slice(-10); // Keep last 10 floating elements
        });
      }
    } catch (e) {
      console.error('Error polling chat/reactions:', e);
    }
  };

  // Meeting Timer Counter
  useEffect(() => {
    const timer = setInterval(() => {
      setMeetingTimer(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Toggle Screen Sharing
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      if (!videoActive) {
        const confirmOpen = window.confirm("Screen sharing requires your camera stream to be active first to establish the video transceivers channel. Would you like to turn on your camera now?");
        if (confirmOpen) {
          await toggleVideo();
        } else {
          return;
        }
      }
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        // Replace track in myStream
        if (myStream) {
          const videoTrack = myStream.getVideoTracks()[0];
          if (videoTrack) {
            myStream.removeTrack(videoTrack);
            videoTrack.stop();
          }
          myStream.addTrack(screenTrack);
        }

        // Update active peer connections
        Object.values(activeCalls.current).forEach(call => {
          const senders = call.peerConnection.getSenders();
          const sender = senders.find(s => s.track && s.track.kind === 'video') || senders.find(s => s.track === null);
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          stopScreenSharing();
        };

        setIsScreenSharing(true);
        notifyPeerStateChange({ isScreenSharing: true });
      } catch (err) {
        console.error('Failed to share screen:', err);
      }
    } else {
      stopScreenSharing();
    }
  };

  const stopScreenSharing = async () => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    
    // Restore normal camera track
    try {
      const camStream = await navigator.mediaDevices.getUserMedia({ video: videoActive, audio: true });
      const newVideoTrack = camStream.getVideoTracks()[0];

      if (myStream) {
        const oldTrack = myStream.getVideoTracks()[0];
        if (oldTrack) {
          myStream.removeTrack(oldTrack);
          oldTrack.stop();
        }
        if (newVideoTrack) {
          myStream.addTrack(newVideoTrack);
        }
      }

      // Update active calls
      Object.values(activeCalls.current).forEach(call => {
        const senders = call.peerConnection.getSenders();
        const sender = senders.find(s => s.track && s.track.kind === 'video') || senders.find(s => s.track === null);
        if (sender && newVideoTrack) {
          sender.replaceTrack(newVideoTrack);
        }
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = myStream;
      }
      setIsScreenSharing(false);
      notifyPeerStateChange({ isScreenSharing: false });
    } catch (e) {
      console.error('Error recovering camera stream:', e);
    }
  };

  const toggleMic = () => {
    const myPeerId = myPeerIdRef.current;
    const blockedState = roomSettings.blockedPeers?.[myPeerId] || {};
    if (roomSettings.blockMic || blockedState.mic) {
      alert("Your microphone has been disabled by the meeting host.");
      return;
    }
    if (myStream) {
      const audioTrack = myStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicActive(audioTrack.enabled);
        notifyPeerStateChange({ isMuted: !audioTrack.enabled });
      }
    }
  };

  const toggleVideo = async () => {
    const myPeerId = myPeerIdRef.current;
    const blockedState = roomSettings.blockedPeers?.[myPeerId] || {};
    if (roomSettings.blockCam || blockedState.cam) {
      alert("Your camera has been disabled by the meeting host.");
      return;
    }
    if (myStream) {
      const videoTrack = myStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoActive(videoTrack.enabled);
        notifyPeerStateChange({ isVideoOff: !videoTrack.enabled });
      } else {
        // No video track exists (joined audio-only). Request camera track!
        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
          const newTrack = tempStream.getVideoTracks()[0];
          if (newTrack) {
            myStream.addTrack(newTrack);
            setVideoActive(true);
            notifyPeerStateChange({ isVideoOff: false });
            
            // Replace track in active peer calls
            Object.values(activeCalls.current).forEach(call => {
              const senders = call.peerConnection.getSenders();
              const sender = senders.find(s => s.track && s.track.kind === 'video') || senders.find(s => s.track === null);
              if (sender) {
                sender.replaceTrack(newTrack);
              }
            });

            if (localVideoRef.current) {
              localVideoRef.current.srcObject = myStream;
              localVideoRef.current.play().catch(e => console.log(e));
            }
          }
        } catch (err) {
          console.error('Failed to turn on video track:', err);
        }
      }
    }
  };

  const toggleHandRaise = async () => {
    const nextVal = !isHandRaised;
    setIsHandRaised(nextVal);
    await notifyPeerStateChange({ isHandRaised: nextVal });
  };

  const toggleBlockParticipantDevice = async (peerId, device) => {
    const currentBlock = roomSettings.blockedPeers?.[peerId] || { mic: false, cam: false };
    const updatedBlockedPeers = {
      [peerId]: {
        ...currentBlock,
        [device]: !currentBlock[device]
      }
    };
    try {
      const res = await api.updateMeetSettings(id, { blockedPeers: updatedBlockedPeers });
      if (res.success) {
        setRoomSettings(res.settings);
      }
    } catch (e) {
      console.error('Failed to update participant blocks:', e);
    }
  };

  const toggleGlobalSetting = async (key, val) => {
    try {
      const res = await api.updateMeetSettings(id, { [key]: val });
      if (res.success) {
        setRoomSettings(res.settings);
      }
    } catch (e) {
      console.error('Failed to update room settings:', e);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const res = await api.sendMeetMessage(id, {
        sender: userProfile?.name || 'Teammate',
        text: newMessage.trim()
      });
      if (res.success) {
        setChatMessages(prev => [...prev, res.message]);
        setNewMessage('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendReaction = async (emoji) => {
    try {
      await api.sendMeetReaction(id, {
        emoji,
        sender: userProfile?.name || 'Teammate'
      });
      // Show immediately locally
      const localId = `local-${Date.now()}`;
      setFloatingReactions(prev => [...prev, { id: localId, emoji, sender: userProfile?.name || 'You' }]);
    } catch (err) {
      console.error(err);
    }
  };

  const endCall = () => {
    if (peerInstance.current) {
      peerInstance.current.destroy();
    }
    if (myPeerIdRef.current) {
      api.leaveMeetingRoom(id, { peerId: myPeerIdRef.current }).catch(() => {});
    }
    router.push('/calendar');
  };

  // Remove floating reactions after 3 seconds
  useEffect(() => {
    if (floatingReactions.length > 0) {
      const timer = setTimeout(() => {
        setFloatingReactions(prev => prev.slice(1));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [floatingReactions]);

  if (accessDenied) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#09090b',
        color: '#f4f4f5',
        fontFamily: 'var(--font-body)',
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: '#fee2e2',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '2.5rem' }}>warning</span>
        </div>
        <h2 style={{ fontWeight: 800, fontSize: '1.5rem', color: '#ef4444' }}>Meeting is Private</h2>
        <p style={{ color: '#a1a1aa', maxWidth: '400px', fontSize: '0.95rem' }}>
          This meeting room is restricted to invited members only.
        </p>
        <button 
          onClick={() => router.push('/calendar')} 
          style={{
            marginTop: '1rem',
            padding: '0.6rem 1.5rem',
            background: '#27272a',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.85rem',
            transition: 'background 0.2s'
          }}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#09090b', color: '#71717a' }}>
        <span>Authenticating & checking access...</span>
      </div>
    );
  }

  const remotePeerIds = Object.keys(remoteStreams);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#09090b',
      color: '#f4f4f5',
      fontFamily: 'var(--font-body)',
      display: 'flex',
      flexDirection: 'row',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Main Meet Screen */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        height: '100%',
        overflow: 'hidden'
      }}>
        {/* Customized Header */}
        <div style={{
          padding: '1.25rem 2rem',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: '#10b981' }}>schedule</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e4e4e7' }}>{formatTimer(meetingTimer)}</span>
            </div>
            <span style={{ fontSize: '0.85rem', color: '#a1a1aa', fontWeight: 500 }}>
              ({statusMsg})
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{
              fontSize: '0.8rem',
              color: '#a1a1aa',
              background: 'rgba(255,255,255,0.06)',
              padding: '0.4rem 0.85rem',
              borderRadius: '20px',
              fontWeight: 600
            }}>
              Room ID: <span style={{ color: '#fff' }}>{id}</span>
            </div>
          </div>
        </div>

        {/* Video Grid */}
        <VideoGrid
          remotePeerIds={remotePeerIds}
          remoteStreams={remoteStreams}
          localVideoRef={localVideoRef}
          videoActive={videoActive}
          micActive={micActive}
          userProfile={userProfile}
          isLocalScreenSharing={isScreenSharing}
        />

        {/* Custom Meeting Floating Reactions View */}
        <div style={{
          position: 'absolute',
          bottom: '7.5rem',
          left: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          pointerEvents: 'none',
          zIndex: 20
        }}>
          {floatingReactions.map(r => (
            <div key={r.id} className="floating-reaction" style={{
              background: 'rgba(0,0,0,0.7)',
              padding: '0.4rem 0.8rem',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
              animation: 'floatUp 2.5s ease-out forwards',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <span style={{ fontSize: '1.2rem' }}>{r.emoji}</span>
              <span style={{ color: '#d4d4d8', fontWeight: 600 }}>{r.sender}</span>
            </div>
          ))}
        </div>

        {/* Reaction Picker Panel */}
        <div style={{
          position: 'absolute',
          bottom: '7.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(18, 18, 20, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '0.5rem 1rem',
          display: 'flex',
          gap: '0.75rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          zIndex: 10
        }}>
          {['👍', '👏', '🎉', '❤️', '🔥', '💡', '😮'].map(emoji => (
            <button
              key={emoji}
              onClick={() => handleSendReaction(emoji)}
              style={{
                fontSize: '1.25rem',
                padding: '4px 8px',
                borderRadius: '8px',
                transition: 'all 0.2s',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Custom control panel triggers */}
        <div style={{
          position: 'absolute',
          bottom: '1.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(18, 18, 20, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px',
          padding: '0.85rem 2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          zIndex: 10
        }}>
          {/* Mic */}
          <button onClick={toggleMic} style={{ background: micActive ? 'rgba(255,255,255,0.08)' : '#ef4444', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>{micActive ? 'mic' : 'mic_off'}</span>
          </button>
          
          {/* Video */}
          <button onClick={toggleVideo} style={{ background: videoActive ? 'rgba(255,255,255,0.08)' : '#ef4444', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>{videoActive ? 'videocam' : 'videocam_off'}</span>
          </button>

          {/* Screen Share */}
          <button onClick={toggleScreenShare} style={{ background: isScreenSharing ? '#10b981' : 'rgba(255,255,255,0.08)', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }} title="Share Screen">
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>screen_share</span>
          </button>

          {/* Hand Raise */}
          <button onClick={toggleHandRaise} style={{ background: isHandRaised ? '#f59e0b' : 'rgba(255,255,255,0.08)', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }} title="Raise Hand">
            <span style={{ fontSize: '1.2rem' }}>✋</span>
          </button>

          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.15)' }} />

          {/* Toggle Participants */}
          <button onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); setShowSettings(false); }} style={{ background: showParticipants ? '#6366f1' : 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0 0.75rem', height: '44px', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>group</span>
            Peers
          </button>
 
          {/* Toggle Chat */}
          <button onClick={() => { setShowChat(!showChat); setShowParticipants(false); setShowSettings(false); }} style={{ background: showChat ? '#6366f1' : 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0 0.75rem', height: '44px', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>chat</span>
            Chat
          </button>
 
          {/* Toggle Settings */}
          <button onClick={() => { setShowSettings(!showSettings); setShowChat(false); setShowParticipants(false); }} style={{ background: showSettings ? '#6366f1' : 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0 0.75rem', height: '44px', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }} title="Meeting Settings">
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>settings</span>
            Settings
          </button>

          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.15)' }} />

          {/* End Call */}
          <button onClick={endCall} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '22px', padding: '0 1.25rem', height: '44px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>call_end</span>
            Leave
          </button>
        </div>
      </div>

      {/* Side Chat Drawer */}
      {showChat && (
        <div style={{
          width: '340px',
          height: '100%',
          background: '#09090b',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 30
        }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>In-call Chat</h3>
            <button onClick={() => setShowChat(false)} style={{ color: '#a1a1aa' }}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          
          {/* Chat Messages */}
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {chatMessages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#52525b', fontSize: '0.85rem', marginTop: '2rem' }}>No messages yet. Say hello!</div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div key={idx} style={{
                  background: msg.sender === (userProfile?.name || 'You') ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '12px',
                  alignSelf: msg.sender === (userProfile?.name || 'You') ? 'flex-end' : 'flex-start',
                  maxWidth: '85%'
                }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#818cf8', marginBottom: '2px' }}>{msg.sender}</div>
                  <div style={{ fontSize: '0.85rem', color: '#e4e4e7', wordBreak: 'break-word' }}>{msg.text}</div>
                </div>
              ))
            )}
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Send message..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '0.6rem 0.8rem',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
            <button type="submit" style={{ background: '#6366f1', color: '#fff', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>send</span>
            </button>
          </form>
        </div>
      )}

      {/* Side Participants Drawer */}
      {showParticipants && (
        <div style={{
          width: '340px',
          height: '100%',
          background: '#09090b',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 30
        }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Participants</h3>
            <button onClick={() => setShowParticipants(false)} style={{ color: '#a1a1aa' }}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Host settings toggle card */}
            {isHostUser && (
              <div style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Host Controls</h4>
                
                {/* Guest access toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                  <span>Allow Guest Access</span>
                  <input
                    type="checkbox"
                    checked={roomSettings.allowGuests !== false}
                    onChange={e => toggleGlobalSetting('allowGuests', e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                </div>

                {/* Global Mic block */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                  <span>Mute Everyone</span>
                  <input
                    type="checkbox"
                    checked={roomSettings.blockMic || false}
                    onChange={e => toggleGlobalSetting('blockMic', e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                </div>

                {/* Global Camera block */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                  <span>Disable Video for All</span>
                  <input
                    type="checkbox"
                    checked={roomSettings.blockCam || false}
                    onChange={e => toggleGlobalSetting('blockCam', e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </div>
            )}

            {/* Local User */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', position: 'relative' }}>
                  {(userProfile?.name || 'Y').charAt(0).toUpperCase()}
                  {isHandRaised && (
                    <span style={{ position: 'absolute', bottom: '-4px', right: '-4px', fontSize: '0.75rem' }}>✋</span>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{userProfile?.name || 'You'}</div>
                  <div style={{ fontSize: '0.7rem', color: '#71717a' }}>{isHostUser ? 'Host (You)' : 'You'}</div>
                </div>
              </div>
            </div>

            {/* Remote Users */}
            {remotePeerIds.map(pId => {
              const remoteName = remoteStreams[pId]?.name || 'Participant';
              const remoteItem = remoteStreams[pId];
              return (
                <div key={pId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', position: 'relative' }}>
                      {remoteName.charAt(0).toUpperCase()}
                      {remoteItem?.isHandRaised && (
                        <span style={{ position: 'absolute', bottom: '-4px', right: '-4px', fontSize: '0.75rem' }}>✋</span>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{remoteName}</div>
                      <div style={{ fontSize: '0.7rem', color: '#71717a' }}>
                        {remoteItem?.isScreenSharing ? 'Screen Sharing' : 'Connected'}
                      </div>
                    </div>
                  </div>

                  {isHostUser && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => toggleBlockParticipantDevice(pId, 'mic')}
                        style={{
                          background: roomSettings.blockedPeers?.[pId]?.mic ? '#ef4444' : 'rgba(255,255,255,0.06)',
                          border: 'none',
                          borderRadius: '6px',
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          cursor: 'pointer'
                        }}
                        title="Mute participant"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
                          {roomSettings.blockedPeers?.[pId]?.mic ? 'mic_off' : 'mic'}
                        </span>
                      </button>
                      <button
                        onClick={() => toggleBlockParticipantDevice(pId, 'cam')}
                        style={{
                          background: roomSettings.blockedPeers?.[pId]?.cam ? '#ef4444' : 'rgba(255,255,255,0.06)',
                          border: 'none',
                          borderRadius: '6px',
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          cursor: 'pointer'
                        }}
                        title="Block camera"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
                          {roomSettings.blockedPeers?.[pId]?.cam ? 'videocam_off' : 'videocam'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Side Settings/Manage Drawer */}
      {showSettings && (
        <div style={{
          width: '340px',
          height: '100%',
          background: '#09090b',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 30
        }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Meeting Options</h3>
            <button onClick={() => setShowSettings(false)} style={{ color: '#a1a1aa', border: 'none', background: 'none', cursor: 'pointer' }}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Meeting Link & Share */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem 0' }}>Share Meeting</h4>
              <p style={{ fontSize: '0.75rem', color: '#a1a1aa', margin: '0 0 0.75rem 0' }}>Invite others by sharing this meeting room code or link.</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  readOnly
                  value={typeof window !== 'undefined' ? window.location.href : `${id}`}
                  style={{
                    flex: 1,
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    color: '#e4e4e7',
                    fontSize: '0.75rem',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Meeting link copied to clipboard!');
                    }
                  }}
                  style={{
                    background: '#6366f1',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0 0.75rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Moderator controls (duplicates / manages settings globally) */}
            {isHostUser && (
              <div style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Moderator Rules</h4>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                  <span>Allow Guest Access</span>
                  <input
                    type="checkbox"
                    checked={roomSettings.allowGuests !== false}
                    onChange={e => toggleGlobalSetting('allowGuests', e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                  <span>Mute Everyone</span>
                  <input
                    type="checkbox"
                    checked={roomSettings.blockMic || false}
                    onChange={e => toggleGlobalSetting('blockMic', e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                  <span>Disable Video for All</span>
                  <input
                    type="checkbox"
                    checked={roomSettings.blockCam || false}
                    onChange={e => toggleGlobalSetting('blockCam', e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </div>
            )}

            {/* Media/Preferences Settings */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Device Settings</h4>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#a1a1aa', marginBottom: '0.25rem' }}>Audio Output / Input</label>
                <select style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.75rem', outline: 'none' }}>
                  <option>Default System Microphone</option>
                  <option>Communications Device</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#a1a1aa', marginBottom: '0.25rem' }}>Camera Source</label>
                <select style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.75rem', outline: 'none' }}>
                  <option>Default Integrated Camera</option>
                  <option>OBS Virtual Camera</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Animations and Keyframes */}
      <style jsx global>{`
        @keyframes floatUp {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          10% {
            opacity: 1;
            transform: translateY(0);
          }
          90% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(-80px);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  );
}
