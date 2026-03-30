import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, Send, Image, Loader2, Trash2, Paperclip, Reply, MoreHorizontal, X, Flag, ShieldBan } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import ChatMessage from '@/components/chat/ChatMessage';

const ChatRoom = () => {
  const { id: chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, deleteMessage } = useChat(chatId, true);

  const [chatInfo, setChatInfo] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const fileInputRef = useRef(null);
  const canBlockUser = user?.role === 'super_admin' || user?.role === 'admin';

  useEffect(() => {
    const fetchChatInfo = async () => {
      try {
        const response = await api.get(`/chat/${chatId}`);
        setChatInfo(response.data.data.chat);
      } catch (err) {
        console.error('Failed to fetch chat info:', err);
      }
    };
    if (chatId) fetchChatInfo();
  }, [chatId]);

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

  const scrollToBottom = (opts = { behavior: 'smooth' }) => {
    const container = messagesContainerRef.current;
    if (!container) return;
    try {
      container.scrollTo({ top: container.scrollHeight, behavior: opts.behavior });
      messagesEndRef.current?.scrollIntoView({ behavior: opts.behavior });
    } catch (e) {
      messagesEndRef.current?.scrollIntoView();
    }
    setShowScrollBtn(false);
  };

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

  const getOtherParticipant = () => {
    return chatInfo?.participants?.find((p) => p._id !== user?._id);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim() && !imageFile) return;

    setIsSending(true);
    const result = await sendMessage(messageText, imageFile, replyTo?._id || null);

    if (result.success) {
      setMessageText('');
      setImageFile(null);
      setReplyTo(null);
    }
    setIsSending(false);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) setImageFile(file);
  };

  // Keep latest messages visible when user focuses or types
  const handleInputFocus = () => {
    scrollToBottom({ behavior: 'auto' });
  };

  const handleReportUser = () => {
    const participant = getOtherParticipant();
    if (!participant?._id) return;
    navigate(`/dashboard/report?userId=${participant._id}&userName=${participant.userName}`);
  };

  const handleBlockUser = async () => {
    const participant = getOtherParticipant();
    if (!participant?._id) return;

    const days = window.prompt(`Block @${participant.userName} for how many days?`, '7');
    const reason = window.prompt(`Reason for blocking @${participant.userName}?`, 'Chat policy violation');
    if (!days || !reason) return;

    try {
      await api.post(`/report/block/${participant._id}`, {
        days: Number(days),
        reason,
      });
      toast.success(`@${participant.userName} blocked successfully`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to block user');
    }
  };

  const otherUser = getOtherParticipant();

  return (
    <div className="mx-auto flex h-[calc(100dvh-24px)] max-w-7xl flex-col overflow-hidden rounded-[2rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(248,250,252,0.98))] shadow-[0_24px_60px_rgba(15,23,42,0.10)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(6,11,21,0.995),rgba(3,7,18,0.995))] dark:shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
      <div className="sticky top-0 z-[1000] border-b border-border/70 bg-background/95 px-4 py-3 backdrop-blur-xl shadow-sm dark:border-white/10 dark:bg-[#071018] sm:px-5" style={{ position: 'sticky', top: 0 }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full border border-border/70 bg-background/80 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
              onClick={() => navigate('/dashboard/chats')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            {otherUser && (
              <button
                type="button"
                className="flex min-w-0 items-center gap-3 rounded-2xl px-1 py-1 text-left transition hover:bg-black/5 dark:hover:bg-white/[0.03]"
                onClick={() => navigate(`/dashboard/users/${otherUser.userName}`)}
              >
                <Avatar className="h-11 w-11 border border-border/70 shadow-sm dark:border-white/10">
                  <AvatarImage src={otherUser.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials(otherUser.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-[1rem] font-semibold tracking-tight text-foreground dark:text-white">
                    {otherUser.fullName}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>@{otherUser.userName}</span>
                    <span>{messages.length} messages</span>
                    {chatInfo?.request && <span>{chatInfo.request.title}</span>}
                  </div>
                </div>
              </button>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full border border-border/70 bg-background/80 shadow-sm dark:border-white/10 dark:bg-white/[0.05]"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-2xl border-border/70 bg-background/95 p-2 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-[rgba(7,12,20,0.96)]">
              <DropdownMenuItem className="rounded-xl" onClick={handleReportUser}>
                <Flag className="mr-2 h-4 w-4" />
                Report user
              </DropdownMenuItem>
              {canBlockUser && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="rounded-xl text-destructive focus:text-destructive" onClick={handleBlockUser}>
                    <ShieldBan className="mr-2 h-4 w-4" />
                    Block user
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        className="min-h-0 overflow-y-auto overscroll-contain scroll-smooth bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.05),transparent_20%)] px-4 py-4 custom-scrollbar dark:bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.07),transparent_22%),linear-gradient(180deg,rgba(8,15,28,0.28),rgba(5,10,20,0.08))] sm:px-6"
        style={{ height: 'calc(100dvh - 64px - 96px)', paddingBottom: '110px' }}
      >
        {isLoading && messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-xl font-semibold text-foreground dark:text-white">Start the conversation</p>
            <p className="mt-2 max-w-md text-muted-foreground">
              Say hello and coordinate the request here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const isOwn = message.sender?._id === user?._id || message.sender === user?._id;
              return (
                <ChatMessage
                  key={message._id}
                  message={message}
                  isOwn={isOwn}
                  showAvatar={!isOwn}
                  onReply={setReplyTo}
                  onDelete={deleteMessage}
                />
              );
            })}
          </div>
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
          className="fixed right-4 bottom-24 z-40 rounded-full bg-primary p-3 text-white shadow-lg"
          aria-label="Scroll to latest"
        >
          <ArrowLeft className="transform rotate-[270deg] h-4 w-4" />
        </button>
      )}

      <form
        onSubmit={handleSend}
        className="shrink-0 border-t border-border/70 bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(9,15,27,0.95),rgba(7,12,20,0.99))]"
        style={{ position: 'sticky', bottom: 0, zIndex: 900 }}
      >
              {replyTo && (
                <div className="mb-3 flex items-start justify-between gap-3 rounded-[1rem] border border-primary/15 bg-primary/5 px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-primary">Replying to @<Link to={`/dashboard/users/${replyTo.sender?.userName}`}>{replyTo.sender?.userName}</Link></div>
                    <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {replyTo.isDeleted ? 'Deleted message' : replyTo.content}
                    </div>
                  </div>
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0 rounded-full" onClick={() => setReplyTo(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {imageFile && (
                <div className="mb-3 flex items-center gap-3 rounded-[1rem] border border-border/70 bg-background/80 px-4 py-2.5 text-sm shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <Paperclip className="h-4 w-4 text-primary" />
                  <span className="min-w-0 flex-1 truncate text-foreground dark:text-white">{imageFile.name}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setImageFile(null)}>
                    Remove
                  </Button>
                </div>
              )}

              <div className="flex items-end gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-full border-border/70 bg-background/80 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Image className="h-4 w-4" />
                </Button>

                <div className="relative flex-1">
                  <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[linear-gradient(135deg,rgba(20,184,166,0.12),rgba(59,130,246,0.08))]" />
                  <textarea
                    ref={inputRef}
                    value={messageText}
                    onChange={(e) => {
                      setMessageText(e.target.value);
                      const ta = inputRef.current;
                      if (ta) {
                        ta.style.height = 'auto';
                        ta.style.height = `${ta.scrollHeight}px`;
                      }
                      // while typing, keep the latest messages visible
                      scrollToBottom({ behavior: 'auto' });
                    }}
                    onFocus={handleInputFocus}
                    placeholder="Write a message..."
                    autoComplete="off"
                    spellCheck={false}
                    rows={1}
                    className="min-h-[44px] max-h-44 w-full resize-none rounded-full border border-slate-900 !bg-slate-950 px-4 py-3 text-[15px] font-medium !text-slate-100 placeholder:!text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_0_1px_rgba(15,23,42,0.26)] outline-none transition focus:border-primary/35 focus:ring-2 focus:ring-primary/20 dark:border-slate-900 dark:!bg-slate-950 dark:!text-slate-100 dark:placeholder:!text-slate-500"
                    style={{
                      background: '#020617',
                      color: '#f8fafc',
                      WebkitTextFillColor: '#f8fafc',
                      caretColor: '#f8fafc',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px rgba(15,23,42,0.26)',
                      overflow: 'hidden'
                    }}
                    disabled={isSending}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const form = e.target.form;
                        if (form) form.requestSubmit();
                      }
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-full p-0 btn-gradient-primary shadow-[0_12px_28px_rgba(20,184,166,0.24)]',
                    isSending && 'opacity-80'
                  )}
                  disabled={isSending || (!messageText.trim() && !imageFile)}
                >
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
      </form>
    </div>
  );
};

export default ChatRoom;
