import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiGet, apiPost, apiDelete } from '../utils/api';
import { isLoggedIn } from '../utils/auth';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!isLoggedIn()) return;
    
    try {
      setLoading(true);
      const response = await apiGet('/api/notifications');
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await apiPost(`/api/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await apiPost('/api/notifications/mark-read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await apiDelete(`/api/notifications/${notificationId}`);
      const notification = notifications.find(n => n._id === notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Delete all read notifications
  const deleteAllRead = async () => {
    try {
      await apiDelete('/api/notifications/read/all');
      setNotifications(prev => prev.filter(n => !n.read));
    } catch (error) {
      console.error('Error deleting read notifications:', error);
    }
  };

  // Create notification (for admins)
  const createNotification = async (notificationData) => {
    try {
      const response = await apiPost('/api/notifications', notificationData);
      // If creating for current user, add to local state
      if (!notificationData.user || notificationData.user === 'current') {
        setNotifications(prev => [response.data, ...prev]);
        if (!response.data.read) {
          setUnreadCount(prev => prev + 1);
        }
      }
      return response.data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  };

  // Get unread count
  const getUnreadCount = async () => {
    try {
      const response = await apiGet('/api/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    if (!isLoggedIn()) return;

    fetchNotifications();
    
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    createNotification,
    getUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 