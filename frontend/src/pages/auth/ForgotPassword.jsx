import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [stage, setStage] = useState(0); // 0 = request code, 1 = reset
  const [isLoading, setIsLoading] = useState(false);

  const requestCode = async (e) => {
    e?.preventDefault();
    if (!email) return toast.error('Please enter your email');
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('If that email exists, a verification code was sent');
      setStage(1);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to send code');
    } finally { setIsLoading(false); }
  };

  const reset = async (e) => {
    e.preventDefault();
    if (!code || !newPassword) return toast.error('Please provide code and new password');
    setIsLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { email, code, newPassword });
      toast.success('Password reset successful');
      // Optionally save tokens and redirect
      const { accessToken, refreshToken, user } = res.data.data || {};
      if (accessToken) localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      if (user) localStorage.setItem('user', JSON.stringify(user));
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Reset failed');
    } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Forgot Password</CardTitle>
          </CardHeader>

          {stage === 0 ? (
            <form onSubmit={requestCode}>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Sending...' : 'Send verification code'}</Button>
              </CardFooter>
            </form>
          ) : (
            <form onSubmit={reset}>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="code">Verification Code</Label>
                  <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" />
                </div>
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setStage(0)}>Back</Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>{isLoading ? 'Resetting...' : 'Reset password'}</Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
