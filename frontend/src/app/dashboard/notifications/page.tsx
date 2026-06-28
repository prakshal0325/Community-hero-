'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useSocketEvent } from '@/lib/socket';
import { notificationsAPI } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
import {
  Bell, CheckCheck, Trash2, FileText, Award, MessageCircle,
  UserCheck, Settings, AlertTriangle, Loader2, BellOff, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

const notificationIcons: Record<string, any> = {
  STATUS_CHANGE: FileText,
  NEARBY_COMPLAINT: AlertTriangle,
  VERIFICATION_REQUEST: UserCheck,
  BADGE_EARNED: Award,
  LEVEL_UP: Award,
  CHALLENGE_COMPLETE: Award,
  COMMENT: MessageCircle,
  ASSIGNMENT: FileText,
  SYSTEM: Settings,
};

const notificationColors: Record<string, string> = {
  STATUS_CHANGE: 'text-blue-500 bg-blue-500/10',
  NEARBY_COMPLAINT: 'text-orange-500 bg-orange-500/10',
  VERIFICATION_REQUEST: 'text-green-500 bg-green-500/10',
  BADGE_EARNED: 'text-yellow-500 bg-yellow-500/10',
  LEVEL_UP: 'text-purple-500 bg-purple-500/10',
  CHALLENGE_COMPLETE: 'text-emerald-500 bg-emerald-500/10',
  COMMENT: 'text-cyan-500 bg-cyan-500/10',
  ASSIGNMENT: 'text-violet-500 bg-violet-500/10',
  SYSTEM: 'text-gray-500 bg-gray-500/10',
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadNotifications = useCallback(async () => {
    try {
      const { data } = await notificationsAPI.getAll({ page, limit: 30 });
      setNotifications(data.notifications || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Real-time notification listener
  const handleNewNotification = useCallback((data: any) => {
    setNotifications((prev) => [data, ...prev]);
    toast.info(data.title);
  }, []);

  useSocketEvent('notification:new', handleNewNotification);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Group notifications by date
  const today = new Date();
  const todayStr = today.toDateString();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const grouped = {
    today: notifications.filter((n) => new Date(n.createdAt).toDateString() === todayStr),
    thisWeek: notifications.filter((n) => {
      const d = new Date(n.createdAt);
      return d.toDateString() !== todayStr && d >= weekAgo;
    }),
    earlier: notifications.filter((n) => new Date(n.createdAt) < weekAgo),
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-muted rounded-xl animate-shimmer" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="glass rounded-2xl h-20 animate-shimmer" />
        ))}
      </div>
    );
  }

  const renderGroup = (label: string, items: any[]) => {
    if (items.length === 0) return null;
    return (
      <div key={label}>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
          {label}
        </h3>
        <div className="space-y-2">
          {items.map((notification) => {
            const Icon = notificationIcons[notification.type] || Bell;
            const colorClass = notificationColors[notification.type] || 'text-gray-500 bg-gray-500/10';
            return (
              <div
                key={notification.id}
                onClick={() => !notification.read && handleMarkRead(notification.id)}
                className={`glass rounded-xl p-4 flex items-start gap-4 transition-all cursor-pointer group hover:bg-accent/30
                  ${!notification.read ? 'border-l-4 border-violet-500' : 'opacity-75'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className={`text-sm font-medium ${!notification.read ? '' : 'text-muted-foreground'}`}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                    {notification.message}
                  </p>
                  {notification.complaint && (
                    <Link
                      href={`/dashboard/citizen/complaints/${notification.complaint.id}`}
                      className="inline-flex items-center gap-1 mt-2 text-xs text-violet-500 hover:text-violet-400 font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FileText className="w-3 h-3" /> View complaint →
                    </Link>
                  )}
                </div>
                {!notification.read && (
                  <div className="w-2.5 h-2.5 rounded-full bg-violet-500 shrink-0 mt-1.5" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-violet-500" />
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-violet-600 text-white text-xs font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium glass hover:bg-accent/50 transition-all"
          >
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <BellOff className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
          <p className="text-sm text-muted-foreground">
            You&apos;ll be notified about status updates, verifications, and community activity.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {renderGroup('Today', grouped.today)}
          {renderGroup('This Week', grouped.thisWeek)}
          {renderGroup('Earlier', grouped.earlier)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-all
                ${page === i + 1 ? 'bg-violet-600 text-white' : 'glass hover:bg-accent/50'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
