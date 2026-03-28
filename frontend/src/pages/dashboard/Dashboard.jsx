import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
  Plus,
  Sparkles,
  TrendingUp,
  UserRound,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [statsData, setStatsData] = useState({
    activeRequests: 0,
    chats: 0,
  });

  useEffect(() => {
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

    fetchStats();
  }, []);

  const firstName = user?.fullName?.split(' ')[0] || 'Friend';
  const profileCompletion = useMemo(() => {
    const checks = [user?.fullName, user?.userName, user?.email, user?.branch, user?.year, user?.avatar];
    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  }, [user]);

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
    {
      label: 'Help Count',
      value: user?.helpCount || 0,
      hint: 'Times you have helped others',
      icon: TrendingUp,
      accent: 'from-emerald-500/20 to-green-500/5',
      iconBg: 'bg-emerald-500/15 text-emerald-300',
      path: '/dashboard/profile',
    },
  ];

  const quickActions = [
    {
      title: 'Create a Request',
      description: 'Ask for help with a clear title and urgency.',
      icon: Plus,
      path: '/dashboard/requests/create',
    },
    {
      title: 'Browse Requests',
      description: 'Find someone you can help right now.',
      icon: Zap,
      path: '/dashboard/requests',
    },
    {
      title: 'Open Chats',
      description: 'Jump back into active conversations.',
      icon: MessageSquare,
      path: '/dashboard/chats',
    },
  ];

  const tips = [
    'Use clear titles so people can decide faster.',
    'Keep your branch, year, and profile photo updated.',
    'Reply quickly in chats to build trust.',
  ];

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-[linear-gradient(135deg,rgba(20,184,166,0.16),rgba(59,130,246,0.08)_45%,rgba(15,23,42,0.4))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)] lg:p-8"
      >
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge className="mb-4 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Community workspace
            </Badge>
            <h2 className="text-3xl font-display font-bold text-white sm:text-4xl">
              Welcome back, {firstName}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-white/72 sm:text-base">
              Your dashboard is ready. Track requests, continue conversations, and keep your profile sharp.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              className="h-12 rounded-2xl bg-white text-slate-900 shadow-xl hover:bg-white/92"
            >
              <Link to="/dashboard/requests/create">
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              className="h-12 rounded-2xl border border-white/10 bg-white/10 text-white hover:bg-white/14"
            >
              <Link to="/dashboard/profile">View Profile</Link>
            </Button>
          </div>
        </div>
      </motion.section>

      <section className="grid gap-4 md:grid-cols-3">
        {overviewCards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 * index }}
          >
            <Card
              className={`cursor-pointer overflow-hidden rounded-[1.75rem] border border-border/70 bg-gradient-to-br ${card.accent} shadow-lg transition hover:-translate-y-1 hover:border-primary/30`}
              onClick={() => navigate(card.path)}
            >
              <CardContent className="p-6">
                <div className="mb-5 flex items-start justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconBg}`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Live</span>
                </div>
                <div className="text-3xl font-display font-bold text-foreground">{card.value}</div>
                <div className="mt-2 text-base font-medium text-foreground">{card.label}</div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{card.hint}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="rounded-[1.75rem] border border-border/70 bg-card/95 shadow-lg">
            <CardHeader className="flex flex-col gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-xl font-display">Quick Actions</CardTitle>
                <CardDescription>Start something useful in one click.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="rounded-full px-3">
                <Link to="/dashboard/requests">
                  Explore all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
              {quickActions.map((action) => (
                <button
                  key={action.title}
                  onClick={() => navigate(action.path)}
                  className="rounded-[1.5rem] border border-border/70 bg-background/60 p-5 text-left transition hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div className="font-medium text-foreground">{action.title}</div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{action.description}</p>
                </button>
              ))}
            </CardContent>
          </Card>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="space-y-6"
        >
          <Card className="rounded-[1.75rem] border border-border/70 bg-card/95 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-display">Your Profile</CardTitle>
              <CardDescription>Keep your account complete and trusted.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-5 flex items-center gap-4">
                <Avatar className="h-14 w-14 border border-border">
                  <AvatarImage src={user?.avatar} alt={user?.fullName} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials(user?.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{user?.fullName}</p>
                  <p className="truncate text-sm text-muted-foreground">@{user?.userName || 'user'}</p>
                </div>
              </div>

              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Profile completion</span>
                <span className="font-medium text-foreground">{profileCompletion}%</span>
              </div>
              <div className="mb-5 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#14b8a6,#38bdf8)]"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>

              <div className="space-y-3 text-sm">
                {user?.branch && (
                  <div className="flex items-center justify-between rounded-2xl bg-background/60 px-4 py-3">
                    <span className="text-muted-foreground">Branch</span>
                    <span className="font-medium text-foreground">{user.branch}</span>
                  </div>
                )}
                {user?.year && (
                  <div className="flex items-center justify-between rounded-2xl bg-background/60 px-4 py-3">
                    <span className="text-muted-foreground">Year</span>
                    <span className="font-medium text-foreground">Year {user.year}</span>
                  </div>
                )}
                <div className="flex items-center justify-between rounded-2xl bg-background/60 px-4 py-3">
                  <span className="text-muted-foreground">Helped</span>
                  <Badge className="rounded-full bg-emerald-500/12 text-emerald-300">{user?.helpCount || 0} times</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

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
            </CardContent>
          </Card>
        </motion.section>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="rounded-[1.75rem] border border-border/70 bg-card/95 shadow-lg">
          <CardHeader className="flex flex-col gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl font-display">Community Feed</CardTitle>
              <CardDescription>Fresh activity will appear here as requests and chats grow.</CardDescription>
            </div>
            <Button variant="outline" asChild className="rounded-full">
              <Link to="/dashboard/requests">
                Browse Requests
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-border/80 bg-background/50 px-6 py-16 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                <UserRound className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-display font-semibold text-foreground">Your workspace is ready</h3>
              <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                Start by creating a request, helping someone from the feed, or opening your chats.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
};

export default Dashboard;
