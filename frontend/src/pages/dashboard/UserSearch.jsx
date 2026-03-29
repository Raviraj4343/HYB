import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Users } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';

const UserSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchUsers = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setUsers([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/user/search?q=${encodeURIComponent(searchQuery)}`);
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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          value={query}
          onChange={handleQueryChange}
          placeholder="Search by name or username..."
          className="pl-10 h-12 text-lg"
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
                <div className="flex items-center gap-4">
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
                    <p className="font-medium text-lg">{user.fullName}</p>
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
