import React from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { HelpCircle, MessageSquare, Plus, Sparkles, Zap, Users, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/context/AuthContext"
import api from "@/api/axios"

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Community-wide active request count (open + in-progress)
  const { data: statsData } = useQuery({
    queryKey: ['request-stats'],
    queryFn: () => api.get('/req/stats').then((res) => res.data.data),
  })

  const { data: myChatsData } = useQuery({
    queryKey: ['my-chats-count'],
    queryFn: () => api.get('/chat').then((res) => res.data.data),
  })

  const activeRequestsCount = statsData?.activeRequests ?? 0;
  const openChatsCount = myChatsData?.chats?.length || 0;

  const overviewCards = [
    {
      label: "Active Requests",
      value: activeRequestsCount,
      icon: HelpCircle,
      accent: "from-blue-500/20 to-cyan-500/5 border-blue-500/20",
      iconBg: "bg-blue-500/20 text-blue-400",
      glow: "bg-blue-500/20",
      path: "/dashboard/requests",
    },
    {
      label: "Open Chats",
      value: openChatsCount,
      icon: MessageSquare,
      accent: "from-purple-500/20 to-pink-500/5 border-purple-500/20",
      iconBg: "bg-purple-500/20 text-purple-400",
      glow: "bg-purple-500/20",
      path: "/dashboard/chats",
    },
  ]

  const quickActions = [
    {
      title: "Create Request",
      description: "Ask for help with a clear title.",
      icon: Plus,
      accent: "from-primary/20 to-primary/5 border-primary/20",
      iconBg: "bg-primary/20 text-primary",
      glow: "bg-primary/20",
      path: "/dashboard/requests/create",
    },
    {
      title: "Community",
      description: "Find and message students.",
      icon: Users,
      accent: "from-emerald-500/20 to-teal-500/5 border-emerald-500/20",
      iconBg: "bg-emerald-500/20 text-emerald-400",
      glow: "bg-emerald-500/20",
      path: "/dashboard/users",
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <motion.section
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl sm:rounded-[2.5rem] border border-white/10 bg-white/5 p-5 sm:p-8 lg:p-12 shadow-2xl backdrop-blur-xl"
      >
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-[80px]" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-purple-500/20 blur-[80px]" />
        
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <Badge variant="glass" className="mb-4 rounded-full px-3 py-1 text-xs sm:text-sm">
              <Sparkles className="mr-1.5 h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              Community Workspace
            </Badge>
            <h1 className="mb-3 text-2xl sm:text-4xl font-display font-bold tracking-tight text-white lg:text-5xl">
              Welcome back, {user?.fullName?.split(' ')[0] || 'User'}
            </h1>
            <p className="text-sm sm:text-lg leading-relaxed text-muted-foreground">
              Keep up with your requests and conversations without the clutter.
            </p>
          </div>

          <div 
            onClick={() => navigate(`/dashboard/users/${user?.userName}`)}
            className="flex items-center gap-3 sm:gap-4 rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4 backdrop-blur-md cursor-pointer hover:bg-white/10 transition-colors group w-full lg:w-auto"
          >
            <Avatar className="h-12 w-12 sm:h-16 sm:w-16 border-2 border-primary/20 group-hover:border-primary/50 transition-colors shrink-0">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>{user?.fullName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="text-base sm:text-xl font-display font-semibold text-white truncate">{user?.fullName}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">@{user?.userName}</div>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs sm:text-sm font-medium text-primary">
                <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {user?.helpCount || 0} Help Count
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Grid Layout */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4"
      >
        {/* Overview Stats */}
        {overviewCards.map((card, i) => (
          <motion.div key={i} variants={itemVariants} className="h-full">
            <Card 
              onClick={() => navigate(card.path)}
              className={`group relative h-full cursor-pointer overflow-hidden border bg-gradient-to-br ${card.accent} transition-all duration-500 hover:scale-[1.02] hover:shadow-xl`}
            >
              <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full ${card.glow} blur-3xl opacity-50 transition-opacity group-hover:opacity-100`} />
              <CardContent className="flex flex-col items-center justify-center p-8 text-center h-full relative z-10">
                <div className="mb-4 text-5xl font-display font-bold text-white tracking-tight">
                  {card.value}
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* Quick Actions */}
        {quickActions.map((action, i) => (
          <motion.div key={i} variants={itemVariants} className="h-full">
            <Card 
              onClick={() => navigate(action.path)}
              className={`group relative h-full cursor-pointer overflow-hidden border bg-gradient-to-br ${action.accent} transition-all duration-500 hover:scale-[1.02] hover:shadow-xl`}
            >
              <div className={`absolute -left-8 -bottom-8 h-32 w-32 rounded-full ${action.glow} blur-3xl opacity-50 transition-opacity group-hover:opacity-100`} />
              <CardContent className="flex flex-col p-6 h-full justify-between relative z-10">
                <div>
                  <div className={`mb-4 inline-flex rounded-xl p-3 ${action.iconBg}`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-display font-semibold text-white">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
                <div className="mt-6 flex items-center text-sm font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  Get started <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.section>
    </div>
  )
}
