'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface Notification {
  id: string;
  user_id: string;
  message: string;
  type: string;
  reference_id?: string;
  reference_type?: string;
  read: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  useMockData: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Mock notifications for demo purposes when API fails
const mockNotifications: Notification[] = [
  {
    id: 'mock-notif-1',
    user_id: 'mock-user',
    message: 'You have received a new review on your profile',
    type: 'new_review',
    reference_id: 'mock-review-1',
    reference_type: 'review',
    read: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
  },
  {
    id: 'mock-notif-2',
    user_id: 'mock-user',
    message: 'Welcome to Vett! Complete your profile to get started',
    type: 'system',
    read: false,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
  },
  {
    id: 'mock-notif-3',
    user_id: 'mock-user',
    message: 'Your profile has been approved and is now visible to reviewers',
    type: 'system',
    reference_id: 'mock-profile-1',
    reference_type: 'profile',
    read: true,
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() // 4 days ago
  }
];

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState(0);
  const [useMockData, setUseMockData] = useState(false);

  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Don't fetch too frequently (at most once every 30 seconds)
    const now = Date.now();
    if (now - lastFetched < 30000 && notifications.length > 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/get-notifications', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.status === 401) {
        console.log('Using mock notifications due to auth error');
        // Use mock data when unauthorized
        setUseMockData(true);
        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter(n => !n.read).length);
        setLastFetched(now);
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch notifications');
      }

      setUseMockData(false);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setLastFetched(now);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      setError(error.message || 'Failed to fetch notifications');
      
      // Use mock data on error as fallback
      if (notifications.length === 0) {
        console.log('Using mock notifications due to fetch error');
        setUseMockData(true);
        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter(n => !n.read).length);
      }
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    if (!user || notificationIds.length === 0) return;

    // If using mock data, just update the local state
    if (useMockData) {
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id)
            ? { ...notification, read: true }
            : notification
        )
      );
      
      // Recalculate unread count
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
      return;
    }

    try {
      const response = await fetch('/api/get-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ notificationIds }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to mark notifications as read');
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id)
            ? { ...notification, read: true }
            : notification
        )
      );
      
      // Recalculate unread count
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
    } catch (error: any) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  // Set up polling for new notifications (every 60 seconds)
  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 60000);

    return () => clearInterval(intervalId);
  }, [user]);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    useMockData
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
} 