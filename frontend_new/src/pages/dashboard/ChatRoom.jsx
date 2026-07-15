import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Send, Loader2, Flag } from 'lucide-react';
import api from '@/api/axios';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import ReportModal from '@/components/ui/ReportModal';

export default function ChatRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const messagesEndRef = useRef(null);
  
  const [newMessage, setNewMessage] = useState('');
  const [reportOpen, setReportOpen] = useState(false);

  // 1. Fetch Chat metadata (participants, etc.)
  const { data: chatData, isLoading: loadingMetadata } = useQuery({
    queryKey: ['chat', id],
    queryFn: () => api.get(`/chat/${id}`).then((res) => res.data.data),
  });

  // 2. Fetch Messages and subscribe to live socket updates using useChat hook
  const { messages, isLoading: loadingMessages, sendMessage } = useChat(id);

  // 3. Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage('');

    try {
      await sendMessage(content);
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };

  const isLoading = loadingMetadata || loadingMessages;

  if (isLoading && messages.length === 0) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const chat = chatData?.chat;
  const otherParticipant = chat?.participants?.find(p => p._id !== currentUser?._id);

  return (
    <>
      <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center gap-4 p-4 border-b border-white/10 bg-background/50">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/chats')} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-10 w-10 border border-white/10">
            <AvatarImage src={otherParticipant?.avatar} />
            <AvatarFallback>{otherParticipant?.fullName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="font-semibold text-white">{otherParticipant?.fullName}</h2>
            <span className="text-xs text-muted-foreground">@{otherParticipant?.userName}</span>
          </div>

          {/* Report button – top-right of header */}
          {otherParticipant && (
            <button
              onClick={() => setReportOpen(true)}
              title={`Report @${otherParticipant.userName}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.08)',
                color: 'rgba(239,68,68,0.85)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                transition: 'all 0.18s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.18)';
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.6)';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
                e.currentTarget.style.color = 'rgba(239,68,68,0.85)';
              }}
            >
              <Flag size={13} />
              <span className="hidden sm:inline">Report</span>
            </button>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => {
            const isMe = (msg.sender?._id || msg.sender) === currentUser?._id;
            return (
              <div key={msg._id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    isMe 
                      ? 'bg-primary text-primary-foreground rounded-br-sm' 
                      : 'bg-white/10 text-white border border-white/5 rounded-bl-sm'
                  }`}
                >
                  <div className="flex flex-col">
                    <p className="text-sm">{msg.content}</p>
                    {isMe && (
                      <div className="flex justify-end items-center mt-0.5 -mr-1 select-none leading-none">
                        {msg.isRead ? (
                          <span className="text-[10px] font-bold text-sky-400 tracking-[-1px]" title="Read">✓✓</span>
                        ) : msg.isDelivered ? (
                          <span className="text-[10px] font-bold text-white/50 tracking-[-1px]" title="Delivered">✓✓</span>
                        ) : (
                          <span className="text-[10px] font-bold text-white/50" title="Sent">✓</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/10 bg-background/50">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input 
              placeholder="Type your message..." 
              className="flex-1 rounded-full bg-white/5 border-white/10 focus-visible:ring-primary"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={!newMessage.trim()}>
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        reportedUser={otherParticipant}
        chatId={id}
      />
    </>
  );
}


