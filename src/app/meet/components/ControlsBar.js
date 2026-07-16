import React from 'react';
import { C, IconBtn, PillBtn } from './ui';

export default function ControlsBar({
  micActive,
  toggleMic,
  videoActive,
  toggleVideo,
  isScreenSharing,
  toggleScreenShare,
  isHandRaised,
  toggleHandRaise,
  showReactionPicker,
  setShowReactionPicker,
  handleSendReaction,
  remotePeerIds,
  activePanel,
  togglePanel,
  unreadCount,
  endCall,
  isHostUser
}) {
  return (
    <div className="meet-controls-bar" style={{
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
  );
}
