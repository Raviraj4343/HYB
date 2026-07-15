import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Send, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';

export default function CreateRequest() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    urgency: 'urgent',
    contact: 'chat',
    phone: '',
    expiryDuration: '24'
  });
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    if (currentUser?.phone) {
      setFormData(prev => ({ ...prev, phone: currentUser.phone }));
    }
  }, [currentUser]);

  const createRequestMutation = useMutation({
    mutationFn: (newRequest) => api.post('/req/create-req', newRequest, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),
    onSuccess: () => {
      toast.success('Request created successfully');
      navigate('/dashboard/my-requests');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create request');
    },
  });

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 5) {
      toast.error('You can only upload up to 5 images.');
      return;
    }
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      toast.error('Only image files are allowed.');
      return;
    }
    setSelectedFiles([...selectedFiles, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.contact === 'call' && !formData.phone?.trim()) {
      toast.error('Please enter a phone number for call preference.');
      return;
    }

    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('category', formData.category);
    data.append('urgency', formData.urgency);
    data.append('contact', formData.contact);
    data.append('expiryDuration', formData.expiryDuration);
    if (formData.contact === 'call') {
      data.append('phone', formData.phone);
    }
    
    selectedFiles.forEach((file) => {
      data.append('images', file);
    });

    createRequestMutation.mutate(data);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Create a Request</h1>
          <p className="text-muted-foreground">Ask the community for help with your task.</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-primary/20 bg-white/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
            <CardDescription>Be as specific as possible to get the best help.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="E.g., Need help understanding React Context"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your problem in detail..."
                  className="min-h-[150px]"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="" disabled className="bg-background text-white">Select a category</option>
                    <option value="medicine" className="bg-background text-white">💊 Medicine</option>
                    <option value="notes" className="bg-background text-white">📝 Notes</option>
                    <option value="sports" className="bg-background text-white">⚽ Sports</option>
                    <option value="stationary" className="bg-background text-white">✏️ Stationary</option>
                    <option value="electronics" className="bg-background text-white">💻 Electronics</option>
                    <option value="books" className="bg-background text-white">📚 Books</option>
                    <option value="food" className="bg-background text-white">🍕 Food</option>
                    <option value="transport" className="bg-background text-white">🚗 Transport</option>
                    <option value="other" className="bg-background text-white">📦 Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgency</Label>
                  <select
                    id="urgency"
                    className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                  >
                    <option value="normal" className="bg-background text-white">Low - No rush</option>
                    <option value="urgent" className="bg-background text-white">Medium - Need it soon</option>
                    <option value="critical" className="bg-background text-white">High - Urgent help needed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact Preference</Label>
                  <select
                    id="contact"
                    className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  >
                    <option value="chat" className="bg-background text-white">💬 Chat in App</option>
                    <option value="call" className="bg-background text-white">📞 Phone Call</option>
                  </select>
                </div>

                {formData.contact === 'call' && (
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="E.g., +91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required={formData.contact === 'call'}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Your phone number will only be visible to the helper you accept.</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="expiryDuration">Expiry Duration</Label>
                  <select
                    id="expiryDuration"
                    className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    value={formData.expiryDuration}
                    onChange={(e) => setFormData({ ...formData, expiryDuration: e.target.value })}
                  >
                    <option value="1" className="bg-background text-white">1 Hour</option>
                    <option value="3" className="bg-background text-white">3 Hours</option>
                    <option value="6" className="bg-background text-white">6 Hours</option>
                    <option value="12" className="bg-background text-white">12 Hours</option>
                    <option value="24" className="bg-background text-white">24 Hours (1 Day)</option>
                    <option value="48" className="bg-background text-white">48 Hours (2 Days)</option>
                    <option value="72" className="bg-background text-white">72 Hours (3 Days)</option>
                  </select>
                </div>
              </div>

              {/* Multiple Image Upload Area */}
              <div className="space-y-3">

                <Label>Attach Images (Max 5)</Label>
                <div className="border-2 border-dashed border-white/10 hover:border-primary/50 transition-colors rounded-2xl p-6 flex flex-col items-center justify-center bg-white/[0.02] cursor-pointer relative group">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-sm font-semibold text-white">Click or drag images to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG, WEBP (up to 5MB each)</p>
                </div>

                {/* Previews */}
                {selectedFiles.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-2">
                    {selectedFiles.map((file, index) => {
                      const url = URL.createObjectURL(file);
                      return (
                        <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group">
                          <img src={url} alt="upload preview" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:bg-black transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-4">
                <Button variant="ghost" type="button" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createRequestMutation.isPending} className="bg-primary hover:bg-primary/90 text-white">
                  {createRequestMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Post Request
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
