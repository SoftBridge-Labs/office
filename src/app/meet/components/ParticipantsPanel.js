import React from 'react';
import { C, Drawer, Avatar, Toggle } from './ui';

export default function ParticipantsPanel({
  onClose,
  remotePeerIds,
  remoteStreams,
  isHostUser,
  roomSettings,
  userProfile,
  isHandRaised,
  micActive,
  videoActive,
  toggleGlobal,
  toggleBlockPeer
}) {
  return (
    <Drawer title={`Participants — ${remotePeerIds.length + 1}`} onClose={onClose}>
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
  );
}
