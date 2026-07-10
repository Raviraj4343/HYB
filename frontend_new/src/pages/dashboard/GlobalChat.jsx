import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Send, Users, Globe, Trash2, Reply, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useGlobalChat } from '@/hooks/useChat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const GlobalChat = () => {
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, deleteMessage } = useGlobalChat(true);
  const [messageText, setMessageText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  const activeParticipants = useMemo(() => {
    const seen = new Map();
    messages.forEach((msg) => {
      if (msg.sender?._id && !seen.has(msg.sender._id)) {
        seen.set(msg.sender._id, msg.sender);
      }
    });
    return [...seen.values()].slice(0, 5);
  }, [messages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 80;
    if (atBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setShowScrollBtn(false);
    } else {
      setShowScrollBtn(true);
    }
  }, [messages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const onScroll = () => {
      const dist = container.scrollHeight - container.scrollTop - container.clientHeight;
      setShowScrollBtn(dist > 120);
    };
    container.addEventListener('scroll', onScroll);
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

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
    if (!result.success) toast.error(result.error || 'Failed to delete message');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-white/10 bg-background/50 backdrop-blur-md shrink-0">
        <div className="flex -space-x-2">
          {activeParticipants.length > 0 ? (
            activeParticipants.map((p) => (
              <Avatar key={p._id} className="h-9 w-9 border-2 border-background">
                <AvatarImage src={p.avatar} />
                <AvatarFallback className="text-xs">{getInitials(p.fullName)}</AvatarFallback>
              </Avatar>
            ))
          ) : (
            <div className="h-9 w-9 rounded-full border-2 border-background bg-white/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-display font-semibold text-white">Community Chat</h2>
            <Badge className="rounded-full border border-primary/30 bg-primary/10 text-primary text-xs px-2 py-0.5">
              <Globe className="h-3 w-3 mr-1" />
              Public
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {messages.length} messages · {activeParticipants.length} active voices
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
        {isLoading && messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <Globe className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">No messages yet. Start the community conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender?._id === user?._id;
            return (
              <motion.div
                key={message._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-end gap-3 group ${isOwn ? 'flex-row-reverse' : ''}`}
              >
                {!isOwn && (
                  <Link to={`/dashboard/users/${message.sender?.userName}`}>
                    <Avatar className="h-8 w-8 border border-white/10 shrink-0 mb-1">
                      <AvatarImage src={message.sender?.avatar} />
                      <AvatarFallback className="text-xs">{getInitials(message.sender?.fullName)}</AvatarFallback>
                    </Avatar>
                  </Link>
                )}
                <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  {!isOwn && (
                    <span className="text-xs text-muted-foreground px-1">
                      <Link to={`/dashboard/users/${message.sender?.userName}`} className="hover:text-primary transition-colors font-medium">
                        {message.sender?.fullName}
                      </Link>
                    </span>
                  )}
                  {message.replyTo && !message.replyTo.isDeleted && (
                    <div className={`text-xs px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-muted-foreground max-w-full ${isOwn ? 'ml-auto' : ''}`}>
                      <span className="text-primary font-medium">↩ @{message.replyTo.sender?.userName}</span>
                      <p className="truncate mt-0.5">{message.replyTo.content}</p>
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      isOwn
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-white/10 text-white border border-white/5 rounded-bl-sm'
                    } ${message.isDeleted ? 'opacity-50 italic' : ''}`}
                  >
                    {message.isDeleted ? '🗑 Message deleted' : message.content}
                  </div>
                  <div className={`flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? 'flex-row-reverse' : ''}`}>
                    <span className="text-xs text-muted-foreground px-1">
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </span>
                    {!message.isDeleted && (
                      <>
                        <button
                          onClick={() => setReplyTo(message)}
                          className="text-muted-foreground hover:text-white transition-colors p-1"
                        >
                          <Reply className="h-3.5 w-3.5" />
                        </button>
                        {isOwn && (
                          <button
                            onClick={() => handleDelete(message._id)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => {
              messagesContainerRef.current?.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: 'smooth' });
              setShowScrollBtn(false);
            }}
            className="absolute bottom-28 right-8 z-20 h-10 w-10 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center"
          >
            <ChevronDown className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="shrink-0 border-t border-white/10 bg-background/50 p-4 backdrop-blur-md">
        {replyTo && (
          <div className="mb-3 flex items-start justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-primary">
                Replying to <Link to={`/dashboard/users/${replyTo.sender?.userName}`} className="hover:underline">@{replyTo.sender?.userName}</Link>
              </p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{replyTo.content}</p>
            </div>
            <button onClick={() => setReplyTo(null)} className="text-muted-foreground hover:text-white transition-colors shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Message the community..."
            disabled={isSending}
            className="flex-1 h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            className="h-12 w-12 rounded-2xl shrink-0 shadow-lg shadow-primary/20"
            disabled={isSending || !messageText.trim()}
          >
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default GlobalChat;
