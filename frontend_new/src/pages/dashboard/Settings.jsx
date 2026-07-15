import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Loader2, Save, User, Building2, GraduationCap, Home, Phone } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function Settings() {
  const { user, updateProfile, updateAvatar, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    branch: user?.branch || '',
    year: user?.year || '',
    hostel: user?.hostel || '',
    phone: user?.phone || '',
  });


  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await updateAvatar(file);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await updateProfile(formData);
    setIsLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and profile details.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-8">
        <div className="space-y-8">
          {/* Profile Settings */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Public Profile</CardTitle>
              <CardDescription>This information will be displayed publicly so be careful what you share.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-6 mb-8">
                  <div className="relative group cursor-pointer">
                    <input type="file" id="avatar-upload" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                    <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="text-2xl">{user?.fullName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer backdrop-blur-sm">
                      <Camera className="h-8 w-8 text-white" />
                    </label>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Profile Picture</h3>
                    <p className="text-sm text-muted-foreground">Click the image to upload a new avatar.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="fullName"
                        name="fullName"
                        className="pl-10"
                        value={formData.fullName}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="branch">Branch</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="branch"
                          name="branch"
                          className="pl-10"
                          value={formData.branch}
                          onChange={handleChange}
                          placeholder="E.g., CSE, ECE"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year">Year</Label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <select
                          id="year"
                          name="year"
                          className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          value={formData.year}
                          onChange={handleChange}
                        >
                          <option value="" disabled className="bg-background text-white">Select Year</option>
                          <option value="1" className="bg-background text-white">1st Year</option>
                          <option value="2" className="bg-background text-white">2nd Year</option>
                          <option value="3" className="bg-background text-white">3rd Year</option>
                          <option value="4" className="bg-background text-white">4th Year</option>
                          <option value="5" className="bg-background text-white">5th Year</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hostel">Hostel Number</Label>
                      <div className="relative">
                        <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="hostel"
                          name="hostel"
                          className="pl-10"
                          value={formData.hostel}
                          onChange={handleChange}
                          placeholder="E.g., H-3, Block A"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="phone"
                          name="phone"
                          className="pl-10"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="E.g., +91 98765 43210"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={isLoading} className="shadow-lg shadow-primary/20">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Email Address</div>
                <div className="text-white mt-1">{user?.email}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Username</div>
                <div className="text-white mt-1">@{user?.userName}</div>
              </div>
              <div className="pt-4 border-t border-white/10">
                <Button variant="destructive" className="w-full" onClick={logout}>
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
