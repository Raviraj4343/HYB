import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, Clock, Flag, Loader2, RotateCcw, ShieldBan, XCircle } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const Reports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [blockDrafts, setBlockDrafts] = useState({});

  const canSuperAdminModerate = user?.role === 'super_admin' || user?.role === 'admin';

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const query = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const response = await api.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/report${query}`);
      setReports(response.data.data.reports || []);
    } catch (err) {
      toast.error('Failed to fetch reports');
    } finally {
      setIsLoading(false);
    }
  };

  const updateReport = async (reportId, status) => {
    try {
      await api.patch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/report/${reportId}/status`, { status });
      setReports((prev) =>
        prev.map((report) => (report._id === reportId ? { ...report, status } : report))
      );
      toast.success(`Report marked as ${status}`);
    } catch (err) {
      toast.error('Failed to update report');
    }
  };

  const updateBlockDraft = (reportId, key, value) => {
    setBlockDrafts((prev) => ({
      ...prev,
      [reportId]: {
        days: prev[reportId]?.days || '',
        reason: prev[reportId]?.reason || '',
        [key]: value,
      },
    }));
  };

  const handleBlockUser = async (report) => {
    const draft = blockDrafts[report._id] || {};
    if (!draft.days || !draft.reason?.trim()) {
      toast.error('Enter block days and reason');
      return;
    }

    try {
      const response = await api.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/report/block/${report.reportedUser?._id}`, {
        days: Number(draft.days),
        reason: draft.reason.trim(),
      });

      setReports((prev) =>
        prev.map((item) =>
          item._id === report._id
            ? {
                ...item,
                reportedUser: {
                  ...item.reportedUser,
                  isBlocked: true,
                  blockReason: response.data.data.blockReason,
                  blockedUntil: response.data.data.blockedUntil,
                },
              }
            : item
        )
      );
      toast.success('User blocked successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to block user');
    }
  };

  const handleUnblockUser = async (report) => {
    try {
      await api.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/report/unblock/${report.reportedUser?._id}`, { resetWarnings: false });
      setReports((prev) =>
        prev.map((item) =>
          item._id === report._id
            ? {
                ...item,
                reportedUser: {
                  ...item.reportedUser,
                  isBlocked: false,
                  blockReason: null,
                  blockedUntil: null,
                },
              }
            : item
        )
      );
      toast.success('User unblocked successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unblock user');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'resolved':
        return <Badge className="bg-green-500"><CheckCircle className="mr-1 h-3 w-3" />Resolved</Badge>;
      case 'dismissed':
        return <Badge variant="secondary"><XCircle className="mr-1 h-3 w-3" />Dismissed</Badge>;
      case 'reviewed':
        return <Badge className="bg-sky-500"><CheckCircle className="mr-1 h-3 w-3" />Reviewed</Badge>;
      default:
        return <Badge variant="destructive"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-display font-bold">
            <Flag className="h-8 w-8" />
            Reports
          </h1>
          <p className="mt-1 text-muted-foreground">Review reports and moderate flagged users</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reports</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-14">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Flag className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">No reports found</p>
            <p className="text-muted-foreground">
              {statusFilter !== 'all' ? 'Try changing the filter' : 'No reports have been submitted'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report._id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Report against @{report.reportedUser?.userName}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      by @{report.reporter?.userName} • {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {getStatusBadge(report.status)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Reason</p>
                    <p className="font-medium">{report.reason}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Reported User</p>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">@{report.reportedUser?.userName}</span>
                      {report.reportedUser?.isBlocked && (
                        <Badge variant="destructive">Blocked</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {report.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                    <p className="rounded-xl bg-muted/60 p-3 text-sm">{report.description}</p>
                  </div>
                )}

                {report.reportedUser?.isBlocked && (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3">
                    <p className="text-sm font-medium text-destructive">Current block</p>
                    <p className="text-sm text-muted-foreground">
                      Reason: {report.reportedUser?.blockReason || 'Not available'}
                    </p>
                    {report.reportedUser?.blockedUntil && (
                      <p className="text-sm text-muted-foreground">
                        Until: {new Date(report.reportedUser.blockedUntil).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {report.status === 'pending' && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateReport(report._id, 'resolved')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Resolve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateReport(report._id, 'dismissed')}
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Dismiss
                    </Button>
                  </div>
                )}

                {canSuperAdminModerate && (
                  <div className="space-y-3 rounded-2xl border border-border/70 bg-card/70 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <ShieldBan className="h-4 w-4 text-destructive" />
                      Super Admin Controls
                    </div>
                    <div className="grid gap-3 md:grid-cols-[140px_minmax(0,1fr)]">
                      <Input
                        type="number"
                        min="1"
                        max="365"
                        placeholder="Days"
                        value={blockDrafts[report._id]?.days || ''}
                        onChange={(e) => updateBlockDraft(report._id, 'days', e.target.value)}
                      />
                      <Textarea
                        rows={2}
                        placeholder="Reason for blocking this user"
                        value={blockDrafts[report._id]?.reason || ''}
                        onChange={(e) => updateBlockDraft(report._id, 'reason', e.target.value)}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="destructive" onClick={() => handleBlockUser(report)}>
                        <ShieldBan className="mr-2 h-4 w-4" />
                        Block User
                      </Button>
                      {report.reportedUser?.isBlocked && (
                        <Button size="sm" variant="outline" onClick={() => handleUnblockUser(report)}>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Unblock User
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reports;
