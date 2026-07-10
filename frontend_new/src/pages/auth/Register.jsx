import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff,
  ShieldCheck, RefreshCw, CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppLogo } from '@/components/ui/AppLogo';

// ── 6-box OTP component ──────────────────────────────────────────
function OtpInput({ value, onChange, disabled }) {
  const inputRefs = useRef([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[idx]) {
        const next = [...digits];
        next[idx] = '';
        onChange(next.join(''));
      } else if (idx > 0) {
        const next = [...digits];
        next[idx - 1] = '';
        onChange(next.join(''));
        inputRefs.current[idx - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleChange = (e, idx) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) return;
    // Handle paste of full code
    if (raw.length > 1) {
      const trimmed = raw.slice(0, 6);
      onChange(trimmed.padEnd(6, '').slice(0, 6));
      inputRefs.current[Math.min(trimmed.length, 5)]?.focus();
      return;
    }
    const next = [...digits];
    next[idx] = raw[0];
    onChange(next.join(''));
    if (idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted.padEnd(6, ' ').trim().slice(0, 6));
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  return (
    <div className="flex gap-3 justify-center">
      {digits.map((digit, idx) => (
        <motion.div
          key={idx}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: idx * 0.05 }}
        >
          <input
            ref={(el) => (inputRefs.current[idx] = el)}
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={digit}
            disabled={disabled}
            onChange={(e) => handleChange(e, idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={`
              w-12 h-14 text-center text-xl font-bold rounded-2xl
              border-2 bg-white/5 text-white outline-none transition-all duration-150
              ${digit ? 'border-primary shadow-[0_0_16px_0_hsl(var(--primary)/0.35)]' : 'border-white/15'}
              focus:border-primary focus:shadow-[0_0_16px_0_hsl(var(--primary)/0.4)]
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          />
        </motion.div>
      ))}
    </div>
  );
}

// ── Main Register page ───────────────────────────────────────────
export default function Register() {
  const [step, setStep] = useState('form'); // 'form' | 'verify' | 'success'
  const [formData, setFormData] = useState({
    fullName: '', userName: '', email: '', password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const { register, verifyRegistration, resendVerificationCode } = useAuth();
  const navigate = useNavigate();

  // Cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // Step 1: Register
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await register(formData);
    setIsLoading(false);
    if (result.success) {
      setPendingEmail(result.email || formData.email);
      setStep('verify');
      setResendCooldown(60);
    }
  };

  // Step 2: Verify OTP
  const handleVerify = async () => {
    if (otpCode.replace(/\s/g, '').length < 6) return;
    setIsLoading(true);
    const result = await verifyRegistration(pendingEmail, otpCode.trim());
    setIsLoading(false);
    if (result.success) {
      setStep('success');
      setTimeout(() => navigate('/dashboard'), 1200);
    } else {
      setOtpCode('');
    }
  };

  // Trigger verify automatically when 6 digits entered
  useEffect(() => {
    if (step === 'verify' && otpCode.replace(/\s/g, '').length === 6) {
      handleVerify();
    }
  }, [otpCode]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    await resendVerificationCode(pendingEmail);
    setResendCooldown(60);
    setOtpCode('');
  };

  // ── Background blobs (shared) ────────────────────────────────
  const Bg = () => (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-pink-500/15 rounded-full mix-blend-screen filter blur-[120px] animate-pulse" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-purple-500/15 rounded-full mix-blend-screen filter blur-[120px] animate-pulse delay-700" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
    </div>
  );

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden p-4">
      <Bg />

      <AnimatePresence mode="wait">

        {/* ── Step 1: Registration Form ── */}
        {step === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-[480px]"
          >
            <div className="rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 bg-white/5 p-6 sm:p-8 md:p-10 shadow-2xl backdrop-blur-2xl">
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                  className="flex justify-center mb-6"
                >
                  <AppLogo to="/" size="lg" showName={false} as="div" />
                </motion.div>
                <h1 className="text-3xl font-display font-bold text-white tracking-tight mb-1">
                  Create Account
                </h1>
                <p className="text-sm text-muted-foreground">
                  Join the <span className="text-white font-medium">Help Your Buddy</span> community
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                      type="text"
                      name="fullName"
                      placeholder="Full Name"
                      className="pl-12 h-12 bg-white/5 border-white/10 rounded-2xl focus:bg-white/10 transition-all text-base"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                      type="text"
                      name="userName"
                      placeholder="Username"
                      className="pl-12 h-12 bg-white/5 border-white/10 rounded-2xl focus:bg-white/10 transition-all text-base"
                      value={formData.userName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    className="pl-12 h-12 bg-white/5 border-white/10 rounded-2xl focus:bg-white/10 transition-all text-base"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Password"
                    className="pl-12 pr-12 h-12 bg-white/5 border-white/10 rounded-2xl focus:bg-white/10 transition-all text-base"
                    value={formData.password}
                    onChange={handleChange}
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

                <Button
                  type="submit"
                  className="w-full h-12 rounded-2xl text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all mt-4"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  Sign Up
                  {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
                </Button>
              </form>
            </div>

            <p className="text-center mt-8 text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-white hover:text-primary transition-colors">
                Sign in instead
              </Link>
            </p>
          </motion.div>
        )}

        {/* ── Step 2: OTP Verification ── */}
        {step === 'verify' && (
          <motion.div
            key="verify"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-[460px]"
          >
            <div className="rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 bg-white/5 p-8 md:p-10 shadow-2xl backdrop-blur-2xl text-center space-y-8">
              {/* Icon */}
              <div className="flex justify-center">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center"
                >
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </motion.div>
              </div>

              {/* Text */}
              <div>
                <h1 className="text-2xl font-display font-bold text-white mb-2">
                  Verify your email
                </h1>
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit code to
                </p>
                <p className="text-sm font-semibold text-white mt-1">{pendingEmail}</p>
              </div>

              {/* OTP boxes */}
              <OtpInput
                value={otpCode}
                onChange={setOtpCode}
                disabled={isLoading}
              />

              {/* Verify button */}
              <Button
                className="w-full h-12 rounded-2xl text-base shadow-lg shadow-primary/20"
                onClick={handleVerify}
                disabled={isLoading || otpCode.replace(/\s/g, '').length < 6}
              >
                {isLoading
                  ? <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  : <ShieldCheck className="mr-2 h-5 w-5" />
                }
                {isLoading ? 'Verifying…' : 'Verify & Sign In'}
              </Button>

              {/* Resend */}
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="text-muted-foreground">Didn't receive it?</span>
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className="flex items-center gap-1 font-semibold text-white hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>

              {/* Back */}
              <button
                onClick={() => { setStep('form'); setOtpCode(''); }}
                className="text-xs text-muted-foreground hover:text-white transition-colors"
              >
                ← Back to registration
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Success flash ── */}
        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative z-10 flex flex-col items-center gap-6 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center"
            >
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold text-white">You're in! 🎉</h2>
              <p className="text-sm text-muted-foreground mt-2">Redirecting to your dashboard…</p>
            </div>
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
