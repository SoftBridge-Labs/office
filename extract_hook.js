const fs = require('fs');
const lines = fs.readFileSync('src/app/meet/[id]/page.js', 'utf8').split('\n');

const hookLines = [];
hookLines.push("import { useState, useEffect, useRef } from 'react';");
hookLines.push("import { api } from '@/lib/api';");
hookLines.push("import { encryptPayload, decryptPayload } from '@/lib/crypto';");
hookLines.push("");
hookLines.push("export function useMeetConnection({ id, router, searchParams, encryptionKeyRef, activePanel, setActivePanel }) {");
for(let i=32; i<=611; i++) {
  if (i >= 54 && i <= 56) continue;
  hookLines.push(lines[i]);
}

hookLines.push("");
hookLines.push("  return {");
hookLines.push("    authorized, setAuthorized, accessDenied, setAccessDenied, peerLoaded,");
hookLines.push("    myStream, remoteStreams, micActive, videoActive, isScreenSharing,");
hookLines.push("    statusMsg, userProfile, setUserProfile, meetLimits, isHandRaised,");
hookLines.push("    isHostUser, setIsHostUser, roomSettings, meetingTimer, floatingReactions,");
hookLines.push("    showReactionPicker, setShowReactionPicker, chatMessages, newMessage,");
hookLines.push("    setNewMessage, chatEndRef, unreadCount, setUnreadCount, polls, showPollModal,");
hookLines.push("    setShowPollModal, pollForm, setPollForm, toggleMic, toggleVideo,");
hookLines.push("    toggleScreenShare, toggleHandRaise, handleSendMessage, handleSendReaction,");
hookLines.push("    toggleBlockPeer, toggleGlobal, endCall, activeCalls, myPeerIdRef,");
hookLines.push("    remotePeerIds: Object.keys(remoteStreams)");
hookLines.push("  };");
hookLines.push("}");

fs.writeFileSync('src/app/meet/hooks/useMeetConnection.js', hookLines.join('\n'));
