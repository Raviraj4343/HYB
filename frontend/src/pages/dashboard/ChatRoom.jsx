import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Send, Image, Loader2, Trash2 } from 'lucide-react';
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
        const response = await api.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/chat/${chatId}`);
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
    return chatInfo?.participants?.find(p => p._id !== user?._id);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
    if (file) {
      setImageFile(file);
    }
  };

  const otherUser = getOtherParticipant();

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/chats')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        {otherUser && (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={otherUser.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(otherUser.fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{otherUser.fullName}</p>
              <p className="text-sm text-muted-foreground">@{otherUser.userName}</p>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender?._id === user?._id || message.sender === user?._id;
            return (
              <div
                key={message._id}
                className={cn("flex", isOwn ? "justify-end" : "justify-start")}
              >
                <div className={cn(
                  "max-w-[70%] rounded-2xl px-4 py-2 group relative",
                  isOwn 
                    ? "bg-primary text-primary-foreground rounded-br-md" 
                    : "bg-muted rounded-bl-md"
                )}>
                  {message.image && (
                    <img 
                      src={message.image} 
                      alt="Shared" 
                      className="rounded-lg mb-2 max-w-full"
                    />
                  )}
                  {message.isDeleted ? (
                    <p className="text-sm italic opacity-70">Message deleted</p>
                  ) : message.content && (
                    <p className="text-sm">{message.content}</p>
                  )}
                  <p className={cn(
                    "text-xs mt-1",
                    isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                  </p>
                  {isOwn && (
                    <button
                      onClick={() => deleteMessage(message._id)}
                      className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="pt-4 border-t">
        {imageFile && (
          <div className="mb-2 flex items-center gap-2 p-2 bg-muted rounded-lg">
            <Image className="w-4 h-4" />
            <span className="text-sm truncate flex-1">{imageFile.name}</span>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={() => setImageFile(null)}
            >
              Remove
            </Button>
          </div>
        )}
        <div className="flex items-center gap-2">
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
            onClick={() => fileInputRef.current?.click()}
          >
            <Image className="w-4 h-4" />
          </Button>
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={isSending}
          />
          <Button type="submit" disabled={isSending || (!messageText.trim() && !imageFile)}>
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatRoom;
