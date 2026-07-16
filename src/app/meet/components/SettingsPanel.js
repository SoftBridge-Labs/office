import React from 'react';
import { C, Drawer, Toggle } from './ui';

export default function SettingsPanel({
  onClose,
  id,
  isHostUser,
  roomSettings,
  toggleGlobal,
  meetLimits
}) {
  return (
    <Drawer title="Meeting Settings" onClose={onClose}>
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
  );
}
