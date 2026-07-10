import React, { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { LayoutDashboard, MessageSquare, Plus, Settings, Users, Globe, HelpCircle, Bell, X, Menu, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { AppLogo } from "@/components/ui/AppLogo"
import { useAuth } from "@/context/AuthContext"

const navItems = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { title: "My Requests", path: "/dashboard/my-requests", icon: HelpCircle },
  { title: "Direct Chats", path: "/dashboard/chats", icon: MessageSquare },
  { title: "Community Chat", path: "/dashboard/global-chat", icon: Globe },
  { title: "Community", path: "/dashboard/users", icon: Users },
  { title: "Notifications", path: "/dashboard/notifications", icon: Bell },
  { title: "Settings", path: "/dashboard/settings", icon: Settings },
]

// Bottom nav items for mobile (max 5)
const mobileNavItems = [
  { title: "Home", path: "/dashboard", icon: LayoutDashboard },
  { title: "Requests", path: "/dashboard/my-requests", icon: HelpCircle },
  { title: "Chats", path: "/dashboard/chats", icon: MessageSquare },
  { title: "Community", path: "/dashboard/users", icon: Users },
  { title: "More", path: null, icon: Menu }, // triggers drawer
]

export function Sidebar({ onMobileMenuToggle, isMobileMenuOpen }) {

  const location = useLocation()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  const allNavItems = [
    ...navItems,
    ...(isAdmin ? [{ title: 'Admin Panel', path: '/dashboard/admin', icon: Shield, adminOnly: true }] : [])
  ]

  const SidebarContent = ({ onClose }) => (
    <>
      {/* Logo */}
      <div className="flex h-20 items-center px-6 border-b border-white/5">
        <AppLogo to="/dashboard" size="md" />
        {onClose && (
          <button onClick={onClose} className="ml-auto text-muted-foreground hover:text-white p-1">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-6 px-4">
        <div className="mb-4 px-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Menu</p>
        </div>
        <nav className="space-y-1">
          {allNavItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
            return (
              <Link key={item.path} to={item.path} className="relative block" onClick={onClose}>
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className={cn(
                      "absolute inset-0 rounded-xl border",
                      item.adminOnly
                        ? 'bg-red-500/10 border-red-500/20'
                        : 'bg-primary/15 border-primary/20'
                    )}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div className={cn(
                  "relative flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-colors hover:text-white",
                  isActive ? "text-white" : "text-muted-foreground hover:bg-white/5",
                  item.adminOnly && !isActive && 'hover:text-red-400'
                )}>
                  <item.icon className={cn(
                    "h-5 w-5 shrink-0",
                    isActive
                      ? (item.adminOnly ? 'text-red-400' : 'text-primary')
                      : 'text-muted-foreground'
                  )} />
                  {item.title}
                  {item.adminOnly && (
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Bottom CTA */}
      <div className="p-4 border-t border-white/5">
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 p-4 border border-primary/20">
          <h4 className="font-semibold text-white mb-1 text-sm">Need Help?</h4>
          <p className="text-xs text-muted-foreground mb-3">Post a request and get community help.</p>
          <Link
            to="/dashboard/requests/create"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary/90 shadow-md shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            New Request
          </Link>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 flex-col border-r border-white/5 bg-background/80 backdrop-blur-xl lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileMenuToggle}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 h-screen w-72 flex-col border-r border-white/5 bg-background/95 backdrop-blur-xl flex lg:hidden"
            >
              <SidebarContent onClose={onMobileMenuToggle} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export function MobileBottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-white/10 bg-background/90 backdrop-blur-xl px-2 py-2 lg:hidden safe-area-pb">
      {mobileNavItems.map((item) => {
        if (item.path === null) return null // "More" is handled by the drawer button in Header
        const isActive = location.pathname === item.path ||
          (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all text-xs font-medium",
              isActive ? "text-primary" : "text-muted-foreground hover:text-white"
            )}
          >
            <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
            <span>{item.title}</span>
          </Link>
        )
      })}
    </nav>
  )
}
