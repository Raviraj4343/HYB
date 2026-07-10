import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, CheckCheck, Trash2, Loader2, RefreshCw, MessageCircle, Zap, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import api from '@/api/axios';

const getNotificationMeta = (type) => {
  switch (type) {
    case 'new_response':
      return { icon: <MessageCircle className="h-4 w-4 text-blue-400" />, bg: 'bg-blue-500/15' };
    case 'response_accepted':
      return { icon: <Check className="h-4 w-4 text-emerald-400" />, bg: 'bg-emerald-500/15' };
    case 'response_rejected':
      return { icon: <Trash2 className="h-4 w-4 text-red-400" />, bg: 'bg-red-500/15' };
    case 'request':
      return { icon: <HelpCircle className="h-4 w-4 text-primary" />, bg: 'bg-primary/15' };
    case 'chat':
      return { icon: <MessageCircle className="h-4 w-4 text-purple-400" />, bg: 'bg-purple-500/15' };
    default:
      return { icon: <Bell className="h-4 w-4 text-muted-foreground" />, bg: 'bg-white/10' };
  }
};

const Notifications = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isLoading,
    refetch,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotifications(true);

  // Auto-mark all as read when page opens
  useEffect(() => {
    if (!isLoading && unreadCount > 0) {
      markAllAsRead().catch(console.error);
    }
  }, [isLoading]);

  const openNotification = async (notification) => {
    try {
      await markAsRead(notification._id);
    } catch (err) {
      console.error(err);
    }

    const chatIdFromData = notification.data && (notification.data.chatId || notification.data.chat);
    if (chatIdFromData) {
      navigate(`/dashboard/chats/${chatIdFromData}`);
      return;
    }

    if (notification.request) {
      try {
        const resp = await api.get('/chat');
        const chats = resp.data?.data?.chats || [];
        const notifReqId = notification.request._id || notification.request;
        const match = chats.find((c) => {
          const reqId = c.request?._id || c.request;
          return reqId && notifReqId && reqId.toString() === notifReqId.toString();
        });
        if (match) {
          navigate(`/dashboard/chats/${match._id}`);
          return;
        }
      } catch (err) {
        console.error(err);
      }
    }

    navigate('/dashboard/chats');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-display font-bold text-white">Notifications</h1>
            {unreadCount > 0 && (
              <Badge className="rounded-full bg-primary text-white text-xs px-2.5 py-0.5">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">Stay updated with your community activity.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="ghost" size="sm" onClick={refetch} disabled={isLoading} className="text-muted-foreground hover:text-white">
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead} className="border-white/10 text-muted-foreground hover:text-white">
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!window.confirm('Delete all notifications?')) return;
                try {
                  await deleteAllNotifications();
                  toast.success('All notifications deleted');
                } catch {
                  toast.error('Failed to delete notifications');
                }
              }}
              className="border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading && notifications.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-[2rem] border border-white/10 bg-white/5 text-center">
          <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center">
            <Bell className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-1">You're all caught up!</h3>
            <p className="text-muted-foreground">No notifications to show right now.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {notifications.map((notification, i) => (
              <motion.div
                key={notification._id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => openNotification(notification)}
                className={cn(
                  "flex items-start gap-4 rounded-2xl border p-4 cursor-pointer transition-all hover:bg-white/10",
                  !notification.isRead
                    ? "border-primary/30 bg-primary/5"
                    : "border-white/10 bg-white/5"
                )}
              >
                {(() => {
                  const meta = getNotificationMeta(notification.type);
                  return (
                    <div className={cn(
                      "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0",
                      meta.bg
                    )}>
                      {meta.icon}
                    </div>
                  );
                })()}

                <div className="flex-1 min-w-0">
                  {notification.title && (
                    <p className={cn("text-sm font-semibold leading-tight", !notification.isRead ? "text-white" : "text-muted-foreground")}>
                      {notification.title}
                    </p>
                  )}
                  <p className={cn("text-sm leading-relaxed mt-0.5", !notification.isRead ? "text-white/80" : "text-muted-foreground")}>
                    {notification.message}
                  </p>
                  {notification.request && (
                    <p className="text-xs text-muted-foreground mt-1">
                      📋 {notification.request.title}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead(notification._id)}
                      className="p-2 rounded-xl text-muted-foreground hover:text-emerald-400 hover:bg-white/10 transition-colors"
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification._id)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {!notification.isRead && (
                  <div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Notifications;
