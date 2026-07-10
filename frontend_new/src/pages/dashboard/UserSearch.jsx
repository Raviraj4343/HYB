import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Users as UsersIcon, MessageSquare } from 'lucide-react';
import api from '@/api/axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function UserSearch() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', searchTerm],
    queryFn: () => api.get(`/user/search?q=${searchTerm}`).then((res) => res.data.data),
    enabled: searchTerm.length > 0, // Only fetch if there is a search term
  });

  const users = usersData?.users || [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-2">Community Directory</h1>
        <p className="text-muted-foreground">Find and connect with other members of the community.</p>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Search by name or username..." 
          className="pl-12 h-14 text-base bg-white/5 border-white/10 rounded-2xl"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {!searchTerm ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <UsersIcon className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-2xl font-display font-semibold text-white mb-2">Start typing to search</h3>
          <p className="text-muted-foreground max-w-sm">
            Enter a name or username in the search bar above to find community members.
          </p>
        </div>
      ) : isLoading ? (
        <div className="text-center p-8 text-muted-foreground">Searching...</div>
      ) : users.length === 0 ? (
        <div className="text-center p-8 border border-white/10 rounded-3xl bg-white/5">
          <p className="text-muted-foreground">No users found matching "{searchTerm}"</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map(user => (
            <Card key={user._id} className="bg-white/5 border-white/10 hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => navigate(`/dashboard/users/${user.userName}`)}>
              <CardContent className="p-6 flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-white/10 group-hover:border-primary/50 transition-colors">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.fullName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white truncate text-lg">{user.fullName}</h4>
                  <p className="text-sm text-muted-foreground truncate">@{user.userName}</p>
                  <p className="text-xs font-medium text-primary mt-1">Help Count: {user.helpCount || 0}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
