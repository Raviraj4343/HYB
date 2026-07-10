import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  Shield, Flag, Users, AlertTriangle, CheckCircle2, XCircle,
  Clock, Eye, Ban, Unlock, RefreshCw, ChevronDown, Loader2,
  TrendingUp, UserX, FileWarning, Search
} from 'lucide-react';
import api from '@/api/axios';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ── helpers ──────────────────────────────────────────────────────
const statusColors = {
  pending:   'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
  reviewed:  'border-blue-500/30 bg-blue-500/10 text-blue-400',
  resolved:  'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  dismissed: 'border-white/10 bg-white/5 text-muted-foreground',
};

const reasonLabels = {
  spam: 'Spam',
  harassment: 'Harassment',
  inappropriate_content: 'Inappropriate Content',
  fraud: 'Fraud',
  fake_request: 'Fake Request',
  abuse: 'Abuse',
  other: 'Other',
};

// ── Sub-components ────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, accent, isLoading }) {
  return (
    <div className={`rounded-2xl border p-5 bg-gradient-to-br ${accent}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
      </div>
      <p className="text-3xl font-bold text-white">
        {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : value}
      </p>
    </div>
  );
}

// ── Reports Tab ──────────────────────────────────────────────────
function ReportsTab({ isSuperAdmin }) {
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', statusFilter],
    queryFn: () =>
      api.get('/report', { params: { status: statusFilter || undefined, limit: 50 } })
        .then(r => r.data.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, reviewNotes }) =>
      api.patch(`/report/${id}/status`, { status, reviewNotes }),
    onSuccess: () => {
      toast.success('Report status updated');
      queryClient.invalidateQueries(['admin-reports']);
      queryClient.invalidateQueries(['admin-stats']);
    },
    onError: (e) => toast.error(e.message || 'Failed to update'),
  });

  const reports = data?.reports || [];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['', 'pending', 'reviewed', 'resolved', 'dismissed'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-semibold border transition-all',
              statusFilter === s
                ? 'bg-primary/20 border-primary/50 text-white'
                : 'border-white/10 text-muted-foreground hover:border-white/30'
            )}
          >
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-white/5 bg-white/[0.02]">
          <Flag className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No reports found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report._id} className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
              {/* Report header */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/5"
                onClick={() => setExpandedId(expandedId === report._id ? null : report._id)}
              >
                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Reporter</p>
                    <p className="text-sm font-medium text-white truncate">
                      @{report.reporter?.userName || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Reported User</p>
                    <p className="text-sm font-semibold text-white truncate">
                      @{report.reportedUser?.userName || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Reason</p>
                    <p className="text-sm text-white">{reasonLabels[report.reason] || report.reason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn('text-xs px-2.5 py-1 rounded-full border font-semibold capitalize', statusColors[report.status])}>
                    {report.status}
                  </span>
                  <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', expandedId === report._id && 'rotate-180')} />
                </div>
              </div>

              {/* Expanded detail */}
              <AnimatePresence>
                {expandedId === report._id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-4">
                      {/* User info */}
                      <div className="flex flex-wrap gap-4">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                          <p className="text-xs text-muted-foreground mb-2">Reported User Status</p>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{report.reportedUser?.fullName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-semibold text-white">{report.reportedUser?.fullName}</p>
                              <p className="text-xs text-muted-foreground">
                                {report.reportedUser?.warningCount || 0} warnings •{' '}
                                {report.reportedUser?.isBlocked ? (
                                  <span className="text-red-400">Blocked</span>
                                ) : (
                                  <span className="text-emerald-400">Active</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {report.description && (
                          <div className="flex-1 p-3 rounded-xl bg-white/5 border border-white/10">
                            <p className="text-xs text-muted-foreground mb-1">Description</p>
                            <p className="text-sm text-white">{report.description}</p>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Submitted {format(new Date(report.createdAt), 'PPP p')}
                        {report.isValidated && <span className="ml-2 text-emerald-400">• AI Validated</span>}
                      </p>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2">
                        {['reviewed', 'resolved', 'dismissed'].map((s) => (
                          <Button
                            key={s}
                            size="sm"
                            variant={s === 'resolved' ? 'default' : 'outline'}
                            className={cn(
                              'capitalize border-white/10 text-sm',
                              s === 'dismissed' && 'text-muted-foreground',
                              s === 'resolved' && 'bg-emerald-500/80 hover:bg-emerald-500 border-none text-white'
                            )}
                            disabled={report.status === s || updateMutation.isPending}
                            onClick={() => updateMutation.mutate({ id: report._id, status: s })}
                          >
                            {s === 'resolved' && <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                            {s === 'reviewed' && <Eye className="mr-1.5 h-3.5 w-3.5" />}
                            {s === 'dismissed' && <XCircle className="mr-1.5 h-3.5 w-3.5" />}
                            {s}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Users Tab ──────────────────────────────────────────────────
function UsersTab({ isSuperAdmin }) {
  const [view, setView] = useState('blocked'); // blocked | atrisk
  const [blockForm, setBlockForm] = useState({ userId: null, days: '', reason: '' });
  const queryClient = useQueryClient();

  const { data: blockedData, isLoading: loadingBlocked } = useQuery({
    queryKey: ['admin-blocked-users'],
    queryFn: () => api.get('/user/blocked').then(r => r.data.data),
    enabled: view === 'blocked',
  });

  const { data: atRiskData, isLoading: loadingAtRisk } = useQuery({
    queryKey: ['admin-atrisk-users'],
    queryFn: () => api.get('/user/at-risk').then(r => r.data.data),
    enabled: view === 'atrisk',
  });

  const unblockMutation = useMutation({
    mutationFn: (userId) => api.post(`/report/unblock/${userId}`, { resetWarnings: false }),
    onSuccess: () => {
      toast.success('User unblocked');
      queryClient.invalidateQueries(['admin-blocked-users']);
      queryClient.invalidateQueries(['admin-stats']);
    },
    onError: (e) => toast.error(e.message || 'Failed to unblock'),
  });

  const blockMutation = useMutation({
    mutationFn: ({ userId, days, reason }) =>
      api.post(`/report/block/${userId}`, { days: Number(days), reason }),
    onSuccess: () => {
      toast.success('User blocked');
      setBlockForm({ userId: null, days: '', reason: '' });
      queryClient.invalidateQueries(['admin-atrisk-users']);
      queryClient.invalidateQueries(['admin-stats']);
    },
    onError: (e) => toast.error(e.message || 'Failed to block'),
  });

  const resetWarningsMutation = useMutation({
    mutationFn: (userId) => api.post(`/user/${userId}/reset-warnings`, { resetCount: true, unblock: true }),
    onSuccess: () => {
      toast.success('Warnings reset successfully');
      queryClient.invalidateQueries(['admin-atrisk-users']);
      queryClient.invalidateQueries(['admin-blocked-users']);
    },
    onError: (e) => toast.error(e.message || 'Failed to reset'),
  });

  const users = view === 'blocked'
    ? (Array.isArray(blockedData) ? blockedData : blockedData?.users || [])
    : (Array.isArray(atRiskData) ? atRiskData : atRiskData?.users || []);

  const isLoading = view === 'blocked' ? loadingBlocked : loadingAtRisk;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setView('blocked')}
          className={cn('px-4 py-1.5 rounded-full text-xs font-semibold border transition-all', view === 'blocked' ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'border-white/10 text-muted-foreground hover:border-white/30')}
        >
          <Ban className="inline h-3.5 w-3.5 mr-1" />Blocked Users
        </button>
        <button
          onClick={() => setView('atrisk')}
          className={cn('px-4 py-1.5 rounded-full text-xs font-semibold border transition-all', view === 'atrisk' ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' : 'border-white/10 text-muted-foreground hover:border-white/30')}
        >
          <AlertTriangle className="inline h-3.5 w-3.5 mr-1" />At-Risk Users
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-white/5 bg-white/[0.02]">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{view === 'blocked' ? 'No blocked users.' : 'No at-risk users.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u._id} className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/5">
              <Avatar className="h-10 w-10 border border-white/10 shrink-0">
                <AvatarImage src={u.avatar} />
                <AvatarFallback>{u.fullName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{u.fullName}</p>
                <p className="text-xs text-muted-foreground">@{u.userName}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-orange-400">⚠ {u.warningCount || 0} warnings</span>
                  {u.isBlocked && <span className="text-xs text-red-400">• Blocked</span>}
                  {u.blockedUntil && (
                    <span className="text-xs text-muted-foreground">
                      until {format(new Date(u.blockedUntil), 'MMM d, yyyy')}
                    </span>
                  )}
                  {u.blockReason && (
                    <span className="text-xs text-muted-foreground">— {u.blockReason}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {/* Reset warnings (admin) */}
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/10 text-xs"
                  onClick={() => resetWarningsMutation.mutate(u._id)}
                  disabled={resetWarningsMutation.isPending}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reset
                </Button>

                {/* Unblock (super_admin) */}
                {isSuperAdmin && u.isBlocked && (
                  <Button
                    size="sm"
                    className="bg-emerald-500/80 hover:bg-emerald-500 text-white text-xs"
                    onClick={() => unblockMutation.mutate(u._id)}
                    disabled={unblockMutation.isPending}
                  >
                    <Unlock className="h-3.5 w-3.5 mr-1" /> Unblock
                  </Button>
                )}

                {/* Block (super_admin, only on at-risk) */}
                {isSuperAdmin && !u.isBlocked && view === 'atrisk' && (
                  blockForm.userId === u._id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Days"
                        min={1}
                        max={365}
                        className="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white"
                        value={blockForm.days}
                        onChange={(e) => setBlockForm(f => ({ ...f, days: e.target.value }))}
                      />
                      <input
                        placeholder="Reason"
                        className="w-28 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white"
                        value={blockForm.reason}
                        onChange={(e) => setBlockForm(f => ({ ...f, reason: e.target.value }))}
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="text-xs"
                        onClick={() => blockMutation.mutate({ userId: u._id, days: blockForm.days, reason: blockForm.reason })}
                        disabled={!blockForm.days || !blockForm.reason || blockMutation.isPending}
                      >
                        Confirm
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs" onClick={() => setBlockForm({ userId: null, days: '', reason: '' })}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="opacity-70 hover:opacity-100 text-xs"
                      onClick={() => setBlockForm({ userId: u._id, days: '', reason: '' })}
                    >
                      <Ban className="h-3.5 w-3.5 mr-1" /> Block
                    </Button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Admin Panel ─────────────────────────────────────────────
export default function AdminPanel() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin' || isSuperAdmin;
  const [tab, setTab] = useState('reports');

  // Stats
  const { data: reportsData } = useQuery({
    queryKey: ['admin-stats', 'reports'],
    queryFn: () => api.get('/report?limit=1').then(r => r.data.data?.pagination?.total || 0),
    enabled: isAdmin,
  });
  const { data: pendingCount } = useQuery({
    queryKey: ['admin-stats', 'pending'],
    queryFn: () => api.get('/report?status=pending&limit=1').then(r => r.data.data?.pagination?.total || 0),
    enabled: isAdmin,
  });
  const { data: blockedUsers } = useQuery({
    queryKey: ['admin-stats', 'blocked'],
    queryFn: () => api.get('/user/blocked').then(r => {
      const d = r.data.data;
      return Array.isArray(d) ? d.length : d?.users?.length || 0;
    }),
    enabled: isAdmin,
  });
  const { data: atRiskUsers } = useQuery({
    queryKey: ['admin-stats', 'atrisk'],
    queryFn: () => api.get('/user/at-risk').then(r => {
      const d = r.data.data;
      return Array.isArray(d) ? d.length : d?.users?.length || 0;
    }),
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Shield className="h-16 w-16 text-muted-foreground" />
        <p className="text-muted-foreground">You don't have access to this panel.</p>
      </div>
    );
  }

  const tabs = [
    { id: 'reports', label: 'Reports', icon: Flag },
    { id: 'users', label: 'Users', icon: UserX },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-red-500/30 to-orange-500/20 border border-red-500/30 flex items-center justify-center">
          <Shield className="h-6 w-6 text-red-400" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Admin Panel</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isSuperAdmin ? 'Super Admin' : 'Admin'} · Moderation &amp; User Management
          </p>
        </div>
        {isSuperAdmin && (
          <Badge className="ml-auto bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 text-red-400 text-xs px-3 py-1">
            Super Admin
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Flag} label="Total Reports" value={reportsData ?? '—'} accent="from-blue-500/10 to-cyan-500/5 border-blue-500/20" />
        <StatCard icon={Clock} label="Pending" value={pendingCount ?? '—'} accent="from-yellow-500/10 to-orange-500/5 border-yellow-500/20" />
        <StatCard icon={Ban} label="Blocked Users" value={blockedUsers ?? '—'} accent="from-red-500/10 to-red-500/5 border-red-500/20" />
        <StatCard icon={AlertTriangle} label="At-Risk Users" value={atRiskUsers ?? '—'} accent="from-orange-500/10 to-yellow-500/5 border-orange-500/20" />
      </div>

      {/* Tabs */}
      <div className="space-y-6">
        <div className="flex border-b border-white/10 gap-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px',
                tab === id
                  ? 'border-primary text-white'
                  : 'border-transparent text-muted-foreground hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'reports' && <ReportsTab isSuperAdmin={isSuperAdmin} />}
            {tab === 'users' && <UsersTab isSuperAdmin={isSuperAdmin} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
