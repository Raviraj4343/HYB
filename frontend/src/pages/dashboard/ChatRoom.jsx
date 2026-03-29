import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Image, Loader2, Trash2, Paperclip } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const ChatRoom = () => {
  const { id: chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, deleteMessage } = useChat(chatId, true);

  const [chatInfo, setChatInfo] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    const result = await sendMessage(messageText, imageFile);

    if (result.success) {
      setMessageText('');
      setImageFile(null);
    }
    setIsSending(false);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) setImageFile(file);
  };

  const otherUser = getOtherParticipant();

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-[0_20px_45px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(8,15,28,0.98),rgba(5,10,20,0.98))] dark:shadow-[0_26px_70px_rgba(0,0,0,0.24)]">
      <div className="border-b border-border/70 bg-background/90 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(8,15,28,0.96))] sm:px-5">
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
              <>
                <Avatar className="h-11 w-11 border border-border/70 shadow-sm dark:border-white/10">
                  <AvatarImage src={otherUser.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials(otherUser.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-[1rem] font-semibold tracking-tight text-foreground dark:text-white">{otherUser.fullName}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>@{otherUser.userName}</span>
                    <span>{messages.length} messages</span>
                    <span className="text-emerald-500">Encrypted style chat</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {chatInfo?.request && (
            <Badge variant="secondary" className="max-w-[180px] truncate rounded-full px-3 py-1 text-[11px] font-medium">
              {chatInfo.request.title}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.03),transparent_20%)] px-4 py-5 custom-scrollbar sm:px-5">
        {isLoading && messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-xl font-semibold text-foreground dark:text-white">Start the conversation</p>
            <p className="mt-2 max-w-md text-muted-foreground">
              Use this space to coordinate help, share details, and keep the request moving.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwn = message.sender?._id === user?._id || message.sender === user?._id;
              return (
                <div key={message._id} className={cn('flex items-end gap-2', isOwn ? 'justify-end' : 'justify-start')}>
                  {!isOwn && (
                    <Avatar className="mb-1 h-8 w-8 border border-border/70 shadow-sm dark:border-white/10">
                      <AvatarImage src={otherUser?.avatar} />
                      <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                        {getInitials(otherUser?.fullName)}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className={cn('group relative max-w-[min(78%,34rem)]', isOwn ? 'items-end' : 'items-start')}>
                    <div
                      className={cn(
                        'rounded-[1.25rem] border px-4 py-2.5 shadow-[0_10px_24px_rgba(15,23,42,0.06)]',
                        isOwn
                          ? 'rounded-br-md border-primary/20 bg-[linear-gradient(135deg,rgba(37,211,102,0.22),rgba(20,184,166,0.18))] text-foreground dark:text-white'
                          : 'rounded-bl-md border-border/70 bg-background/95 text-foreground dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.94))] dark:text-white'
                      )}
                    >
                      {message.image && (
                        <img
                          src={message.image}
                          alt="Shared"
                          className="mb-3 max-h-60 w-full rounded-[0.9rem] object-cover"
                        />
                      )}
                      {message.isDeleted ? (
                        <p className="text-sm italic opacity-70">Message deleted</p>
                      ) : message.content && (
                        <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                      )}
                    </div>

                    <div className={cn('mt-1.5 flex items-center gap-2 px-1 text-[11px] text-muted-foreground', isOwn && 'justify-end')}>
                      <span>{formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}</span>
                      {isOwn && !message.isDeleted && (
                        <button
                          onClick={() => deleteMessage(message._id)}
                          className="opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-border/70 bg-background/85 p-3 backdrop-blur-xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(9,15,27,0.90),rgba(7,12,20,0.98))]">
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
            className="h-11 w-11 rounded-full border-border/70 bg-background/80 dark:border-white/10 dark:bg-white/[0.04]"
            onClick={() => fileInputRef.current?.click()}
          >
            <Image className="h-4 w-4" />
          </Button>

          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Write a message..."
            className="h-11 flex-1 rounded-full border-border/70 bg-background/90 px-5 text-[15px] shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
            disabled={isSending}
          />

          <Button
            type="submit"
            className="h-11 rounded-full px-4 btn-gradient-primary shadow-[0_12px_28px_rgba(20,184,166,0.24)]"
            disabled={isSending || (!messageText.trim() && !imageFile)}
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatRoom;
