import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function CreateRequest() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: '', description: '', category: '', urgency: 'urgent' });

  const createRequestMutation = useMutation({
    mutationFn: (newRequest) => api.post('/req/create-req', newRequest),
    onSuccess: () => {
      toast.success('Request created successfully');
      navigate('/dashboard/my-requests');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create request');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createRequestMutation.mutate(formData);
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
