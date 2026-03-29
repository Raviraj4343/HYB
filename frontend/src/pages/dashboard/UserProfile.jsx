import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Flag, HelpCircle, MessageSquare, Heart } from 'lucide-react';

const UserProfile = () => {
  const { userName } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/user/profile/${userName}`);
        setProfile(response.data.data.user);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (userName) fetchProfile();
  }, [userName]);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isOwnProfile = currentUser?.userName === userName;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium">User not found</p>
            <p className="text-muted-foreground">The user you're looking for doesn't exist</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile.avatar} />
              <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                {getInitials(profile.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl font-display font-bold">{profile.fullName}</h1>
              <p className="text-muted-foreground">@{profile.userName}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                {profile.branch && (
                  <Badge variant="secondary">{profile.branch}</Badge>
                )}
                {profile.year && (
                  <Badge variant="outline">Year {profile.year}</Badge>
                )}
                {profile.hostel && (
                  <Badge variant="outline">{profile.hostel}</Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-muted rounded-xl">
              <div className="flex items-center justify-center gap-2 mb-1">
                <HelpCircle className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl font-bold">{profile.stats?.requestsCreated || 0}</p>
              <p className="text-xs text-muted-foreground">Requests</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-xl">
              <div className="flex items-center justify-center gap-2 mb-1">
                <MessageSquare className="w-5 h-5 text-accent" />
              </div>
              <p className="text-2xl font-bold">{profile.stats?.responsesGiven || 0}</p>
              <p className="text-xs text-muted-foreground">Responses</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-xl">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Heart className="w-5 h-5 text-destructive" />
              </div>
              <p className="text-2xl font-bold">{profile.stats?.helpCount || 0}</p>
              <p className="text-xs text-muted-foreground">Helped</p>
            </div>
          </div>

          {/* Actions */}
          {!isOwnProfile && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => navigate(`/dashboard/report?userId=${profile._id}&userName=${profile.userName}`)}
              >
                <Flag className="w-4 h-4" />
                Report User
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;
