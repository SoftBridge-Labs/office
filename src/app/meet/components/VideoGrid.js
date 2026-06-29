'use client';

export default function VideoGrid({
  remotePeerIds = [],
  remoteStreams = {},
  localVideoRef,
  videoActive,
  micActive,
  userProfile,
  isLocalScreenSharing
}) {
  const remoteScreenSharePeerId = remotePeerIds.find(pId => remoteStreams[pId]?.isScreenSharing);
  const activePresenter = isLocalScreenSharing
    ? { name: 'You (Your Screen)', isLocal: true }
    : remoteScreenSharePeerId
      ? { name: `${remoteStreams[remoteScreenSharePeerId].name} (Screen Share)`, isLocal: false, peerId: remoteScreenSharePeerId, stream: remoteStreams[remoteScreenSharePeerId].stream }
      : null;

  const cardStyle = {
    position: 'relative',
    height: '100%',
    maxHeight: '400px',
    background: '#18181b',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const renderLocalCard = (isMini = false) => (
    <div style={{ ...cardStyle, maxHeight: isMini ? '150px' : '400px' }}>
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: isLocalScreenSharing ? 'none' : 'scaleX(-1)',
          opacity: videoActive || isLocalScreenSharing ? 1 : 0
        }}
      />
      {(!videoActive && !isLocalScreenSharing) && (
        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>videocam_off</span>
          </div>
          {!isMini && <span style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 600 }}>Video is Off</span>}
        </div>
      )}
      <span style={{ position: 'absolute', bottom: '0.5rem', left: '0.5rem', background: 'rgba(9,9,11,0.75)', backdropFilter: 'blur(8px)', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span>{userProfile?.name || 'You'}</span>
        {(!micActive) && <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', color: '#ef4444' }}>mic_off</span>}
      </span>
    </div>
  );

  const renderRemoteCard = (pId, isMini = false) => {
    const item = remoteStreams[pId];
    if (!item) return null;
    return (
      <div key={pId} style={{ ...cardStyle, maxHeight: isMini ? '150px' : '400px' }}>
        <video
          autoPlay
          playsInline
          ref={el => {
            if (el && item.stream) {
              if (el.srcObject !== item.stream) {
                el.srcObject = item.stream;
                el.play().catch(err => console.error("Error playing remote video:", err));
              }
            }
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: item.isVideoOff ? 0 : 1
          }}
        />
        {item.isVideoOff && (
          <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>videocam_off</span>
            </div>
            {!isMini && <span style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 600 }}>Video is Off</span>}
          </div>
        )}
        <span style={{ position: 'absolute', bottom: '0.5rem', left: '0.5rem', background: 'rgba(9,9,11,0.75)', backdropFilter: 'blur(8px)', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>{item.name}</span>
          {item.isMuted && <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', color: '#ef4444' }}>mic_off</span>}
          {item.isHandRaised && <span style={{ marginLeft: '4px' }}>✋</span>}
        </span>
      </div>
    );
  };

  // ─── Render Presenter Layout ───
  if (activePresenter) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        gap: '1.5rem',
        padding: '1.5rem',
        paddingBottom: '7rem',
        height: 'calc(100vh - 120px)',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }} className="lobby-grid">
        {/* Left: Large Screen view */}
        <div style={{
          flex: 3,
          background: '#18181b',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {activePresenter.isLocal ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          ) : (
            <video
              autoPlay
              playsInline
              ref={el => {
                if (el && activePresenter.stream) {
                  if (el.srcObject !== activePresenter.stream) {
                    el.srcObject = activePresenter.stream;
                    el.play().catch(err => console.log(err));
                  }
                }
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          )}
          <span style={{
            position: 'absolute',
            bottom: '1rem',
            left: '1rem',
            background: 'rgba(9,9,11,0.85)',
            backdropFilter: 'blur(8px)',
            padding: '0.5rem 1rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: 700,
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            🖥️ Screen: {activePresenter.name}
          </span>
        </div>

        {/* Right: Vertical Filmstrip */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          overflowY: 'auto',
          maxHeight: '100%',
          paddingRight: '4px'
        }}>
          {!activePresenter.isLocal && renderLocalCard(true)}
          {remotePeerIds.map(pId => {
            if (activePresenter.peerId === pId) return null;
            return renderRemoteCard(pId, true);
          })}
        </div>
      </div>
    );
  }

  // ─── Render Regular Grid Layout ───
  return (
    <div style={{
      flex: 1,
      display: 'grid',
      gridTemplateColumns: remotePeerIds.length === 0 ? '1fr' : remotePeerIds.length === 1 ? '1fr 1fr' : 'repeat(auto-fit, minmax(360px, 1fr))',
      gap: '1.5rem',
      padding: '1.5rem',
      paddingBottom: '7rem',
      alignItems: 'center',
      justifyContent: 'center',
      maxWidth: '1200px',
      margin: '0 auto',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {renderLocalCard()}
      {remotePeerIds.map(pId => renderRemoteCard(pId))}
    </div>
  );
}
