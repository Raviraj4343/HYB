import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { MessageSquare, Plus, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const getStatusBadge = (status) => {
  switch (status) {
    case 'open':
    case 'in-progress':
      return (
        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10">
          Ongoing
        </Badge>
      );
    case 'fulfilled':
      return (
        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/10">
          Completed
        </Badge>
      );
    case 'expired':
      return (
        <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/10">
          Expired
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge className="bg-zinc-500/10 text-zinc-400 border-zinc-500/20 hover:bg-zinc-500/10">
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="glass" className="capitalize">
          {status}
        </Badge>
      );
  }
};

export default function MyRequests() {
  const navigate = useNavigate();

  const { data: requestsData, isLoading, isError } = useQuery({
    queryKey: ['my-requests'],
    queryFn: () => api.get('/req/get-my-req').then((res) => res.data.data),
  });

  const requests = requestsData?.requests || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">My Requests</h1>
          <p className="text-muted-foreground mt-1">Manage and track your active help requests.</p>
        </div>
        <Button onClick={() => navigate('/dashboard/requests/create')} className="shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" /> New Request
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse bg-white/5 border-white/5">
              <CardContent className="h-48"></CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <div className="text-center p-12 rounded-3xl border border-destructive/20 bg-destructive/10 text-destructive">
          <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-80" />
          <h3 className="text-lg font-semibold">Failed to load requests</h3>
          <p className="text-sm opacity-80 mt-2">There was a problem fetching your data.</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center p-16 rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 text-primary">
            <MessageSquare className="h-10 w-10" />
          </div>
          <h3 className="text-2xl font-display font-semibold text-white mb-2">No active requests</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-8">
            You haven't created any help requests yet. Need a hand with something?
          </p>
          <Button onClick={() => navigate('/dashboard/requests/create')}>
            Create your first request
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {requests.map((req, i) => (
            <motion.div
              key={req._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="group relative h-full flex flex-col hover:border-primary/50 transition-colors">
                <CardContent className="flex flex-col flex-1 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-2">
                      {getStatusBadge(req.status)}
                      <Badge variant="outline" className="border-white/10 text-white capitalize">
                        {req.category}
                      </Badge>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      {format(new Date(req.createdAt), 'MMM d, yyyy')}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">{req.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-1">
                    {req.description}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
                    <div className="text-sm font-medium">
                      <span className="text-muted-foreground">Urgency: </span>
                      <span className={`capitalize ${req.urgency === 'critical' ? 'text-destructive' : req.urgency === 'urgent' ? 'text-orange-400' : 'text-primary'}`}>
                        {req.urgency}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" className="group-hover:text-primary" onClick={() => navigate(`/dashboard/requests/${req._id}`)}>
                      View <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
