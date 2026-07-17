'use client';

import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const getApiUrl = () => {
  if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__.NEXT_PUBLIC_API_URL) return window.__ENV__.NEXT_PUBLIC_API_URL;
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
};

export function usePingSocket(uid, activeChannelId) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [presenceData, setPresenceData] = useState({});
  const activeChannelRef = useRef(activeChannelId);

  useEffect(() => {
    activeChannelRef.current = activeChannelId;
  }, [activeChannelId]);

  useEffect(() => {
    if (!uid) return;

    const url = getApiUrl();
    const newSocket = io(`${url}/workspace/ping`, {
      auth: { token: uid }, // The doc says: { token: "user_uid" }
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      if (activeChannelRef.current) {
        newSocket.emit('join_channel', activeChannelRef.current);
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('new_message', (msg) => {
      // Play sound for all incoming messages not from the user
      if (msg.senderUid !== uid) {
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.play().catch(() => {});
        } catch (e) {}
      }

      if (msg.channelId === activeChannelRef.current) {
        setMessages(prev => {
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    });

    newSocket.on('message_edited', (editedMsg) => {
      setMessages(prev => prev.map(m => m._id === editedMsg._id ? editedMsg : m));
    });

    newSocket.on('message_deleted', ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    });

    newSocket.on('message_reaction', ({ messageId, emoji, uid }) => {
      setMessages(prev => prev.map(m => {
        if (m._id === messageId) {
          const newReactions = [...(m.reactions || [])];
          // Check if already reacted
          if (!newReactions.find(r => r.emoji === emoji && r.uid === uid)) {
            newReactions.push({ emoji, uid });
          }
          return { ...m, reactions: newReactions };
        }
        return m;
      }));
    });

    newSocket.on('message_read', ({ messageId, uid }) => {
      setMessages(prev => prev.map(m => {
        if (m._id === messageId) {
          const newReads = [...(m.readBy || [])];
          if (!newReads.includes(uid)) newReads.push(uid);
          return { ...m, readBy: newReads };
        }
        return m;
      }));
    });

    newSocket.on('presence_update', (presence) => {
      setPresenceData(prev => ({ ...prev, [presence.uid]: presence }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [uid]);

  useEffect(() => {
    if (socket && isConnected && activeChannelId) {
      socket.emit('join_channel', activeChannelId);
      return () => {
        socket.emit('leave_channel', activeChannelId);
      };
    }
  }, [socket, isConnected, activeChannelId]);

  return {
    socket,
    isConnected,
    messages,
    setMessages, // allow setting history from REST API
    presenceData
  };
}
