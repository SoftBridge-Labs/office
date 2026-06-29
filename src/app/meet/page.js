'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function MeetLobbyPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [videoActive, setVideoActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [stream, setStream] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [meetLimits, setMeetLimits] = useState(null);
  const [hostedMeetings, setHostedMeetings] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const videoRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('sb_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUserProfile(parsed);
          setName(parsed.name || '');
          fetchLimits(parsed.uid);
        } catch (e) {
          console.error(e);
        }
      } else {
        const tempName = localStorage.getItem('sb_meet_display_name') || '';
        setName(tempName);
      }

      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (code) {
        setRoomIdInput(code);
      }
    }
  }, []);

  const fetchLimits = async (uid) => {
    try {
      const res = await api.checkMeetLimits(uid);
      if (res.success && res.limits) {
        setMeetLimits(res.limits);
      }
      const hostedRes = await api.getHostedMeetings(uid);
      if (hostedRes.success && hostedRes.meetings) {
        setHostedMeetings(hostedRes.meetings);
      }
    } catch (err) {
      console.error('Failed to fetch meeting limits', err);
    }
  };

  // Get User Media Preview
  useEffect(() => {
    let currentStream = null;
    const constraints = {
      video: videoActive ? { width: 640, height: 480 } : false,
      audio: micActive
    };

    if (videoActive || micActive) {
      navigator.mediaDevices.getUserMedia(constraints)
        .then((mediaStream) => {
          setStream(mediaStream);
          currentStream = mediaStream;
          if (videoRef.current && videoActive) {
            videoRef.current.srcObject = mediaStream;
          }
        })
        .catch((err) => {
          console.error('Error getting media devices for lobby preview:', err);
        });
    } else {
      setStream(null);
    }

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoActive, micActive]);

  const saveName = () => {
    if (typeof window !== 'undefined' && name.trim()) {
      localStorage.setItem('sb_meet_display_name', name.trim());
      if (userProfile) {
        const updated = { ...userProfile, name: name.trim() };
        localStorage.setItem('sb_user', JSON.stringify(updated));
      }
    }
  };

  const handleStartInstantMeeting = async () => {
    saveName();
    const uid = userProfile?.uid || `guest-${Math.random().toString(36).substring(2, 7)}`;
    
    // Check limits first if registered user
    if (userProfile && !userProfile.uid?.startsWith('guest')) {
      try {
        const limitsRes = await api.checkMeetLimits(userProfile.uid);
        if (limitsRes.success && limitsRes.limits) {
          if (limitsRes.limits.meetingsRemaining <= 0) {
            setStatusMsg('Meeting limit reached. Please upgrade your plan.');
            return;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    const instantId = `SoftBridgeCalendar-${Math.random().toString(36).substring(2, 10)}`;
    router.push(`/meet/${instantId}?mic=${micActive}&video=${videoActive}`);
  };

  const handleJoinMeeting = () => {
    if (!roomIdInput.trim()) return;
    saveName();
    let cleanRoomId = roomIdInput.trim();
    if (cleanRoomId.includes('/meet/')) {
      cleanRoomId = cleanRoomId.split('/meet/')[1].split('?')[0];
    }
    router.push(`/meet/${cleanRoomId}?mic=${micActive}&video=${videoActive}`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#ededeb',
      color: '#1a1a1a',
      fontFamily: 'var(--font-body)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
    }}>
      <div style={{
        maxWidth: '1000px',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2.5rem',
        alignItems: 'center',
      }} className="lobby-grid">
        
        {/* Left Side: Preview & Setup */}
        <div style={{
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            fontWeight: 800,
            width: '100%',
            textAlign: 'left',
            color: '#1a1a1a'
          }}>Ready to join?</h2>
          
          <div style={{
            position: 'relative',
            width: '100%',
            height: '240px',
            background: '#1a1a1a',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {videoActive && stream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)'
                }}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#94a3b8' }}>videocam_off</span>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Camera is off</span>
              </div>
            )}

            {/* Quick Status indicators on video */}
            <div style={{
              position: 'absolute',
              bottom: '1rem',
              right: '1rem',
              display: 'flex',
              gap: '0.5rem'
            }}>
              <span style={{
                background: 'rgba(0,0,0,0.6)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: micActive ? '#10b981' : '#ef4444'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>
                  {micActive ? 'mic' : 'mic_off'}
                </span>
              </span>
            </div>
          </div>

          {/* Quick Media Control Buttons */}
          <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'center' }}>
            <button
              onClick={() => setMicActive(!micActive)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                borderRadius: '12px',
                background: micActive ? '#f1f5f9' : '#ef4444',
                color: micActive ? '#1a1a1a' : '#fff',
                fontWeight: 600,
                border: '1px solid #cbd5e1',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
            >
              <span className="material-symbols-outlined">{micActive ? 'mic' : 'mic_off'}</span>
              {micActive ? 'Mute' : 'Unmute'}
            </button>
            <button
              onClick={() => setVideoActive(!videoActive)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                borderRadius: '12px',
                background: videoActive ? '#f1f5f9' : '#ef4444',
                color: videoActive ? '#1a1a1a' : '#fff',
                fontWeight: 600,
                border: '1px solid #cbd5e1',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
            >
              <span className="material-symbols-outlined">{videoActive ? 'videocam' : 'videocam_off'}</span>
              {videoActive ? 'Stop Video' : 'Start Video'}
            </button>
          </div>
        </div>

        {/* Right Side: Setup Options */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          padding: '2.5rem',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)'
        }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.2rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              backgroundImage: 'linear-gradient(to right, #4f46e5, #a855f7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.5rem'
            }}>SoftBridge Meet</h1>
            <p style={{ color: '#475569', fontSize: '0.95rem' }}>Secure, high-definition video conferencing for teams.</p>
          </div>

          {/* Name input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Your Display Name</label>
            <input
              type="text"
              placeholder="Enter name to display in meeting"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1.2rem',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                color: '#1a1a1a',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
              onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
            />
          </div>

          <div style={{ width: '100%', height: '1px', background: '#cbd5e1' }} />

          {/* Actions grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Join Room */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Enter meeting room code or link"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.85rem 1.2rem',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  color: '#1a1a1a',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleJoinMeeting}
                disabled={!roomIdInput.trim()}
                style={{
                  padding: '0 1.5rem',
                  borderRadius: '12px',
                  background: roomIdInput.trim() ? '#4f46e5' : '#f1f5f9',
                  color: roomIdInput.trim() ? '#fff' : '#94a3b8',
                  fontWeight: 700,
                  cursor: roomIdInput.trim() ? 'pointer' : 'default',
                  transition: 'background 0.2s',
                  border: 'none'
                }}
              >
                Join Room
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.8rem', gap: '0.5rem' }}>
              <span>OR</span>
            </div>

            {/* Start Room */}
            {userProfile ? (
              <button
                onClick={handleStartInstantMeeting}
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                  color: '#fff',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
                  transition: 'transform 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
              >
                <span className="material-symbols-outlined">video_call</span>
                Start Instant Meeting
              </button>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '0.85rem',
                borderRadius: '12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#ef4444',
                fontSize: '0.8rem',
                fontWeight: 600
              }}>
                Sign in to start/host your own instant meetings. Guests can only join existing meetings using a code above.
              </div>
            )}
          </div>

          {statusMsg && (
            <p style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>
              {statusMsg}
            </p>
          )}

          {/* Limits display */}
          {meetLimits && (
            <div style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '14px',
              padding: '0.85rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              fontSize: '0.8rem',
              color: '#475569'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>Usage & Tier Limits</span>
                <span style={{
                  color: meetLimits.isPremium ? '#10b981' : '#f59e0b',
                  background: '#f1f5f9',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  border: '1px solid #cbd5e1'
                }}>
                  {meetLimits.isPremium ? 'PRO TIER' : 'FREE TIER'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Meetings Hosted:</span>
                <span>{meetLimits.hostedCount} / {meetLimits.maxMeetings}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Call Time Used:</span>
                <span>{Math.round(meetLimits.totalDurationSec / 60)} mins / {Math.round(meetLimits.maxDurationSec / 3600)} hrs</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {userProfile && hostedMeetings.length > 0 && (
        <div style={{
          maxWidth: '1000px',
          width: '100%',
          marginTop: '3rem',
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          padding: '2rem',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.25rem',
            fontWeight: 800,
            marginBottom: '1rem',
            color: '#1a1a1a'
          }}>Your Hosted Meetings</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Room ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Date & Time</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Duration</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {hostedMeetings.slice((currentPage - 1) * 5, currentPage * 5).map(meet => (
                  <tr key={meet.room_id} style={{ borderBottom: '1px solid #f1f5f9', color: '#1a1a1a' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{meet.room_id}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{new Date(meet.start_time).toLocaleString()}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {meet.end_time ? `${Math.round(meet.duration / 60)} mins` : 'In Progress / Stale'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <button
                        onClick={() => router.push(`/meet/${meet.room_id}`)}
                        style={{
                          background: '#4f46e5',
                          color: '#fff',
                          border: 'none',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      >
                        Rejoin
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {hostedMeetings.length > 5 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', fontSize: '0.8rem', color: '#475569' }}>
                <div>Showing {Math.min(hostedMeetings.length, (currentPage - 1) * 5 + 1)}-{Math.min(hostedMeetings.length, currentPage * 5)} of {hostedMeetings.length}</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    style={{
                      background: currentPage === 1 ? '#e2e8f0' : '#4f46e5',
                      color: currentPage === 1 ? '#94a3b8' : '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.35rem 0.75rem',
                      cursor: currentPage === 1 ? 'default' : 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Prev
                  </button>
                  <button
                    disabled={currentPage >= Math.ceil(hostedMeetings.length / 5)}
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(hostedMeetings.length / 5), prev + 1))}
                    style={{
                      background: currentPage >= Math.ceil(hostedMeetings.length / 5) ? '#e2e8f0' : '#4f46e5',
                      color: currentPage >= Math.ceil(hostedMeetings.length / 5) ? '#94a3b8' : '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.35rem 0.75rem',
                      cursor: currentPage >= Math.ceil(hostedMeetings.length / 5) ? 'default' : 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Styles for responsive Grid layout */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .lobby-grid {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}
