import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HelpCircle,
  ArrowUpRight,
  MessageSquare,
  Plus,
  Sparkles,
  Zap,
  Camera
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../api/axios';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Dashboard = () => {
  const { user, updateAvatar } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [statsData, setStatsData] = useState({
    activeRequests: 0,
    chats: 0,
  });

  const fetchStats = async () => {
    try {
      const [requestsRes, chatsRes] = await Promise.all([
        api.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/req/stats`),
          api.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/chat`),
      ]);

      setStatsData({
        activeRequests: requestsRes.data.data?.activeRequests || 0,
        chats: chatsRes.data.data?.chats?.length || 0,
      });
    } catch (error) {
      console.error('Failed to load dashboard stats', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    const handleRefresh = () => {
      fetchStats();
    };

    socket.on('request:changed', handleRefresh);
    socket.on('chat:list:refresh', handleRefresh);
    socket.on('connect', handleRefresh);

    return () => {
      socket.off('request:changed', handleRefresh);
      socket.off('chat:list:refresh', handleRefresh);
      socket.off('connect', handleRefresh);
    };
  }, [socket]);

  const firstName = user?.fullName?.split(' ')[0] || 'Friend';
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await updateAvatar(file);
    } catch (err) {
      console.error('Avatar update failed', err);
    }
  };

  const overviewCards = [
    {
      label: 'Active Requests',
      value: statsData.activeRequests,
      hint: 'Open help requests in the community',
      icon: HelpCircle,
      accent: 'from-teal-500/20 to-cyan-500/5',
      iconBg: 'bg-teal-500/15 text-teal-300',
      path: '/dashboard/requests',
    },
    {
      label: 'Chats',
      value: statsData.chats,
      hint: 'Conversations waiting for you',
      icon: MessageSquare,
      accent: 'from-sky-500/20 to-blue-500/5',
      iconBg: 'bg-sky-500/15 text-sky-300',
      path: '/dashboard/chats',
    },
  ];

  const quickActions = [
    {
      title: 'Create a Request',
      description: 'Ask for help with a clear title and urgency.',
      icon: Plus,
      accent: 'from-primary/20 to-cyan-500/5',
      iconBg: 'bg-primary/15 text-primary',
      path: '/dashboard/requests/create',
    },
    {
      title: 'My Requests',
      description: 'Review and manage the requests you have created.',
      icon: Zap,
      accent: 'from-sky-500/20 to-indigo-500/5',
      iconBg: 'bg-sky-500/15 text-sky-300',
      path: '/dashboard/my-requests',
    },
    {
      title: 'Open Chats',
      description: 'Jump back into active conversations.',
      icon: MessageSquare,
      accent: 'from-emerald-500/20 to-teal-500/5',
      iconBg: 'bg-emerald-500/15 text-emerald-300',
      path: '/dashboard/chats',
    },
  ];

  const allTiles = [
    overviewCards[0] ? { ...overviewCards[0], kind: 'live' } : null,
    quickActions[0] ? { ...quickActions[0], kind: 'action' } : null,
    overviewCards[1] ? { ...overviewCards[1], kind: 'live' } : null,
    quickActions[1] ? { ...quickActions[1], kind: 'action' } : null,
  ].filter(Boolean);

  const tileMotion = {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    whileHover: { y: -10, scale: 1.015 },
    transition: { duration: 0.28, ease: 'easeOut' },
  };

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.52),rgba(255,255,255,0.18))] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] dark:bg-[linear-gradient(135deg,rgba(20,184,166,0.12),rgba(59,130,246,0.06)_45%,rgba(15,23,42,0.28))] dark:shadow-[0_24px_60px_rgba(0,0,0,0.16)] lg:p-8"
      >
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/8 blur-3xl" />
        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-center">
          <div className="max-w-2xl">
            <Badge className="mb-4 rounded-full border border-primary/10 bg-white/60 px-3 py-1 text-xs font-medium text-foreground dark:border-white/10 dark:bg-white/10 dark:text-white/90">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Community workspace
            </Badge>
            <h2 className="text-3xl font-display font-semibold text-foreground dark:text-white sm:text-[2.35rem]">
              Welcome back, {firstName}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground/68 dark:text-white/68 sm:text-base">
              Keep up with your requests and conversations without the clutter.
            </p>
          </div>

          <div className="rounded-[1.2rem] border border-white/8 bg-gradient-to-b from-black/6 to-black/3 p-3 sm:p-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative shrink-0 group">
                <input id="avatarUpload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                <div className="overflow-hidden rounded-lg">
                  {/* animate avatar on change */}
                  <motion.div
                    key={user?.avatar || 'avatar'}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35 }}
                  >
                    <Avatar className="h-12 w-12 shrink-0 rounded-lg border border-white/8 bg-card shadow-sm sm:h-10 sm:w-10">
                      <AvatarImage src={user?.avatar} alt={user?.fullName} />
                      <AvatarFallback className="rounded-lg bg-primary/18 text-primary text-sm font-semibold">
                        {getInitials(user?.fullName)}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                </div>

                <label htmlFor="avatarUpload" title="Change avatar" className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-primary text-white shadow-sm transition-transform transform scale-95 cursor-pointer group-hover:scale-105">
                  <Camera className="h-4 w-4" />
                </label>
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-xl font-display font-semibold leading-tight text-foreground dark:text-white sm:text-2xl">
                  {firstName}
                </div>
                <div className="mt-0.5 truncate text-sm text-foreground/70 dark:text-white/70">
                  @{user?.userName || 'profile'}
                </div>
                <div className="mt-2 truncate text-base font-display font-semibold text-foreground dark:text-white">
                  Help Count {user?.helpCount || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <section
        className="gap-6"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          alignItems: 'stretch',
        }}
      >
        {allTiles.map((tile, index) => (
          <motion.div
            key={tile.label || tile.title}
            initial={tileMotion.initial}
            animate={tileMotion.animate}
            whileHover={tileMotion.whileHover}
            transition={{ ...tileMotion.transition, delay: 0.06 * index }}
            className="group min-w-0"
            style={{ width: '100%' }}
          >
            <Card
              className={`relative h-full min-h-[260px] cursor-pointer overflow-hidden rounded-[1.6rem] border border-border/70 bg-gradient-to-br ${tile.accent} shadow-[0_18px_45px_rgba(0,0,0,0.18)] transition-all duration-300 group-hover:border-primary/35 group-hover:shadow-[0_22px_60px_rgba(20,184,166,0.12)]`}
              onClick={() => navigate(tile.path)}
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_34%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-80" />
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
              <CardContent className="flex h-full flex-col p-6">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tile.iconBg} ring-1 ring-white/10 transition-all duration-300 group-hover:scale-105`}>
                    <tile.icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {tile.kind === 'live' ? 'Live' : 'Action'}
                  </span>
                </div>
                {tile.kind === 'live' ? (
                  <>
                    <div className="text-4xl font-display font-bold tracking-tight text-foreground">{tile.value}</div>
                    <div className="mt-3 text-xl font-display font-semibold text-foreground">{tile.label}</div>
                    <p className="mt-2 max-w-[28rem] text-sm leading-6 text-muted-foreground">{tile.hint}</p>
                  </>
                ) : (
                  <>
                    <div className="text-xl font-display font-semibold text-foreground">{tile.title}</div>
                    <p className="mt-2 max-w-[28rem] text-sm leading-6 text-muted-foreground">{tile.description}</p>
                  </>
                )}
                <div className="mt-auto pt-6">
                  <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/10 px-4 py-3 text-sm text-foreground/88 transition-colors duration-300 group-hover:border-primary/20 group-hover:bg-black/15">
                    <span>{tile.kind === 'live' ? 'Open now' : 'Launch'}</span>
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>
    </div>
  );
};

export default Dashboard;
