import React, { useState, useEffect } from 'react';
import { C, Drawer, Toggle } from './ui';
import { api } from '@/lib/api';

export default function SettingsPanel({
  onClose,
  id,
  isHostUser,
  roomSettings,
  toggleGlobal,
  meetLimits
}) {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [sharingStatus, setSharingStatus] = useState('');

  useEffect(() => {
    async function loadChannels() {
      try {
        const res = await api.ping.getChannels();
        if (res && res.success) {
          setChannels(res.data || []);
        } else if (res && Array.isArray(res)) {
          setChannels(res);
        }
      } catch (err) {
        console.error('Failed to load channels in SettingsPanel', err);
      }
    }
    loadChannels();
  }, []);

  const handleShareInPing = async () => {
    if (!selectedChannel) return;
    setSharingStatus('Sharing...');
    try {
      const meetLink = typeof window !== 'undefined' ? window.location.href : id;
      await api.ping.sendMessage({
        channelId: selectedChannel,
        content: `Join my meeting: ${meetLink}`
      });
      setSharingStatus('Shared successfully!');
      setTimeout(() => setSharingStatus(''), 3000);
    } catch (err) {
      console.error(err);
      setSharingStatus('Failed to share.');
    }
  };

  return (
    <Drawer title="Meeting Settings" onClose={onClose}>
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Share */}
        <div style={{ background: C.card, borderRadius: 12, padding: '1rem', border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.85rem' }}>Share Meeting</div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input readOnly value={typeof window !== 'undefined' ? window.location.href : id} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '0.5rem 0.75rem', color: C.text, fontSize: '0.78rem', outline: 'none' }} />
            <button onClick={() => { if (typeof window !== 'undefined') navigator.clipboard.writeText(window.location.href); }} style={{ background: C.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '0 0.85rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>Copy</button>
          </div>

          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Share Link in Ping</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
            <select 
              value={selectedChannel} 
              onChange={e => setSelectedChannel(e.target.value)}
              style={{
                width: '100%',
                background: '#13141b',
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: '0.5rem 0.75rem',
                color: C.text,
                fontSize: '0.78rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="" style={{ background: '#13141b', color: C.muted }}>Select Ping Channel...</option>
              {channels.map(chan => (
                <option key={chan._id || chan.id} value={chan._id || chan.id} style={{ background: '#13141b', color: C.text }}>
                  {chan.type === 'direct' ? `DM: ${chan.name}` : `# ${chan.name}`}
                </option>
              ))}
            </select>
            <button 
              disabled={!selectedChannel}
              onClick={handleShareInPing}
              style={{ 
                background: selectedChannel ? C.success : 'rgba(255,255,255,0.05)', 
                color: selectedChannel ? '#fff' : C.muted, 
                border: 'none', 
                borderRadius: 8, 
                padding: '0.5rem', 
                cursor: selectedChannel ? 'pointer' : 'not-allowed', 
                fontWeight: 600, 
                fontSize: '0.8rem',
                textAlign: 'center'
              }}
            >
              Send Invitation
            </button>
            {sharingStatus && (
              <span style={{ fontSize: '0.72rem', color: sharingStatus.includes('success') ? C.success : sharingStatus.includes('Failed') ? C.danger : C.accent, textAlign: 'center', marginTop: '0.25rem' }}>
                {sharingStatus}
              </span>
            )}
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
