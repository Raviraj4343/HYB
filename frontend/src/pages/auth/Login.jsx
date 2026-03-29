import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Eye, EyeOff, Loader2, Mail, Lock, Users, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const navigate = useNavigate();
  const { login, verifyRegistration, resendVerificationCode } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'email' && unverifiedEmail) {
      setUnverifiedEmail('');
      setVerificationCode('');
    }
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    const result = await login(formData.email, formData.password);
    setIsLoading(false);
    
    if (result.success) {
      navigate('/dashboard');
      return;
    }

    if (result.code === 'EMAIL_NOT_VERIFIED') {
      setUnverifiedEmail(result.email || formData.email.trim().toLowerCase());
    }
  };

  const handleVerifyFromLogin = async () => {
    if (!unverifiedEmail || !verificationCode.trim()) {
      setErrors((prev) => ({ ...prev, verificationCode: 'Verification code is required' }));
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
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Floating shapes */}
        <motion.div 
          className="absolute top-20 left-20 w-32 h-32 rounded-full bg-white/10 backdrop-blur-sm"
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-40 right-20 w-48 h-48 rounded-full bg-white/10 backdrop-blur-sm"
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/3 w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm"
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <img
                src="/logo.png"
                alt="HYB logo"
                className="w-12 h-12 object-contain"
              />
              <span className="text-2xl font-bold text-primary">
                HYB
              </span>
            </div>        
            <h1 className="text-5xl font-display font-bold leading-tight mb-6">
              Help Your<br />Buddy
            </h1>
            
            <p className="text-xl text-white/80 mb-12 max-w-md">
              A community where students help each other through shared knowledge and support.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Community Support</h3>
                  <p className="text-white/70">Get help from fellow students</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Real-time Chat</h3>
                  <p className="text-white/70">Connect and communicate instantly</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
              <img
                src="/logo.png"
                alt="HYB logo"
                className="w-11 h-11 object-contain"
              />
              {/* <span className="text-3xl font-display font-bold gradient-text">
                HYB
              </span> */}
            </div>


          <Card className="rounded-2xl border border-border/60 bg-card/95 shadow-2xl backdrop-blur">
            <CardHeader className="space-y-4 pb-4">
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-full px-3 text-muted-foreground hover:text-foreground"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
                <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  HYB
                </div>
              </div>

              <div className="text-center">
                <CardTitle className="text-2xl font-display">Welcome back</CardTitle>
              <CardDescription>
                Sign in to your account to continue
              </CardDescription>
              </div>
            </CardHeader>
            
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10 h-11"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-11"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col gap-4">
                <Button 
                  type="submit" 
                  className="w-full h-11 btn-gradient-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </Button>

                {unverifiedEmail && (
                  <div className="w-full rounded-2xl border border-primary/20 bg-primary/5 p-4 text-left">
                    <p className="text-sm font-medium text-foreground">Email verification required</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Finish verifying <span className="font-medium text-foreground">{unverifiedEmail}</span> to sign in.
                    </p>
                    <div className="mt-3 space-y-3">
                      <Input
                        value={verificationCode}
                        onChange={(e) => {
                          setVerificationCode(e.target.value);
                          if (errors.verificationCode) {
                            setErrors((prev) => ({ ...prev, verificationCode: '' }));
                          }
                        }}
                        placeholder="Enter verification code"
                        className="h-11"
                        autoComplete="one-time-code"
                        disabled={isVerifyingEmail}
                      />
                      {errors.verificationCode && (
                        <p className="text-xs text-destructive">{errors.verificationCode}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          className="flex-1 h-11 btn-gradient-primary"
                          onClick={handleVerifyFromLogin}
                          disabled={isVerifyingEmail}
                        >
                          {isVerifyingEmail ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            'Verify email'
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-11"
                          onClick={handleResendFromLogin}
                          disabled={isVerifyingEmail}
                        >
                          Resend
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="w-full flex items-center justify-between">
                  <p className="text-sm">
                    <Link
                      to="/forgot-password"
                      state={{ email: formData.email.trim().toLowerCase() }}
                      className="text-sm text-primary font-medium hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </p>
                  <p className="text-center text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <Link 
                      to="/register" 
                      className="font-medium text-primary hover:underline"
                    >
                      Create account
                    </Link>
                  </p>
                </div>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
