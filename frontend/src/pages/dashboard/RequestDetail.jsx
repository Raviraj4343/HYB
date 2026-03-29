import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { 
  ArrowLeft, Clock, MapPin, MessageSquare, Phone, 
  Loader2, AlertCircle, User, Calendar, HandHeart,
  CheckCircle, XCircle, Trash2, Edit, Send
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [request, setRequest] = useState(null);
  const [responses, setResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [responseText, setResponseText] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = user?._id === request?.requestedBy?._id;
  const isHelper = user?._id === request?.acceptedHelper?._id;
  const hasAlreadyResponded = responses.some(
    (response) => response.responder?._id === user?._id || response.responder === user?._id
  );

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  const fetchRequestDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [reqResponse, resResponse] = await Promise.all([
        api.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/req/get-req-ById/${id}`),
        api.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/res/get-req-for-res/${id}`).catch(() => ({ data: { data: { responses: [] } } }))
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

  const handleAcceptRequest = async () => {
    try {
      await api.put(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/req/accept-req/${id}`);
      toast.success('You are now helping with this request! 🙌');
      fetchRequestDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to accept request');
    }
  };

  const handleAcceptResponse = async (responseId) => {
    try {
      await api.patch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/res/${responseId}/accept`);
      toast.success('Response accepted!');
      fetchRequestDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to accept response');
    }
  };

  const handleFulfillRequest = async () => {
    try {
      await api.put(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/req/full-fill-req/${id}`);
      toast.success('Request marked as fulfilled! Thank you! 🎉');
      fetchRequestDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to fulfill request');
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

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
        <Button onClick={() => navigate('/dashboard/requests')}>Back to Requests</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid lg:grid-cols-3 gap-6"
      >
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Card */}
          <Card className="glass-card-elevated overflow-hidden">
            {request.image && (
              <div className="h-48 overflow-hidden">
                <img 
                  src={request.image} 
                  alt={request.title}
                  className="w-full h-full object-cover"
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
              <p className="text-foreground whitespace-pre-wrap">{request.description}</p>

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

              {/* Owner Actions */}
              {isOwner && request.status === 'open' && (
                <div className="flex gap-2 pt-4 border-t">
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

              {isOwner && request.status === 'in-progress' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button className="btn-gradient-primary" onClick={handleFulfillRequest}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Fulfilled
                  </Button>
                </div>
              )}

              {/* Helper Actions */}
                {!isOwner && request.status === 'open' && (
                  <div className="pt-4 border-t">
                    <Button
                      className="btn-gradient-primary w-full"
                      onClick={handleAcceptRequest}
                      disabled={hasAlreadyResponded}
                    >
                      <HandHeart className="w-4 h-4 mr-2" />
                      {hasAlreadyResponded ? 'Response Already Sent' : 'I Can Help!'}
                    </Button>
                    {hasAlreadyResponded && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        You have already responded to this request.
                      </p>
                    )}
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Responses Section */}
          {(responses.length > 0 || (!isOwner && request.status === 'open')) && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg font-display">Responses ({responses.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {responses.map((response) => (
                  <div key={response._id} className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-start justify-between gap-3 mb-2">
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
                      {isOwner && response.status === 'pending' && (
                        <Button size="sm" onClick={() => handleAcceptResponse(response._id)}>
                          Accept
                        </Button>
                      )}
                      {response.status !== 'pending' && (
                        <Badge className={response.status === 'accepted' ? 'badge-fulfilled' : 'badge-cancelled'}>
                          {response.status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground">{response.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(response.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                ))}

                {/* Write Response */}
                {!isOwner && request.status === 'open' && (
                  <div className="pt-4 border-t">
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

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Requester Info */}
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

          {/* Helper Info */}
          {request.acceptedHelper && (
            <Card className="glass-card border-success/30" style={{ background: 'linear-gradient(135deg, hsl(var(--success) / 0.1) 0%, hsl(var(--success) / 0.05) 100%)' }}>
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

          {/* Request Meta */}
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

      {/* Delete Confirmation Dialog */}
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
    </div>
  );
};

export default RequestDetail;
