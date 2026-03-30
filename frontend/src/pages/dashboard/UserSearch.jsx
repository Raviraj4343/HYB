import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, RotateCcw, ShieldBan, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useDebouncedCallback } from 'use-debounce';

const UserSearch = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [blockDrafts, setBlockDrafts] = useState({});

  const canModerate = currentUser?.role === 'super_admin';

  const searchUsers = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setUsers([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get(`/user/search?q=${encodeURIComponent(searchQuery)}`);
      setUsers(response.data.data.users || []);
      setHasSearched(true);
    } catch (err) {
      console.error('Search failed:', err);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const debouncedSearch = useDebouncedCallback(searchUsers, 300);

  const handleQueryChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const updateBlockDraft = (userId, key, value) => {
    setBlockDrafts((prev) => ({
      ...prev,
      [userId]: {
        days: prev[userId]?.days || '',
        reason: prev[userId]?.reason || '',
        [key]: value,
      },
    }));
  };

  const handleBlockUser = async (targetUser) => {
    const draft = blockDrafts[targetUser._id] || {};
    if (!draft.days || !draft.reason?.trim()) {
      toast.error('Enter block days and reason');
      return;
    }

    try {
      const response = await api.post(`/report/block/${targetUser._id}`, {
        days: Number(draft.days),
        reason: draft.reason.trim(),
      });

      setUsers((prev) =>
        prev.map((item) =>
          item._id === targetUser._id
            ? {
                ...item,
                isBlocked: true,
                blockedUntil: response.data.data.blockedUntil,
                blockReason: response.data.data.blockReason,
              }
            : item
        )
      );
      toast.success('User blocked successfully');
    } catch (err) {
      toast.error(err.data?.message || err.response?.data?.message || err.message || 'Failed to block user');
    }
  };

  const handleUnblockUser = async (targetUser) => {
    try {
      await api.post(`/report/unblock/${targetUser._id}`, { resetWarnings: false });
      setUsers((prev) =>
        prev.map((item) =>
          item._id === targetUser._id
            ? {
                ...item,
                isBlocked: false,
                blockedUntil: null,
                blockReason: null,
              }
            : item
        )
      );
      toast.success('User unblocked successfully');
    } catch (err) {
      toast.error(err.data?.message || err.response?.data?.message || err.message || 'Failed to unblock user');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <Users className="w-8 h-8" />
          Find Users
        </h1>
        <p className="text-muted-foreground mt-1">Search for users in the community</p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <span className="pointer-events-none absolute left-0 top-0 bottom-0 flex items-center pl-3">
          <Search className="w-5 h-5 text-muted-foreground" />
        </span>
        <Input
          value={query}
          onChange={handleQueryChange}
          placeholder="Search by name or username..."
          className="h-12 text-lg"
          data-left-icon
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Results */}
      {hasSearched && users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No users found</p>
            <p className="text-muted-foreground">Try a different search term</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <Card
              key={user._id}
              className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50"
              onClick={() => navigate(`/dashboard/users/${user.userName}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12 shrink-0">
                    <AvatarImage
                      src={user.avatar}
                      alt={user.fullName}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {getInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-lg">{user.fullName}</p>
                      {user.isBlocked && <Badge variant="destructive">Blocked</Badge>}
                    </div>
                    <p className="text-muted-foreground">@{user.userName}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {user.branch && (
                        <Badge variant="secondary">{user.branch}</Badge>
                      )}
                      {user.year && (
                        <Badge variant="outline">Year {user.year}</Badge>
                      )}
                      <Badge variant="default" className="bg-accent text-accent-foreground">
                        {user.helpCount || 0} helps
                      </Badge>
                    </div>

                    {user.isBlocked && (
                      <div className="mt-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm">
                        <p className="font-medium text-destructive">Currently blocked</p>
                        <p className="text-muted-foreground">Reason: {user.blockReason || 'Not available'}</p>
                        {user.blockedUntil && (
                          <p className="text-muted-foreground">Until: {new Date(user.blockedUntil).toLocaleString()}</p>
                        )}
                      </div>
                    )}

                    {canModerate && currentUser?._id !== user._id && (
                      <div
                        className="mt-4 space-y-3 rounded-2xl border border-border/70 bg-card/70 p-4"
                        onClick={(e) => e.stopPropagation()}
                      >
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
                            value={blockDrafts[user._id]?.days || ''}
                            onChange={(e) => updateBlockDraft(user._id, 'days', e.target.value)}
                          />
                          <Textarea
                            rows={2}
                            placeholder="Reason for blocking this user"
                            value={blockDrafts[user._id]?.reason || ''}
                            onChange={(e) => updateBlockDraft(user._id, 'reason', e.target.value)}
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="destructive" onClick={() => handleBlockUser(user)}>
                            <ShieldBan className="mr-2 h-4 w-4" />
                            Block User
                          </Button>
                          {user.isBlocked && (
                            <Button size="sm" variant="outline" onClick={() => handleUnblockUser(user)}>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Unblock User
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserSearch;
