import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Search, Filter, Clock, ArrowRight, Loader2, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

export default function RequestsList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['all-requests'],
    queryFn: () => api.get('/req/get-all-req').then((res) => res.data.data),
  });

  const requests = requestsData?.requests || [];

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'ongoing'
        ? req.status === 'open' || req.status === 'in-progress'
        : req.status === 'fulfilled'; // 'completed'

    const matchesCategory = categoryFilter === 'all' || req.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const resetFilters = () => {
    setStatusFilter('all');
    setCategoryFilter('all');
  };

  const isAnyFilterActive =
    statusFilter !== 'all' || categoryFilter !== 'all';

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Community Requests</h1>
          <p className="text-muted-foreground mt-1">Help out your peers by answering their open requests.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              className="pl-10 h-12 bg-white/5 border-white/10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant={showFilters || isAnyFilterActive ? 'default' : 'outline'}
            className="h-12 border-white/10"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" /> Filter
            {isAnyFilterActive && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
                Active
              </span>
            )}
          </Button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6 backdrop-blur-xl"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Filter */}
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'all', label: 'All Statuses' },
                      { value: 'ongoing', label: 'Ongoing' },
                      { value: 'completed', label: 'Completed' },
                    ].map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setStatusFilter(s.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          statusFilter === s.value
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'all', label: 'All Categories' },
                      { value: 'medicine', label: 'Medicine' },
                      { value: 'notes', label: 'Notes' },
                      { value: 'sports', label: 'Sports' },
                      { value: 'stationary', label: 'Stationery' },
                      { value: 'electronics', label: 'Electronics' },
                      { value: 'books', label: 'Books' },
                      { value: 'food', label: 'Food' },
                      { value: 'transport', label: 'Transport' },
                      { value: 'other', label: 'Other' },
                    ].map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setCategoryFilter(c.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          categoryFilter === c.value
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {isAnyFilterActive && (
                <div className="flex justify-end pt-3 border-t border-white/5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="text-xs text-muted-foreground hover:text-white"
                  >
                    Reset Filters
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredRequests.length === 0 ? (
            <div className="text-center p-12 rounded-3xl border border-white/10 bg-white/5">
              <p className="text-muted-foreground">No requests found.</p>
            </div>
          ) : (
            filteredRequests.map((req, i) => (
              <motion.div
                key={req._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="hover:border-primary/50 transition-colors bg-white/5 backdrop-blur-md">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-6">
                    <div className="flex items-center gap-4 sm:w-1/4">
                      <Avatar className="h-12 w-12 border-2 border-white/10">
                        <AvatarImage src={req.requestedBy?.avatar} />
                        <AvatarFallback>{req.requestedBy?.fullName?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-white">{req.requestedBy?.fullName}</div>
                        <div className="text-sm text-muted-foreground">@{req.requestedBy?.userName}</div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h3 className="text-lg font-semibold text-white truncate mr-1">{req.title}</h3>
                        {getStatusBadge(req.status)}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{req.description}</p>
                      {req.locationHint && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 text-primary/70" />
                          <span className="line-clamp-1">{req.locationHint}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 sm:w-32">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        {format(new Date(req.createdAt), 'MMM d')}
                      </div>
                      <Button onClick={() => navigate(`/dashboard/requests/${req._id}`)}>
                        Details <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
