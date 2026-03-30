import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Camera, Loader2, User, Lock, Eye, EyeOff, Check } from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const { user, updateProfile, updateAvatar, changePassword } = useAuth();

  // Profile state
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    branch: user?.branch || '',
    customBranch: '',
    year: user?.year || '',
    hostel: user?.hostel || '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

 const handleProfileSubmit = async (e) => {
  e.preventDefault();
  setIsUpdatingProfile(true);

  // 1️⃣ Upload avatar separately
  if (avatarFile) {
    await updateAvatar(avatarFile);
    setAvatarFile(null);
    setAvatarPreview(null);
  }

  // 2️⃣ Update profile fields ONLY
  const finalBranch = profileData.branch === 'Other' ? (profileData.customBranch || '') : profileData.branch;
  await updateProfile({ fullName: profileData.fullName, branch: finalBranch, year: profileData.year, hostel: profileData.hostel });

  setIsUpdatingProfile(false);
};



  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsChangingPassword(true);
    const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
    
    if (result.success) {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
    
    setIsChangingPassword(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="password" className="gap-2">
            <Lock className="w-4 h-4" />
            Password
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile details and avatar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={avatarPreview || user?.avatar} />
                      <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                        {getInitials(user?.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <label
                      htmlFor="avatar-upload"
                      className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </label>
                  </div>
                  <div>
                    <p className="font-medium">{user?.fullName}</p>
                    <p className="text-sm text-muted-foreground">@{user?.userName}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG or GIF. Max 5MB.
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Profile Fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={profileData.fullName}
                      onChange={handleProfileChange}
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch</Label>
                    <Select value={profileData.branch} onValueChange={(v) => setProfileData(prev => ({ ...prev, branch: v, ...(v !== 'Other' ? { customBranch: '' } : {}) }))}>
                      <SelectTrigger className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                        <SelectValue placeholder="Branch" />
                      </SelectTrigger>
                      <SelectContent className="border-border/70 bg-[#151b24] text-foreground">
                        {[
                          { value: 'CSE', label: 'BTech - CSE' },
                          { value: 'IT', label: 'BTech - IT' },
                          { value: 'ECE', label: 'BTech - ECE' },
                          { value: 'EE', label: 'BTech - EE' },
                          { value: 'ME', label: 'BTech - ME' },
                          { value: 'CE', label: 'BTech - CE' },
                          { value: 'MTech', label: 'MTech' },
                          { value: 'BBA', label: 'BBA' },
                          { value: 'Other', label: 'Other (enter manually)' },
                        ].map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-foreground focus:bg-white/10 focus:text-foreground">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {profileData.branch === 'Other' && (
                      <Input
                        id="customBranch"
                        name="customBranch"
                        value={profileData.customBranch}
                        onChange={(e) => setProfileData(prev => ({ ...prev, customBranch: e.target.value }))}
                        placeholder="Enter your branch"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      name="year"
                      type="number"
                      min="1"
                      max="5"
                      value={profileData.year}
                      onChange={handleProfileChange}
                      placeholder="1-5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hostel">Hostel</Label>
                    <Input
                      id="hostel"
                      name="hostel"
                      value={profileData.hostel}
                      onChange={handleProfileChange}
                      placeholder="e.g., H1, H2"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isUpdatingProfile} className="gap-2">
                    {isUpdatingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                      className="pr-10"
                      data-right-icon
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                      className="pr-10"
                      data-right-icon
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isChangingPassword} className="gap-2">
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Changing...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Change Password
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
