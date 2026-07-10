import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppLogo } from '@/components/ui/AppLogo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);

  const { login, verifyRegistration, resendVerificationCode } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else if (result.code === 'EMAIL_NOT_VERIFIED') {
      setUnverifiedEmail(result.email || email);
    }
  };

  const handleVerifyFromLogin = async () => {
    if (!unverifiedEmail || !verificationCode.trim()) {
      return;
    }

    setIsVerifyingEmail(true);
    const result = await verifyRegistration(unverifiedEmail, verificationCode.trim());
    setIsVerifyingEmail(false);

    if (result.success) {
      navigate('/dashboard');
    }
  };

  const handleResendFromLogin = async () => {
    if (!unverifiedEmail) return;
    setIsVerifyingEmail(true);
    await resendVerificationCode(unverifiedEmail);
    setIsVerifyingEmail(false);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden p-4">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      {/* Floating Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <div className="rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 bg-white/5 p-6 sm:p-8 md:p-10 shadow-2xl backdrop-blur-2xl">
          {unverifiedEmail ? (
            <div>
              <div className="text-center mb-8">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="flex justify-center mb-6"
                >
                  <AppLogo to="/" size="lg" showName={false} as="div" />
                </motion.div>
                <h1 className="text-3xl font-display font-bold text-white tracking-tight mb-2">Verify Email</h1>
                <p className="text-sm text-muted-foreground">
                  A verification code has been automatically sent to <span className="text-white font-medium">{unverifiedEmail}</span>. Enter it below to sign in.
                </p>
              </div>

              <div className="space-y-5">
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    type="text"
                    placeholder="Enter 6-digit code"
                    className="pl-12 h-12 bg-white/5 border-white/10 rounded-2xl focus:bg-white/10 transition-all text-base text-center tracking-[0.3em] font-mono font-bold"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                    required
                    disabled={isVerifyingEmail}
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    className="flex-1 h-12 rounded-2xl text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" 
                    onClick={handleVerifyFromLogin}
                    disabled={isVerifyingEmail || verificationCode.length < 6}
                  >
                    {isVerifyingEmail ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                    Verify Email
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    className="h-12 rounded-2xl border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm"
                    onClick={handleResendFromLogin}
                    disabled={isVerifyingEmail}
                  >
                    Resend
                  </Button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setUnverifiedEmail('');
                    setVerificationCode('');
                  }}
                  className="w-full text-center text-sm font-medium text-muted-foreground hover:text-white transition-colors pt-2"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                  className="flex justify-center mb-6"
                >
                  <AppLogo to="/" size="lg" showName={false} as="div" />
                </motion.div>
                <h1 className="text-3xl font-display font-bold text-white tracking-tight mb-1">Welcome Back</h1>
                <p className="text-sm text-muted-foreground">
                  Sign in to continue to <span className="text-white font-medium">Help Your Buddy</span>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                      type="email"
                      placeholder="Email address"
                      className="pl-12 h-12 bg-white/5 border-white/10 rounded-2xl focus:bg-white/10 transition-all text-base"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      className="pl-12 pr-12 h-12 bg-white/5 border-white/10 rounded-2xl focus:bg-white/10 transition-all text-base"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
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

                <div className="flex items-center justify-between px-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input type="checkbox" className="peer sr-only" />
                      <div className="h-5 w-5 rounded-md border border-white/20 bg-white/5 peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                        <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground group-hover:text-white transition-colors">Remember me</span>
                  </label>
                  <Link 
                    to="/forgot-password" 
                    state={{ email }}
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button type="submit" className="w-full h-12 rounded-2xl text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  Sign In
                  {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-center mt-8 text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-white hover:text-primary transition-colors">
            Create one now
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
