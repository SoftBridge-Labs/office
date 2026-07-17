'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { usePingSocket } from '../hooks/usePingSocket';

const PingContext = createContext(null);

export function PingProvider({ children }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const channelParam = searchParams.get('channel');

  const [activeChannelId, setActiveChannelId] = useState(channelParam || null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageContent, setEditingMessageContent] = useState('');
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [showRightPanel, setShowRightPanel] = useState(true);
  
  // Feature states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDMModal, setShowDMModal] = useState(false);
  const [viewProfileModal, setViewProfileModal] = useState(null);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelPrivate, setNewChannelPrivate] = useState(false);
  const [presenceDropdown, setPresenceDropdown] = useState(false);
  const [channelSearch, setChannelSearch] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  
  // Invite states
  const [inviteTab, setInviteTab] = useState('link'); // 'dept', 'user', 'link'
  const [departments, setDepartments] = useState([]);
  const [workspaceUsers, setWorkspaceUsers] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const localUser = localStorage.getItem('sb_user');
    let uid = localStorage.getItem('sb_uid');
    
    if (localUser) {
      try {
        const parsed = JSON.parse(localUser);
        setUserProfile(parsed);
        if (parsed.uid) uid = parsed.uid;
      } catch (e) {}
    }

    const fetchInitialData = async () => {
      try {
        const res = await api.ping.getChannels();
        let fetchedChannels = [];
        if (res && res.success) {
          fetchedChannels = res.data || [];
        } else if (res && Array.isArray(res)) {
          fetchedChannels = res;
        }
        
        setChannels(fetchedChannels);

        // Initial active channel selection if none is set
        setActiveChannelId(prev => {
           if (prev) return prev;
           const joinId = searchParams.get('join');
           if (joinId) return joinId;
           const param = searchParams.get('channel');
           if (param) return param;
           return null;
        });

        try {
          const deptRes = await api.ping.listWorkspaceDepartments();
          if (deptRes && deptRes.success) setDepartments(deptRes.data);
        } catch (e) {
          if (e.message !== 'Access denied') console.error('Failed to fetch departments', e);
        }
        
        try {
          const usersRes = await api.ping.listWorkspaceUsers();
          if (usersRes && usersRes.success) setWorkspaceUsers(usersRes.data);
        } catch (e) {
          if (e.message !== 'Access denied') console.error('Failed to fetch users', e);
        }
      } catch (err) {
        if (err.message !== 'Access denied') console.error('Failed to fetch channels', err);
        setChannels([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []); // Run once on mount

  // Sync active channel to URL parameter if changed internally
  useEffect(() => {
    if (activeChannelId && channelParam !== activeChannelId) {
      router.replace(`${pathname}?channel=${activeChannelId}`, { scroll: false });
    }
  }, [activeChannelId, pathname, router, channelParam]);

  const { socket, isConnected, messages, setMessages, presenceData } = usePingSocket(userProfile?.uid, activeChannelId);

  const activeChannelRef = useRef(activeChannelId);
  const userProfileRef = useRef(userProfile);

  useEffect(() => {
    activeChannelRef.current = activeChannelId;
    userProfileRef.current = userProfile;
  }, [activeChannelId, userProfile]);

  useEffect(() => {
    if (socket) {
      const handleNewChannel = (c) => {
        setChannels(prev => {
          if (prev.find(ch => (ch._id || ch.id) === (c._id || c.id))) return prev;
          return [c, ...prev];
        });
      };
      const handleChannelDeleted = ({ channelId }) => {
        setChannels(prev => prev.filter(c => (c._id || c.id) !== channelId));
        setActiveChannelId(curr => curr === channelId ? null : curr);
      };
      
      socket.on('new_channel', handleNewChannel);
      socket.on('channel_deleted', handleChannelDeleted);

      const handleNewMessage = (msg) => {
        // If the message is not in the active channel and not from the current user, increment its unread count
        const currentUserUid = userProfileRef.current?.uid || localStorage.getItem('sb_uid');
        const activeChanId = activeChannelRef.current;
        if (msg.channelId && activeChanId && msg.channelId.toString() !== activeChanId.toString() && msg.senderUid !== currentUserUid && msg.type !== 'system') {
          setChannels(prev => prev.map(c => {
            const cid = c._id || c.id;
            if (cid && cid.toString() === msg.channelId.toString()) {
              return { ...c, unreadCount: (c.unreadCount || 0) + 1 };
            }
            return c;
          }));
        }
      };
      socket.on('new_message', handleNewMessage);

      return () => {
        socket.off('new_channel', handleNewChannel);
        socket.off('channel_deleted', handleChannelDeleted);
        socket.off('new_message', handleNewMessage);
      };
    }
  }, [socket]);

  useEffect(() => {
    if (!activeChannelId) {
      setMessages([]);
      return;
    }
    const fetchHistory = async () => {
      try {
        const res = await api.ping.getMessages(activeChannelId, { limit: 50 });
        if (res && res.success) {
          setMessages(res.data);
          setHasMoreMessages(res.data.length === 50);
        } else if (res && Array.isArray(res)) {
          setMessages(res);
          setHasMoreMessages(res.length === 50);
        } else {
          setMessages([]);
          setHasMoreMessages(false);
        }
      } catch (err) {
        if (err.message !== 'Access denied') console.error('Failed to fetch messages', err);
        setMessages([]);
      }
    };
    fetchHistory();
  }, [activeChannelId, setMessages]);

  const handleLoadMore = async () => {
    if (!activeChannelId || loadingMore || !hasMoreMessages) return;
    setLoadingMore(true);
    try {
      const skip = messages.length;
      const res = await api.ping.getMessages(activeChannelId, { limit: 50, skip });
      if (res && res.success) {
        const older = res.data;
        setMessages(prev => [...older, ...prev]);
        setHasMoreMessages(res.data.length === 50);
      } else if (res && Array.isArray(res)) {
        const older = res;
        setMessages(prev => [...older, ...prev]);
        setHasMoreMessages(res.length === 50);
      } else {
        setHasMoreMessages(false);
      }
    } catch (err) {
      console.error('Failed to load more messages', err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChannelId) return;
    const content = inputText.trim();
    setInputText('');
    
    const tempId = 'temp_' + Date.now();
    const optimisticMsg = {
      _id: tempId,
      channelId: activeChannelId,
      content,
      senderUid: userProfile?.uid,
      senderName: userProfile?.name || 'You',
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const res = await api.ping.sendMessage({ channelId: activeChannelId, content });
      if (res && res.success && res.data) {
        setMessages(prev => {
          if (prev.some(m => m._id === res.data._id && m._id !== tempId)) {
            return prev.filter(m => m._id !== tempId);
          }
          return prev.map(m => m._id === tempId ? res.data : m);
        });
      }
    } catch (err) {
      console.error('Failed to send message', err);
      setMessages(prev => prev.filter(m => m._id !== tempId));
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    try {
      const res = await api.ping.createChannel({
        name: newChannelName.trim(),
        type: 'channel',
        isPrivate: newChannelPrivate
      });
      if (res && res.success && res.data) {
        setChannels(prev => {
          if (prev.find(c => (c._id || c.id) === res.data._id)) return prev;
          return [res.data, ...prev];
        });
        setActiveChannelId(res.data._id);
        setShowCreateModal(false);
        setNewChannelName('');
        setNewChannelPrivate(false);
      }
    } catch (err) {
      console.error('Failed to create channel', err);
    }
  };

  const handleCreateDM = async (otherUserId) => {
    try {
      const otherUser = workspaceUsers.find(u => (u.uid || u._id) === otherUserId);
      const res = await api.ping.createChannel({
        name: otherUser ? otherUser.name : 'Direct Message',
        type: 'direct',
        isPrivate: true,
        otherMembers: [otherUserId]
      });
      if (res && res.success && res.data) {
        setChannels(prev => {
          if (prev.find(c => (c._id || c.id) === res.data._id)) return prev;
          return [res.data, ...prev];
        });
        setActiveChannelId(res.data._id);
        setShowDMModal(false);
      }
    } catch (err) {
      console.error('Failed to create DM', err);
    }
  };

  const handleJoinChannel = async () => {
    try {
      const res = await api.ping.addMemberToChannel(activeChannelId, { memberUid: userProfile.uid, role: 'member' });
      if (res && res.success) {
        setChannels(prev => prev.map(c => (c._id === activeChannelId || c.id === activeChannelId) ? res.data : c));
      }
    } catch (err) {
      console.error('Failed to join channel', err);
    }
  };

  const handleDeleteChannel = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) return;
    try {
      const res = await api.ping.deleteChannel(id);
      if (res && res.success) {
        setChannels(prev => prev.filter(c => (c._id || c.id) !== id));
        if (activeChannelId === id) setActiveChannelId(null);
      } else {
        alert(res?.error || 'Failed to delete channel');
      }
    } catch (err) {
      console.error('Failed to delete channel', err);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editingMessageContent.trim()) return;
    try {
      const res = await api.ping.editMessage(editingMessageId, { content: editingMessageContent.trim() });
      if (res && res.success) {
        setMessages(prev => prev.map(m => m._id === editingMessageId ? res.data : m));
        setEditingMessageId(null);
        setEditingMessageContent('');
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm('Delete message?')) return;
    try {
      const res = await api.ping.deleteMessage(msgId);
      if (res && res.success) {
        setMessages(prev => prev.filter(m => m._id !== msgId));
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      await api.ping.addReaction(messageId, { emoji });
    } catch (err) {
      console.error('Failed to add reaction', err);
    }
  };

  const handlePresenceUpdate = async (status) => {
    try {
      await api.ping.updatePresence({ status });
      setPresenceDropdown(false);
    } catch (err) {
      console.error('Failed to update presence', err);
    }
  };

  const handleInviteDept = async () => {
    if (!selectedDept || !activeChannelId) return;
    const deptUsers = workspaceUsers.filter(u => u.departments && Array.isArray(u.departments) && u.departments.includes(selectedDept)).map(u => u.uid || u._id);
    if (deptUsers.length === 0) return alert('No users in this department found.');
    try {
      const res = await api.ping.addMembersBulk(activeChannelId, { memberUids: deptUsers, role: 'member' });
      if (res && res.success) {
        setChannels(prev => prev.map(c => (c._id === activeChannelId || c.id === activeChannelId) ? res.data : c));
        alert(`Invited ${res.addedCount} users from department.`);
        setSelectedDept('');
      }
    } catch (err) {
      console.error('Failed to invite dept', err);
    }
  };

  const handleInviteUser = async () => {
    if (!selectedUser || !activeChannelId) return;
    try {
      const res = await api.ping.addMemberToChannel(activeChannelId, { memberUid: selectedUser, role: 'member' });
      if (res && res.success) {
        setChannels(prev => prev.map(c => (c._id === activeChannelId || c.id === activeChannelId) ? res.data : c));
        alert('User invited successfully!');
        setSelectedUser('');
      }
    } catch (err) {
      console.error('Failed to invite user', err);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/ping?join=${activeChannelId}`;
    navigator.clipboard.writeText(link);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleUpdateChannelSettings = async (settings) => {
    if (!activeChannelId) return;
    try {
      const res = await api.ping.updateChannelSettings(activeChannelId, settings);
      if (res && res.success) {
        setChannels(prev => prev.map(c => {
          if ((c._id || c.id) === activeChannelId) {
            return { ...c, ...settings, settings: { ...c.settings, ...settings.settings } };
          }
          return c;
        }));
        setShowSettingsModal(false);
      }
    } catch (err) {
      console.error('Failed to update channel settings', err);
    }
  };

  const activeChannel = channels.find(c => c._id === activeChannelId || c.id === activeChannelId);
  const isMemberOfActive = activeChannel && userProfile && activeChannel.members?.some(m => m.uid === userProfile.uid);
  const isOwnerOrAdmin = activeChannel && userProfile && activeChannel.members?.some(m => m.uid === userProfile.uid && ['owner', 'admin'].includes(m.role));

  const contextValue = {
    activeChannelId, setActiveChannelId,
    editingMessageId, setEditingMessageId,
    editingMessageContent, setEditingMessageContent,
    channels, setChannels,
    loading, setLoading,
    inputText, setInputText,
    userProfile, setUserProfile,
    showRightPanel, setShowRightPanel,
    showCreateModal, setShowCreateModal,
    showDMModal, setShowDMModal,
    viewProfileModal, setViewProfileModal,
    newChannelName, setNewChannelName,
    newChannelPrivate, setNewChannelPrivate,
    presenceDropdown, setPresenceDropdown,
    channelSearch, setChannelSearch,
    loadingMore, setLoadingMore,
    hasMoreMessages, setHasMoreMessages,
    showSettingsModal, setShowSettingsModal,
    showMoreMenu, setShowMoreMenu,
    inviteTab, setInviteTab,
    departments, setDepartments,
    workspaceUsers, setWorkspaceUsers,
    selectedDept, setSelectedDept,
    selectedUser, setSelectedUser,
    userSearch, setUserSearch,
    copySuccess, setCopySuccess,
    messagesEndRef,
    socket, isConnected, messages, setMessages, presenceData,
    handleLoadMore, handleSendMessage, handleCreateChannel, handleCreateDM, handleJoinChannel, handleDeleteChannel, handleSaveEdit, handleDeleteMessage, handleReaction, handlePresenceUpdate, handleInviteDept, handleInviteUser, handleCopyLink, handleUpdateChannelSettings,
    activeChannel, isMemberOfActive, isOwnerOrAdmin,
    router
  };

  return (
    <PingContext.Provider value={contextValue}>
      {children}
    </PingContext.Provider>
  );
}

export function usePingContext() {
  const context = useContext(PingContext);
  if (!context) {
    throw new Error('usePingContext must be used within a PingProvider');
  }
  return context;
}
