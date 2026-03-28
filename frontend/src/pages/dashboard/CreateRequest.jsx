import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'sonner';
import { 
  Loader2, ImagePlus, X, Clock, 
  MapPin, MessageSquare, Phone 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { motion } from 'framer-motion';

const CATEGORIES = [
  { value: 'medicine', label: '💊 Medicine', description: 'Medical supplies or health items' },
  { value: 'notes', label: '📝 Notes', description: 'Study materials and class notes' },
  { value: 'sports', label: '⚽ Sports', description: 'Sports equipment or gear' },
  { value: 'stationary', label: '✏️ Stationary', description: 'Pens, paper, supplies' },
  { value: 'electronics', label: '💻 Electronics', description: 'Chargers, cables, devices' },
  { value: 'books', label: '📚 Books', description: 'Textbooks or reading materials' },
  { value: 'food', label: '🍕 Food', description: 'Food items or meals' },
  { value: 'transport', label: '🚗 Transport', description: 'Rides or vehicle sharing' },
  { value: 'other', label: '📦 Other', description: 'Anything else' },
];

const URGENCY_OPTIONS = [
  { value: 'normal', label: 'Normal', description: 'Can wait a day or two', color: 'text-primary' },
  { value: 'urgent', label: 'Urgent', description: 'Need it within hours', color: 'text-warning' },
  { value: 'critical', label: 'Critical', description: 'Need it immediately', color: 'text-destructive' },
];

const EXPIRY_OPTIONS = [
  { value: '6', label: '6 hours' },
  { value: '12', label: '12 hours' },
  { value: '24', label: '24 hours' },
  { value: '48', label: '48 hours' },
  { value: '72', label: '72 hours' },
];

const CreateRequest = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    urgency: 'normal',
    locationHint: '',
    contact: 'chat',
    expiryDuration: '24',
  });
  
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('category', formData.category);
      submitData.append('urgency', formData.urgency);
      submitData.append('contact', formData.contact);
      submitData.append('expiryDuration', formData.expiryDuration);
      
      if (formData.locationHint) {
        submitData.append('locationHint', formData.locationHint);
      }
      
      if (imageFile) {
        submitData.append('image', imageFile);
      }
      
      const response = await api.post('/req/create-req', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      toast.success('Request created successfully! 🎉');
      navigate(`/dashboard/requests/${response.data.data.request._id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to create request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="glass-card-elevated">
          <CardHeader>
            <CardTitle className="text-2xl font-display">Create Help Request</CardTitle>
            <CardDescription>
              Describe what you need help with and the community will step in
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Need Paracetamol urgently"
                  value={formData.title}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="h-11"
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe what you need in detail. Include any specifics that might help..."
                  value={formData.description}
                  onChange={handleChange}
                  disabled={isLoading}
                  rows={4}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description}</p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => handleSelectChange('category', v)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <span>{cat.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category}</p>
                )}
              </div>

              {/* Urgency */}
              <div className="space-y-3">
                <Label>Urgency Level</Label>
                <RadioGroup
                  value={formData.urgency}
                  onValueChange={(v) => handleSelectChange('urgency', v)}
                  className="grid grid-cols-3 gap-3"
                  disabled={isLoading}
                >
                  {URGENCY_OPTIONS.map((opt) => (
                    <Label
                      key={opt.value}
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border cursor-pointer transition-all ${
                        formData.urgency === opt.value 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value={opt.value} className="sr-only" />
                      <span className={`font-medium ${opt.color}`}>{opt.label}</span>
                      <span className="text-xs text-muted-foreground mt-1">{opt.description}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              {/* Location Hint */}
              <div className="space-y-2">
                <Label htmlFor="locationHint" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location Hint (Optional)
                </Label>
                <Input
                  id="locationHint"
                  name="locationHint"
                  placeholder="e.g., Near Library, H3 Hostel"
                  value={formData.locationHint}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              {/* Contact Preference */}
              <div className="space-y-3">
                <Label>Contact Preference</Label>
                <RadioGroup
                  value={formData.contact}
                  onValueChange={(v) => handleSelectChange('contact', v)}
                  className="flex gap-4"
                  disabled={isLoading}
                >
                  <Label className={`flex items-center gap-3 p-3 px-5 rounded-lg border cursor-pointer transition-all ${
                    formData.contact === 'chat' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}>
                    <RadioGroupItem value="chat" className="sr-only" />
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <span>Chat</span>
                  </Label>
                  <Label className={`flex items-center gap-3 p-3 px-5 rounded-lg border cursor-pointer transition-all ${
                    formData.contact === 'call' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}>
                    <RadioGroupItem value="call" className="sr-only" />
                    <Phone className="w-5 h-5 text-primary" />
                    <span>Call</span>
                  </Label>
                </RadioGroup>
              </div>

              {/* Expiry Duration */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Request Valid For
                </Label>
                <Select 
                  value={formData.expiryDuration} 
                  onValueChange={(v) => handleSelectChange('expiryDuration', v)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Attach Image (Optional)</Label>
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-40 h-40 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <ImagePlus className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Click to upload image</span>
                    <span className="text-xs text-muted-foreground">Max 5MB</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={isLoading}
                    />
                  </label>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => navigate(-1)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 btn-gradient-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Request'
                  )}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default CreateRequest;
