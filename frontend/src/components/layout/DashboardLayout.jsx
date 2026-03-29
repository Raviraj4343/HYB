import {
  ArrowLeft,
  Bell,
  Flag,
  HandHeart,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  MessagesSquare,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  User,
  Users,
  X,
  HelpCircle
} from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../hooks/useNotifications';
import api from '../../api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications(true);
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [communityUnreadCount, setCommunityUnreadCount] = useState(0);

  const GLOBAL_CHAT_LAST_SEEN_KEY = 'globalChatLastSeenAt';
  const isCommunityChatPage = location.pathname.startsWith('/dashboard/community-chat');

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Overview' },
    { path: '/dashboard/requests', icon: HelpCircle, label: 'Requests' },
    { path: '/dashboard/my-requests', icon: HandHeart, label: 'My Requests' },
    { path: '/dashboard/users', icon: Users, label: 'People' },
    { path: '/dashboard/chats', icon: MessageSquare, label: 'Chats' },
    { path: '/dashboard/notifications', icon: Bell, label: 'Notifications', badge: unreadCount },
  ];

  const pageTitle = useMemo(() => {
    if (isCommunityChatPage) {
      return 'Community Chat';
    }

    const match = navItems.find((item) =>
      item.path === '/dashboard'
        ? location.pathname === item.path
        : location.pathname.startsWith(item.path)
    );
    return match?.label || 'Dashboard';
  }, [location.pathname, unreadCount]);

  const canGoBack = location.pathname !== '/dashboard' && !isCommunityChatPage;

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    const fetchCommunityUnreadCount = async () => {
      if (!user?._id) {
        setCommunityUnreadCount(0);
        return;
      }

      if (location.pathname.startsWith('/dashboard/community-chat')) {
        setCommunityUnreadCount(0);
        return;
      }

      const lastSeenAt = localStorage.getItem(GLOBAL_CHAT_LAST_SEEN_KEY) || '1970-01-01T00:00:00.000Z';

      try {
        const response = await api.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/chat/global/unread-count`, {
          params: { since: lastSeenAt },
        });
        setCommunityUnreadCount(response.data.data?.unreadCount || 0);
      } catch {
        setCommunityUnreadCount(0);
      }
    };

    fetchCommunityUnreadCount();

    if (!socket || !user?._id) return undefined;

    const handleGlobalChatChange = () => {
      fetchCommunityUnreadCount();
    };

    socket.on('global-chat:message:new', handleGlobalChatChange);
    socket.on('global-chat:message:deleted', handleGlobalChatChange);
    socket.on('connect', handleGlobalChatChange);

    return () => {
      socket.off('global-chat:message:new', handleGlobalChatChange);
      socket.off('global-chat:message:deleted', handleGlobalChatChange);
      socket.off('connect', handleGlobalChatChange);
    };
  }, [user?._id, location.pathname, socket]);

  useEffect(() => {
    const handleSeen = () => {
      setCommunityUnreadCount(0);
    };

    window.addEventListener('global-chat:seen', handleSeen);
    return () => {
      window.removeEventListener('global-chat:seen', handleSeen);
    };
  }, []);

  useEffect(() => {
    if (!isMobileSidebarOpen) return undefined;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [isMobileSidebarOpen]);

  const renderNavLink = (item, mobile = false) => (
    <Link
      key={item.path}
      to={item.path}
      onClick={() => mobile && setIsMobileSidebarOpen(false)}
      className={cn(
        'group flex items-center gap-3 rounded-[1.35rem] px-4 py-3.5 transition-all duration-200',
        isActive(item.path)
          ? 'bg-[linear-gradient(135deg,hsl(var(--primary))_0%,rgba(59,130,246,0.92)_100%)] text-primary-foreground shadow-[0_16px_34px_rgba(20,184,166,0.28)]'
          : mobile
            ? 'border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] text-sidebar-foreground hover:border-primary/35 hover:bg-[linear-gradient(180deg,rgba(20,184,166,0.12),rgba(59,130,246,0.10))] hover:text-white hover:shadow-[0_16px_40px_rgba(8,145,178,0.18)]'
            : 'text-sidebar-foreground hover:bg-sidebar-accent/95 hover:text-sidebar-accent-foreground hover:shadow-sm'
      )}
    >
      <div
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-200',
          isActive(item.path)
            ? 'bg-black/10 ring-1 ring-white/10'
            : mobile
              ? 'border border-white/10 bg-[#0f172a] text-slate-300 group-hover:border-primary/30 group-hover:bg-[#10243a] group-hover:text-white'
              : 'bg-sidebar-accent text-muted-foreground group-hover:bg-white/70 group-hover:text-foreground'
        )}
      >
        <item.icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{item.label}</p>
      </div>
      {item.badge > 0 && (
        <Badge className={cn(
          'rounded-full px-2 py-0.5 text-[11px]',
          isActive(item.path)
            ? 'bg-white/20 text-white'
            : 'bg-accent text-accent-foreground'
        )}>
          {item.badge > 9 ? '9+' : item.badge}
        </Badge>
      )}
    </Link>
  );

  const sidebarContent = (mobile = false) => (
    <>
      <div className="px-5 pt-5">
        {mobile ? (
          <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-4 shadow-[0_14px_40px_rgba(0,0,0,0.22)]">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14 border border-white/10 shadow-[0_10px_24px_rgba(0,0,0,0.24)]">
                <AvatarImage src={user?.avatar} alt={user?.fullName} />
                <AvatarFallback className="bg-[linear-gradient(135deg,rgba(20,184,166,0.22),rgba(59,130,246,0.28))] text-white font-semibold">
                  {getInitials(user?.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-xl font-semibold tracking-tight text-white">{user?.fullName || 'User'}</p>
                <p className="truncate text-xs uppercase tracking-[0.28em] text-slate-400">{user?.role || 'Member'}</p>
              </div>
            </div>
          </div>
        ) : (
          <Link
            to="/dashboard"
            className="flex items-center gap-3 rounded-[1.7rem] border border-sidebar-border/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-4 py-4 shadow-[0_12px_30px_rgba(0,0,0,0.12)]"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 ring-1 ring-primary/15 shadow-inner">
              <img src="/logo.png" alt="HYB Logo" className="h-9 w-9 object-contain" />
            </div>
            <div>
              <p className="text-lg font-display font-bold tracking-tight text-sidebar-foreground">HYB</p>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Help Your Buddy</p>
            </div>
          </Link>
        )}
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6 custom-scrollbar">
        <div className="mb-3 px-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground/70">
            {mobile ? 'Menu' : 'Main Menu'}
          </div>
          {mobile && (
            <div className="mt-1 text-lg font-medium tracking-tight text-slate-300">
              Quick navigation
            </div>
          )}
        </div>
        {mobile && (
          <div className="mb-4 px-1">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Search people"
                className="h-14 rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(12,17,29,0.96),rgba(7,12,23,0.9))] pl-11 text-sm text-slate-100 placeholder:text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus-visible:ring-2 focus-visible:ring-primary/55 focus-visible:ring-offset-0"
              />
            </div>
          </div>
        )}
        {navItems
          .filter((item) => !(mobile && item.path === '/dashboard/community-chat'))
          .map((item) => renderNavLink(item, mobile))}

        {(user?.role === 'admin' || user?.role === 'moderator' || user?.role === 'super_admin') && (
          <Link
            to="/dashboard/admin/reports"
            onClick={() => mobile && setIsMobileSidebarOpen(false)}
            className={cn(
              'mt-4 flex items-center gap-3 rounded-[1.35rem] px-4 py-3.5 transition-all duration-200',
              location.pathname.startsWith('/dashboard/admin')
                ? 'bg-destructive text-destructive-foreground shadow-lg'
                : mobile
                  ? 'border border-white/10 bg-white/[0.04] text-sidebar-foreground hover:bg-white/[0.09] hover:text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/95 hover:text-sidebar-accent-foreground'
            )}
          >
            <div className={cn(
              'flex h-11 w-11 items-center justify-center rounded-2xl',
              mobile ? 'bg-white/[0.06]' : 'bg-black/10'
            )}>
              <Flag className="h-5 w-5" />
            </div>
            <span className="font-medium">Reports</span>
          </Link>
        )}
      </nav>

      <div className="border-t border-sidebar-border/80 p-4">
        <div className={cn(
          'rounded-[1.7rem] border p-4 shadow-[0_10px_24px_rgba(0,0,0,0.08)]',
          mobile
            ? 'border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))]'
            : 'border-sidebar-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]'
        )}>
          {/* Hide avatar block on mobile; show Profile/Settings/Logout directly */}
          {!mobile && (
            <div className="mb-4 flex items-center gap-3">
              <Avatar className="h-12 w-12 border border-sidebar-border shadow-sm">
                <AvatarImage src={user?.avatar} alt={user?.fullName} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {getInitials(user?.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium text-sidebar-foreground">{user?.fullName || 'User'}</p>
                <p className="truncate text-sm text-muted-foreground">@{user?.userName || 'account'}</p>
              </div>
            </div>
          )}

          {!mobile && (
            <Button
              onClick={() => navigate('/dashboard/requests/create')}
              className="mb-3 h-11 w-full rounded-2xl btn-gradient-primary shadow-lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
          )}

          <Button
            variant="ghost"
            className={cn(
              'mb-1 h-10 w-full justify-start rounded-2xl text-muted-foreground hover:text-foreground',
              mobile ? 'hover:bg-white/[0.08]' : 'hover:bg-white/5'
            )}
            onClick={() => {
              navigate('/dashboard/profile');
              if (mobile) setIsMobileSidebarOpen(false);
            }}
          >
            <User className="mr-2 h-4 w-4" />
            Profile
          </Button>

          <Button
            variant="ghost"
            className={cn(
              'mb-1 h-10 w-full justify-start rounded-2xl text-muted-foreground hover:text-foreground',
              mobile ? 'hover:bg-white/[0.08]' : 'hover:bg-white/5'
            )}
            onClick={() => {
              navigate('/dashboard/settings');
              if (mobile) setIsMobileSidebarOpen(false);
            }}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>

          {mobile && (
            <Button
              variant="ghost"
              className="mb-1 h-10 w-full justify-start rounded-2xl text-muted-foreground hover:bg-white/[0.08] hover:text-foreground"
              onClick={() => {
                toggleTheme();
              }}
            >
              {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </Button>
          )}

          <Button
            variant="ghost"
            className={cn(
              'h-10 w-full justify-start rounded-2xl text-muted-foreground hover:text-destructive',
              mobile ? 'hover:bg-destructive/12' : 'hover:bg-destructive/8'
            )}
            onClick={() => {
              if (mobile) setIsMobileSidebarOpen(false);
              handleLogout();
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </>
  );

  if (isCommunityChatPage) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.08),_transparent_28%),radial-gradient(circle_at_right,_rgba(59,130,246,0.08),_transparent_24%)] bg-background">
        <div className="relative min-h-screen px-3 py-3 sm:px-4 sm:py-4">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="absolute right-4 top-4 z-20 h-12 w-12 rounded-2xl border border-border/70 bg-card/85 text-muted-foreground shadow-[0_10px_24px_rgba(0,0,0,0.14)] backdrop-blur-xl hover:border-primary/30 hover:bg-card hover:text-foreground"
            onClick={() => navigate('/dashboard')}
          >
            <X className="h-5 w-5" />
          </Button>

          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.08),_transparent_28%),radial-gradient(circle_at_right,_rgba(59,130,246,0.08),_transparent_24%)] bg-background">
      <div className="flex min-h-screen">
        <aside className="hidden lg:flex lg:w-80 lg:flex-col lg:border-r lg:border-sidebar-border/80 lg:bg-[linear-gradient(180deg,rgba(17,24,39,0.92),rgba(17,24,39,0.84))] lg:backdrop-blur-2xl">
          {sidebarContent(false)}
        </aside>

        <AnimatePresence>
          {isMobileSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0, backdropFilter: 'blur(0px)', backgroundColor: 'rgba(0,0,0,0)' }}
                animate={{ opacity: 1, backdropFilter: 'blur(24px)', backgroundColor: 'rgba(2,6,23,0.88)' }}
                exit={{ opacity: 0, backdropFilter: 'blur(0px)', backgroundColor: 'rgba(0,0,0,0)' }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="fixed inset-0 z-40 lg:hidden mobile-overlay"
                onClick={() => setIsMobileSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: 320 }}
                animate={{ x: 0 }}
                exit={{ x: 320 }}
                transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                className="fixed inset-y-0 right-0 z-50 flex w-[380px] max-w-[95vw] flex-col overflow-hidden border-l border-white/10 bg-[linear-gradient(180deg,rgba(11,18,34,0.98),rgba(15,23,42,0.98))] shadow-[0_24px_80px_rgba(0,0,0,0.66)] backdrop-blur-3xl lg:hidden force-3d"
              >
                <div className="flex items-center justify-between border-b border-sidebar-border/70 px-6 py-6">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground/70">Menu</div>
                    <div className="mt-1 text-2xl font-semibold tracking-tight text-sidebar-foreground">Quick navigation</div>
                  </div>
                  <button
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-base font-medium text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto overscroll-contain force-3d custom-scrollbar">
                  {sidebarContent(true)}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <div
          className={cn(
            "flex min-h-screen flex-1 flex-col transition-all duration-200",
            isMobileSidebarOpen && "pointer-events-none scale-[0.992] blur-[6px] brightness-[0.48] lg:pointer-events-auto lg:scale-100 lg:blur-0 lg:brightness-100"
          )}
        >
          <header className="sticky top-0 z-30 border-b border-[#1f2a44] bg-[#070d19]/92 shadow-[0_18px_48px_rgba(1,6,20,0.42)] backdrop-blur-2xl">
            <div className="flex h-24 items-center justify-between gap-4 px-4 sm:px-6 lg:h-28 lg:px-8">
              <div className="flex min-w-0 items-center gap-4">
                <Link
                  to="/dashboard"
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.35rem] border border-[#3050d3]/60 bg-[linear-gradient(180deg,rgba(40,56,115,0.9),rgba(72,35,115,0.68))] shadow-[0_0_0_1px_rgba(96,165,250,0.14),0_18px_32px_rgba(34,44,115,0.35)]"
                >
                  <img src="/logo.png" alt="HYB logo" className="h-10 w-10 object-contain" />
                </Link>

                <div className="min-w-0 hidden lg:block">
                  <div className="truncate text-sm uppercase tracking-[0.48em] text-slate-500">HYB</div>
                  <h1 className="truncate text-lg font-semibold tracking-[0.18em] text-slate-200">
                    {pageTitle}
                  </h1>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pr-1 sm:gap-3 sm:pr-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "relative overflow-visible h-12 w-12 rounded-full border border-[#3050d3]/40 bg-[radial-gradient(circle_at_top,rgba(95,127,255,0.22),rgba(14,20,36,0.95))] text-slate-200 shadow-[0_0_0_1px_rgba(86,123,255,0.08),0_14px_30px_rgba(28,39,86,0.28)] hover:text-white",
                    location.pathname.startsWith('/dashboard/community-chat') && "border-primary/50 text-primary shadow-[0_0_28px_rgba(45,212,191,0.18)]"
                  )}
                  onClick={() => navigate('/dashboard/community-chat')}
                >
                  <MessagesSquare className="h-5 w-5" />
                  {communityUnreadCount > 0 && (
                    <span className="absolute -right-2.5 -top-2.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground shadow-[0_6px_14px_rgba(20,184,166,0.28)]">
                      {communityUnreadCount > 9 ? '9+' : communityUnreadCount}
                    </span>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="relative overflow-visible h-12 w-12 rounded-full border border-[#8b3561]/45 bg-[radial-gradient(circle_at_top,rgba(244,114,182,0.16),rgba(14,20,36,0.95))] text-slate-200 shadow-[0_0_0_1px_rgba(244,114,182,0.08),0_14px_30px_rgba(77,24,52,0.24)] hover:text-white"
                  onClick={() => navigate('/dashboard/notifications')}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-2.5 -top-2.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground shadow-[0_6px_14px_rgba(239,68,68,0.28)]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>

                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(25,31,44,0.96),rgba(14,20,32,0.96))] p-3 text-slate-200 shadow-[0_16px_30px_rgba(0,0,0,0.28)] transition hover:border-primary/35 hover:text-white lg:hidden"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            {canGoBack && (
              <div className="mb-5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-10 rounded-full border border-border/70 bg-card/80 px-3 text-muted-foreground shadow-sm hover:border-primary/30 hover:bg-card hover:text-foreground"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Back
                </Button>
              </div>
            )}
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
