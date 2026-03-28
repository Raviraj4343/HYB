import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BellRing,
  CheckCircle2,
  HelpCircle,
  ArrowUpRight,
  MessageSquare,
  Plus,
  Sparkles,
  TrendingUp,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../api/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Dashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [statsData, setStatsData] = useState({
    activeRequests: 0,
    chats: 0,
  });

  const fetchStats = async () => {
    try {
      const [requestsRes, chatsRes] = await Promise.all([
        api.get('/req/stats'),
        api.get('/chat'),
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
      title: 'Browse Requests',
      description: 'Find someone you can help right now.',
      icon: Zap,
      accent: 'from-sky-500/20 to-indigo-500/5',
      iconBg: 'bg-sky-500/15 text-sky-300',
      path: '/dashboard/requests',
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

  const tips = [
    'Use clear titles so people can decide faster.',
    'Keep your branch, year, and profile photo updated.',
    'Reply quickly in chats to build trust.',
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
        className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-[linear-gradient(135deg,rgba(20,184,166,0.14),rgba(59,130,246,0.08)_45%,rgba(255,255,255,0.72))] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] dark:bg-[linear-gradient(135deg,rgba(20,184,166,0.16),rgba(59,130,246,0.08)_45%,rgba(15,23,42,0.4))] dark:shadow-[0_24px_60px_rgba(0,0,0,0.18)] lg:p-8"
      >
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge className="mb-4 rounded-full border border-primary/10 bg-white/65 px-3 py-1 text-xs font-medium text-foreground shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-white/90">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Community workspace
            </Badge>
            <h2 className="text-3xl font-display font-bold text-foreground dark:text-white sm:text-4xl">
              Welcome back, {firstName}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-foreground/72 dark:text-white/72 sm:text-base">
              Your dashboard is ready. Track requests, continue conversations, and keep your profile sharp.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              className="h-12 rounded-2xl btn-gradient-primary text-primary-foreground shadow-xl hover:opacity-95"
            >
              <Link to="/dashboard/requests/create">
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              className="h-12 rounded-2xl border border-border/70 bg-white/70 text-foreground shadow-sm hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/14"
            >
              <Link to="/dashboard/requests">Browse Requests</Link>
            </Button>
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

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <Card className="rounded-[1.75rem] border border-border/70 bg-[linear-gradient(135deg,rgba(250,204,21,0.12),rgba(251,146,60,0.06))] shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-display">
              <BellRing className="h-5 w-5 text-amber-300" />
              Better Habits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tips.map((tip) => (
              <div key={tip} className="flex items-start gap-3 rounded-2xl bg-black/10 px-4 py-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <p className="text-sm leading-6 text-foreground/90">{tip}</p>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-2xl bg-black/10 px-4 py-3 text-sm">
              <span className="text-foreground/80">Help Count</span>
              <Badge className="rounded-full bg-emerald-500/12 text-emerald-300">
                <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                {user?.helpCount || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
};

export default Dashboard;
