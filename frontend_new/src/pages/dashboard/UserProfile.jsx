import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, MessageSquare, Zap, Calendar, Mail, Building2,
  GraduationCap, Home, Shield, AlertTriangle, Ban, Unlock,
  Flag, CheckCircle2, XCircle, Eye, Loader2, ChevronDown, Clock
} from 'lucide-react';
import { format } from 'date-fns';
import api from '@/api/axios';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ── helpers ──────────────────────────────────────────────────────
const safeDate = (val) => {
  if (!val) return null;
  try { return new Date(val); } catch { return null; }
};

const InfoRow = ({ icon: Icon, label, value, accent }) =>
  value ? (
    <div className="flex items-center gap-3 text-sm">
      <Icon className={cn('h-4 w-4 shrink-0', accent || 'text-muted-foreground')} />
      <span className="text-muted-foreground min-w-[80px]">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  ) : null;

const reportStatusColors = {
  pending:   'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
  reviewed:  'border-blue-500/30 bg-blue-500/10 text-blue-400',
  resolved:  'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  dismissed: 'border-white/10 bg-white/5 text-muted-foreground',
};

// ── Admin: Reports Section ───────────────────────────────────────
function UserReports({ userId }) {
  const [expanded, setExpanded] = useState(null);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-user-reports', userId],
    queryFn: () => api.get(`/report/user/${userId}`).then(r => r.data.data),
  });

  const reports = data?.reports || [];

  if (isLoading) return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  if (!reports.length) return (
    <div className="text-center py-6 text-muted-foreground text-sm">No reports against this user.</div>
  );

  return (
    <div className="space-y-2 mt-2">
      {reports.map(r => (
        <div key={r._id} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          <div
            className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-white/5"
            onClick={() => setExpanded(expanded === r._id ? null : r._id)}
          >
            <span className="text-sm text-white flex-1">
              @{r.reporter?.userName || '?'} reported for <strong>{r.reason}</strong>
            </span>
            <span className={cn('text-xs px-2 py-0.5 rounded-full border font-semibold', reportStatusColors[r.status])}>
              {r.status}
            </span>
            {r.isValidated && <span className="text-xs text-emerald-400">AI ✓</span>}
            <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', expanded === r._id && 'rotate-180')} />
          </div>
          {expanded === r._id && (
            <div className="px-4 pb-3 border-t border-white/5 text-sm text-muted-foreground space-y-1">
              {r.description && <p className="text-white">{r.description}</p>}
              <p>Submitted {safeDate(r.createdAt) ? format(safeDate(r.createdAt), 'PPP') : '—'}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Admin: Block/Unblock actions ─────────────────────────────────
function AdminActions({ userData, onSuccess }) {
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockDays, setBlockDays] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const queryClient = useQueryClient();

  const unblockMutation = useMutation({
    mutationFn: () => api.post(`/report/unblock/${userData._id}`, { resetWarnings: false }),
    onSuccess: () => {
      toast.success('User unblocked');
      queryClient.invalidateQueries(['user', userData.userName]);
      onSuccess?.();
    },
    onError: (e) => toast.error(e.message || 'Failed to unblock'),
  });

  const blockMutation = useMutation({
    mutationFn: () => api.post(`/report/block/${userData._id}`, { days: Number(blockDays), reason: blockReason }),
    onSuccess: () => {
      toast.success('User blocked');
      setShowBlockForm(false);
      queryClient.invalidateQueries(['user', userData.userName]);
      onSuccess?.();
    },
    onError: (e) => toast.error(e.message || 'Failed to block'),
  });

  return (
    <div className="space-y-3">
      {userData.isBlocked ? (
        <Button
          className="bg-emerald-500/80 hover:bg-emerald-500 text-white w-full"
          onClick={() => unblockMutation.mutate()}
          disabled={unblockMutation.isPending}
        >
          <Unlock className="mr-2 h-4 w-4" />
          {unblockMutation.isPending ? 'Unblocking...' : 'Unblock User'}
        </Button>
      ) : showBlockForm ? (
        <div className="space-y-2 p-4 rounded-xl border border-red-500/20 bg-red-500/5">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">Block User</p>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              max={365}
              placeholder="Days (1–365)"
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              value={blockDays}
              onChange={e => setBlockDays(e.target.value)}
            />
          </div>
          <textarea
            placeholder="Reason for block..."
            rows={2}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
            value={blockReason}
            onChange={e => setBlockReason(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              disabled={!blockDays || !blockReason || blockMutation.isPending}
              onClick={() => blockMutation.mutate()}
            >
              {blockMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4 mr-1" />}
              Confirm Block
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowBlockForm(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button
          variant="destructive"
          className="w-full opacity-80 hover:opacity-100"
          onClick={() => setShowBlockForm(true)}
        >
          <Ban className="mr-2 h-4 w-4" /> Block User
        </Button>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────
export default function UserProfile() {
  const { userName } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isAdmin = currentUser?.role === 'admin' || isSuperAdmin;

  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['user', userName],
    queryFn: () => api.get(`/user/profile/${userName}`).then(r => r.data.data.user),
    retry: 1,
  });

  const handleMessage = async () => {
    try {
      const res = await api.post('/chat/ensure', { otherUserId: userData._id, requestId: null });
      navigate(`/dashboard/chats/${res.data.data.chat._id}`);
    } catch {
      toast.error('Failed to start chat');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        <div className="text-center py-20 rounded-2xl border border-white/10 bg-white/5">
          <p className="text-white text-lg font-semibold">User not found</p>
          <p className="text-muted-foreground mt-1 text-sm">@{userName} doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const isMe = currentUser?._id === userData._id;
  const joinedDate = safeDate(userData.createdAt);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-white">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Left: Profile Card ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
            {/* Cover */}
            <div className="h-40 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 relative">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
              {userData.isBlocked && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-500/20 border border-red-500/30 backdrop-blur rounded-full px-3 py-1">
                  <Ban className="h-3.5 w-3.5 text-red-400" />
                  <span className="text-xs font-semibold text-red-400">Blocked</span>
                </div>
              )}
            </div>

            <div className="px-6 pb-6 -mt-14">
              {/* Avatar + Name */}
              <div className="flex flex-col sm:flex-row gap-4 sm:items-end mb-6">
                <div className="relative">
                  <Avatar className="h-28 w-28 border-4 border-background shadow-2xl">
                    <AvatarImage src={userData.avatar} />
                    <AvatarFallback className="text-3xl">{userData.fullName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {userData.role && userData.role !== 'user' && (
                    <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center border-2 border-background">
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-display font-bold text-white">{userData.fullName}</h1>
                    {userData.role && userData.role !== 'user' && (
                      <Badge className="text-[10px] uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
                        {userData.role.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">@{userData.userName}</p>
                  {joinedDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <Calendar className="inline h-3 w-3 mr-1" />
                      Joined {format(joinedDate, 'MMMM yyyy')}
                    </p>
                  )}
                </div>

                {!isMe && isSuperAdmin && (
                  <Button onClick={handleMessage} className="shadow-lg shadow-primary/20 shrink-0">
                    <MessageSquare className="mr-2 h-4 w-4" /> Message
                  </Button>
                )}
                {isMe && (
                  <Button variant="outline" className="border-white/10 shrink-0" onClick={() => navigate('/dashboard/settings')}>
                    Edit Profile
                  </Button>
                )}
              </div>

              {/* Info grid */}
              <div className="space-y-2.5">
                <InfoRow icon={Building2} label="Branch" value={userData.branch} />
                <InfoRow icon={GraduationCap} label="Year" value={userData.year} />
                <InfoRow icon={Home} label="Hostel" value={userData.hostel} />
                {/* Own profile / admin sees email */}
                {(isMe || isSuperAdmin) && userData.email && (
                  <InfoRow icon={Mail} label="Email" value={userData.email} accent="text-primary" />
                )}
                {/* Admin sees warning count */}
                {isAdmin && (
                  <div className="flex items-center gap-3 text-sm">
                    <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0" />
                    <span className="text-muted-foreground min-w-[80px]">Warnings</span>
                    <span className={cn('font-bold', (userData.warningCount || 0) > 5 ? 'text-red-400' : (userData.warningCount || 0) > 2 ? 'text-orange-400' : 'text-white')}>
                      {userData.warningCount || 0} / 11
                    </span>
                  </div>
                )}
                {isAdmin && userData.isBlocked && userData.blockedUntil && (
                  <InfoRow
                    icon={Clock}
                    label="Blocked until"
                    value={format(new Date(userData.blockedUntil), 'PPP p')}
                    accent="text-red-400"
                  />
                )}
                {isAdmin && userData.blockReason && (
                  <InfoRow icon={Ban} label="Block reason" value={userData.blockReason} accent="text-red-400" />
                )}
                {isSuperAdmin && userData.lastLogin && (
                  <InfoRow icon={Calendar} label="Last login" value={format(new Date(userData.lastLogin), 'PPP p')} />
                )}
              </div>
            </div>
          </div>

          {/* Admin: Reports on this user */}
          {isAdmin && !isMe && (
            <div className="rounded-[2rem] border border-orange-500/20 bg-orange-500/5 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-orange-400 uppercase tracking-wider mb-3">
                <Flag className="h-4 w-4" /> Reports Against This User
              </h3>
              <UserReports userId={userData._id} />
            </div>
          )}
        </div>

        {/* ── Right: Stats + Admin actions ── */}
        <div className="space-y-4">
          {/* Help Count */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
            <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
              <Zap className="h-7 w-7 text-primary" />
            </div>
            <div className="text-4xl font-display font-bold text-white mb-1">{userData.helpCount || 0}</div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Community Helps</div>
          </div>

          {/* Admin stats card */}
          {isAdmin && !isMe && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
                <Shield className="h-4 w-4 text-red-400" /> Admin Overview
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/5 p-3 text-center">
                  <p className="text-xl font-bold text-white">{userData.warningCount || 0}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Warnings</p>
                </div>
                <div className="rounded-xl bg-white/5 p-3 text-center">
                  <p className={cn('text-xl font-bold', userData.isBlocked ? 'text-red-400' : 'text-emerald-400')}>
                    {userData.isBlocked ? 'Blocked' : 'Active'}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Status</p>
                </div>
              </div>
              <div className="rounded-xl bg-white/5 p-3 text-center">
                <p className="text-xl font-bold text-white">{userData.isEmailVerified ? '✅' : '❌'}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Email Verified</p>
              </div>
            </div>
          )}

          {/* Super Admin: Block/Unblock */}
          {isSuperAdmin && !isMe && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
              <h4 className="flex items-center gap-2 text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">
                <Shield className="h-3.5 w-3.5" /> Moderation Actions
              </h4>
              <AdminActions
                userData={userData}
                onSuccess={() => queryClient.invalidateQueries(['user', userName])}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
