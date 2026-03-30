import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';

export const useNotifications = (enabled = true) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { socket } = useSocket();

  const fetchNotifications = useCallback(async () => {
    if (!enabled) return;

    try {
      setIsLoading(true);
      const response = await api.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/notification`);
      const { notifications: data, unreadCount: count } = response.data.data;
      setNotifications(data || []);
      setUnreadCount(count || 0);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await api.put(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/notification/${notificationId}/read`);
      setNotifications((prev) => prev.map((notification) => (
        notification._id === notificationId ? { ...notification, isRead: true } : notification
      )));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.put(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/notification/read-all`);
      setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await api.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/notification/${notificationId}`);
      setNotifications((prev) => {
        const target = prev.find((notification) => notification._id === notificationId);
        if (target && !target.isRead) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        return prev.filter((notification) => notification._id !== notificationId);
      });
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }, []);

  const deleteAllNotifications = useCallback(async () => {
    try {
      await api.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/notification/all`);
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to delete all notifications:', err);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      fetchNotifications();
    }
  }, [enabled, fetchNotifications]);

  useEffect(() => {
    if (!socket || !enabled) return undefined;

    const handleNotificationNew = ({ notification }) => {
      setNotifications((prev) => (
        prev.some((item) => item._id === notification._id)
          ? prev
          : [notification, ...prev]
      ));
    };

    const handleNotificationUpdated = ({ notification }) => {
      setNotifications((prev) => prev.map((item) => (
        item._id === notification._id ? notification : item
      )));
    };

    const handleNotificationDeleted = ({ notificationId }) => {
      setNotifications((prev) => prev.filter((item) => item._id !== notificationId));
    };

    const handleNotificationCount = ({ unreadCount: nextUnreadCount }) => {
      setUnreadCount(nextUnreadCount || 0);
    };

    const handleReconnect = () => {
      fetchNotifications();
    };

    socket.on('notification:new', handleNotificationNew);
    socket.on('notification:updated', handleNotificationUpdated);
    socket.on('notification:deleted', handleNotificationDeleted);
    socket.on('notification:count', handleNotificationCount);
    socket.on('connect', handleReconnect);

    return () => {
      socket.off('notification:new', handleNotificationNew);
      socket.off('notification:updated', handleNotificationUpdated);
      socket.off('notification:deleted', handleNotificationDeleted);
      socket.off('notification:count', handleNotificationCount);
      socket.off('connect', handleReconnect);
    };
  }, [socket, enabled, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  };
};
