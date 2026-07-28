import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { MessageSquare, Search, Store } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { useChatList } from '@/hooks/useChat';

export default function Chats() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const { chats, isLoading } = useChatList(true);

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold text-white mb-4">Messages</h1>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search conversations..." 
            className="pl-10 bg-white/5 border-white/10 h-12"
          />
        </div>
      </div>

      <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading chats...</div>
        ) : chats.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No messages yet</h3>
            <p className="text-muted-foreground">When you start a conversation, it will appear here.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {chats.map((chat) => {
              const otherParticipant = chat.participants.find(p => p._id !== currentUser?._id);
              const isUnread = false; // Could determine from lastMessage and seen status

              return (
                <div 
                  key={chat._id}
                  onClick={() => navigate(`/dashboard/chats/${chat._id}`)}
                  className="flex items-center gap-4 p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <Avatar className="h-12 w-12 border border-white/10">
                    <AvatarImage src={otherParticipant?.avatar} />
                    <AvatarFallback>{otherParticipant?.fullName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-white truncate">{otherParticipant?.fullName}</h4>
                      <span className="text-xs text-muted-foreground">
                        {chat.lastMessage ? format(new Date(chat.lastMessage.createdAt), 'MMM d, h:mm a') : ''}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${isUnread ? 'text-white font-medium' : 'text-muted-foreground'}`}>
                      {chat.lastMessage?.content || 'No messages yet'}
                    </p>
                    {chat.marketplaceListing && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-primary">
                        <Store className="h-3 w-3" />
                        <span className="truncate">
                          {chat.marketplaceListing.title} · {chat.marketplaceListing.listingType === 'sell' ? 'Sale' : 'Borrow'}
                        </span>
                      </div>
                    )}
                  </div>
                  {isUnread && (
                    <div className="h-3 w-3 bg-primary rounded-full"></div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
