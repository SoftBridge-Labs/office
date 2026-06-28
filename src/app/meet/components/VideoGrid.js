'use client';

export default function VideoGrid({
  remotePeerIds = [],
  remoteStreams = {},
  localVideoRef,
  videoActive,
  micActive,
  userProfile
}) {
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
      {/* Local Stream Card */}
      <div style={{
        position: 'relative',
        height: '100%',
        maxHeight: '500px',
        background: '#18181b',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)',
            opacity: videoActive ? 1 : 0
          }}
        />
        {!videoActive && (
          <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            </div>
            <span style={{ fontSize: '0.85rem', color: '#71717a', fontWeight: 600 }}>Video is Off</span>
          </div>
        )}
        <span style={{ position: 'absolute', bottom: '1rem', left: '1rem', background: 'rgba(9,9,11,0.75)', backdropFilter: 'blur(8px)', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
          {userProfile?.name || 'You'} {(!micActive) && '(Muted)'}
        </span>
      </div>

      {/* Remote Streams */}
      {remotePeerIds.map(pId => {
        const item = remoteStreams[pId];
        return (
          <div key={pId} style={{
            position: 'relative',
            height: '100%',
            maxHeight: '500px',
            background: '#18181b',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <video
              autoPlay
              playsInline
              ref={el => {
                if (el && item?.stream) {
                  el.srcObject = item.stream;
                }
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            <span style={{ position: 'absolute', bottom: '1rem', left: '1rem', background: 'rgba(9,9,11,0.75)', backdropFilter: 'blur(8px)', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
              {item.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
