import {
  ArrowLeft,
  Bell,
  BookOpenText,
  ChevronRight,
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
import useSmartBackNavigation from '../../hooks/useSmartBackNavigation';
import { Button } from '@/components/ui/button';
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
  const goBack = useSmartBackNavigation('/dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [communityUnreadCount, setCommunityUnreadCount] = useState(0);

  const GLOBAL_CHAT_LAST_SEEN_KEY = 'globalChatLastSeenAt';
  const isCommunityChatPage = location.pathname.startsWith('/dashboard/community-chat');
  const isDirectChatPage = /^\/dashboard\/chats\/[^/]+$/.test(location.pathname);

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Overview' },
    { path: '/dashboard/requests', icon: HelpCircle, label: 'Requests' },
    { path: '/dashboard/my-requests', icon: HandHeart, label: 'My Requests' },
    { path: '/dashboard/users', icon: Users, label: 'People' },
    { path: '/dashboard/campus-resources', icon: BookOpenText, label: 'Campus Resources' },
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
  const isDarkTheme = theme === 'dark';

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
    navigate('/login', { replace: true });
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
        'group flex items-center gap-3 rounded-[1.45rem] px-4 py-3.5 transition-all duration-200',
        isActive(item.path)
          ? 'bg-[linear-gradient(135deg,hsl(var(--primary))_0%,rgba(59,130,246,0.92)_100%)] text-primary-foreground shadow-[0_16px_34px_rgba(20,184,166,0.28)]'
          : mobile
            ? isDarkTheme
              ? 'border border-white/14 bg-[linear-gradient(180deg,rgba(14,24,38,0.88),rgba(10,18,30,0.82))] text-white shadow-[0_14px_32px_rgba(0,0,0,0.22)] hover:-translate-y-0.5 hover:border-primary/35 hover:bg-[linear-gradient(180deg,rgba(20,184,166,0.16),rgba(59,130,246,0.14))] hover:text-white hover:shadow-[0_18px_44px_rgba(8,145,178,0.22)]'
              : 'border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(244,247,251,0.88))] text-slate-900 shadow-[0_14px_32px_rgba(15,23,42,0.10)] hover:-translate-y-0.5 hover:border-primary/35 hover:bg-[linear-gradient(180deg,rgba(240,253,250,0.96),rgba(239,246,255,0.96))] hover:text-slate-950 hover:shadow-[0_18px_44px_rgba(8,145,178,0.12)]'
            : 'text-sidebar-foreground hover:bg-sidebar-accent/95 hover:text-sidebar-accent-foreground hover:shadow-sm'
      )}
    >
      <div
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-200',
          isActive(item.path)
            ? 'bg-black/10 ring-1 ring-white/10'
            : mobile
              ? isDarkTheme
                ? 'border border-white/14 bg-[#0d1628] text-slate-100 group-hover:border-primary/30 group-hover:bg-[#10243a] group-hover:text-white'
                : 'border border-slate-200 bg-white text-slate-700 group-hover:border-primary/30 group-hover:bg-slate-50 group-hover:text-slate-950'
              : 'bg-sidebar-accent text-muted-foreground group-hover:bg-white/70 group-hover:text-foreground'
        )}
      >
        <item.icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[1.03rem] font-semibold tracking-tight">{item.label}</p>
        {mobile && (
          <p className={cn(
            'mt-1 text-[0.8rem] transition',
            isDarkTheme ? 'text-slate-300 group-hover:text-slate-100' : 'text-slate-500 group-hover:text-slate-700'
          )}>
            Jump into {item.label.toLowerCase()}
          </p>
        )}
      </div>
      {mobile && (
        <ChevronRight className={cn(
          'h-4 w-4 transition',
          isDarkTheme ? 'text-slate-400 group-hover:text-slate-100' : 'text-slate-400 group-hover:text-slate-700'
        )} />
      )}
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
      <div className="px-4 pt-4">
        {mobile ? (
          <div className={cn(
            'relative overflow-hidden rounded-[1.45rem] p-3.5 shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-2xl',
            isDarkTheme
              ? 'border border-white/14 bg-[linear-gradient(180deg,rgba(18,28,45,0.9),rgba(12,19,31,0.84))]'
              : 'border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,247,250,0.88))] shadow-[0_18px_40px_rgba(15,23,42,0.10)]'
          )}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.42),transparent)]" />
            <div className="flex items-center gap-3">
              <Avatar className={cn(
                'h-11 w-11 shadow-[0_10px_24px_rgba(0,0,0,0.16)]',
                isDarkTheme ? 'border border-white/12' : 'border border-slate-200'
              )}>
                <AvatarImage src={user?.avatar} alt={user?.fullName} />
                <AvatarFallback className="bg-[linear-gradient(135deg,rgba(20,184,166,0.26),rgba(59,130,246,0.34))] text-white font-semibold">
                  {getInitials(user?.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className={cn(
                  'truncate text-[1rem] font-semibold tracking-tight',
                  isDarkTheme ? 'text-white' : 'text-slate-900'
                )}>{user?.fullName || 'User'}</p>
                <p className={cn(
                  'mt-0.5 truncate text-[0.78rem]',
                  isDarkTheme ? 'text-slate-300' : 'text-slate-500'
                )}>@{user?.userName || 'account'}</p>
              </div>
              <div className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                {user?.role === 'super_admin' ? 'Super Admin' : user?.role || 'Member'}
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

      <nav className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
        <div className={cn(
          'mb-4 rounded-[1.2rem] px-4 py-3 backdrop-blur-xl',
          isDarkTheme
            ? 'border border-white/12 bg-[linear-gradient(180deg,rgba(18,28,45,0.78),rgba(12,18,28,0.68))] shadow-[0_12px_28px_rgba(0,0,0,0.18)]'
            : 'border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(245,247,250,0.84))] shadow-[0_12px_28px_rgba(15,23,42,0.08)]'
        )}>
          <div className={cn(
            'text-[11px] font-semibold uppercase tracking-[0.32em]',
            isDarkTheme ? 'text-slate-300/90' : 'text-slate-500'
          )}>
            {mobile ? 'Navigation' : 'Main Menu'}
          </div>
          {mobile && (
            <div className={cn(
              'mt-1.5 text-[0.85rem] font-medium',
              isDarkTheme ? 'text-slate-200' : 'text-slate-700'
            )}>
              Quick routes across HYB
            </div>
          )}
        </div>
        <div className="space-y-2.5">
          {navItems
            .filter((item) => {
              if (!mobile) return true;

              const hiddenMobilePaths = new Set([
                '/dashboard/community-chat',
                '/dashboard/requests',
                '/dashboard/my-requests',
                '/dashboard/chats',
                '/dashboard/notifications',
                '/dashboard/users',
                '/dashboard/campus-resources',
              ]);

              return !hiddenMobilePaths.has(item.path);
            })
            .map((item) => renderNavLink(item, mobile))}
        </div>

        {(user?.role === 'admin' || user?.role === 'moderator' || user?.role === 'super_admin') && (
          <Link
            to="/dashboard/admin/reports"
            onClick={() => mobile && setIsMobileSidebarOpen(false)}
            className={cn(
              'mt-4 flex items-center gap-3 rounded-[1.35rem] px-4 py-3.5 transition-all duration-200',
              location.pathname.startsWith('/dashboard/admin')
                ? 'bg-destructive text-destructive-foreground shadow-lg'
                : mobile
                  ? isDarkTheme
                    ? 'border border-white/14 bg-[linear-gradient(180deg,rgba(14,24,38,0.88),rgba(10,18,30,0.82))] text-white shadow-[0_14px_32px_rgba(0,0,0,0.22)] hover:-translate-y-0.5 hover:border-primary/35 hover:bg-[linear-gradient(180deg,rgba(20,184,166,0.16),rgba(59,130,246,0.14))] hover:text-white'
                    : 'border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(244,247,251,0.88))] text-slate-900 shadow-[0_14px_32px_rgba(15,23,42,0.10)] hover:-translate-y-0.5 hover:border-primary/35 hover:bg-[linear-gradient(180deg,rgba(240,253,250,0.96),rgba(239,246,255,0.96))] hover:text-slate-950'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/95 hover:text-sidebar-accent-foreground'
            )}
          >
            <div className={cn(
              'flex h-11 w-11 items-center justify-center rounded-2xl',
              mobile
                ? isDarkTheme
                  ? 'border border-white/10 bg-[#0f172a]'
                  : 'border border-slate-200 bg-white'
                : 'bg-black/10'
            )}>
              <Flag className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[1.03rem] font-semibold tracking-tight">Reports</p>
              {mobile && <p className={cn('mt-1 text-[0.8rem]', isDarkTheme ? 'text-slate-300' : 'text-slate-500')}>Moderation and flagged content</p>}
            </div>
            {mobile && <ChevronRight className={cn('h-4 w-4 transition', isDarkTheme ? 'text-slate-400 group-hover:text-slate-100' : 'text-slate-400 group-hover:text-slate-700')} />}
          </Link>
        )}
      </nav>

      <div className="border-t border-sidebar-border/80 p-4">
        <div className={cn(
          'rounded-[1.2rem] p-3.5 backdrop-blur-xl',
          mobile
            ? isDarkTheme
              ? 'border border-white/12 bg-[linear-gradient(180deg,rgba(17,27,43,0.92),rgba(10,16,28,0.88))] shadow-[0_10px_24px_rgba(0,0,0,0.12)]'
              : 'border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,247,250,0.88))] shadow-[0_10px_24px_rgba(15,23,42,0.08)]'
            : 'border-sidebar-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]'
        )}>
          {mobile && (
            <div className="mb-3">
              <div className={cn('text-[11px] font-semibold uppercase tracking-[0.28em]', isDarkTheme ? 'text-slate-300' : 'text-slate-500')}>Account</div>
              <div className={cn('mt-1 text-[0.92rem] font-semibold tracking-tight', isDarkTheme ? 'text-white' : 'text-slate-900')}>Settings & session</div>
            </div>
          )}
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
              'mb-1 h-11 w-full justify-start rounded-2xl text-muted-foreground hover:text-foreground',
              mobile
                ? isDarkTheme
                  ? 'border border-transparent bg-white/[0.015] text-slate-100 hover:border-white/10 hover:bg-white/[0.08] hover:text-white'
                  : 'border border-transparent bg-slate-100/80 text-slate-700 hover:border-slate-200 hover:bg-white hover:text-slate-950'
                : 'hover:bg-white/5'
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
              'mb-1 h-11 w-full justify-start rounded-2xl text-muted-foreground hover:text-foreground',
              mobile
                ? isDarkTheme
                  ? 'border border-transparent bg-white/[0.015] text-slate-100 hover:border-white/10 hover:bg-white/[0.08] hover:text-white'
                  : 'border border-transparent bg-slate-100/80 text-slate-700 hover:border-slate-200 hover:bg-white hover:text-slate-950'
                : 'hover:bg-white/5'
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
              className={cn(
                'mb-1 h-11 w-full justify-start rounded-2xl border border-transparent',
                isDarkTheme
                  ? 'bg-white/[0.015] text-slate-100 hover:border-white/10 hover:bg-white/[0.08] hover:text-white'
                  : 'bg-slate-100/80 text-slate-700 hover:border-slate-200 hover:bg-white hover:text-slate-950'
              )}
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
              'h-11 w-full justify-start rounded-2xl text-muted-foreground hover:text-destructive',
              mobile
                ? isDarkTheme
                  ? 'border border-transparent bg-white/[0.015] text-slate-100 hover:border-destructive/15 hover:bg-destructive/12 hover:text-destructive-foreground'
                  : 'border border-transparent bg-slate-100/80 text-slate-700 hover:border-destructive/20 hover:bg-red-50 hover:text-destructive'
                : 'hover:bg-destructive/8'
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

  if (isCommunityChatPage || isDirectChatPage) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.08),_transparent_28%),radial-gradient(circle_at_right,_rgba(59,130,246,0.08),_transparent_24%)] bg-background">
        <div className="relative min-h-screen px-3 py-3 sm:px-4 sm:py-4">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="absolute right-4 top-4 z-20 h-12 w-12 rounded-2xl border border-border/70 bg-card/85 text-muted-foreground shadow-[0_10px_24px_rgba(0,0,0,0.14)] backdrop-blur-xl hover:border-primary/30 hover:bg-card hover:text-foreground"
            onClick={() => navigate(isDirectChatPage ? '/dashboard/chats' : '/dashboard')}
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="fixed inset-0 z-40 lg:hidden mobile-backdrop"
                onClick={() => setIsMobileSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: 340, opacity: 0.96 }}
                animate={{ x: 0 }}
                exit={{ x: 340, opacity: 0.96 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={cn(
                  'fixed inset-y-0 right-0 z-50 flex w-[320px] max-w-[88vw] flex-col overflow-hidden rounded-l-[2rem] force-3d',
                  'mobile-glass',
                  !isDarkTheme && 'mobile-glass light'
                )}
              >
                <div className={cn(
                  'pointer-events-none absolute inset-0',
                  isDarkTheme
                    ? 'bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.12),transparent_20%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03)_18%,rgba(255,255,255,0.025)_100%)]'
                    : 'bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.05),transparent_18%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.06),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.55),rgba(255,255,255,0.24)_18%,rgba(255,255,255,0.12)_100%)]'
                )} />
                <div className={cn('relative px-4 py-4', isDarkTheme ? 'border-b border-white/10' : 'border-b border-slate-200/80')}>
                  <div className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)]" />
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-[1rem] shadow-[0_12px_24px_rgba(0,0,0,0.16)]',
                        isDarkTheme
                          ? 'border border-white/12 bg-[linear-gradient(135deg,rgba(20,184,166,0.18),rgba(59,130,246,0.22))]'
                          : 'border border-slate-200/80 bg-[linear-gradient(135deg,rgba(20,184,166,0.12),rgba(59,130,246,0.14))]'
                      )}>
                        <img src="/logo.png" alt="HYB Logo" className="h-7 w-7 object-contain" />
                      </div>
                      <div>
                        <div className={cn('text-[11px] font-semibold uppercase tracking-[0.32em]', isDarkTheme ? 'text-muted-foreground/70' : 'text-slate-500')}>Menu</div>
                        <div className={cn('mt-1 text-lg font-semibold tracking-tight', isDarkTheme ? 'text-sidebar-foreground' : 'text-slate-900')}>Quick navigation</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-[1rem] transition',
                        isDarkTheme
                          ? 'border border-white/12 bg-white/[0.06] text-slate-200 hover:bg-white/[0.12] hover:text-white'
                          : 'border border-slate-200/80 bg-white/70 text-slate-700 hover:bg-white hover:text-slate-950'
                      )}
                      aria-label="Close menu"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="relative flex-1 overflow-y-auto overscroll-contain force-3d custom-scrollbar">
                  {sidebarContent(true)}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <div
          className={cn(
            "flex min-h-screen flex-1 flex-col transition-all duration-200",
            isMobileSidebarOpen && "pointer-events-none scale-[0.985] blur-[10px] brightness-[0.24] saturate-[0.55] lg:pointer-events-auto lg:scale-100 lg:blur-0 lg:brightness-100 lg:saturate-100"
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
                    <span className="absolute right-0 top-0 z-10 flex h-5 min-w-5 translate-x-[18%] -translate-y-[18%] items-center justify-center rounded-full border-2 border-[#070d19] bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground shadow-[0_8px_18px_rgba(20,184,166,0.34)]">
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
                    <span className="absolute right-0 top-0 z-10 flex h-5 min-w-5 translate-x-[18%] -translate-y-[18%] items-center justify-center rounded-full border-2 border-[#070d19] bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground shadow-[0_8px_18px_rgba(239,68,68,0.34)]">
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
                  onClick={goBack}
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
