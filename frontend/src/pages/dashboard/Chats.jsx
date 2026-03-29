import { useNavigate } from 'react-router-dom';
import { useChatList } from '../../hooks/useChat';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Loader2, Search, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

const Chats = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { chats, isLoading } = useChatList(true);

  const getOtherParticipant = (chat) => {
    return chat.participants?.find((p) => p._id !== user?._id) || chat.participants?.[0];
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 shadow-[0_20px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.96))]">
        <div className="border-b border-border/70 bg-background/80 px-5 py-5 backdrop-blur-xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(8,15,28,0.94))] sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground dark:text-white">Chats</h1>
                  <p className="text-sm text-muted-foreground">Simple direct conversations, like a real inbox.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm text-muted-foreground dark:border-white/10 dark:bg-white/[0.04]">
              <Search className="h-4 w-4" />
              <span>{chats.length} active conversation{chats.length === 1 ? '' : 's'}</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <MessageSquare className="h-8 w-8" />
            </div>
            <p className="text-xl font-semibold text-foreground dark:text-white">No chats yet</p>
            <p className="mt-2 max-w-md text-muted-foreground">
              When you respond to a request, your conversations will appear here in a cleaner message list.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/70 dark:divide-white/10">
            {chats.map((chat, index) => {
              const otherUser = getOtherParticipant(chat);
              return (
                <motion.button
                  key={chat._id}
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  onClick={() => navigate(`/dashboard/chats/${chat._id}`)}
                  className="flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-muted/40 dark:hover:bg-white/[0.03] sm:px-6"
                >
                  <Avatar className="mt-0.5 h-10 w-10 border border-border/70 shadow-sm dark:border-white/10">
                    <AvatarImage src={otherUser?.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(otherUser?.fullName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-[0.98rem] font-semibold tracking-tight text-foreground dark:text-white">
                          {otherUser?.fullName}
                        </div>
                        <div className="mt-0.5 truncate text-sm text-muted-foreground">
                          @{otherUser?.userName}
                        </div>
                      </div>
                      <div className="shrink-0 pt-0.5 text-xs text-muted-foreground">
                        {chat.lastMessage
                          ? formatDistanceToNow(new Date(chat.lastMessage.createdAt), { addSuffix: true })
                          : 'New'}
                      </div>
                    </div>

                    <div className="mt-2 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm leading-6 text-muted-foreground">
                          {chat.lastMessage?.content || 'Image shared in the conversation'}
                        </p>
                        {chat.request && (
                          <Badge variant="secondary" className="mt-2 rounded-full px-2.5 py-1 text-[10px] font-medium">
                            {chat.request.title}
                          </Badge>
                        )}
                      </div>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground dark:border-white/10 dark:bg-white/[0.04]">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chats;
