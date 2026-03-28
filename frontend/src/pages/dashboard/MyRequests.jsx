import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { 
  HandHeart, Clock, MapPin, ChevronRight, Loader2, 
  AlertCircle, RefreshCw, Plus, Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const MyRequests = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [myRequests, setMyRequests] = useState([]);
  const [myResponses, setMyResponses] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [isLoadingResponses, setIsLoadingResponses] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyRequests();
    fetchMyResponses();
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    const handleRealtimeRefresh = () => {
      fetchMyRequests();
      fetchMyResponses();
    };

    socket.on('request:changed', handleRealtimeRefresh);
    socket.on('notification:new', handleRealtimeRefresh);
    socket.on('connect', handleRealtimeRefresh);

    return () => {
      socket.off('request:changed', handleRealtimeRefresh);
      socket.off('notification:new', handleRealtimeRefresh);
      socket.off('connect', handleRealtimeRefresh);
    };
  }, [socket]);

  const fetchMyRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const response = await api.get('/req/get-my-req');
      setMyRequests(response.data.data.requests || []);
    } catch (err) {
      console.error('Failed to load my requests:', err);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const fetchMyResponses = async () => {
    setIsLoadingResponses(true);
    try {
      const response = await api.get('/res/get-my-res');
      setMyResponses(response.data.data.responses || []);
    } catch (err) {
      console.error('Failed to load my responses:', err);
    } finally {
      setIsLoadingResponses(false);
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
      case 'pending': return 'bg-warning/15 text-warning border border-warning/25';
      case 'accepted': return 'badge-fulfilled';
      case 'rejected': return 'badge-cancelled';
      default: return '';
    }
  };

  const getCategoryEmoji = (cat) => {
    const emojis = {
      medicine: '💊', notes: '📝', sports: '⚽', stationary: '✏️',
      electronics: '💻', books: '📚', food: '🍕', transport: '🚗', other: '📦'
    };
    return emojis[cat] || '📦';
  };

  const RequestCard = ({ request }) => (
    <Link to={`/dashboard/requests/${request._id}`}>
      <Card className="glass-card hover-lift cursor-pointer group">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg shrink-0">
              {getCategoryEmoji(request.category)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {request.title}
                </h3>
                <div className="flex gap-1.5 shrink-0">
                  <Badge className={cn('text-xs', getStatusBadgeClass(request.status))}>
                    {request.status}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                {request.description}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                </div>
                <Badge className={cn('text-xs', getUrgencyBadgeClass(request.urgency))}>
                  {request.urgency}
                </Badge>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const ResponseCard = ({ response }) => (
    <Link to={`/dashboard/requests/${response.request?._id}`}>
      <Card className="glass-card hover-lift cursor-pointer group">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <HandHeart className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {response.request?.title || 'Request'}
                </h3>
                <Badge className={cn('text-xs', getStatusBadgeClass(response.status))}>
                  {response.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                {response.message}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(response.createdAt), { addSuffix: true })}
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">My Activity</h1>
          <p className="text-muted-foreground">Track your requests and responses</p>
        </div>
        <Button asChild className="btn-gradient-primary gap-2 shrink-0">
          <Link to="/dashboard/requests/create">
            <Plus className="w-4 h-4" />
            New Request
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="requests" className="gap-2">
            My Requests
            {myRequests.length > 0 && (
              <Badge variant="secondary" className="ml-1">{myRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="responses" className="gap-2">
            My Responses
            {myResponses.length > 0 && (
              <Badge variant="secondary" className="ml-1">{myResponses.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* My Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          {isLoadingRequests ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : myRequests.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <div className="w-14 h-14 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                  <HandHeart className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">No requests yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first help request to get started
                </p>
                <Button asChild className="btn-gradient-primary">
                  <Link to="/dashboard/requests/create">Create Request</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <motion.div className="grid gap-3">
              <AnimatePresence>
                {myRequests.map((request, index) => (
                  <motion.div
                    key={request._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <RequestCard request={request} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </TabsContent>

        {/* My Responses Tab */}
        <TabsContent value="responses" className="space-y-4">
          {isLoadingResponses ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : myResponses.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <div className="w-14 h-14 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                  <HandHeart className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">No responses yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start helping others by responding to requests
                </p>
                <Button asChild variant="outline">
                  <Link to="/dashboard/requests">Browse Requests</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <motion.div className="grid gap-3">
              <AnimatePresence>
                {myResponses.map((response, index) => (
                  <motion.div
                    key={response._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ResponseCard response={response} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyRequests;
