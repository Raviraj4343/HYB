import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';

export const useNotifications = (enabled = true) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { socket } = useSocket();

  const fetchNotifications = useCallback(async () => {
    if (!enabled) return;
    try {
      setIsLoading(true);
      const response = await api.get('/notification');
      const { notifications: data, unreadCount: count } = response.data.data;
      setNotifications(data || []);
      setUnreadCount(count || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await api.put(`/notification/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/notification/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await api.delete(`/notification/${notificationId}`);
      setNotifications((prev) => {
        const target = prev.find((n) => n._id === notificationId);
        if (target && !target.isRead) setUnreadCount((c) => Math.max(0, c - 1));
        return prev.filter((n) => n._id !== notificationId);
      });
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }, []);

  const deleteAllNotifications = useCallback(async () => {
    try {
      await api.delete('/notification/all');
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to delete all notifications:', err);
    }
  }, []);

  useEffect(() => {
    if (enabled) fetchNotifications();
  }, [enabled, fetchNotifications]);

  useEffect(() => {
    if (!socket || !enabled) return;

    const handleNew = ({ notification }) => {
      setNotifications((prev) =>
        prev.some((item) => item._id === notification._id) ? prev : [notification, ...prev]
      );
      setUnreadCount((c) => c + 1);
    };
    const handleUpdated = ({ notification }) => {
      setNotifications((prev) =>
        prev.map((item) => (item._id === notification._id ? notification : item))
      );
    };
    const handleDeleted = ({ notificationId }) => {
      setNotifications((prev) => prev.filter((item) => item._id !== notificationId));
    };
    const handleCount = ({ unreadCount: count }) => setUnreadCount(count || 0);

    socket.on('notification:new', handleNew);
    socket.on('notification:updated', handleUpdated);
    socket.on('notification:deleted', handleDeleted);
    socket.on('notification:count', handleCount);
    socket.on('connect', fetchNotifications);

    return () => {
      socket.off('notification:new', handleNew);
      socket.off('notification:updated', handleUpdated);
      socket.off('notification:deleted', handleDeleted);
      socket.off('notification:count', handleCount);
      socket.off('connect', fetchNotifications);
    };
  }, [socket, enabled, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    setNotifications,   // exposed so callers can optimistically update the list
  };
};
