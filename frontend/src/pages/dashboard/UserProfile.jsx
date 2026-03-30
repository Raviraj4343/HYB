import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Flag, HelpCircle, MessageSquare, Heart, RotateCcw, ShieldBan } from 'lucide-react';

const UserProfile = () => {
  const { userName } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blockDays, setBlockDays] = useState('');
  const [blockReason, setBlockReason] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/user/profile/${userName}`);
        setProfile(response.data.data.user);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (userName) fetchProfile();
  }, [userName]);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isOwnProfile = currentUser?.userName === userName;
  const canModerate = currentUser?.role === 'super_admin' && !isOwnProfile;

  const handleBlockUser = async () => {
    if (!profile?._id) return;
    if (!blockDays || !blockReason.trim()) {
      toast.error('Enter block days and reason');
      return;
    }

    try {
      const response = await api.post(`/report/block/${profile._id}`, {
        days: Number(blockDays),
        reason: blockReason.trim(),
      });

      setProfile((prev) => ({
        ...prev,
        isBlocked: true,
        blockedUntil: response.data.data.blockedUntil,
        blockReason: response.data.data.blockReason,
      }));
      toast.success('User blocked successfully');
    } catch (err) {
      toast.error(err.data?.message || err.response?.data?.message || err.message || 'Failed to block user');
    }
  };

  const handleUnblockUser = async () => {
    if (!profile?._id) return;

    try {
      await api.post(`/report/unblock/${profile._id}`, { resetWarnings: false });
      setProfile((prev) => ({
        ...prev,
        isBlocked: false,
        blockedUntil: null,
        blockReason: null,
      }));
      toast.success('User unblocked successfully');
    } catch (err) {
      toast.error(err.data?.message || err.response?.data?.message || err.message || 'Failed to unblock user');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium">User not found</p>
            <p className="text-muted-foreground">The user you're looking for doesn't exist</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile.avatar} />
              <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                {getInitials(profile.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl font-display font-bold">{profile.fullName}</h1>
              <p className="text-muted-foreground">@{profile.userName}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                {profile.branch && (
                  <Badge variant="secondary">{profile.branch}</Badge>
                )}
                {profile.year && (
                  <Badge variant="outline">Year {profile.year}</Badge>
                )}
                {profile.hostel && (
                  <Badge variant="outline">{profile.hostel}</Badge>
                )}
                {profile.isBlocked && (
                  <Badge variant="destructive">Blocked</Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {profile.isBlocked && (
            <div className="mb-6 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
              <p className="font-medium text-destructive">This account is currently blocked</p>
              <p className="mt-1 text-sm text-muted-foreground">Reason: {profile.blockReason || 'Not available'}</p>
              {profile.blockedUntil && (
                <p className="mt-1 text-sm text-muted-foreground">Until: {new Date(profile.blockedUntil).toLocaleString()}</p>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-muted rounded-xl">
              <div className="flex items-center justify-center gap-2 mb-1">
                <HelpCircle className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl font-bold">{profile.stats?.requestsCreated || 0}</p>
              <p className="text-xs text-muted-foreground">Requests</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-xl">
              <div className="flex items-center justify-center gap-2 mb-1">
                <MessageSquare className="w-5 h-5 text-accent" />
              </div>
              <p className="text-2xl font-bold">{profile.stats?.responsesGiven || 0}</p>
              <p className="text-xs text-muted-foreground">Responses</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-xl">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Heart className="w-5 h-5 text-destructive" />
              </div>
              <p className="text-2xl font-bold">{profile.stats?.helpCount || 0}</p>
              <p className="text-xs text-muted-foreground">Helped</p>
            </div>
          </div>

          {/* Actions */}
          {!isOwnProfile && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => navigate(`/dashboard/report?userId=${profile._id}&userName=${profile.userName}`)}
              >
                <Flag className="w-4 h-4" />
                Report User
              </Button>
            </div>
          )}

          {canModerate && (
            <div className="mt-6 rounded-2xl border border-border/70 bg-card/70 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldBan className="h-4 w-4 text-destructive" />
                Super Admin Controls
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-[140px_minmax(0,1fr)]">
                <Input
                  type="number"
                  min="1"
                  max="365"
                  placeholder="Days"
                  value={blockDays}
                  onChange={(e) => setBlockDays(e.target.value)}
                />
                <Textarea
                  rows={3}
                  placeholder="Reason for blocking this user"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="destructive" onClick={handleBlockUser}>
                  <ShieldBan className="mr-2 h-4 w-4" />
                  Block User
                </Button>
                {profile.isBlocked && (
                  <Button variant="outline" onClick={handleUnblockUser}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Unblock User
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Super admin full details view */}
          {currentUser?.role === 'super_admin' && (
            <div className="mt-6 rounded-2xl border border-border/70 bg-card/70 p-4">
              <h3 className="text-sm font-medium mb-3">Full Profile (Admin view)</h3>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{profile.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{profile.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role</span>
                  <span className="font-medium">{profile.role || 'user'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email Verified</span>
                  <span className="font-medium">{profile.isEmailVerified ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Warnings</span>
                  <span className="font-medium">{profile.warningCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Login</span>
                  <span className="font-medium">{profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Created</span>
                  <span className="font-medium">{profile.createdAt ? new Date(profile.createdAt).toLocaleString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium">{profile.updatedAt ? new Date(profile.updatedAt).toLocaleString() : 'N/A'}</span>
                </div>
              </div>
              {profile.reportHistory && profile.reportHistory.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Report history</h4>
                  <div className="space-y-2 text-sm">
                    {profile.reportHistory.map((r, idx) => (
                      <div key={idx} className="rounded border border-border/40 p-2 bg-background/60">
                        <div className="text-muted-foreground text-xs">Reported at: {r.reportedAt ? new Date(r.reportedAt).toLocaleString() : 'N/A'}</div>
                        <div className="font-medium">Report ID: {r.reportId?._id || r.reportId || 'N/A'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;
