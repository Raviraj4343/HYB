import { useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, CheckCheck, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axios';

const Notifications = () => {
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

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'response':
        return '💬';
      case 'accepted':
        return '✅';
      case 'request':
        return '🙋';
      case 'chat':
        return '💌';
      default:
        return '🔔';
    }
  };

  const navigate = useNavigate();

  // Auto-mark notifications as read when the notifications page is opened
  // Wait until initial fetch completes (isLoading -> false) and then mark unread as read.
  // This mimics modern SaaS behavior where opening the notifications panel marks them read.
  useEffect(() => {
    if (!isLoading && unreadCount > 0) {
      // fire-and-forget
      markAllAsRead().catch((err) => console.error('Auto mark-all-as-read failed', err));
    }
    // run when loading finishes
  }, [isLoading, unreadCount, markAllAsRead]);

  const openNotification = async (notification) => {
    try {
      await markAsRead(notification._id);
    } catch (err) {
      console.error('Failed to mark notification as read before navigation', err);
    }

    // If the notification explicitly carries a chatId in data, navigate directly
    const chatIdFromData = notification.data && (notification.data.chatId || notification.data.chat);
    if (chatIdFromData) {
      navigate(`/dashboard/chats/${chatIdFromData}`);
      return;
    }

    // If notification relates to a request, try to find the chat for that request
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
        console.error('Failed to fetch chats while opening notification', err);
      }
    }

    // Fallback: open chat list
    navigate('/dashboard/chats');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Bell className="w-8 h-8" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount} new</Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">Stay updated with your activity</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead} className="gap-2">
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!window.confirm('Delete all notifications? This cannot be undone.')) return;
                try {
                  await deleteAllNotifications();
                  toast.success('All notifications deleted');
                  refetch();
                } catch (err) {
                  console.error('Failed to delete all notifications', err);
                  toast.error(err?.response?.data?.message || 'Failed to delete notifications');
                }
              }}
              className="gap-2 text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              Delete all
            </Button>
          )}
        </div>
      </div>

      {isLoading && notifications.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No notifications yet</p>
            <p className="text-muted-foreground">We'll notify you when something happens</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification._id}
              onClick={() => openNotification(notification)}
              className={cn(
                "transition-all duration-200 hover:shadow-md cursor-pointer",
                !notification.isRead && "border-primary/50 bg-primary/5"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="text-2xl">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm",
                      !notification.isRead && "font-medium"
                    )}>
                      {notification.message}
                    </p>
                    {notification.request && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Related to: {notification.request.title}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); markAsRead(notification._id); }}
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); deleteNotification(notification._id); }}
                      className="text-destructive hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
