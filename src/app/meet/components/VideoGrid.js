'use client';

import { useState, useEffect } from 'react';

function AvatarPlaceholder({ name, avatar_url, size = 64, fontSize = '1.5rem' }) {
  if (avatar_url) {
    return (
      <img 
        src={avatar_url} 
        alt={name} 
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(255,255,255,0.1)' }} 
      />
    );
  }
  const colors = ['#6366f1','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#ef4444','#10b981'];
  const colorIdx = name ? name.charCodeAt(0) % colors.length : 0;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: colors[colorIdx],
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize, color: '#fff',
      flexShrink: 0
    }}>
      {(name || 'U').charAt(0).toUpperCase()}
    </div>
  );
}

function VideoTile({ stream, name, avatar_url, isMuted, isVideoOff, isHandRaised, isScreenSharing, isLocal, isMini = false, isFeatured = false }) {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      background: '#1c1d24',
      borderRadius: isFeatured ? '20px' : '14px',
      overflow: 'hidden',
      border: isFeatured ? '1.5px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.06)',
      boxShadow: isFeatured ? '0 8px 32px rgba(0,0,0,0.6)' : '0 4px 16px rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0
    }}>
      <video
        autoPlay playsInline muted={isLocal}
        ref={el => {
          if (el && stream) {
            if (el.srcObject !== stream) {
              el.srcObject = stream;
              el.play().catch(() => {});
            }
          }
        }}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          transform: (isLocal && !isScreenSharing) ? 'scaleX(-1)' : 'none',
          opacity: isVideoOff ? 0 : 1,
          transition: 'opacity 0.3s'
        }}
      />

      {/* Avatar when video off */}
      {(isVideoOff || (!isLocal && !stream)) && (
        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <AvatarPlaceholder name={name} avatar_url={avatar_url} size={isFeatured ? 80 : isMini ? 40 : 56} fontSize={isFeatured ? '2rem' : isMini ? '1rem' : '1.4rem'} />
          {!isMini && <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>Camera off</span>}
        </div>
      )}

      {/* Subtle gradient overlay at bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: isFeatured ? '80px' : '50px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
        pointerEvents: 'none'
      }} />

      {/* Name tag */}
      <div style={{
        position: 'absolute',
        bottom: '0.6rem', left: '0.65rem',
        display: 'flex', alignItems: 'center', gap: '0.4rem'
      }}>
        <span style={{
          fontSize: isFeatured ? '0.88rem' : '0.72rem',
          fontWeight: 600,
          color: '#f1f5f9',
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          maxWidth: isMini ? '80px' : '160px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>
          {name}{isLocal ? ' (You)' : ''}
        </span>
        {isMuted && (
          <span className="material-symbols-outlined" style={{ fontSize: '0.85rem', color: '#ef4444' }}>mic_off</span>
        )}
      </div>

      {/* Hand Raised badge */}
      {isHandRaised && (
        <div style={{
          position: 'absolute', top: '0.6rem', left: '0.6rem',
          background: 'rgba(245,158,11,0.9)', borderRadius: '50%',
          width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          animation: 'floatUp 2s ease-in-out infinite'
        }}>✋</div>
      )}

      {/* Screen share badge */}
      {isScreenSharing && (
        <div style={{
          position: 'absolute', top: '0.6rem', right: '0.6rem',
          background: '#10b981', borderRadius: '6px',
          padding: '4px 10px', fontSize: '0.75rem', fontWeight: 800, color: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)', letterSpacing: '0.05em'
        }}>SCREEN SHARE</div>
      )}

      {/* Speaking indicator */}
      {!isMuted && (
        <div style={{
          position: 'absolute', bottom: '0.6rem', right: '0.65rem',
          display: 'flex', alignItems: 'center', gap: '2px'
        }}>
          {[4, 7, 5].map((h, i) => (
            <div key={i} style={{
              width: '2.5px', height: `${h}px`,
              background: '#10b981', borderRadius: '2px',
              animation: 'audioBar 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function VideoGrid({
  remotePeerIds = [],
  remoteStreams = {},
  localStream,
  videoActive,
  micActive,
  userProfile,
  isLocalScreenSharing
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const [activeSpeakerId, setActiveSpeakerId] = useState(null);
  const MAX_MINI = 4;

  const remoteScreenSharePeerId = remotePeerIds.find(pId => remoteStreams[pId]?.isScreenSharing);
  const hasPresenter = isLocalScreenSharing || !!remoteScreenSharePeerId;

  // Active speaker detection
  useEffect(() => {
    if (remotePeerIds.length === 0) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    let audioCtx;
    try { audioCtx = new AudioContext(); } catch(e) { return; }
    
    const analysers = {};
    const dataArrays = {};

    remotePeerIds.forEach(pId => {
      const stream = remoteStreams[pId]?.stream;
      if (stream && stream.getAudioTracks().length > 0) {
        try {
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          analysers[pId] = analyser;
          dataArrays[pId] = new Uint8Array(analyser.frequencyBinCount);
        } catch (e) { }
      }
    });

    const interval = setInterval(() => {
      let maxVol = 0;
      let speaker = null;
      for (const pId in analysers) {
        analysers[pId].getByteFrequencyData(dataArrays[pId]);
        let sum = 0;
        for (let i = 0; i < dataArrays[pId].length; i++) {
          sum += dataArrays[pId][i];
        }
        const vol = sum / dataArrays[pId].length;
        if (vol > maxVol && vol > 15) { // threshold
          maxVol = vol;
          speaker = pId;
        }
      }
      if (speaker) setActiveSpeakerId(speaker);
    }, 1000);

    return () => {
      clearInterval(interval);
      audioCtx.close().catch(() => {});
    };
  }, [remotePeerIds, remoteStreams]);

  // Reset page on participant change
  useEffect(() => {
    setCurrentPage(0);
  }, [remotePeerIds.length]);

  const totalCount = remotePeerIds.length;

  // Determine featured peer (active speaker, or first remote)
  const featuredPeerId = (activeSpeakerId && remotePeerIds.includes(activeSpeakerId)) ? activeSpeakerId : remotePeerIds[0];

  // Tile peers for the strip (exclude featured)
  const stripPeerIds = remotePeerIds.filter(id => id !== featuredPeerId);
  const pageCount = Math.ceil(Math.max(0, stripPeerIds.length - 0) / MAX_MINI);
  const visibleStrip = stripPeerIds.slice(currentPage * MAX_MINI, (currentPage + 1) * MAX_MINI);

  // Disable remote streams that are not on the current page to save CPU
  useEffect(() => {
    const visibleIds = [featuredPeerId, ...visibleStrip].filter(Boolean);
    remotePeerIds.forEach(pId => {
      const isVisible = visibleIds.includes(pId) || pId === activePresenter?.peerId;
      const stream = remoteStreams[pId]?.stream;
      if (stream) {
        stream.getVideoTracks().forEach(track => {
          track.enabled = isVisible; // Stop decoder for non-visible tracks
        });
      }
    });
  }, [visibleStrip, featuredPeerId, remoteStreams, remotePeerIds, remoteScreenSharePeerId]);

  // === Screen share layout ===
  if (hasPresenter) {
    const presenterName = isLocalScreenSharing ? `${userProfile?.name || 'You'} — Screen` : `${remoteStreams[remoteScreenSharePeerId]?.name || 'Participant'} — Screen`;
    const presenterStream = isLocalScreenSharing ? localStream : remoteStreams[remoteScreenSharePeerId]?.stream;
    return (
      <div style={{ flex: 1, display: 'flex', gap: '1rem', padding: '1rem 1rem 7rem 1rem', boxSizing: 'border-box', overflow: 'hidden', minHeight: 0 }}>
        {/* Main screen area */}
        <div style={{ flex: 1, position: 'relative', borderRadius: '20px', overflow: 'hidden', background: '#111114', border: '1.5px solid rgba(255,255,255,0.07)', boxShadow: '0 8px 40px rgba(0,0,0,0.7)' }}>
          <video
            autoPlay playsInline muted={isLocalScreenSharing}
            ref={el => { if (el && presenterStream) { if (el.srcObject !== presenterStream) { el.srcObject = presenterStream; el.play().catch(() => {}); } } }}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
          <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: '#10b981' }}>monitor</span>
            {presenterName}
          </div>
        </div>
        {/* Film strip */}
        <div style={{ width: '160px', display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }}>
          <div style={{ height: '120px', flexShrink: 0 }}>
            <VideoTile name={userProfile?.name || 'You'} avatar_url={userProfile?.avatar_url} isLocal stream={localStream} isVideoOff={!videoActive} isMuted={!micActive} isMini />
          </div>
          {remotePeerIds.filter(pId => pId !== remoteScreenSharePeerId).map(pId => (
            <div key={pId} style={{ height: '120px', flexShrink: 0 }}>
              <VideoTile name={remoteStreams[pId]?.name || 'Participant'} avatar_url={remoteStreams[pId]?.avatar_url} stream={remoteStreams[pId]?.stream} isVideoOff={remoteStreams[pId]?.isVideoOff} isMuted={remoteStreams[pId]?.isMuted} isHandRaised={remoteStreams[pId]?.isHandRaised} isMini />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // === Solo call (no remote peers) ===
  if (totalCount === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1.5rem 8rem 1.5rem', boxSizing: 'border-box', minHeight: 0 }}>
        <div style={{ width: '100%', maxWidth: '680px', height: '100%', maxHeight: '480px' }}>
          <VideoTile name={userProfile?.name || 'You'} avatar_url={userProfile?.avatar_url} isLocal stream={localStream} isVideoOff={!videoActive} isMuted={!micActive} isFeatured />
        </div>
      </div>
    );
  }

  // === 1-on-1 call ===
  if (totalCount === 1) {
    const pId = remotePeerIds[0];
    return (
      <div style={{ flex: 1, display: 'flex', gap: '1rem', padding: '1rem 1rem 8rem 1rem', boxSizing: 'border-box', minHeight: 0 }}>
        {/* Featured remote */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <VideoTile name={remoteStreams[pId]?.name || 'Participant'} avatar_url={remoteStreams[pId]?.avatar_url} stream={remoteStreams[pId]?.stream} isVideoOff={remoteStreams[pId]?.isVideoOff} isMuted={remoteStreams[pId]?.isMuted} isHandRaised={remoteStreams[pId]?.isHandRaised} isFeatured />
        </div>
        {/* Your mini pip */}
        <div style={{ width: '200px', height: '140px', alignSelf: 'flex-end', flexShrink: 0, marginBottom: '0.5rem' }}>
          <VideoTile name={userProfile?.name || 'You'} avatar_url={userProfile?.avatar_url} isLocal stream={localStream} isVideoOff={!videoActive} isMuted={!micActive} isMini />
        </div>
      </div>
    );
  }

  // === Multi-party call (featured + strip) ===
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 1rem 7.5rem 1rem', boxSizing: 'border-box', minHeight: 0 }}>
      {/* Featured area */}
      <div style={{ flex: 1, display: 'flex', gap: '1rem', minHeight: 0 }}>
        {/* Main featured */}
        <div style={{ flex: 1, minHeight: 0 }}>
          {featuredPeerId ? (
            <VideoTile
              name={remoteStreams[featuredPeerId]?.name || 'Participant'}
              avatar_url={remoteStreams[featuredPeerId]?.avatar_url}
              stream={remoteStreams[featuredPeerId]?.stream}
              isVideoOff={remoteStreams[featuredPeerId]?.isVideoOff}
              isMuted={remoteStreams[featuredPeerId]?.isMuted}
              isHandRaised={remoteStreams[featuredPeerId]?.isHandRaised}
              isScreenSharing={remoteStreams[featuredPeerId]?.isScreenSharing}
              isFeatured
            />
          ) : (
            <VideoTile name={userProfile?.name || 'You'} avatar_url={userProfile?.avatar_url} isLocal stream={localStream} isVideoOff={!videoActive} isMuted={!micActive} isFeatured />
          )}
        </div>

        {/* Right column: your tile + extra remotes */}
        <div style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '0.75rem', flexShrink: 0 }}>
          {/* Your tile always in right column */}
          <div style={{ height: '140px' }}>
            <VideoTile name={userProfile?.name || 'You'} avatar_url={userProfile?.avatar_url} isLocal stream={localStream} isVideoOff={!videoActive} isMuted={!micActive} isMini />
          </div>
          {visibleStrip.map(pId => (
            <div key={pId} style={{ height: '140px' }}>
              <VideoTile name={remoteStreams[pId]?.name || 'Participant'} avatar_url={remoteStreams[pId]?.avatar_url} stream={remoteStreams[pId]?.stream} isVideoOff={remoteStreams[pId]?.isVideoOff} isMuted={remoteStreams[pId]?.isMuted} isHandRaised={remoteStreams[pId]?.isHandRaised} isMini />
            </div>
          ))}
          {/* Show +N more if overflow */}
          {stripPeerIds.length > MAX_MINI && (
            <div style={{ height: '140px', background: 'rgba(255,255,255,0.04)', borderRadius: '14px', border: '1px dashed rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#a1a1aa' }}>+{stripPeerIds.length - MAX_MINI}</span>
              <span style={{ fontSize: '0.68rem', color: '#6b7280' }}>more</span>
            </div>
          )}
        </div>
      </div>

      {/* Pagination strip */}
      {pageCount > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
          {[...Array(pageCount)].map((_, i) => (
            <button key={i} onClick={() => setCurrentPage(i)} style={{ width: '8px', height: '8px', borderRadius: '50%', border: 'none', cursor: 'pointer', background: i === currentPage ? '#6366f1' : 'rgba(255,255,255,0.2)', padding: 0 }} />
          ))}
        </div>
      )}
    </div>
  );
}
