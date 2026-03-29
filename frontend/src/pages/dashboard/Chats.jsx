import { useNavigate } from 'react-router-dom';
import { useChatList } from '../../hooks/useChat';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Loader2, ArrowUpRight, Sparkles } from 'lucide-react';
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
    <div className="mx-auto max-w-5xl space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.58),rgba(255,255,255,0.18))] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] dark:bg-[linear-gradient(135deg,rgba(20,184,166,0.10),rgba(59,130,246,0.06)_45%,rgba(15,23,42,0.26))] dark:shadow-[0_24px_60px_rgba(0,0,0,0.14)]"
      >
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <Badge className="mb-4 rounded-full border border-primary/10 bg-white/60 px-3 py-1 text-xs font-medium text-foreground dark:border-white/10 dark:bg-white/10 dark:text-white/90">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Direct conversations
            </Badge>
            <h1 className="flex items-center gap-3 text-3xl font-display font-semibold tracking-tight text-foreground dark:text-white">
              <MessageSquare className="h-8 w-8 text-primary" />
              Chats
            </h1>
            <p className="mt-2 text-sm leading-7 text-foreground/68 dark:text-white/68 sm:text-base">
              Keep your one-to-one help conversations organized, searchable, and ready to continue.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:w-[320px]">
            <div className="rounded-[1.3rem] border border-border/70 bg-background/70 p-4 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04]">
              <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Open chats</div>
              <div className="mt-3 text-3xl font-display font-semibold text-foreground dark:text-white">{chats.length}</div>
            </div>
            <div className="rounded-[1.3rem] border border-border/70 bg-background/70 p-4 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04]">
              <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Your role</div>
              <div className="mt-3 truncate text-lg font-semibold capitalize text-foreground dark:text-white">{user?.role || 'member'}</div>
            </div>
          </div>
        </div>
      </motion.section>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : chats.length === 0 ? (
        <Card className="overflow-hidden rounded-[1.8rem] border-border/70 bg-card/80 shadow-[0_18px_45px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.92))]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <MessageSquare className="h-8 w-8" />
            </div>
            <p className="text-xl font-semibold text-foreground dark:text-white">No chats yet</p>
            <p className="mt-2 max-w-md text-muted-foreground">
              Start a conversation by responding to a request and your messages will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {chats.map((chat) => {
            const otherUser = getOtherParticipant(chat);
            return (
              <motion.div
                key={chat._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24 }}
              >
                <Card
                  className="group cursor-pointer overflow-hidden rounded-[1.7rem] border border-border/70 bg-card/85 shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_22px_55px_rgba(20,184,166,0.10)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.90),rgba(2,6,23,0.90))]"
                  onClick={() => navigate(`/dashboard/chats/${chat._id}`)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14 border border-border/70 shadow-sm dark:border-white/10">
                        <AvatarImage src={otherUser?.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(otherUser?.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-lg font-semibold tracking-tight text-foreground dark:text-white">{otherUser?.fullName}</p>
                            <p className="mt-0.5 truncate text-sm text-muted-foreground">@{otherUser?.userName}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {chat.lastMessage && (
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(chat.lastMessage.createdAt), { addSuffix: true })}
                              </span>
                            )}
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background/70 text-muted-foreground transition group-hover:border-primary/35 group-hover:text-primary dark:border-white/10 dark:bg-white/[0.04]">
                              <ArrowUpRight className="h-4 w-4" />
                            </div>
                          </div>
                        </div>

                        {chat.lastMessage && (
                          <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
                            {chat.lastMessage.content || 'Image shared in the conversation'}
                          </p>
                        )}

                        {chat.request && (
                          <Badge variant="secondary" className="mt-3 rounded-full px-3 py-1 text-[11px] font-medium">
                            Request: {chat.request.title}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Chats;
