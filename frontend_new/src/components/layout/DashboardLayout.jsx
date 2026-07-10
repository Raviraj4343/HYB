import React, { useState, useEffect } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import { Sidebar, MobileBottomNav } from "./Sidebar"
import { Header } from "./Header"
import { useSocket } from "@/context/SocketContext"
import { toast } from "sonner"
import { Bell, MessageCircle, CheckCircle2, ThumbsDown, HelpCircle } from "lucide-react"

// Map backend notification types → icon + accent color
const NOTIF_META = {
  new_response:      { icon: MessageCircle, color: "text-blue-400",    bg: "bg-blue-500/15",     label: "New Help Offer" },
  response_accepted: { icon: CheckCircle2,  color: "text-emerald-400", bg: "bg-emerald-500/15",  label: "Help Accepted" },
  response_rejected: { icon: ThumbsDown,    color: "text-red-400",     bg: "bg-red-500/15",      label: "Help Declined" },
  request:           { icon: HelpCircle,    color: "text-primary",     bg: "bg-primary/15",      label: "Request Update" },
  chat:              { icon: MessageCircle, color: "text-purple-400",  bg: "bg-purple-500/15",   label: "New Message" },
}

// Real-time notification listener — shows a toast on socket `notification:new`
function GlobalNotificationListener() {
  const { socket } = useSocket()
  const navigate   = useNavigate()

  useEffect(() => {
    if (!socket) return

    const handleNew = ({ notification }) => {
      const meta = NOTIF_META[notification?.type] || {
        icon: Bell, color: "text-muted-foreground", bg: "bg-white/10", label: "Notification"
      }
      const Icon = meta.icon

      toast.custom(
        (t) => (
          <div
            className="flex items-start gap-3 w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a1a2e]/95 backdrop-blur-xl px-4 py-3 shadow-2xl shadow-black/40 cursor-pointer"
            onClick={() => {
              toast.dismiss(t)
              // Navigate to request detail if a request is attached
              const reqId = notification?.request?._id || notification?.request
              if (reqId) navigate(`/dashboard/requests/${reqId}`)
              else navigate("/dashboard/notifications")
            }}
          >
            {/* Icon badge */}
            <div className={`mt-0.5 h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${meta.bg}`}>
              <Icon className={`h-4 w-4 ${meta.color}`} />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {meta.label}
              </p>
              <p className="text-sm font-medium text-white leading-snug mt-0.5">
                {notification?.title || "New notification"}
              </p>
              {notification?.message && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {notification.message}
                </p>
              )}
              {notification?.request?.title && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  📋 {notification.request.title}
                </p>
              )}
            </div>

            {/* Dismiss */}
            <button
              className="text-muted-foreground hover:text-white transition-colors mt-0.5 text-lg leading-none"
              onClick={(e) => { e.stopPropagation(); toast.dismiss(t) }}
            >
              ×
            </button>
          </div>
        ),
        { duration: 6000, position: "top-right" }
      )
    }

    socket.on("notification:new", handleNew)
    return () => socket.off("notification:new", handleNew)
  }, [socket, navigate])

  return null
}

export default function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Global real-time notification toast listener */}
      <GlobalNotificationListener />

      {/* Sidebar (desktop fixed + mobile drawer) */}
      <Sidebar onMobileMenuToggle={toggleMobileMenu} isMobileMenuOpen={isMobileMenuOpen} />

      {/* Main Content Area */}
      <div className="lg:pl-72 flex flex-col min-h-screen transition-all">
        <Header onMobileMenuToggle={toggleMobileMenu} isMobileMenuOpen={isMobileMenuOpen} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden pb-24 lg:pb-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  )
}
