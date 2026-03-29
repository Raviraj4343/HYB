import { useEffect, useRef, useState } from 'react';
import { ShieldBan, Loader2, MessageSquare, Reply, Send, Trash2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGlobalChat } from '../../hooks/useChat';
import api from '../../api/axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const GlobalChat = () => {
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, deleteMessage } = useGlobalChat(true);
  const [messageText, setMessageText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const GLOBAL_CHAT_LAST_SEEN_KEY = 'globalChatLastSeenAt';

  const canBlockUsers = user?.role === 'super_admin' || user?.role === 'admin';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-5xl flex-col">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-display font-bold">
            <MessageSquare className="h-8 w-8" />
            Community Chat
          </h1>
          <p className="mt-1 text-muted-foreground">Everyone on HYB can talk here in one shared conversation.</p>
        </div>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.8rem] border border-border/70 bg-card/90">
        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
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
                const replyPreview = message.replyTo?.isDeleted
                  ? 'Deleted message'
                  : message.replyTo?.content || 'Reply';

                return (
                  <div key={message._id} className="group flex gap-3">
                    <Avatar className="mt-1 h-11 w-11 shrink-0 border border-border/70">
                      <AvatarImage src={message.sender?.avatar} alt={message.sender?.fullName} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials(message.sender?.fullName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-medium text-foreground">{message.sender?.fullName}</span>
                        <span className="text-sm text-muted-foreground">@{message.sender?.userName}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </span>
                      </div>

                      <div className="mt-2 rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                        {message.replyTo && (
                          <div className="mb-3 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 text-sm">
                            <div className="font-medium text-primary">
                              Replying to @{message.replyTo?.sender?.userName || 'user'}
                            </div>
                            <div className="mt-1 line-clamp-2 text-muted-foreground">{replyPreview}</div>
                          </div>
                        )}

                        {message.isDeleted ? (
                          <p className="text-sm italic text-muted-foreground">Message deleted</p>
                        ) : (
                          <p className="whitespace-pre-wrap text-sm text-foreground">{message.content}</p>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        {!message.isDeleted && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 rounded-full px-3 text-muted-foreground"
                            onClick={() => setReplyTo(message)}
                          >
                            <Reply className="mr-1.5 h-4 w-4" />
                            Reply
                          </Button>
                        )}

                        {isOwn && !message.isDeleted && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 rounded-full px-3 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(message._id)}
                          >
                            <Trash2 className="mr-1.5 h-4 w-4" />
                            Delete
                          </Button>
                        )}

                        {canBlockUsers && !isOwn && !message.isDeleted && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 rounded-full px-3 text-warning hover:text-warning"
                            onClick={() => handleBlockUser(message.sender)}
                          >
                            <ShieldBan className="mr-1.5 h-4 w-4" />
                            Block
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-border/70 p-4">
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
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message for everyone..."
                className="h-12 flex-1 rounded-2xl"
                disabled={isSending}
              />
              <Button
                type="submit"
                className={cn("h-12 rounded-2xl px-5 btn-gradient-primary", isSending && "opacity-80")}
                disabled={isSending || !messageText.trim()}
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GlobalChat;
