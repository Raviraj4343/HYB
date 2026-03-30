import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { 
  HelpCircle, Search, Filter, Clock, MapPin, 
  MessageSquare, Phone, ChevronRight, Loader2, 
  AlertCircle, RefreshCw, Trash2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'medicine', label: '💊 Medicine' },
  { value: 'notes', label: '📝 Notes' },
  { value: 'sports', label: '⚽ Sports' },
  { value: 'stationary', label: '✏️ Stationary' },
  { value: 'electronics', label: '💻 Electronics' },
  { value: 'books', label: '📚 Books' },
  { value: 'food', label: '🍕 Food' },
  { value: 'transport', label: '🚗 Transport' },
  { value: 'other', label: '📦 Other' },
];

const URGENCY_LEVELS = [
  { value: 'all', label: 'All Urgency' },
  { value: 'normal', label: 'Normal' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'critical', label: 'Critical' },
];

const RequestsList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { socket } = useSocket();
  const canModerateRequests = user?.role === 'super_admin' || user?.role === 'admin';
  
  const category = searchParams.get('category') || 'all';
  const urgency = searchParams.get('urgency') || 'all';

  useEffect(() => {
    fetchRequests();
  }, [category, urgency]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleRequestChanged = () => {
      fetchRequests();
    };

    socket.on('request:changed', handleRequestChanged);
    socket.on('connect', handleRequestChanged);

    return () => {
      socket.off('request:changed', handleRequestChanged);
      socket.off('connect', handleRequestChanged);
    };
  }, [socket, category, urgency]);

  const fetchRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (category !== 'all') params.category = category;
      if (urgency !== 'all') params.urgency = urgency;
      
      const response = await api.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/req/get-all-req`, { params });
      setRequests(response.data.data.requests || []);
    } catch (err) {
      setError(err.message || 'Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
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

  const getCategoryEmoji = (cat) => {
    const categoryItem = CATEGORIES.find(c => c.value === cat);
    return categoryItem?.label.split(' ')[0] || '📦';
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredRequests = requests.filter(req =>
    req.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdminDelete = async (event, requestId, requestTitle) => {
    event.stopPropagation();
    event.preventDefault();

    const reason = window.prompt(`Reason for deleting "${requestTitle}"?`, 'Violates platform guidelines');
    if (!reason) return;

    const confirmed = window.confirm(`Delete "${requestTitle}" permanently?`);
    if (!confirmed) return;

    try {
      await api.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/req/admin/${requestId}`, {
        data: { reason },
      });
      setRequests((prev) => prev.filter((item) => item._id !== requestId));
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to delete request';
      setError(message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Help Requests</h1>
          <p className="text-muted-foreground">Browse and help your community</p>
        </div>
        <Button asChild className="btn-gradient-primary gap-2 shrink-0">
          <Link to="/dashboard/requests/create">
            Create Request
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-0 top-0 bottom-0 flex items-center pl-3">
                <Search className="w-4 h-4 text-muted-foreground" />
              </span>
              <Input
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-left-icon
              />
            </div>
            <div className="flex gap-2">
              <Select value={category} onValueChange={(v) => handleFilterChange('category', v)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={urgency} onValueChange={(v) => handleFilterChange('urgency', v)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Urgency" />
                </SelectTrigger>
                <SelectContent>
                  {URGENCY_LEVELS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">Failed to load requests</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchRequests} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : filteredRequests.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
              <HelpCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No requests found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || category !== 'all' || urgency !== 'all' 
                ? 'Try adjusting your filters'
                : 'Be the first to create a help request'}
            </p>
            <Button asChild className="btn-gradient-primary">
              <Link to="/dashboard/requests/create">Create Request</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div 
          className="grid gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AnimatePresence>
            {filteredRequests.map((request, index) => (
              <motion.div
                key={request._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="glass-card hover-lift group relative cursor-pointer"
                  onClick={() => navigate(`/dashboard/requests/${request._id}`)}
                >
                  {canModerateRequests && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="absolute right-4 top-4 z-10 h-9 w-9 rounded-full border border-destructive/20 bg-background/85 text-destructive hover:bg-destructive/10"
                      onClick={(event) => handleAdminDelete(event, request._id, request.title)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Category Icon */}
                        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0">
                          {getCategoryEmoji(request.category)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                              {request.title}
                            </h3>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge className={cn('text-xs', getUrgencyBadgeClass(request.urgency))}>
                                {request.urgency}
                              </Badge>
                              <Badge className={cn('text-xs', getStatusBadgeClass(request.status))}>
                                {request.status}
                              </Badge>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {request.description}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {/* Author */}
                              <div className="flex items-center gap-1.5">
                                <Avatar className="w-5 h-5">
                                  <AvatarImage src={request.requestedBy?.avatar} />
                                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                    {getInitials(request.requestedBy?.fullName)}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{request.requestedBy?.userName || 'Unknown'}</span>
                              </div>

                              {/* Time */}
                              <div className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>
                                  {request.createdAt 
                                    ? formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })
                                    : 'Recently'}
                                </span>
                              </div>

                              {/* Location */}
                              {request.locationHint && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span className="truncate max-w-24">{request.locationHint}</span>
                                </div>
                              )}

                              {/* Contact */}
                              <div className="flex items-center gap-1">
                                {request.contact === 'chat' 
                                  ? <MessageSquare className="w-3.5 h-3.5" />
                                  : <Phone className="w-3.5 h-3.5" />
                                }
                                <span className="capitalize">{request.contact}</span>
                              </div>
                            </div>

                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                      </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default RequestsList;
