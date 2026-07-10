import React, { useState, useRef, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Bell, LogOut, Settings, User, Menu, X, MessageCircle, Check, Trash2, HelpCircle, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/context/AuthContext"
import { useNotifications } from "@/hooks/useNotifications"
import { AppLogo } from "@/components/ui/AppLogo"

const getNotificationMeta = (type) => {
  switch (type) {
    case 'new_response':
      return { icon: <MessageCircle className="h-3 w-3 text-blue-400" />, bg: 'bg-blue-500/10' };
    case 'response_accepted':
      return { icon: <Check className="h-3 w-3 text-emerald-400" />, bg: 'bg-emerald-500/10' };
    case 'response_rejected':
      return { icon: <Trash2 className="h-3 w-3 text-red-400" />, bg: 'bg-red-500/10' };
    case 'request':
      return { icon: <HelpCircle className="h-3 w-3 text-primary" />, bg: 'bg-primary/10' };
    case 'chat':
      return { icon: <MessageCircle className="h-3 w-3 text-purple-400" />, bg: 'bg-purple-500/10' };
    default:
      return { icon: <Bell className="h-3 w-3 text-muted-foreground" />, bg: 'bg-white/5' };
  }
};

export function Header({ onMobileMenuToggle, isMobileMenuOpen }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const notifDropdownRef = useRef(null)
  const { notifications, unreadCount, isLoading: isLoadingNotifs, markAsRead } = useNotifications(true)

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/dashboard") return "Dashboard Overview";
    if (path.startsWith("/dashboard/requests/create")) return "Create Help Request";
    if (path.startsWith("/dashboard/requests/")) return "Request Details";
    if (path.startsWith("/dashboard/requests")) return "Community Requests";
    if (path.startsWith("/dashboard/my-requests")) return "My Requests";
    if (path.startsWith("/dashboard/chats")) return "Direct Chats";
    if (path.startsWith("/dashboard/global-chat")) return "Community Chat";
    if (path.startsWith("/dashboard/users")) return "Community Members";
    if (path.startsWith("/dashboard/notifications")) return "Notifications";
    if (path.startsWith("/dashboard/settings")) return "Settings";
    if (path.startsWith("/dashboard/admin")) return "Admin Panel";
    return "Help Your Buddy";
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowDropdown(false)
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) setShowNotifDropdown(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-16 lg:h-20 items-center justify-between border-b border-white/5 bg-background/80 px-4 lg:px-8 backdrop-blur-xl">

      {/* Left side — Brand/Page Title */}
      <div className="flex-1 flex items-center gap-4">
        {/* Mobile only: Brand Logo */}
        <div className="lg:hidden">
          <AppLogo to="/dashboard" size="sm" />
        </div>
        
        {/* Desktop only: Dynamic Page Title */}
        <div className="hidden lg:block">
          <h2 className="text-xl font-semibold text-white tracking-tight">
            {getPageTitle()}
          </h2>
        </div>
      </div>

      {/* Right side — actions */}
      <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 ml-auto">

        {/* Notifications Bell */}
        <div className="relative" ref={notifDropdownRef}>
          <button
            onClick={() => { setShowNotifDropdown(!showNotifDropdown); setShowDropdown(false) }}
            className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 rounded-2xl border border-white/10 bg-background/95 backdrop-blur-xl p-4 shadow-2xl z-50 flex flex-col">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                <span className="text-sm font-semibold text-white">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium">
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[300px] pr-1 scrollbar-thin">
                {isLoadingNotifs ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No notifications</p>
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notif) => {
                    const meta = getNotificationMeta(notif.type);
                    return (
                      <div
                        key={notif._id}
                        onClick={async () => {
                          setShowNotifDropdown(false);
                          try {
                            await markAsRead(notif._id);
                          } catch (e) {
                            console.error(e);
                          }
                          
                          const chatId = notif.data?.chatId || notif.data?.chat;
                          if (chatId) {
                            navigate(`/dashboard/chats/${chatId}`);
                          } else {
                            navigate('/dashboard/notifications');
                          }
                        }}
                        className={`flex items-start gap-3 p-2.5 rounded-xl border border-transparent cursor-pointer transition-colors text-left ${
                          !notif.isRead 
                            ? 'bg-primary/5 hover:bg-primary/10' 
                            : 'bg-white/[0.02] hover:bg-white/5'
                        }`}
                      >
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${meta.bg}`}>
                          {meta.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold truncate ${!notif.isRead ? 'text-white' : 'text-muted-foreground'}`}>
                            {notif.title || notif.message}
                          </p>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                            {notif.message}
                          </p>
                          <p className="text-[9px] text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        {!notif.isRead && (
                          <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1 shrink-0" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <button
                onClick={() => { setShowNotifDropdown(false); navigate('/dashboard/notifications') }}
                className="mt-3 w-full rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium py-2 hover:bg-primary/20 transition-colors"
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>

        {/* User Avatar + Dropdown — DESKTOP only */}
        <div className="relative hidden lg:block" ref={dropdownRef}>
          <div
            className="flex items-center gap-3 border-l border-white/10 pl-4 cursor-pointer group"
            onClick={() => { setShowDropdown(!showDropdown); setShowNotifDropdown(false) }}
          >
            <Avatar className="h-9 w-9 transition-transform group-hover:scale-105 border border-white/10">
              <AvatarImage src={user?.avatar} alt={user?.fullName} />
              <AvatarFallback className="text-xs">{user?.fullName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white leading-none">{user?.fullName}</span>
              <span className="text-xs text-muted-foreground mt-1">@{user?.userName}</span>
            </div>
          </div>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-3 w-52 rounded-2xl border border-white/10 bg-background/95 backdrop-blur-xl p-2 shadow-2xl z-50">
              <div className="px-2 py-3 border-b border-white/10 mb-2">
                <p className="text-sm font-medium text-white truncate">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <button onClick={() => { setShowDropdown(false); navigate(`/dashboard/users/${user?.userName}`) }} className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-white transition-colors">
                <User className="h-4 w-4" /> Profile
              </button>
              <button onClick={() => { setShowDropdown(false); navigate('/dashboard/settings') }} className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-white transition-colors">
                <Settings className="h-4 w-4" /> Settings
              </button>
              <button onClick={() => { setShowDropdown(false); logout() }} className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors mt-1">
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger — top-right, replaces profile on mobile */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden flex items-center justify-center h-9 w-9 rounded-xl border border-white/10 bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
    </header>
  )
}
