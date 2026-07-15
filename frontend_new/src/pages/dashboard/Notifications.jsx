import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell, Check, CheckCheck, Trash2, Loader2, RefreshCw,
  MessageCircle, Zap, HelpCircle, Flag, ShieldAlert,
  ThumbsUp, ThumbsDown, ChevronDown, ChevronUp
} from 'lucide-react';
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
    case 'report':
      return { icon: <Flag className="h-4 w-4 text-orange-400" />, bg: 'bg-orange-500/15' };
    case 'report_review':
      return { icon: <ShieldAlert className="h-4 w-4 text-yellow-400" />, bg: 'bg-yellow-500/15' };
    case 'warning':
      return { icon: <Zap className="h-4 w-4 text-yellow-400" />, bg: 'bg-yellow-500/15' };
    case 'account_blocked':
      return { icon: <ShieldAlert className="h-4 w-4 text-red-400" />, bg: 'bg-red-500/15' };
    default:
      return { icon: <Bell className="h-4 w-4 text-muted-foreground" />, bg: 'bg-white/10' };
  }
};

// ─── Report Review Card ────────────────────────────────────────────────────────
function ReportReviewCard({ notification, onDecision }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading]   = useState(null); // 'approve' | 'reject' | null
  const d = notification.data || {};

  const decide = async (action) => {
    setLoading(action);
    try {
      await api.patch(`/report/${d.reportId}/review`, {
        action,
        notificationId: notification._id,
      });
      toast.success(
        action === 'approve'
          ? `✅ Report approved — warning issued to @${d.reportedUserName}`
          : `🚫 Report rejected — no action taken`
      );
      onDecision(notification._id);
    } catch (err) {
      toast.error(err?.message || 'Action failed. Please try again.');
      setLoading(null);
    }
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(234,179,8,0.07) 0%, rgba(234,179,8,0.02) 100%)',
        border: '1px solid rgba(234,179,8,0.25)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    >
      {/* Header row */}
      <div style={{ padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* Icon */}
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
          background: 'rgba(234,179,8,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ShieldAlert size={18} color="#facc15" />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 700, color: '#facc15' }}>
            {notification.title}
          </p>
          <p style={{ margin: '0 0 6px', fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
            {notification.message}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12px' }}>
            {d.reporterName && (
              <span style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '6px', padding: '2px 8px', color: 'rgba(255,255,255,0.5)' }}>
                Reporter: <strong style={{ color: '#fff' }}>@{d.reporterName}</strong>
              </span>
            )}
            {d.reportedUserName && (
              <span style={{ background: 'rgba(239,68,68,0.1)', borderRadius: '6px', padding: '2px 8px', color: 'rgba(239,68,68,0.8)' }}>
                Reported: <strong style={{ color: '#ef4444' }}>@{d.reportedUserName}</strong>
              </span>
            )}
            {d.reason && (
              <span style={{ background: 'rgba(99,102,241,0.1)', borderRadius: '6px', padding: '2px 8px', color: 'rgba(167,139,250,0.9)' }}>
                {d.reason}
              </span>
            )}
          </div>
          {d.description && (
            <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>
              &ldquo;{d.description}&rdquo;
            </p>
          )}
        </div>

        {/* Timestamp */}
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </span>
      </div>

      {/* Chat transcript toggle */}
      {d.recentMessages && d.recentMessages.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              width: '100%', padding: '8px 16px', background: 'transparent',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', color: 'rgba(255,255,255,0.5)',
              fontSize: '12px', fontWeight: 600,
            }}
          >
            <span>📝 Chat transcript ({d.recentMessages.length} messages)</span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  margin: '0 12px 12px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}>
                  {d.recentMessages.map((m, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', flexShrink: 0, marginTop: '1px' }}>
                        [{i + 1}]
                      </span>
                      <span style={{ fontSize: '11px', color: 'rgba(99,102,241,0.9)', flexShrink: 0, fontWeight: 600 }}>
                        {m.senderName}:
                      </span>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
                        {m.content}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Action buttons */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '12px 16px',
        display: 'flex',
        gap: '10px',
      }}>
        <button
          onClick={() => decide('approve')}
          disabled={!!loading}
          style={{
            flex: 1, padding: '9px 0', borderRadius: '10px', border: 'none',
            background: loading ? 'rgba(34,197,94,0.2)' : 'linear-gradient(135deg, #16a34a, #15803d)',
            color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '13px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            boxShadow: loading ? 'none' : '0 4px 12px rgba(22,163,74,0.3)',
            transition: 'all 0.15s ease',
          }}
        >
          {loading === 'approve' ? (
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <ThumbsUp size={14} />
          )}
          Approve (Warn User)
        </button>

        <button
          onClick={() => decide('reject')}
          disabled={!!loading}
          style={{
            flex: 1, padding: '9px 0', borderRadius: '10px', border: 'none',
            background: loading ? 'rgba(239,68,68,0.2)' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
            color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '13px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            boxShadow: loading ? 'none' : '0 4px 12px rgba(220,38,38,0.3)',
            transition: 'all 0.15s ease',
          }}
        >
          {loading === 'reject' ? (
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <ThumbsDown size={14} />
          )}
          Reject (Ignore)
        </button>
      </div>
    </div>
  );
}

// ─── Main Notifications Page ───────────────────────────────────────────────────
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
    setNotifications,
  } = useNotifications(true);

  // Auto-mark all as read when page opens
  useEffect(() => {
    if (!isLoading && unreadCount > 0) {
      markAllAsRead().catch(console.error);
    }
  }, [isLoading]);

  // Called when super-admin makes a yes/no decision — remove the card optimistically
  const handleReviewDecision = (notificationId) => {
    if (typeof setNotifications === 'function') {
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } else {
      refetch();
    }
  };

  const openNotification = async (notification) => {
    // Don't navigate on report_review — it's self-contained
    if (notification.type === 'report_review') return;

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
              >
                {/* ── Special card for report_review ── */}
                {notification.type === 'report_review' ? (
                  <ReportReviewCard
                    notification={notification}
                    onDecision={handleReviewDecision}
                  />
                ) : (
                  /* ── Standard notification card ── */
                  <div
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
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Notifications;
