import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Context
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { ThemeProvider } from "./context/ThemeContext";

// Route Guards
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import AdminRoute from "./routes/AdminRoute";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Profile from "./pages/dashboard/Profile";

// Dashboard
import DashboardLayout from "./components/layout/DashboardLayout";
import Dashboard from "./pages/dashboard/Dashboard";
import RequestsList from "./pages/dashboard/RequestsList";
import CreateRequest from "./pages/dashboard/CreateRequest";
import RequestDetail from "./pages/dashboard/RequestDetail";
import MyRequests from "./pages/dashboard/MyRequests";
import Settings from "./pages/dashboard/Settings";
import Notifications from "./pages/dashboard/Notifications";
import Chats from "./pages/dashboard/Chats";
import ChatRoom from "./pages/dashboard/ChatRoom";
import UserSearch from "./pages/dashboard/UserSearch";
import UserProfile from "./pages/dashboard/UserProfile";
import Reports from "./pages/dashboard/Reports";
import CreateReport from "./pages/dashboard/CreateReport";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="bottom-center" richColors />
        <BrowserRouter>
          <AuthProvider>
            <SocketProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Index />} />

                {/* Auth Routes */}
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

                {/* Protected Dashboard Routes */}
                <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                  <Route index element={<Dashboard />} />
                  <Route path="requests" element={<RequestsList />} />
                  <Route path="requests/create" element={<CreateRequest />} />
                  <Route path="requests/:id" element={<RequestDetail />} />
                  <Route path="my-requests" element={<MyRequests />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="chats" element={<Chats />} />
                  <Route path="chats/:id" element={<ChatRoom />} />
                  <Route path="users" element={<UserSearch />} />
                  <Route path="users/:userName" element={<UserProfile />} />
                  <Route
                      path="report"
                      element={
                        <ProtectedRoute>
                          <CreateReport />
                        </ProtectedRoute>
                      }
                    />
                  <Route path="profile" element={<Profile />} />
                  
                  {/* Admin Only Routes */}
                  <Route path="admin/reports" element={
                    <AdminRoute><Reports /></AdminRoute>
                  } />
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SocketProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
