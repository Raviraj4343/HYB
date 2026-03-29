import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api, { getStoredUser } from '../../api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [stage, setStage] = useState(0); // 0 = request code, 1 = reset
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const prefilledEmail = location.state?.email;
    const storedEmail = getStoredUser()?.email;
    const nextEmail = [prefilledEmail, storedEmail].find(
      (value) => typeof value === 'string' && value.trim()
    );

    if (nextEmail) {
      setEmail(nextEmail.trim().toLowerCase());
    }
  }, [location.state]);

  const normalizedSubmittedEmail = submittedEmail || email.trim().toLowerCase();

  const maskEmail = (value) => {
    if (!value || !value.includes('@')) return value;

    const [localPart, domain] = value.split('@');
    if (localPart.length <= 2) {
      return `${localPart[0] || ''}***@${domain}`;
    }

    return `${localPart.slice(0, 2)}${'*'.repeat(Math.max(localPart.length - 2, 3))}@${domain}`;
  };

  const requestCode = async (e) => {
    e?.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return toast.error('Please enter your registered email');
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) return toast.error('Please enter a valid email address');
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: normalizedEmail });
      setEmail(normalizedEmail);
      setSubmittedEmail(normalizedEmail);
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('If that email exists, a verification code was sent to the registered email');
      setStage(1);
    } catch (err) {
      toast.error(err.data?.message || err.response?.data?.message || err.message || 'Failed to send code');
    } finally { setIsLoading(false); }
  };

  const reset = async (e) => {
    e.preventDefault();
    if (!code.trim() || !newPassword || !confirmPassword) {
      return toast.error('Please provide the code and both password fields');
    }
    if (newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    if (newPassword !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setIsLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email: normalizedSubmittedEmail,
        code: code.trim(),
        newPassword
      });
      toast.success('Password reset successful');
      // Optionally save tokens and redirect
      const { accessToken, refreshToken, user } = res.data.data || {};
      if (accessToken) localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      if (user) localStorage.setItem('user', JSON.stringify(user));
      navigate('/login');
    } catch (err) {
      toast.error(err.data?.message || err.response?.data?.message || err.message || 'Reset failed');
    } finally { setIsLoading(false); }
  };

  const passwordChecks = [
    { label: 'At least 6 characters', valid: newPassword.length >= 6 },
    { label: 'Passwords match', valid: !!newPassword && !!confirmPassword && newPassword === confirmPassword },
  ];

  const inputClassName =
    "h-12 rounded-xl border-border/70 !bg-[#151b24] !text-foreground placeholder:!text-slate-400 pr-12 pl-11 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-0";

  const inputStyle = {
    backgroundColor: '#151b24',
    color: 'hsl(var(--foreground))',
    WebkitTextFillColor: 'hsl(var(--foreground))',
    caretColor: 'hsl(var(--foreground))',
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.14),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.10),_transparent_30%)]" />
      <motion.div
        className="relative mx-auto w-full max-w-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="mb-5 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 shadow-lg shadow-primary/10">
            <img
              src="/logo.png"
              alt="HYB logo"
              className="h-8 w-8 object-contain"
            />
          </div>
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary/80">Account Recovery</p>
            <h1 className="text-2xl font-display font-bold text-foreground">Reset your password</h1>
          </div>
        </div>

        <Card className="border border-white/10 bg-card/95 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-4 pb-3">
            <div className="flex items-center justify-between gap-4">
              {[0, 1].map((step) => {
                const isActive = stage === step;
                const isCompleted = stage > step;
                return (
                  <div key={step} className="flex flex-1 items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition ${
                        isCompleted
                          ? 'border-primary bg-primary text-primary-foreground'
                          : isActive
                            ? 'border-primary/60 bg-primary/15 text-primary'
                            : 'border-border bg-muted/40 text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : step + 1}
                    </div>
                    <p className="min-w-0 text-sm font-medium text-foreground">
                      {step === 0 ? 'Verify email' : 'Create password'}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3">
              <CardTitle className="text-xl">
                {stage === 0 ? 'Use your registered email' : 'Enter code and new password'}
              </CardTitle>
              <CardDescription className="mt-1 text-sm leading-6">
                {stage === 0
                  ? 'We will send a code to your account email.'
                  : `Code sent to ${maskEmail(normalizedSubmittedEmail)}.`}
              </CardDescription>
            </div>
          </CardHeader>

          {stage === 0 ? (
            <form onSubmit={requestCode}>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Registered Email</p>
                      <p className="text-sm text-muted-foreground">
                        {email ? maskEmail(email) : 'Email address linked to your account'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-12 rounded-xl border-border/70 !bg-[#151b24] !text-foreground placeholder:!text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-0"
                      disabled={isLoading}
                      autoComplete="email"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-3">
                <Button type="submit" className="h-12 w-full rounded-xl btn-gradient-primary" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Send verification code
                    </>
                  )}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => navigate('/login')}>
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </Button>
              </CardFooter>
            </form>
          ) : (
            <form onSubmit={reset}>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">Verification email sent</p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{normalizedSubmittedEmail}</span>
                      </p>
                      <div className="flex flex-wrap gap-3 pt-1">
                        <button
                          type="button"
                          onClick={requestCode}
                          className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:text-primary/80"
                          disabled={isLoading}
                        >
                          <RefreshCw className="h-4 w-4" />
                          Resend code
                        </button>
                        <button
                          type="button"
                          onClick={() => setStage(0)}
                          className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
                          disabled={isLoading}
                        >
                          Change email
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Enter the 6-digit code"
                      className={`${inputClassName} tracking-[0.2em]`}
                      disabled={isLoading}
                      autoComplete="one-time-code"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Create a new password"
                      className={inputClassName}
                      disabled={isLoading}
                      autoComplete="new-password"
                      style={inputStyle}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((value) => !value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      className={inputClassName}
                      disabled={isLoading}
                      autoComplete="new-password"
                      style={inputStyle}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <div className="space-y-2">
                    {passwordChecks.map((check) => (
                      <div key={check.label} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className={`h-4 w-4 ${check.valid ? 'text-emerald-400' : 'text-muted-foreground/50'}`} />
                        <span className={check.valid ? 'text-foreground' : 'text-muted-foreground'}>
                          {check.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-3 sm:flex-row">
                <Button type="button" variant="secondary" className="h-12 w-full rounded-xl sm:w-auto" onClick={() => setStage(0)}>
                  Back
                </Button>
                <Button type="submit" className="h-12 w-full rounded-xl btn-gradient-primary sm:flex-1" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset password'
                  )}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
