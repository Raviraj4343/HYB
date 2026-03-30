import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, MessagesSquare, Reply, Send, ShieldBan, Trash2, Users, X, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGlobalChat } from '../../hooks/useChat';
import api from '../../api/axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import ChatMessage from '@/components/chat/ChatMessage';
import { toast } from 'sonner';

const GlobalChat = () => {
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, deleteMessage } = useGlobalChat(true);
  const [messageText, setMessageText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const inputRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const GLOBAL_CHAT_LAST_SEEN_KEY = 'globalChatLastSeenAt';

  const canBlockUsers = user?.role === 'super_admin' || user?.role === 'admin';

  useEffect(() => {
    const adjustLayout = () => {
      try {
        const headerH = headerRef.current?.offsetHeight || 0;
        const inputH = inputRef.current?.offsetHeight || 80;
        const vv = window.visualViewport;
        const viewportH = vv ? vv.height : window.innerHeight;

        if (containerRef.current) containerRef.current.style.height = `${viewportH - headerH}px`;
        if (messagesContainerRef.current) {
          messagesContainerRef.current.style.paddingTop = `${headerH + 12}px`;
          messagesContainerRef.current.style.paddingBottom = `${inputH + 24}px`;
        }
        document.documentElement.style.setProperty('--app-height', `${viewportH}px`);
      } catch (e) {}
    };

    adjustLayout();
    const onResize = () => adjustLayout();
    const onVVResize = () => adjustLayout();
    window.addEventListener('resize', onResize);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', onVVResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (window.visualViewport) window.visualViewport.removeEventListener('resize', onVVResize);
    };
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const atBottom = (container.scrollHeight - container.scrollTop - container.clientHeight) < 80;
    if (atBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setShowScrollBtn(false);
    } else {
      setShowScrollBtn(true);
    }
  }, [messages]);

  useEffect(() => {
    const onScroll = () => {
      const container = messagesContainerRef.current;
      if (!container) return;
      const dist = container.scrollHeight - container.scrollTop - container.clientHeight;
      setShowScrollBtn(dist > 120);
    };
    const container = messagesContainerRef.current;
    container?.addEventListener('scroll', onScroll);
    return () => container?.removeEventListener('scroll', onScroll);
  }, []);

  // Ensure input stays visible when mobile keyboard opens (Android/iOS adjustments)
  useEffect(() => {
    const adjustForKeyboard = () => {
      try {
        const headerH = headerRef.current?.offsetHeight || 0;
        const vv = window.visualViewport;
        const viewportH = vv ? vv.height : window.innerHeight;
        if (containerRef.current) containerRef.current.style.height = `${viewportH - headerH}px`;
        document.documentElement.style.setProperty('--app-height', `${viewportH}px`);
        setTimeout(() => {
          messagesContainerRef.current?.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: 'smooth' });
          setShowScrollBtn(false);
        }, 120);
      } catch (e) {}
    };

    const onFocusIn = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) adjustForKeyboard();
    };

    const onVVResize = () => {
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) adjustForKeyboard();
    };

    document.addEventListener('focusin', onFocusIn);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', onVVResize);

    return () => {
      document.removeEventListener('focusin', onFocusIn);
      if (window.visualViewport) window.visualViewport.removeEventListener('resize', onVVResize);
    };
  }, []);

  // Keep messages container padded so input doesn't overlap messages
  useEffect(() => {
    const setPadding = () => {
      const inputEl = inputRef.current;
      const container = messagesContainerRef.current;
      if (!container) return;
      const h = inputEl?.offsetHeight || 80;
      container.style.paddingBottom = `${h + 24}px`;
      // ensure view remains at bottom after input size change
      setTimeout(() => {
        try {
          container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
          setShowScrollBtn(false);
        } catch (e) {}
      }, 60);
    };

    setPadding();
    window.addEventListener('resize', setPadding);
    return () => window.removeEventListener('resize', setPadding);
  }, [replyTo, messageText]);

  const activeParticipants = useMemo(() => {
    const seen = new Map();
    messages.forEach((message) => {
      if (message.sender?._id && !seen.has(message.sender._id)) {
        seen.set(message.sender._id, message.sender);
      }
    });
    return [...seen.values()].slice(0, 4);
  }, [messages]);

  useEffect(() => {
    const markSeen = () => {
      localStorage.setItem(GLOBAL_CHAT_LAST_SEEN_KEY, new Date().toISOString());
      window.dispatchEvent(new CustomEvent('global-chat:seen'));
    };

    markSeen();
    return () => {
      markSeen();
    };
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setIsSending(true);
    const result = await sendMessage(messageText.trim(), replyTo?._id || null);
    setIsSending(false);

    if (result.success) {
      setMessageText('');
      setReplyTo(null);
    } else {
      toast.error(result.error || 'Failed to send message');
    }
  };

  const handleDelete = async (messageId) => {
    const result = await deleteMessage(messageId);
    if (!result.success) {
      toast.error(result.error || 'Failed to delete message');
    }
  };

  const handleBlockUser = async (targetUser) => {
    const days = window.prompt(`Block @${targetUser.userName} for how many days?`, '7');
    const reason = window.prompt(`Reason for blocking @${targetUser.userName}?`, 'Community chat violation');

    if (!days || !reason) return;

    try {
      await api.post(`/report/block/${targetUser._id}`, {
        days: Number(days),
        reason,
      });
      toast.success(`@${targetUser.userName} blocked successfully`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to block user');
    }
  };

  return (
    <div ref={containerRef} className="relative mx-auto flex max-w-7xl flex-col overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.68),rgba(255,255,255,0.24))] p-2 shadow-[0_18px_42px_rgba(15,23,42,0.08)] dark:bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.08),transparent_22%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_24%),linear-gradient(180deg,rgba(7,12,20,0.98),rgba(11,18,32,0.98))] dark:shadow-[0_24px_56px_rgba(0,0,0,0.22)] sm:p-3" style={{height: 'calc(var(--app-height, 100vh) - 32px)'}}>
      <div className="pointer-events-none absolute left-0 top-0 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />

      <Card className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.8rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(248,250,252,0.84))] shadow-[0_24px_54px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(7,12,20,0.96),rgba(12,18,32,0.96))] dark:shadow-[0_24px_54px_rgba(0,0,0,0.28)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.08),transparent_22%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.1),transparent_18%),linear-gradient(180deg,rgba(255,255,255,0.015),transparent_30%)]" />
        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
          <div ref={headerRef} className="absolute left-0 right-0 top-0 z-30 border-b border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(248,250,252,0.84))] px-4 py-3 backdrop-blur-md shadow-sm dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(12,18,32,0.96))] sm:px-5">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3 shrink-0">
                {activeParticipants.length > 0 ? (
                  activeParticipants.map((participant) => (
                    <Avatar key={participant._id} className="h-11 w-11 border-2 border-background shadow-sm dark:border-[rgba(7,12,20,0.9)]">
                      <AvatarImage src={participant.avatar} alt={participant.fullName} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials(participant.fullName)}
                      </AvatarFallback>
                    </Avatar>
                  ))
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-background bg-muted text-muted-foreground dark:border-[rgba(7,12,20,0.9)]">
                    <Users className="h-4 w-4" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-xl font-display font-semibold tracking-tight text-foreground sm:text-2xl">
                    Community Chat
                  </h1>
                  <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
                    Public Room
                  </Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <MessagesSquare className="h-4 w-4 text-primary" />
                    <span>{messages.length} messages</span>
                  </div>
                  <span>{activeParticipants.length || 0} active voices</span>
                  <span className="hidden sm:inline">Open group conversation across HYB</span>
                </div>
              </div>
            </div>
          </div>

          <div ref={messagesContainerRef} className="relative flex-1 overflow-y-auto overscroll-contain scroll-smooth bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.05),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] px-4 pt-0 pb-32 sm:pb-5 custom-scrollbar dark:bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.06),transparent_28%),linear-gradient(180deg,rgba(7,12,20,0.3),rgba(7,12,20,0.06))] sm:px-5">
            {isLoading && messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">No messages yet. Start the community conversation.</p>
              </div>
              ) : (
              messages.map((message) => {
                const isOwn = message.sender?._id === user?._id;
                return (
                  <ChatMessage
                    key={message._id}
                    message={message}
                    isOwn={isOwn}
                    showAvatar={!isOwn}
                    onReply={setReplyTo}
                    onDelete={handleDelete}
                  />
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {showScrollBtn && (
            <button
              type="button"
              onClick={() => {
                messagesContainerRef.current?.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: 'smooth' });
                setShowScrollBtn(false);
              }}
              className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] right-20 z-40 rounded-full bg-primary p-3 text-white shadow-lg sm:bottom-28 sm:right-4"
              aria-label="Scroll to latest"
            >
              <Send className="transform rotate-90 h-4 w-4" />
            </button>
          )}

          {typeof document !== 'undefined' && createPortal(
            <div className="sm:static fixed left-0 right-0 bottom-0 z-50 sm:z-auto">
              <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="border-t border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(248,250,252,0.92))] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(9,15,27,0.88),rgba(7,12,20,0.98))] sm:p-4">
                  {replyTo && (
                    <div className="mb-3 flex items-start justify-between gap-3 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-primary">Replying to @{replyTo.sender?.userName}</div>
                        <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {replyTo.isDeleted ? 'Deleted message' : replyTo.content}
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0 rounded-full"
                        onClick={() => setReplyTo(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <form onSubmit={handleSend} className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="h-10 w-10 rounded-full border border-border/70 bg-background/80 shadow-sm text-muted-foreground flex items-center justify-center"
                        onClick={() => {
                          // reserved for future quick actions (emoji/attachments)
                        }}
                        aria-label="Actions"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="relative flex-1">
                      <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[linear-gradient(135deg,rgba(20,184,166,0.08),rgba(59,130,246,0.06))]" />
                      <textarea
                        ref={inputRef}
                        value={messageText}
                        onChange={(e) => {
                          setMessageText(e.target.value);
                          // auto grow
                          const ta = inputRef.current;
                          if (ta) {
                            ta.style.height = 'auto';
                            ta.style.height = `${ta.scrollHeight}px`;
                            const container = messagesContainerRef.current;
                            if (container) container.style.paddingBottom = `${ta.offsetHeight + 24}px`;
                          }
                        }}
                        placeholder="Message the whole community..."
                        rows={1}
                        className="relative z-10 min-h-[44px] max-h-44 w-full resize-none rounded-full border border-slate-800 bg-slate-950 px-4 py-3 text-[15px] font-medium text-slate-100 placeholder:text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_0_1px_rgba(15,23,42,0.24)] outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                        style={{ backgroundColor: '#020617', color: '#f8fafc', WebkitTextFillColor: '#f8fafc', caretColor: '#f8fafc', overflow: 'hidden' }}
                        disabled={isSending}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            // submit
                            const form = e.target.form;
                            if (form) form.requestSubmit();
                          }
                        }}
                        onFocus={() => {
                          const ta = inputRef.current;
                          const container = messagesContainerRef.current;
                          if (container && ta) {
                            ta.style.height = 'auto';
                            ta.style.height = `${ta.scrollHeight}px`;
                            container.style.paddingBottom = `${ta.offsetHeight + 24}px`;
                            setTimeout(() => container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' }), 120);
                            setShowScrollBtn(false);
                          }
                        }}
                        onBlur={() => {
                          const ta = inputRef.current;
                          const container = messagesContainerRef.current;
                          if (container && ta) {
                            container.style.paddingBottom = `${ta.offsetHeight + 24}px`;
                          }
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      className={cn("h-10 w-10 rounded-full p-0 btn-gradient-primary shadow-[0_12px_28px_rgba(20,184,166,0.24)] flex items-center justify-center", isSending && "opacity-80")}
                      disabled={isSending || !messageText.trim()}
                    >
                      {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </form>
                </div>
              </div>
            </div>, document.body)
          }
        </CardContent>
      </Card>
    </div>
  );
};

export default GlobalChat;
