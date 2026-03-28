import {
  ArrowLeft,
  Bell,
  Flag,
  HandHeart,
  Home,
  LogOut,
  Menu,
  MessageSquare,
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
import { useMemo, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications(true);
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Overview' },
    { path: '/dashboard/requests', icon: HelpCircle, label: 'Requests' },
    { path: '/dashboard/my-requests', icon: HandHeart, label: 'My Requests' },
    { path: '/dashboard/users', icon: Users, label: 'People' },
    { path: '/dashboard/chats', icon: MessageSquare, label: 'Chats' },
    { path: '/dashboard/notifications', icon: Bell, label: 'Notifications', badge: unreadCount },
  ];

  const pageTitle = useMemo(() => {
    const match = navItems.find((item) =>
      item.path === '/dashboard'
        ? location.pathname === item.path
        : location.pathname.startsWith(item.path)
    );
    return match?.label || 'Dashboard';
  }, [location.pathname, unreadCount]);

  const canGoBack = location.pathname !== '/dashboard';

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

  const renderNavLink = (item, mobile = false) => (
    <Link
      key={item.path}
      to={item.path}
      onClick={() => mobile && setIsMobileSidebarOpen(false)}
      className={cn(
        'group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200',
        isActive(item.path)
          ? 'bg-primary text-primary-foreground shadow-[0_12px_30px_rgba(20,184,166,0.24)]'
          : 'text-sidebar-foreground hover:bg-sidebar-accent/90 hover:text-sidebar-accent-foreground'
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
          isActive(item.path)
            ? 'bg-black/10'
            : 'bg-sidebar-accent text-muted-foreground group-hover:bg-white/60 group-hover:text-foreground'
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

  const sidebarContent = (
    <>
      <div className="px-5 pt-5">
        <Link
          to="/dashboard"
          className="flex items-center gap-3 rounded-3xl border border-sidebar-border/80 bg-sidebar-accent/70 px-4 py-4 shadow-sm"
          onClick={() => setIsMobileSidebarOpen(false)}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 ring-1 ring-primary/10">
            <img src="/logo.png" alt="HYB Logo" className="h-9 w-9 object-contain" />
          </div>
          <div>
            <p className="text-lg font-display font-bold text-sidebar-foreground">HYB</p>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Help Your Buddy</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6 custom-scrollbar">
        {navItems.map((item) => renderNavLink(item, true))}

        {(user?.role === 'admin' || user?.role === 'moderator') && (
          <Link
            to="/dashboard/admin/reports"
            onClick={() => setIsMobileSidebarOpen(false)}
            className={cn(
              'mt-4 flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200',
              location.pathname.startsWith('/dashboard/admin')
                ? 'bg-destructive text-destructive-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/90 hover:text-sidebar-accent-foreground'
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/10">
              <Flag className="h-5 w-5" />
            </div>
            <span className="font-medium">Reports</span>
          </Link>
        )}
      </nav>

      <div className="border-t border-sidebar-border/80 p-4">
        <div className="rounded-3xl border border-sidebar-border/80 bg-sidebar-accent/70 p-4">
          <div className="mb-4 flex items-center gap-3">
            <Avatar className="h-11 w-11 border border-sidebar-border">
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

          <Button
            onClick={() => navigate('/dashboard/requests/create')}
            className="mb-2 h-11 w-full rounded-2xl btn-gradient-primary"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>

          <Button
            variant="ghost"
            className="h-10 w-full justify-start rounded-2xl text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.08),_transparent_28%),radial-gradient(circle_at_right,_rgba(59,130,246,0.08),_transparent_24%)] bg-background">
      <div className="flex min-h-screen">
        <aside className="hidden lg:flex lg:w-80 lg:flex-col lg:border-r lg:border-sidebar-border/80 lg:bg-sidebar/88 lg:backdrop-blur-xl">
          {sidebarContent}
        </aside>

        <AnimatePresence>
          {isMobileSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm lg:hidden"
                onClick={() => setIsMobileSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                className="fixed inset-y-0 left-0 z-50 flex w-[290px] flex-col border-r border-sidebar-border bg-sidebar shadow-2xl lg:hidden"
              >
                <div className="flex items-center justify-between px-4 pt-4">
                  <div className="text-sm font-semibold text-muted-foreground">Navigation</div>
                  <button
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="rounded-xl p-2 text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {sidebarContent}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
            <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-10">
              <div className="flex min-w-0 items-center gap-4">
                <Link
                  to="/dashboard"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-card/70 shadow-sm"
                >
                  <img src="/logo.png" alt="HYB logo" className="h-8 w-8 object-contain" />
                </Link>

                <div className="flex min-w-0 items-center gap-3">
                  {canGoBack && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-10 rounded-full border border-border/70 bg-card/70 px-3 text-muted-foreground hover:text-foreground"
                      onClick={() => navigate(-1)}
                    >
                      <ArrowLeft className="mr-1.5 h-4 w-4" />
                      Back
                    </Button>
                  )}
                  <h1 className="truncate text-2xl font-display font-bold text-foreground">{pageTitle}</h1>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden xl:block relative w-72">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search requests, chats, people..."
                    className="h-11 rounded-2xl border-border/70 bg-card/70 pl-11"
                  />
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-2xl border border-border/70 bg-card/70"
                  onClick={toggleTheme}
                >
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-2xl border border-border/70 bg-card/70"
                  onClick={() => navigate('/dashboard/notifications')}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>

                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="rounded-2xl border border-border/70 bg-card/70 p-2.5 text-muted-foreground transition hover:text-foreground lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-2xl border border-border/70 bg-card/70 p-1.5 transition hover:border-primary/40">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.avatar} alt={user?.fullName} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getInitials(user?.fullName)}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-60 rounded-2xl">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="truncate font-medium">{user?.fullName}</span>
                        <span className="truncate text-xs text-muted-foreground">@{user?.userName}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
