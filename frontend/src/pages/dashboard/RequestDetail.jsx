import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import {
  Clock,
  MapPin,
  MessageSquare,
  Phone,
  Loader2,
  AlertCircle,
  HandHeart,
  CheckCircle,
  XCircle,
  Trash2,
  Send,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import useSmartBackNavigation from '@/hooks/useSmartBackNavigation';

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const goBackToRequests = useSmartBackNavigation('/dashboard/requests');
  const { user } = useAuth();

  const [request, setRequest] = useState(null);
  const [responses, setResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [responseText, setResponseText] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFulfillDialog, setShowFulfillDialog] = useState(false);
  const [selectedFulfillHelperId, setSelectedFulfillHelperId] = useState('');
  const [isFulfilling, setIsFulfilling] = useState(false);

  const isOwner = user?._id === request?.requestedBy?._id;
  const hasAlreadyResponded = responses.some(
    (response) => response.responder?._id === user?._id || response.responder === user?._id
  );
  const acceptedResponses = responses.filter((response) => response.status === 'accepted');

  const helperOptions = (() => {
    const seen = new Set();
    const options = [];

    [...responses]
      .sort((a, b) => {
        const priority = { completed: 0, accepted: 1, pending: 2, rejected: 3 };
        return (priority[a.status] ?? 99) - (priority[b.status] ?? 99);
      })
      .forEach((response) => {
      const responder = response.responder;
      if (!responder?._id || seen.has(responder._id)) return;

      seen.add(responder._id);
      options.push({
        _id: responder._id,
        fullName: responder.fullName,
        userName: responder.userName,
        avatar: responder.avatar,
        helpCount: responder.helpCount || 0,
        responseStatus: response.status,
        responseMessage: response.message,
      });
      });

    if (request?.acceptedHelper?._id && !seen.has(request.acceptedHelper._id)) {
      options.unshift({
        _id: request.acceptedHelper._id,
        fullName: request.acceptedHelper.fullName,
        userName: request.acceptedHelper.userName,
        avatar: request.acceptedHelper.avatar,
        helpCount: request.acceptedHelper.helpCount || 0,
        responseStatus: request.status === 'fulfilled' ? 'completed' : 'accepted',
        responseMessage: '',
      });
    }

    return options;
  })();

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  const fetchRequestDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [reqResponse, resResponse] = await Promise.all([
        api.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/req/get-req-ById/${id}`),
        api.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/res/get-req-for-res/${id}`).catch(() => ({ data: { data: { responses: [] } } })),
      ]);

      setRequest(reqResponse.data.data.request);
      setResponses(resResponse.data.data?.responses || []);
    } catch (err) {
      setError(err.message || 'Failed to load request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!responseText.trim()) {
      toast.error('Please write a message');
      return;
    }

    setIsSubmittingResponse(true);
    try {
      const formData = new FormData();
      formData.append('requestId', id);
      formData.append('message', responseText);

      await api.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/res/create-response`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Response sent! The requester will be notified.');
      setResponseText('');
      fetchRequestDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to send response');
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const handleAcceptResponse = async (responseId) => {
    try {
      await api.patch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/res/${responseId}/accept`);
      toast.success('Helper accepted. Chat is ready now.');
      fetchRequestDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to accept response');
    }
  };

  const handleOpenFulfillDialog = () => {
    const defaultHelperId =
      request?.acceptedHelper?._id ||
      responses.find((response) => ['completed', 'accepted'].includes(response.status))?.responder?._id ||
      helperOptions[0]?._id ||
      '';

    setSelectedFulfillHelperId(defaultHelperId);
    setShowFulfillDialog(true);
  };

  const handleFulfillRequest = async () => {
    if (!selectedFulfillHelperId) {
      toast.error('Please select the user who helped you');
      return;
    }

    setIsFulfilling(true);
    try {
      await api.put(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/req/full-fill-req/${id}`, {
        helperId: selectedFulfillHelperId,
      });
      toast.success('Request marked as fulfilled! Thank you!');
      setShowFulfillDialog(false);
      fetchRequestDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to fulfill request');
    } finally {
      setIsFulfilling(false);
    }
  };

  const handleCancelRequest = async () => {
    try {
      await api.put(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/req/cancle-req/${id}`);
      toast.success('Request cancelled');
      fetchRequestDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel request');
    }
  };

  const handleDeleteRequest = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/req/${id}`);
      toast.success('Request deleted');
      navigate('/dashboard/requests');
    } catch (err) {
      toast.error(err.message || 'Failed to delete request');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const getUrgencyBadgeClass = (level) => {
    switch (level) {
      case 'critical': return 'badge-urgency-critical';
      case 'urgent': return 'badge-urgency-urgent';
      default: return 'badge-urgency-normal';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'open': return 'badge-open';
      case 'in-progress': return 'badge-in-progress';
      case 'fulfilled': return 'badge-fulfilled';
      case 'expired': return 'badge-expired';
      case 'cancelled': return 'badge-cancelled';
      default: return '';
    }
  };

  const getResponseBadgeClass = (status) => {
    if (status === 'completed') return 'badge-fulfilled';
    if (status === 'accepted') return 'bg-primary/15 text-primary border border-primary/25';
    if (status === 'rejected') return 'badge-cancelled';
    return 'bg-warning/15 text-warning border border-warning/25';
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h3 className="font-semibold text-foreground mb-2">Request not found</h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button onClick={goBackToRequests}>Back to Requests</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-6 lg:grid-cols-3"
      >
        <div className="space-y-6 lg:col-span-2">
          <Card className="glass-card-elevated overflow-hidden">
            {request.image && (
              <div className="h-48 overflow-hidden">
                <img
                  src={request.image}
                  alt={request.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-xl font-display">{request.title}</CardTitle>
                <div className="flex gap-2 shrink-0">
                  <Badge className={cn('text-xs', getUrgencyBadgeClass(request.urgency))}>
                    {request.urgency}
                  </Badge>
                  <Badge className={cn('text-xs', getStatusBadgeClass(request.status))}>
                    {request.status}
                  </Badge>
                </div>
              </div>
              <CardDescription className="flex items-center gap-2 capitalize">
                {request.category}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="whitespace-pre-wrap text-foreground">{request.description}</p>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {request.locationHint && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span>{request.locationHint}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  {request.contact === 'chat' ? <MessageSquare className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                  <span className="capitalize">{request.contact}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Expires {formatDistanceToNow(new Date(request.expiresAt), { addSuffix: true })}</span>
                </div>
              </div>

              {isOwner && request.status === 'open' && (
                <div className="flex gap-2 border-t pt-4">
                  <Button variant="outline" size="sm" onClick={handleCancelRequest}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive" onClick={() => setShowDeleteDialog(true)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              )}

              {isOwner && !['fulfilled', 'cancelled', 'expired'].includes(request.status) && helperOptions.length > 0 && (
                <div className="flex gap-2 border-t pt-4">
                  <Button className="btn-gradient-primary" onClick={handleOpenFulfillDialog}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Fulfilled
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {(responses.length > 0 || (!isOwner && request.status === 'open')) && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg font-display">Responses ({responses.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {responses.map((response) => (
                  <div key={response._id} className="rounded-lg bg-muted/50 p-4">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={response.responder?.avatar} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(response.responder?.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{response.responder?.fullName}</p>
                          <p className="text-xs text-muted-foreground">@{response.responder?.userName}</p>
                        </div>
                      </div>
                      {isOwner && !['accepted', 'completed'].includes(response.status) && !['fulfilled', 'cancelled', 'expired'].includes(request.status) && (
                        <Button size="sm" onClick={() => handleAcceptResponse(response._id)}>
                          Accept & Chat
                        </Button>
                      )}
                      {response.status !== 'pending' && (
                        <Badge className={getResponseBadgeClass(response.status)}>
                          {response.status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground">{response.message}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(response.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                ))}

                {!isOwner && request.status === 'open' && (
                  <div className="border-t pt-4">
                    <Textarea
                      placeholder={hasAlreadyResponded ? 'You have already responded to this request.' : 'Write your response...'}
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      rows={3}
                      className="mb-3"
                      disabled={hasAlreadyResponded}
                    />
                    <Button
                      onClick={handleSubmitResponse}
                      disabled={hasAlreadyResponded || isSubmittingResponse || !responseText.trim()}
                      className="gap-2"
                    >
                      {isSubmittingResponse ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {hasAlreadyResponded ? 'Response Already Sent' : 'Send Response'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Requested by</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={request.requestedBy?.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {getInitials(request.requestedBy?.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{request.requestedBy?.fullName}</p>
                  <p className="text-sm text-muted-foreground">@{request.requestedBy?.userName}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {acceptedResponses.length > 0 && !request.acceptedHelper && (
            <Card
              className="glass-card border-primary/20"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.1) 0%, hsl(var(--primary) / 0.04) 100%)' }}
            >
              <CardHeader>
                <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                  <HandHeart className="w-4 h-4" />
                  People Helping
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {acceptedResponses.map((response) => (
                  <div key={response._id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={response.responder?.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {getInitials(response.responder?.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{response.responder?.fullName}</p>
                      <p className="truncate text-sm text-muted-foreground">@{response.responder?.userName}</p>
                    </div>
                    <Badge className={getResponseBadgeClass(response.status)}>
                      {response.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {request.acceptedHelper && (
            <Card
              className="glass-card border-success/30"
              style={{ background: 'linear-gradient(135deg, hsl(var(--success) / 0.1) 0%, hsl(var(--success) / 0.05) 100%)' }}
            >
              <CardHeader>
                <CardTitle className="text-sm font-medium text-success flex items-center gap-2">
                  <HandHeart className="w-4 h-4" />
                  Being Helped by
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={request.acceptedHelper?.avatar} />
                    <AvatarFallback className="bg-success/10 text-success font-medium">
                      {getInitials(request.acceptedHelper?.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{request.acceptedHelper?.fullName}</p>
                    <p className="text-sm text-muted-foreground">@{request.acceptedHelper?.userName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{format(new Date(request.createdAt), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Expires</span>
                <span>{format(new Date(request.expiresAt), 'MMM d, h:mm a')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="capitalize">{request.category}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRequest} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showFulfillDialog}
        onOpenChange={(open) => {
          if (isFulfilling) return;
          setShowFulfillDialog(open);
        }}
      >
        <DialogContent className="max-w-2xl overflow-hidden rounded-[1.75rem] border border-border/70 bg-[linear-gradient(180deg,rgba(14,20,32,0.98),rgba(18,27,43,0.98))] p-0 text-white shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
          <div className="relative overflow-hidden p-6 sm:p-7">
            <div className="absolute inset-x-10 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)]" />
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-sky-500/10 blur-3xl" />

            <DialogHeader className="relative space-y-3 text-left">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Confirm fulfillment
              </div>
              <DialogTitle className="text-2xl font-display text-white">
                Who helped you complete this request?
              </DialogTitle>
              <DialogDescription className="max-w-xl text-sm leading-6 text-slate-300">
                Choose the person who actually helped. We will credit their help count and mark this request as fulfilled.
              </DialogDescription>
            </DialogHeader>

            <div className="relative mt-6 space-y-3">
              {helperOptions.length > 0 ? (
                helperOptions.map((helper) => {
                  const isSelected = selectedFulfillHelperId === helper._id;

                  return (
                    <button
                      key={helper._id}
                      type="button"
                      onClick={() => setSelectedFulfillHelperId(helper._id)}
                      className={cn(
                        'w-full rounded-[1.35rem] border px-4 py-4 text-left transition-all duration-200',
                        isSelected
                          ? 'border-primary/60 bg-[linear-gradient(135deg,rgba(20,184,166,0.2),rgba(59,130,246,0.18))] shadow-[0_18px_36px_rgba(20,184,166,0.18)]'
                          : 'border-white/10 bg-white/[0.04] hover:border-primary/30 hover:bg-white/[0.06]'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12 border border-white/10">
                          <AvatarImage src={helper.avatar} alt={helper.fullName} />
                          <AvatarFallback className="bg-primary/15 text-primary">
                            {getInitials(helper.fullName)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-base font-semibold text-white">{helper.fullName}</p>
                              <p className="truncate text-sm text-slate-300">@{helper.userName}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className="border border-white/10 bg-white/10 text-slate-100">
                                {helper.helpCount || 0} helps
                              </Badge>
                              {helper.responseStatus && (
                                <Badge className={getResponseBadgeClass(helper.responseStatus)}>
                                  {helper.responseStatus}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {helper.responseMessage && (
                            <p className="mt-2 line-clamp-2 text-sm text-slate-300">
                              {helper.responseMessage}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-[1.35rem] border border-amber-500/25 bg-amber-500/10 px-4 py-4 text-sm text-amber-100">
                  No responses are available for this request yet, so there is nobody to credit right now.
                </div>
              )}
            </div>

            <DialogFooter className="relative mt-6 flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-between sm:space-x-0">
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.08] hover:text-white"
                onClick={() => setShowFulfillDialog(false)}
                disabled={isFulfilling}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="rounded-xl btn-gradient-primary"
                onClick={handleFulfillRequest}
                disabled={isFulfilling || helperOptions.length === 0 || !selectedFulfillHelperId}
              >
                {isFulfilling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Finishing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Confirm and mark fulfilled
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequestDetail;
