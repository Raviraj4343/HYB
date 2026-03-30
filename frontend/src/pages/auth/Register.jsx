import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import useSmartBackNavigation from '@/hooks/useSmartBackNavigation';

const Register = () => {
  const navigate = useNavigate();
  const goBack = useSmartBackNavigation('/');
  const { register, verifyRegistration, resendVerificationCode } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
    branch: '',
    branchCustom: '',
    year: '',
    hostel: '',
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [stage, setStage] = useState('details');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [verificationNotice, setVerificationNotice] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value, ...(name === 'branch' && value !== 'Other' ? { branchCustom: '' } : {}) }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, avatar: 'Image must be less than 5MB' }));
      return;
    }

    setErrors((prev) => ({ ...prev, avatar: '' }));
    setAvatarFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    if (!formData.userName.trim()) {
      newErrors.userName = 'Username is required';
    } else if (formData.userName.trim().length < 3) {
      newErrors.userName = 'Username must be at least 3 characters';
    } else if (!/^[a-z0-9_]+$/.test(formData.userName.trim().toLowerCase())) {
      newErrors.userName = 'Use lowercase letters, numbers, and underscores only';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    const payload = {
      fullName: formData.fullName.trim(),
      userName: formData.userName.trim().toLowerCase(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      branch: formData.branch === 'Other' ? (formData.branchCustom || undefined) : (formData.branch || undefined),
      year: formData.year ? Number(formData.year) : undefined,
      hostel: formData.hostel || undefined,
      ...(avatarFile && { avatar: avatarFile }),
    };

    const result = await register(payload);
    setIsLoading(false);

    if (result.success) {
      setPendingEmail(result.email || payload.email);
      setStage('verify');
      setVerificationNotice(
        result.emailSent === false
          ? {
              tone: 'warning',
              message: 'We could not send your verification code yet. Use Resend code after fixing the backend email service.',
            }
          : {
              tone: 'success',
              message: 'Verification code sent. Check your inbox and enter the 6-digit code below.',
            }
      );
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!verificationCode.trim()) {
      setErrors((prev) => ({ ...prev, verificationCode: 'Verification code is required' }));
      return;
    }

    setIsLoading(true);
    const result = await verifyRegistration(pendingEmail, verificationCode.trim());
    setIsLoading(false);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    }
  };

  const handleResend = async () => {
    if (!pendingEmail) return;
    setIsLoading(true);
    const result = await resendVerificationCode(pendingEmail);
    setIsLoading(false);
    setVerificationNotice(
      result.success
        ? {
            tone: 'success',
            message: result.message || 'Verification code sent. Check your inbox.',
          }
        : {
            tone: 'warning',
            message: result.error || 'We could not resend the verification code right now.',
          }
    );
  };

  const inputClassName =
    'h-11 rounded-xl border-border/70 !bg-[#151b24] !text-foreground placeholder:!text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-0';
  const iconInputClassName = `${inputClassName} pl-[3.25rem]`;
  const passwordInputClassName = `${inputClassName} pl-[3.25rem] pr-10`;
  const trailingIconInputClassName = `${inputClassName} pr-10`;
  const compactInputClassName =
    'h-9 rounded-xl border-border/70 !bg-[#151b24] !text-foreground placeholder:!text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-0';
  const inputStyle = {
    backgroundColor: '#151b24',
    color: 'hsl(var(--foreground))',
    WebkitTextFillColor: 'hsl(var(--foreground))',
    caretColor: 'hsl(var(--foreground))',
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>
        <div className="absolute inset-0 bg-black/20" />
        <motion.div
          className="absolute top-24 right-20 w-40 h-40 rounded-full bg-white/10 backdrop-blur-sm"
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-28 left-16 w-32 h-32 rounded-full bg-white/10 backdrop-blur-sm"
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <img src="/logo.png" alt="HYB logo" className="w-12 h-12 object-contain" />
              <span className="text-4xl font-display font-bold">HYB</span>
            </div>

            <h1 className="text-4xl font-display font-bold leading-tight mb-6">
              Join the community
            </h1>

            <p className="text-xl text-white/80 mb-10 max-w-md">
              Create your profile, upload your avatar, and verify your email to get started.
            </p>

            <div className="space-y-4">
              {['Quick signup', 'Email verification', 'Avatar from day one', 'Ready for chat and help'].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="text-lg">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background overflow-y-auto">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="lg:hidden flex items-center gap-3 mb-6 justify-center">
            <img src="/logo.png" alt="HYB logo" className="w-9 h-9 object-contain" />
            <span className="text-2xl font-display font-bold gradient-text"></span>
          </div>

          <Card className="rounded-2xl border border-border/60 bg-card/95 shadow-2xl backdrop-blur">
            <CardHeader className="space-y-4 pb-4">
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-full px-3 text-muted-foreground hover:text-foreground"
                  onClick={() => (stage === 'details' ? goBack() : setStage('details'))}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
                <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {stage === 'details' ? 'Signup' : 'Verify'}
                </div>
              </div>

              <div className="text-center">
                <CardTitle className="text-2xl font-display">
                  {stage === 'details' ? 'Create account' : 'Verify your email'}
                </CardTitle>
                <CardDescription>
                  {stage === 'details' ? 'A few details and you are in.' : pendingEmail}
                </CardDescription>
              </div>

              {stage === 'details' ? (
                <div className="flex justify-center pt-2">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-10 h-10 text-muted-foreground" />
                      )}
                    </div>

                    <label
                      htmlFor="avatar-upload"
                      className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-primary-foreground rounded-full cursor-pointer flex items-center justify-center shadow-md hover:bg-primary/90 transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                        disabled={isLoading}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Mail className="h-6 w-6" />
                </div>
              )}

              {errors.avatar && (
                <p className="text-xs text-destructive text-center">{errors.avatar}</p>
              )}
            </CardHeader>

            {stage === 'details' ? (
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="fullName">Full Name</Label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-0 top-0 bottom-0 flex items-center pl-3">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </span>
                        <Input
                          id="fullName"
                          name="fullName"
                          className={iconInputClassName}
                          style={inputStyle}
                          placeholder="Enter name"
                          value={formData.fullName}
                          onChange={handleChange}
                          disabled={isLoading}
                          data-left-icon
                        />
                      </div>
                      {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="userName">Username</Label>
                      <Input
                        id="userName"
                        name="userName"
                        className={inputClassName}
                        style={inputStyle}
                        placeholder="username"
                        value={formData.userName}
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                      {errors.userName && <p className="text-xs text-destructive">{errors.userName}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-0 top-0 bottom-0 flex items-center pl-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      </span>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        className={iconInputClassName}
                        style={inputStyle}
                        placeholder="abc@gmail.com"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={isLoading}
                        data-left-icon
                      />
                    </div>
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-0 top-0 bottom-0 flex items-center pl-3">
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        </span>
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          className={passwordInputClassName}
                          style={inputStyle}
                          placeholder="Create password"
                          value={formData.password}
                          onChange={handleChange}
                          disabled={isLoading}
                          data-left-icon
                          data-right-icon
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword">Confirm</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          className={trailingIconInputClassName}
                          style={inputStyle}
                          placeholder="Repeat password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          disabled={isLoading}
                          data-right-icon
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((value) => !value)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/50">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="branch" className="text-xs">Branch</Label>
                        <Select value={formData.branch} onValueChange={(value) => handleSelectChange('branch', value)} disabled={isLoading}>
                          <SelectTrigger className={compactInputClassName} style={inputStyle}>
                            <SelectValue placeholder="Branch" />
                          </SelectTrigger>
                          <SelectContent className="border-border/70 bg-[#151b24] text-foreground">
                            {[
                              { value: 'CSE', label: 'BTech - CSE' },
                              { value: 'IT', label: 'BTech - IT' },
                              { value: 'ECE', label: 'BTech - ECE' },
                              { value: 'EE', label: 'BTech - EE' },
                              { value: 'ME', label: 'BTech - ME' },
                              { value: 'CE', label: 'BTech - CE' },
                              { value: 'MTech', label: 'MTech' },
                              { value: 'BBA', label: 'BBA' },
                              { value: 'Other', label: 'Other (enter manually)' },
                            ].map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} className="text-foreground focus:bg-white/10 focus:text-foreground">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {formData.branch === 'Other' && (
                          <Input
                            id="branchCustom"
                            name="branchCustom"
                            className={compactInputClassName + ' mt-2'}
                            style={inputStyle}
                            placeholder="Enter your branch"
                            value={formData.branchCustom}
                            onChange={handleChange}
                            disabled={isLoading}
                          />
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="year" className="text-xs">Year</Label>
                        <Select value={formData.year} onValueChange={(value) => handleSelectChange('year', value)} disabled={isLoading}>
                          <SelectTrigger
                            className={compactInputClassName}
                            style={inputStyle}
                          >
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent className="border-border/70 bg-[#151b24] text-foreground">
                            {[1, 2, 3, 4, 5].map((year) => (
                              <SelectItem
                                key={year}
                                value={String(year)}
                                className="text-foreground focus:bg-white/10 focus:text-foreground"
                              >
                                Year {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="hostel" className="text-xs">Hostel</Label>
                        <Input
                          id="hostel"
                          name="hostel"
                          className={compactInputClassName}
                          style={inputStyle}
                          placeholder="Hostel"
                          value={formData.hostel}
                          onChange={handleChange}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 pt-2">
                  <Button type="submit" className="w-full h-11 btn-gradient-primary" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Create account
                      </>
                    )}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-primary hover:underline">
                      Sign in
                    </Link>
                  </p>
                </CardFooter>
              </form>
            ) : (
              <form onSubmit={handleVerify}>
                <CardContent className="space-y-4">
                  {verificationNotice?.message && (
                    <div
                      className={
                        verificationNotice.tone === 'warning'
                          ? 'rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-100'
                          : 'rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-100'
                      }
                    >
                      {verificationNotice.message}
                    </div>
                  )}

                  <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                    <p className="text-sm text-muted-foreground">Verification code sent to</p>
                    <p className="text-base font-medium mt-1">{pendingEmail}</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="verificationCode">Verification Code</Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-0 top-0 bottom-0 flex items-center pl-3">
                        <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                      </span>
                      <Input
                        id="verificationCode"
                        value={verificationCode}
                        onChange={(e) => {
                          setVerificationCode(e.target.value);
                          if (errors.verificationCode) {
                            setErrors((prev) => ({ ...prev, verificationCode: '' }));
                          }
                        }}
                        className={iconInputClassName}
                        style={inputStyle}
                        placeholder="Enter the 6-digit code"
                        disabled={isLoading}
                        autoComplete="one-time-code"
                      />
                    </div>
                    {errors.verificationCode && <p className="text-xs text-destructive">{errors.verificationCode}</p>}
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 pt-2">
                  <Button type="submit" className="w-full h-11 btn-gradient-primary" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify email'
                    )}
                  </Button>

                  <Button type="button" variant="ghost" className="w-full" onClick={handleResend} disabled={isLoading}>
                    Resend code
                  </Button>

                  <Button type="button" variant="secondary" className="w-full" onClick={() => setStage('details')} disabled={isLoading}>
                    Back
                  </Button>
                </CardFooter>
              </form>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
