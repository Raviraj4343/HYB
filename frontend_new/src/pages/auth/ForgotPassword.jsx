import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, Key, Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';

export default function ForgotPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const { requestPasswordReset, resetPassword } = useAuth();

  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    const result = await requestPasswordReset(email);
    setIsLoading(false);
    if (result.success) {
      setIsSent(true);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email || !code || !newPassword) return;
    setIsLoading(true);
    const result = await resetPassword(email, code.trim(), newPassword);
    setIsLoading(false);
    if (result.success) {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-8 bg-background relative overflow-hidden">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>
      
      <Link to="/login" className="absolute top-8 left-8 flex items-center text-sm font-medium text-muted-foreground hover:text-white transition-colors z-10">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Login
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 border border-white/10 shadow-xl">
            <Key className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-display font-bold text-white tracking-tight">
            {isSent ? 'Enter Reset Details' : 'Reset Password'}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {isSent 
              ? `A 6-digit code has been sent to ${email}. Please enter it and choose a new password.`
              : "Enter your email address and we'll send you a 6-digit code to reset your password."
            }
          </p>
        </div>

        {isSent ? (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="space-y-4">
              {/* Code input */}
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
                  className="pl-12 h-12 bg-white/5 border-white/10 rounded-2xl focus:bg-white/10 transition-all text-base text-center tracking-[0.3em] font-mono font-bold"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Password input */}
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New Password"
                  className="pl-12 pr-12 h-12 bg-white/5 border-white/10 rounded-2xl focus:bg-white/10 transition-all text-base"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 rounded-2xl text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" disabled={isLoading || code.length < 6}>
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              Reset Password
            </Button>

            <button
              type="button"
              onClick={() => {
                setIsSent(false);
                setCode('');
                setNewPassword('');
              }}
              className="w-full text-center text-sm font-medium text-muted-foreground hover:text-white transition-colors pt-2"
            >
              Try another email
            </button>
          </form>
        ) : (
          <form onSubmit={handleSendCode} className="space-y-6">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                type="email"
                placeholder="Email address"
                className="pl-12 h-12 bg-white/5 border-white/10 rounded-2xl focus:bg-white/10 transition-all text-base"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full h-12 rounded-2xl text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              Send Reset Code
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
