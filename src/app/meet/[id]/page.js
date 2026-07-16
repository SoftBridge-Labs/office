'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import VideoGrid from '../components/VideoGrid';

import { C, Avatar, IconBtn, PillBtn } from '../components/ui';
import SettingsPanel from '../components/SettingsPanel';
import ChatPanel from '../components/ChatPanel';
import PollsPanel from '../components/PollsPanel';
import ParticipantsPanel from '../components/ParticipantsPanel';
import ControlsBar from '../components/ControlsBar';
import PollModal from '../components/PollModal';
import GlobalStyles from '../components/GlobalStyles';
import { useMeetConnection } from '../hooks/useMeetConnection';

export default function MeetPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const encryptionKeyRef = useRef(null);
  const [activePanel, setActivePanel] = useState(null);

  const fmt = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const togglePanel = (panel) => setActivePanel(p => p === panel ? null : panel);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let hash = window.location.hash.replace('#', '');
      if (!hash) {
        hash = Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, '0')).join('');
        window.history.replaceState(null, null, `#${hash}`);
      }
      encryptionKeyRef.current = id + '-' + hash;
    }
  }, [id]);

  const conn = useMeetConnection({ id, router, searchParams, encryptionKeyRef, activePanel, setActivePanel });
  const { authorized, accessDenied, myStream, remoteStreams, micActive, videoActive, isScreenSharing, statusMsg, userProfile, meetLimits, isHandRaised, isHostUser, roomSettings, meetingTimer, floatingReactions, showReactionPicker, setShowReactionPicker, chatMessages, newMessage, setNewMessage, chatEndRef, unreadCount, polls, showPollModal, setShowPollModal, pollForm, setPollForm, toggleMic, toggleVideo, toggleScreenShare, toggleHandRaise, handleSendMessage, handleSendReaction, toggleBlockPeer, toggleGlobal, endCall, remotePeerIds } = conn;

  if (accessDenied) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: C.bg, color: C.text, gap: '1.25rem', textAlign: 'center', padding: '2rem' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: C.danger }}>lock</span>
      </div>
      <h2 style={{ fontWeight: 800, fontSize: '1.4rem', color: C.danger, margin: 0 }}>Access Restricted</h2>
      <p style={{ color: C.muted, maxWidth: 380, fontSize: '0.9rem', margin: 0 }}>This meeting is private. You need an invitation to join this room.</p>
      <button onClick={() => router.push('/calendar')} style={{ padding: '0.65rem 1.75rem', background: C.accent, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>Go to Calendar</button>
    </div>
  );

  if (!authorized) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: C.bg, color: C.muted }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${C.accent}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: '0.9rem' }}>Authenticating...</span>
      </div>
    </div>
  );

  // ─── Main Layout ──────────────────────────────────────────────────────────
  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: C.bg,
      color: C.text,
      fontFamily: "'Inter', -apple-system, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>

      {/* ── Top Bar ── */}
      <div style={{
        height: 56,
        background: C.sidebar,
        borderBottom: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 1.25rem',
        gap: '1rem',
        flexShrink: 0,
        zIndex: 10
      }}>
        {/* Back */}
        <button onClick={endCall} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: 6 }}
          onMouseEnter={e => e.currentTarget.style.color = C.text} onMouseLeave={e => e.currentTarget.style.color = C.muted}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>arrow_back</span>
        </button>

        {/* Logo */}
        <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: '#fff' }}>video_call</span>
        </div>

        {/* Room name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {id?.replace('SoftBridgeCalendar-', '').replace('internal-', '') || 'Meeting'}
          </div>
        </div>

        {/* Timer + Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, padding: '3px 12px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.success, animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: C.success }}>{fmt(meetingTimer)}</span>
          </div>
          <span style={{ fontSize: '0.78rem', color: C.muted }}>{statusMsg}</span>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <IconBtn icon="content_copy" label="Copy link" size={34} onClick={() => { if (typeof window !== 'undefined') { navigator.clipboard.writeText(window.location.href); } }} />
          {userProfile && <Avatar name={userProfile.name} avatar_url={userProfile.avatar_url} size={32} />}
        </div>
      </div>

      {/* ── Body ── */}

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden', position: 'relative' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minWidth: 0 }}>

          <VideoGrid
            remotePeerIds={remotePeerIds}
            remoteStreams={remoteStreams}
            localStream={myStream}
            videoActive={videoActive}
            micActive={micActive}
            userProfile={userProfile}
            isLocalScreenSharing={isScreenSharing}
          />

          {/* Floating Reactions */}
          <div style={{ position: 'absolute', bottom: '7rem', left: '1.5rem', pointerEvents: 'none', zIndex: 20, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {floatingReactions.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', padding: '0.35rem 0.75rem', borderRadius: 20, border: `1px solid ${C.border}`, animation: 'floatUp 3.5s ease-out forwards', fontSize: '0.82rem' }}>
                <span style={{ fontSize: '1.1rem' }}>{r.emoji}</span>
                <span style={{ color: '#d4d4d8', fontWeight: 600 }}>{r.sender}</span>
              </div>
            ))}
          </div>

          <ControlsBar {...conn} activePanel={activePanel} togglePanel={togglePanel} />
        </div>

        {/* ── Side Panels ── */}
        {activePanel === 'chat' && <ChatPanel onClose={() => setActivePanel(null)} chatMessages={chatMessages} userProfile={userProfile} chatEndRef={chatEndRef} newMessage={newMessage} setNewMessage={setNewMessage} handleSendMessage={handleSendMessage} />}
        {activePanel === 'participants' && <ParticipantsPanel onClose={() => setActivePanel(null)} remotePeerIds={remotePeerIds} remoteStreams={remoteStreams} isHostUser={isHostUser} roomSettings={roomSettings} userProfile={userProfile} isHandRaised={isHandRaised} micActive={micActive} videoActive={videoActive} toggleGlobal={toggleGlobal} toggleBlockPeer={toggleBlockPeer} />}
        {activePanel === 'polls' && <PollsPanel onClose={() => setActivePanel(null)} isHostUser={isHostUser} setShowPollModal={setShowPollModal} polls={polls} userProfile={userProfile} id={id} />}
        {activePanel === 'settings' && <SettingsPanel onClose={() => setActivePanel(null)} id={id} isHostUser={isHostUser} roomSettings={roomSettings} toggleGlobal={toggleGlobal} meetLimits={meetLimits} />}
      </div>

      <PollModal showPollModal={showPollModal} setShowPollModal={setShowPollModal} pollForm={pollForm} setPollForm={setPollForm} id={id} encryptionKeyRef={encryptionKeyRef} />

      <GlobalStyles />
    </div>
  );
}