'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import MeetHeader from '../components/MeetHeader';
import VideoGrid from '../components/VideoGrid';
import ControlPanel from '../components/ControlPanel';

export default function MeetPage() {
  const { id } = useParams();
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [peerLoaded, setPeerLoaded] = useState(false);
  const [myStream, setMyStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // { peerId: { stream, name } }
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [statusMsg, setStatusMsg] = useState('Initializing meeting...');
  const [userProfile, setUserProfile] = useState(null);

  const localVideoRef = useRef(null);
  const peerInstance = useRef(null);
  const myPeerIdRef = useRef(null);
  const activeCalls = useRef({}); // { peerId: call }

  // 1. Auth & Invite check
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const isGuestAllowedRoom = id.startsWith('SoftBridgeCalendar-');
    const token = localStorage.getItem('sb_id_token');
    
    if (!token) {
      if (isGuestAllowedRoom) {
        const guestUid = `guest-${Math.random().toString(36).substring(2, 7)}`;
        const guestProfile = { uid: guestUid, name: 'Guest User', email: 'guest@softbridge.com' };
        setUserProfile(guestProfile);
        setAuthorized(true);
      } else {
        router.push('/login');
      }
      return;
    }

    const uid = localStorage.getItem('sb_uid') || 'user-1';
    api.getAccount(uid)
      .then(res => {
        if (res.success && res.user) {
          setUserProfile(res.user);
          checkMeetAccess(res.user);
        } else {
          if (isGuestAllowedRoom) {
            const guestUid = `guest-${Math.random().toString(36).substring(2, 7)}`;
            const guestProfile = { uid: guestUid, name: 'Guest User', email: 'guest@softbridge.com' };
            setUserProfile(guestProfile);
            setAuthorized(true);
          } else {
            router.push('/login');
          }
        }
      })
      .catch(() => {
        // Fallback to local profile cache if offline/error
        const cachedProfile = localStorage.getItem('sb_user_profile');
        if (cachedProfile) {
          const user = JSON.parse(cachedProfile);
          setUserProfile(user);
          checkMeetAccess(user);
        } else {
          if (isGuestAllowedRoom) {
            const guestUid = `guest-${Math.random().toString(36).substring(2, 7)}`;
            const guestProfile = { uid: guestUid, name: 'Guest User', email: 'guest@softbridge.com' };
            setUserProfile(guestProfile);
            setAuthorized(true);
          } else {
            router.push('/login');
          }
        }
      });
  }, []);

  const checkMeetAccess = async (user) => {
    const isGuestAllowedRoom = id.startsWith('SoftBridgeCalendar-');
    if (isGuestAllowedRoom) {
      setAuthorized(true);
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
          return;
        }
        setAccessDenied(true);
        return;
      }

      const isInvitee = matchedEvent.invitees && matchedEvent.invitees.some(inv => 
        inv.email?.toLowerCase() === user.email?.toLowerCase()
      );
      const isHost = myCalendars.some(cal => cal.id === matchedEvent.calendar_id);

      if (isInvitee || isHost) {
        setAuthorized(true);
      } else {
        setAccessDenied(true);
      }
    } catch (err) {
      console.error('Error checking invite access:', err);
      // Local fallback check
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
          return;
        }
        setAccessDenied(true);
        return;
      }

      const isInvitee = matchedEvent.invitees && matchedEvent.invitees.some(inv => 
        inv.email?.toLowerCase() === user.email?.toLowerCase()
      );
      const isHost = localCalendars.some(cal => cal.id === matchedEvent.calendar_id);

      if (isInvitee || isHost) {
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
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setMyStream(stream);
        localStreamInstance = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setStatusMsg('Connecting to signaling broker...');
      })
      .catch((err) => {
        console.error('Failed to get camera/mic, trying audio only', err);
        navigator.mediaDevices.getUserMedia({ video: false, audio: true })
          .then((stream) => {
            setMyStream(stream);
            localStreamInstance = stream;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
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
        await api.joinMeetingRoom(id, {
          peerId: registeredId,
          uid: userProfile.uid,
          name: userProfile.name || 'Teammate'
        });
        setStatusMsg('Looking for participants...');
      } catch (err) {
        console.error('Failed to join meeting broker:', err);
      }
    });

    peer.on('call', (call) => {
      console.log('Incoming call from peer:', call.peer);
      call.answer(myStream);
      activeCalls.current[call.peer] = call;

      call.on('stream', (userRemoteStream) => {
        setRemoteStreams(prev => ({
          ...prev,
          [call.peer]: { stream: userRemoteStream, name: 'Remote User' }
        }));
      });

      call.on('close', () => {
        handlePeerDisconnect(call.peer);
      });

      call.on('error', () => {
        handlePeerDisconnect(call.peer);
      });
    });

    const discoveryInterval = setInterval(async () => {
      if (!peerInstance.current || peerInstance.current.destroyed) return;

      try {
        const res = await api.getMeetingPeers(id);
        if (res.success && res.peers) {
          res.peers.forEach(otherUser => {
            if (otherUser.peerId !== myPeerId && !activeCalls.current[otherUser.peerId]) {
              console.log('Calling peer:', otherUser.peerId);
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
          });

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
            return changed ? updated : prev;
          });

          const othersCount = res.peers.filter(p => p.peerId !== myPeerId).length;
          if (othersCount === 0) {
            setStatusMsg('Waiting for others to join...');
          } else {
            setStatusMsg(`In call with ${othersCount} participant(s)`);
          }
        }
      } catch (err) {
        console.error('Error during peer discovery:', err);
      }
    }, 4500);

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
      clearInterval(discoveryInterval);
      if (peerInstance.current) {
        peerInstance.current.destroy();
      }
      if (myPeerIdRef.current) {
        api.leaveMeetingRoom(id, { peerId: myPeerIdRef.current }).catch(() => {});
      }
    };
  }, [peerLoaded, myStream, userProfile, id]);

  const toggleMic = () => {
    if (myStream) {
      const audioTrack = myStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicActive(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (myStream) {
      const videoTrack = myStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoActive(videoTrack.enabled);
      }
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
        fontFamily: 'system-ui, sans-serif',
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
          This meeting room is restricted to invited members only. You do not have access to join this meeting.
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
          onMouseEnter={e => e.currentTarget.style.background = '#3f3f46'}
          onMouseLeave={e => e.currentTarget.style.background = '#27272a'}
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
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <MeetHeader statusMsg={statusMsg} remotePeerIds={remotePeerIds} id={id} />

      <VideoGrid
        remotePeerIds={remotePeerIds}
        remoteStreams={remoteStreams}
        localVideoRef={localVideoRef}
        videoActive={videoActive}
        micActive={micActive}
        userProfile={userProfile}
      />

      <ControlPanel
        micActive={micActive}
        videoActive={videoActive}
        toggleMic={toggleMic}
        toggleVideo={toggleVideo}
        endCall={endCall}
      />
    </div>
  );
}
