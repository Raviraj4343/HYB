import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';

export const useChat = (chatId, enabled = true) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { socket } = useSocket();

  const fetchMessages = useCallback(async () => {
    if (!enabled || !chatId) return;
    try {
      setIsLoading(true);
      const response = await api.get(`/chat/${chatId}/messages`);
      setMessages(response.data.data.messages || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [chatId, enabled]);

  const sendMessage = useCallback(async (content, replyTo = null) => {
    if (!chatId) return { success: false };
    try {
      const response = await api.post(`/chat/${chatId}/messages`, { content, replyTo });
      return { success: true, message: response.data.data.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [chatId]);

  const deleteMessage = useCallback(async (messageId) => {
    if (!chatId) return;
    try {
      await api.delete(`/chat/${chatId}/messages/${messageId}`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [chatId]);

  useEffect(() => {
    if (enabled && chatId) fetchMessages();
  }, [enabled, chatId, fetchMessages]);

  useEffect(() => {
    if (!socket || !enabled || !chatId) return;
    socket.emit('chat:join', chatId);

    const handleNewMessage = ({ chatId: incomingChatId, message }) => {
      if (incomingChatId !== chatId) return;
      setMessages((prev) =>
        prev.some((item) => item._id === message._id) ? prev : [...prev, message]
      );
    };

    const handleDeletedMessage = ({ chatId: incomingChatId, messageId, deletedAt }) => {
      if (incomingChatId !== chatId) return;
      setMessages((prev) =>
        prev.map((message) =>
          message._id === messageId
            ? { ...message, content: null, isDeleted: true, deletedAt }
            : message
        )
      );
    };

    const handleMessagesDelivered = ({ chatId: incomingChatId }) => {
      if (incomingChatId !== chatId) return;
      setMessages((prev) =>
        prev.map((msg) => (!msg.isDelivered ? { ...msg, isDelivered: true } : msg))
      );
    };

    const handleMessagesRead = ({ chatId: incomingChatId }) => {
      if (incomingChatId !== chatId) return;
      setMessages((prev) =>
        prev.map((msg) => (!msg.isRead ? { ...msg, isDelivered: true, isRead: true } : msg))
      );
    };

    socket.on('chat:message:new', handleNewMessage);
    socket.on('chat:message:deleted', handleDeletedMessage);
    socket.on('chat:messages:delivered', handleMessagesDelivered);
    socket.on('chat:messages:read', handleMessagesRead);

    return () => {
      socket.emit('chat:leave', chatId);
      socket.off('chat:message:new', handleNewMessage);
      socket.off('chat:message:deleted', handleDeletedMessage);
      socket.off('chat:messages:delivered', handleMessagesDelivered);
      socket.off('chat:messages:read', handleMessagesRead);
    };
  }, [socket, enabled, chatId]);

  return { messages, isLoading, error, refetch: fetchMessages, sendMessage, deleteMessage };
};

export const useChatList = (enabled = true) => {
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { socket } = useSocket();

  const fetchChats = useCallback(async () => {
    if (!enabled) return;
    try {
      setIsLoading(true);
      const response = await api.get('/chat');
      setChats(response.data.data.chats || []);
    } catch (err) {
      console.error('Failed to fetch chats:', err);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) fetchChats();
  }, [enabled, fetchChats]);

  useEffect(() => {
    if (!socket || !enabled) return;
    const handleRefresh = () => fetchChats();
    socket.on('chat:list:refresh', handleRefresh);
    socket.on('connect', handleRefresh);
    return () => {
      socket.off('chat:list:refresh', handleRefresh);
      socket.off('connect', handleRefresh);
    };
  }, [socket, enabled, fetchChats]);

  return { chats, isLoading, refetch: fetchChats };
};

export const useGlobalChat = (enabled = true) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { socket } = useSocket();

  const fetchMessages = useCallback(async () => {
    if (!enabled) return;
    try {
      setIsLoading(true);
      const response = await api.get('/chat/global/messages');
      setMessages(response.data.data.messages || []);
    } catch (err) {
      console.error('Failed to fetch global messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  const sendMessage = useCallback(async (content, replyTo = null) => {
    try {
      const response = await api.post('/chat/global/messages', { content, replyTo });
      return { success: true, message: response.data.data.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const deleteMessage = useCallback(async (messageId) => {
    try {
      await api.delete(`/chat/global/messages/${messageId}`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  useEffect(() => {
    if (enabled) fetchMessages();
  }, [enabled, fetchMessages]);

  useEffect(() => {
    if (!socket || !enabled) return;

    const handleNewMessage = ({ message }) => {
      setMessages((prev) =>
        prev.some((item) => item._id === message._id) ? prev : [...prev, message]
      );
    };

    const handleDeletedMessage = ({ messageId, deletedAt }) => {
      setMessages((prev) =>
        prev.map((message) =>
          message._id === messageId
            ? { ...message, content: null, isDeleted: true, deletedAt }
            : message
        )
      );
    };

    socket.on('global-chat:message:new', handleNewMessage);
    socket.on('global-chat:message:deleted', handleDeletedMessage);
    socket.on('connect', fetchMessages);

    return () => {
      socket.off('global-chat:message:new', handleNewMessage);
      socket.off('global-chat:message:deleted', handleDeletedMessage);
      socket.off('connect', fetchMessages);
    };
  }, [socket, enabled, fetchMessages]);

  return { messages, isLoading, refetch: fetchMessages, sendMessage, deleteMessage };
};
