import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'

// Contexts
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'

// Route Guards
import ProtectedRoute from './routes/ProtectedRoute'
import PublicRoute from './routes/PublicRoute'

// Layouts & Pages
import DashboardLayout from './components/layout/DashboardLayout'
import Dashboard from './pages/dashboard/Dashboard'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import RequestsList from './pages/dashboard/RequestsList'
import CreateRequest from './pages/dashboard/CreateRequest'
import RequestDetail from './pages/dashboard/RequestDetail'
import MyRequests from './pages/dashboard/MyRequests'
import Chats from './pages/dashboard/Chats'
import ChatRoom from './pages/dashboard/ChatRoom'
import UserSearch from './pages/dashboard/UserSearch'
import UserProfile from './pages/dashboard/UserProfile'
import Settings from './pages/dashboard/Settings'
import Landing from './pages/Landing'
import GlobalChat from './pages/dashboard/GlobalChat'
import Notifications from './pages/dashboard/Notifications'
import AdminPanel from './pages/dashboard/AdminPanel'
import Marketplace from './pages/dashboard/Marketplace'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster
        position="top-right"
        theme="dark"
        closeButton
        toastOptions={{
          style: {
            background: 'rgba(26, 26, 46, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '1.25rem',
            color: '#fff',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          },
          classNames: {
            error: '!border-red-500/30 !bg-red-500/10 !text-red-200',
            success: '!border-emerald-500/30 !bg-emerald-500/10 !text-emerald-200',
            info: '!border-blue-500/30 !bg-blue-500/10 !text-blue-200',
            warning: '!border-yellow-500/30 !bg-yellow-500/10 !text-yellow-200',
          }
        }}
      />
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              
              {/* Auth Routes */}
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
              
              {/* Dashboard Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="requests" element={<RequestsList />} />
                <Route path="requests/create" element={<CreateRequest />} />
                <Route path="requests/:id" element={<RequestDetail />} />
                <Route path="my-requests" element={<MyRequests />} />
                <Route path="chats" element={<Chats />} />
                <Route path="chats/:id" element={<ChatRoom />} />
                <Route path="users" element={<UserSearch />} />
                <Route path="users/:userName" element={<UserProfile />} />
                <Route path="settings" element={<Settings />} />
                <Route path="global-chat" element={<GlobalChat />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="marketplace" element={<Marketplace />} />
                <Route path="admin" element={<AdminPanel />} />
              </Route>

              <Route path="*" element={<div className="text-white p-8">404 - Not Found</div>} />
            </Routes>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
