import { useEffect, useMemo, useState } from 'react';
import {
  BookOpenText,
  Building2,
  BusFront,
  CalendarDays,
  ExternalLink,
  FileText,
  Newspaper,
  Pencil,
  Plus,
  Sparkles,
  ShieldCheck,
  Trash2,
  Upload,
  UserSquare2
  ,Maximize2, Minimize2, X
} from 'lucide-react';
import ResourceCard from '@/components/campus/ResourceCard';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CATEGORY_OPTIONS = [
  {
    value: 'faculty_contacts',
    title: 'Professor Details',
    description: 'Faculty contacts with department, designation, email, and phone details.',
    icon: UserSquare2,
    accent: 'from-cyan-500/20 via-sky-500/14 to-transparent',
    badge: 'Faculty',
  },
  {
    value: 'hostel_updates',
    title: 'Hostel Details',
    description: 'Warden contacts, hostel notices, and mess menu photos.',
    icon: Building2,
    accent: 'from-emerald-500/20 via-teal-500/14 to-transparent',
    badge: 'Hostel',
  },
  {
    value: 'bus_timing',
    title: 'Bus Timing',
    description: 'Transport schedules, route changes, and pickup details.',
    icon: BusFront,
    accent: 'from-amber-500/20 via-orange-500/14 to-transparent',
    badge: 'Transport',
  },
  {
    value: 'holiday_notice',
    title: 'Holiday List',
    description: 'Academic breaks, closure notices, and official holiday updates.',
    icon: CalendarDays,
    accent: 'from-violet-500/20 via-fuchsia-500/14 to-transparent',
    badge: 'Calendar',
  },
  {
    value: 'campus_news',
    title: 'News',
    description: 'Important announcements, events, and campus-wide updates.',
    icon: Newspaper,
    accent: 'from-primary/20 via-sky-500/14 to-transparent',
    badge: 'Updates',
  },
];

const SINGLE_IMAGE_CATEGORIES = new Set(['bus_timing', 'holiday_notice']);
const CATEGORY_FIELD_RULES = {
  faculty_contacts: {
    showTitle: false,
    showDescription: false,
    showProfessorFields: true,
    showLocation: true,
    showExternalLink: false,
    showEffectiveDate: false,
    attachmentLabel: 'Optional supporting image',
    attachmentAccept: 'image/*',
  },
  hostel_updates: {
    showTitle: false,
    showDescription: false,
    showHostelFields: true,
    showLocation: true,
    showExternalLink: true,
    showEffectiveDate: false,
    attachmentLabel: 'Optional image, mess menu photo, or hostel notice attachment',
    attachmentAccept: 'image/*',
  },
  bus_timing: {
    showTitle: false,
    showDescription: false,
    showLocation: false,
    showExternalLink: false,
    showEffectiveDate: true,
    attachmentLabel: 'Upload the latest bus timing image or PDF',
    attachmentAccept: 'image/*,.pdf,application/pdf',
  },
  holiday_notice: {
    showTitle: false,
    showDescription: false,
    showLocation: false,
    showExternalLink: false,
    showEffectiveDate: true,
    attachmentLabel: 'Upload the latest holiday list image or PDF',
    attachmentAccept: 'image/*,.pdf,application/pdf',
  },
  campus_news: {
    showTitle: true,
    showDescription: true,
    showLocation: false,
    showExternalLink: false,
    showEffectiveDate: false,
    attachmentLabel: 'Optional poster or supporting image',
    attachmentAccept: 'image/*',
  },
};

const EMPTY_FORM = {
  category: 'faculty_contacts',
  title: '',
  description: '',
  contactName: '',
  phoneNumber: '',
  location: '',
  externalLink: '',
  effectiveDate: '',
  sortOrder: '0',
  professorName: '',
  designation: '',
  department: '',
  email: '',
  phone: '',
  hostelName: '',
  wardenName: '',
  wardenPhone: '',
  messMenuNote: '',
};

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const CampusResources = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [viewCategory, setViewCategory] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isViewFullScreen, setIsViewFullScreen] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailFullScreen, setIsDetailFullScreen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]); // for multiple news images
  const [wardens, setWardens] = useState([]);
  const [removeImage, setRemoveImage] = useState(false);
  const isSuperAdmin = user?.role === 'super_admin';
  const fieldRules = CATEGORY_FIELD_RULES[form.category] || CATEGORY_FIELD_RULES.faculty_contacts;

  const groupedResources = useMemo(() => {
    return CATEGORY_OPTIONS.reduce((acc, option) => {
      acc[option.value] = resources.filter((resource) => resource.category === option.value);
      return acc;
    }, {});
  }, [resources]);

  const fetchResources = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/campus-resources');
      setResources(response.data.data?.resources || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load campus resources');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const openCreateDialog = (category) => {
    setEditingResource(null);
    setForm({ ...EMPTY_FORM, category: category || EMPTY_FORM.category });
    setImageFile(null);
    setImageFiles([]);
    setWardens([]);
    setRemoveImage(false);
    setIsDialogOpen(true);
    // reset scroll of dialog body on next paint
    setTimeout(() => {
      const body = document.getElementById('campus-resource-dialog-body');
      if (body) body.scrollTop = 0;
    }, 120);
  };

  const openViewCategory = (category) => {
    setViewCategory(category);
    setIsViewFullScreen(false);
    setIsViewDialogOpen(true);
    // small delay to ensure dialog body exists before scrolling
    setTimeout(() => {
      const body = document.getElementById('campus-resource-view-body');
      if (body) body.scrollTop = 0;
    }, 120);
  };

  const closeViewDialog = () => {
    setIsViewDialogOpen(false);
    setViewCategory(null);
    setIsViewFullScreen(false);
  };

  const openResourceDetail = async (resourceId) => {
    try {
      setIsDetailFullScreen(false);
      // close the category view dialog to avoid dual dialogs/icons
      setIsViewDialogOpen(false);
      setViewCategory(null);
      setIsDetailOpen(true);
      // fetch single resource
      const resp = await api.get(`/campus-resources/${resourceId}`);
      setSelectedResource(resp.data.data?.resource || null);
      // scroll top
      setTimeout(() => {
        const b = document.getElementById('campus-resource-detail-body');
        if (b) b.scrollTop = 0;
      }, 80);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load resource');
      setIsDetailOpen(false);
    }
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    setSelectedResource(null);
    setIsDetailFullScreen(false);
  };

  const openEditDialog = (resource) => {
    setEditingResource(resource);
    setForm({
      category: resource.category,
      title: resource.title || '',
      description: resource.description || '',
      contactName: resource.contactName || '',
      phoneNumber: resource.phoneNumber || '',
      location: resource.location || '',
      externalLink: resource.externalLink || '',
      effectiveDate: resource.effectiveDate ? new Date(resource.effectiveDate).toISOString().slice(0, 10) : '',
      sortOrder: String(resource.sortOrder ?? 0),
      professorName: resource.professorName || '',
      designation: resource.designation || '',
      department: resource.department || '',
      email: resource.email || '',
      phone: resource.phone || '',
      hostelName: resource.hostelName || '',
      wardenName: resource.wardenName || '',
      wardenPhone: resource.wardenPhone || '',
      messMenuNote: resource.messMenuNote || '',
    });
    setImageFile(null);
    setImageFiles(resource.images || []);
    setWardens(resource.wardens || []);
    setRemoveImage(false);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingResource(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setRemoveImage(false);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Client-side validation per category
      if (form.category === 'campus_news') {
        if (!form.title?.trim() || !form.description?.trim()) {
          toast.error('News requires a title and description');
          setIsSaving(false);
          return;
        }
      }

      if (form.category === 'faculty_contacts') {
        if (!form.professorName?.trim() || !form.designation?.trim() || !form.department?.trim()) {
          toast.error('Please provide professor name, designation and department');
          setIsSaving(false);
          return;
        }
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
          toast.error('Please provide a valid email');
          setIsSaving(false);
          return;
        }
      }

      if (form.category === 'hostel_updates') {
        if (!form.hostelName?.trim()) {
          toast.error('Please provide hostel name');
          setIsSaving(false);
          return;
        }
        // at least one warden required either in wardens list or single fields
        if ((wardens.length === 0 || wardens.every(w => !w.name.trim())) && !form.wardenName?.trim()) {
          toast.error('Please add at least one warden');
          setIsSaving(false);
          return;
        }
      }

      if (SINGLE_IMAGE_CATEGORIES.has(form.category) && !editingResource) {
        // require an uploaded file when creating a single notice resource
        if (!imageFile && imageFiles.length === 0) {
          toast.error('Please upload the required image or PDF for this section');
          setIsSaving(false);
          return;
        }
      }

      const payload = new FormData();
      const normalizedForm = {
        ...form,
        title: fieldRules.showTitle ? form.title : '',
        description: fieldRules.showDescription ? form.description : '',
        contactName: '',
        phoneNumber: '',
        location: fieldRules.showLocation ? form.location : '',
        externalLink: fieldRules.showExternalLink ? form.externalLink : '',
        effectiveDate: fieldRules.showEffectiveDate ? form.effectiveDate : '',
        professorName: fieldRules.showProfessorFields ? form.professorName : '',
        designation: fieldRules.showProfessorFields ? form.designation : '',
        department: fieldRules.showProfessorFields ? form.department : '',
        email: fieldRules.showProfessorFields ? form.email : '',
        phone: fieldRules.showProfessorFields ? form.phone : '',
        hostelName: fieldRules.showHostelFields ? form.hostelName : '',
        wardenName: fieldRules.showHostelFields ? form.wardenName : '',
        wardenPhone: fieldRules.showHostelFields ? form.wardenPhone : '',
        messMenuNote: fieldRules.showHostelFields ? form.messMenuNote : '',
      };

      Object.entries(normalizedForm).forEach(([key, value]) => {
        payload.append(key, value ?? '');
      });

      // attach files according to category
      if (fieldRules.attachmentAccept && (form.category === 'bus_timing' || form.category === 'holiday_notice')) {
        // require a file for single-notice categories on create
        if (!editingResource && !imageFile && imageFiles.length === 0) {
          throw new Error('Please upload the required image or PDF for this section.');
        }
      }

      if (imageFile) {
        payload.append('image', imageFile);
      }

      // multiple images (news)
      if (form.category === 'campus_news' && imageFiles && imageFiles.length > 0) {
        imageFiles.forEach((f) => {
          if (f instanceof File) payload.append('images', f);
        });
      }

      // mess menu for hostel
      if (form.category === 'hostel_updates' && imageFile) {
        // allow imageFile to be messMenu if user selected
        payload.append('messMenu', imageFile);
      }

      // wardens
      if (form.category === 'hostel_updates') {
        payload.append('wardens', JSON.stringify(wardens || []));
      }

      if (removeImage) {
        payload.append('removeImage', 'true');
      }

      if (editingResource) {
        await api.put(`/campus-resources/${editingResource._id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Campus resource updated');
      } else {
        await api.post('/campus-resources', payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Campus resource created');
      }

      closeDialog();
      fetchResources();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save campus resource');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (resourceId) => {
    const confirmed = window.confirm('Delete this campus resource? This cannot be undone.');
    if (!confirmed) return;

    try {
      await api.delete(`/campus-resources/${resourceId}`);
      toast.success('Campus resource deleted');
      fetchResources();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete campus resource');
    }
  };

  const renderCategoryMeta = (resource) => {
    if (resource.category === 'faculty_contacts') {
      return [
        { label: 'Designation', value: resource.designation },
        { label: 'Department', value: resource.department },
        { label: 'Email', value: resource.email },
        { label: 'Phone', value: resource.phone },
        { label: 'Office', value: resource.location },
      ].filter((item) => item.value);
    }

    if (resource.category === 'hostel_updates') {
      return [
        { label: 'Hostel', value: resource.hostelName },
        { label: 'Warden', value: resource.wardenName },
        { label: 'Warden Phone', value: resource.wardenPhone },
        { label: 'Location', value: resource.location },
        { label: 'Mess Note', value: resource.messMenuNote },
      ].filter((item) => item.value);
    }

    if (resource.category === 'campus_news') {
      return [];
    }

    return [
      { label: 'Contact', value: resource.contactName },
      { label: 'Phone', value: resource.phoneNumber },
      { label: 'Location', value: resource.location },
    ].filter((item) => item.value);
  };

  return (
    <div className="space-y-8">
      {/* Category grid overview - clickable */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {CATEGORY_OPTIONS.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => {
                  if (isSuperAdmin) {
                    openCreateDialog(cat.value);
                    // ensure dialog body scrolls to top after opening
                    setTimeout(() => {
                      const body = document.getElementById('campus-resource-dialog-body');
                      if (body) body.scrollTop = 0;
                    }, 120);
                  } else {
                    // show a read-only list of resources for this category to normal users
                    openViewCategory(cat.value);
                  }
                }}
                className="text-left rounded-xl border border-border/60 bg-background/80 p-4 hover:shadow-md transition transform hover:-translate-y-1 nav-focus"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate font-semibold text-foreground">{cat.title}</div>
                      <div className="text-xs text-muted-foreground rounded-full border border-border/50 px-2 py-0.5">{cat.badge}</div>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">{cat.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
      <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.56),rgba(255,255,255,0.22))] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] dark:bg-[linear-gradient(135deg,rgba(20,184,166,0.10),rgba(59,130,246,0.06)_50%,rgba(15,23,42,0.24))] dark:shadow-[0_24px_60px_rgba(0,0,0,0.16)] lg:p-8">
        <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge className="mb-4 rounded-full border border-primary/15 bg-white/65 px-3 py-1 text-xs font-medium text-foreground dark:border-white/10 dark:bg-white/10 dark:text-white/90">
              <BookOpenText className="mr-1.5 h-3.5 w-3.5" />
              Campus Resources
            </Badge>
            <h1 className="text-3xl font-display font-semibold text-foreground dark:text-white sm:text-[2.35rem]">
              College assets in one reliable place
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground/70 dark:text-white/68 sm:text-base">
              Keep emergency numbers, hostel contacts, bus timings, holiday notices, and campus news organized in a shared resource hub.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-primary/15 bg-primary/8 px-4 py-3 text-sm text-foreground/75 dark:text-white/75">
              {isSuperAdmin ? (
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Super admin can publish, edit, and remove resources
                </div>
              ) : (
                'Read-only for members. Resource moderation stays with super admin.'
              )}
            </div>
            {isSuperAdmin && (
              <Button className="h-12 rounded-2xl btn-gradient-primary px-5 shadow-[0_16px_34px_rgba(20,184,166,0.24)]" onClick={() => openCreateDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Resource
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Sections removed: presenting only the category grid as requested */}

      <Dialog open={isDialogOpen} onOpenChange={(open) => (!open ? closeDialog() : setIsDialogOpen(true))}>
            <DialogContent id="campus-resource-dialog" className="ds-dialog max-h-[92vh] overflow-hidden rounded-[1.8rem] p-0 sm:max-w-4xl" role="dialog" aria-modal="true">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="sticky top-0 z-10 border-b bg-background/95 px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    <Sparkles className="h-3 w-3" />
                    Super Admin
                  </div>
                  <DialogTitle className="text-lg font-semibold">
                    {editingResource ? 'Edit resource' : 'Add resource'}
                  </DialogTitle>
                </div>
                <div className="text-sm text-muted-foreground">Only show required fields for selected category</div>
              </div>
            </DialogHeader>

            <div id="campus-resource-dialog-body" className="dialog-body custom-scrollbar">
              <div className="rounded-lg border border-border/60 bg-background/90 p-2">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
                <div className="custom-scrollbar box-scroll space-y-4 pr-2">
                        <div className="rounded-lg border border-border/60 bg-background p-4 shadow-sm">
                    <div className="mb-4">
                      <h3 className="text-lg font-display font-semibold text-foreground">Core details</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {SINGLE_IMAGE_CATEGORIES.has(form.category)
                          ? 'This section is a single notice upload, so the form stays minimal on purpose.'
                          : 'Only the fields relevant to this category are shown here.'}
                      </p>
                    </div>

                    <div className={cn('grid gap-4', fieldRules.showTitle ? 'md:grid-cols-2' : 'md:grid-cols-1')}>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Category</label>
                        <Select value={form.category} onValueChange={(value) => handleChange('category', value)}>
                          <SelectTrigger className="h-12 rounded-2xl">
                            <SelectValue placeholder="Choose a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORY_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {fieldRules.showTitle && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Title</label>
                        <Input className="h-10 rounded-lg" value={form.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="e.g. Prof. Sharma - CSE Office" required />
                      </div>
                      )}
                    </div>

                    {fieldRules.showProfessorFields && (
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Professor Name</label>
                          <Input className="h-10 rounded-lg" value={form.professorName} onChange={(e) => handleChange('professorName', e.target.value)} placeholder="Prof. Sharma" required />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Designation</label>
                          <Input className="h-10 rounded-lg" value={form.designation} onChange={(e) => handleChange('designation', e.target.value)} placeholder="Assistant Professor" required />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Department</label>
                          <Input className="h-10 rounded-lg" value={form.department} onChange={(e) => handleChange('department', e.target.value)} placeholder="Computer Science" required />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Email</label>
                          <Input type="email" className="h-10 rounded-lg" value={form.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="faculty@college.edu" required />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Phone</label>
                          <Input className="h-10 rounded-lg" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="+91 ..." required />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Office / Location</label>
                          <Input className="h-10 rounded-lg" value={form.location} onChange={(e) => handleChange('location', e.target.value)} placeholder="CSE block, room 214" />
                        </div>
                      </div>
                    )}

                    {fieldRules.showHostelFields && (
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Hostel Name</label>
                          <Input className="h-10 rounded-lg" value={form.hostelName} onChange={(e) => handleChange('hostelName', e.target.value)} placeholder="Hostel H-9" required />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Warden Name</label>
                          <Input className="h-10 rounded-lg" value={form.wardenName} onChange={(e) => handleChange('wardenName', e.target.value)} placeholder="Dr. Verma" required />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Warden Phone</label>
                          <Input className="h-10 rounded-lg" value={form.wardenPhone} onChange={(e) => handleChange('wardenPhone', e.target.value)} placeholder="+91 ..." required />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Hostel Location</label>
                          <Input className="h-10 rounded-lg" value={form.location} onChange={(e) => handleChange('location', e.target.value)} placeholder="North campus hostel wing" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium text-foreground">Mess Menu / Notice Note</label>
                          <Textarea className="min-h-[100px] rounded-lg" value={form.messMenuNote} onChange={(e) => handleChange('messMenuNote', e.target.value)} placeholder="Add a short note about menu changes, notices, or hostel updates..." />
                        </div>
                      </div>
                    )}

                    {fieldRules.showDescription && (
                    <div className="mt-5 space-y-2">
                      <label className="text-sm font-medium text-foreground">Description</label>
                      <Textarea className="min-h-[150px] rounded-[1.4rem]" value={form.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Write the details students should know..." required />
                    </div>
                    )}
                  </div>

                  {((fieldRules.showLocation && !fieldRules.showProfessorFields && !fieldRules.showHostelFields) || fieldRules.showExternalLink || fieldRules.showEffectiveDate) && (
                  <div className="rounded-[1.5rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(248,250,252,0.78))] p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.52),rgba(8,15,28,0.42))] box-scroll">
                    <div className="mb-4">
                      <h3 className="text-lg font-display font-semibold text-foreground">Useful metadata</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Only minimal supporting fields appear here when this category actually needs them.</p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                      {fieldRules.showLocation && !fieldRules.showProfessorFields && !fieldRules.showHostelFields && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Location</label>
                        <Input className="h-12 rounded-2xl" value={form.location} onChange={(e) => handleChange('location', e.target.value)} placeholder="Block / office / stop" />
                      </div>
                      )}
                      {fieldRules.showEffectiveDate && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Effective Date</label>
                        <Input type="date" className="h-12 rounded-2xl" value={form.effectiveDate} onChange={(e) => handleChange('effectiveDate', e.target.value)} />
                      </div>
                      )}
                    </div>

                    {(fieldRules.showExternalLink || !SINGLE_IMAGE_CATEGORIES.has(form.category)) && (
                    <div className={cn(
                      'mt-5 grid gap-5',
                      fieldRules.showExternalLink ? 'md:grid-cols-[minmax(0,1fr)_160px]' : 'md:grid-cols-[160px]'
                    )}>
                      {fieldRules.showExternalLink && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">External Link</label>
                        <Input className="h-12 rounded-2xl" value={form.externalLink} onChange={(e) => handleChange('externalLink', e.target.value)} placeholder="Drive / website / pdf link" />
                      </div>
                      )}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Sort Order</label>
                        <Input type="number" className="h-12 rounded-2xl" value={form.sortOrder} onChange={(e) => handleChange('sortOrder', e.target.value)} placeholder="0" />
                      </div>
                    </div>
                    )}
                  </div>
                  )}
                </div>

                <div className="custom-scrollbar box-scroll space-y-5 pr-1">
                  <div className="rounded-[1.5rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(248,250,252,0.78))] p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.52),rgba(8,15,28,0.42))] box-scroll">
                    <div className="mb-4">
                      <h3 className="text-lg font-display font-semibold text-foreground">Attachment</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {fieldRules.attachmentLabel}
                      </p>
                    </div>

                    <div className="space-y-3 rounded-[1.35rem] border border-border/70 bg-background/75 p-4 dark:bg-white/[0.03]">
                      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-medium text-primary transition hover:bg-primary/15">
                        <Upload className="h-4 w-4" />
                        {form.category === 'campus_news' ? 'Upload images (optional, multiple)' : 'Upload file'}
                        <input
                          type="file"
                          accept={fieldRules.attachmentAccept}
                          className="hidden"
                          onChange={(e) => {
                            if (form.category === 'campus_news') {
                              const list = Array.from(e.target.files || []);
                              setImageFiles(list);
                              // clear single image field
                              setImageFile(null);
                            } else if (form.category === 'hostel_updates') {
                              // mess menu or image: treat as messMenu
                              setImageFile(e.target.files?.[0] || null);
                            } else {
                              setImageFile(e.target.files?.[0] || null);
                            }
                          }}
                          multiple={form.category === 'campus_news'}
                        />
                      </label>

                      {/* show previews / names */}
                      <div className="space-y-2 text-sm">
                        {form.category === 'campus_news' && imageFiles && imageFiles.length > 0 && (
                          <div className="grid grid-cols-2 gap-2">
                            {imageFiles.map((f, i) => (
                              <span key={i} className="block truncate rounded-2xl border border-border/70 bg-background/80 px-3 py-2.5 text-foreground">{f.name}</span>
                            ))}
                          </div>
                        )}

                        {form.category !== 'campus_news' && (editingResource?.image || imageFile) && (
                          <div>
                            <span className="block rounded-2xl border border-border/70 bg-background/80 px-3 py-2.5 text-foreground">
                              {imageFile ? imageFile.name : (editingResource?.image ? 'Current image attached' : '')}
                            </span>
                            {editingResource?.image && !imageFile && (
                              <button
                                type="button"
                                className={cn(
                                  'mt-2 w-full rounded-2xl border px-3 py-2.5 transition',
                                  removeImage
                                    ? 'border-destructive/30 bg-destructive/10 text-destructive'
                                    : 'border-border/70 bg-background/80 text-muted-foreground'
                                )}
                                onClick={() => setRemoveImage((prev) => !prev)}
                              >
                                {removeImage ? 'Image will be removed on save' : 'Remove current image'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Hostel-specific: wardens and mess menu preview */}
                    {form.category === 'hostel_updates' && (
                      <div className="mt-4 space-y-3 rounded-[1.35rem] border border-border/70 bg-background/75 p-4 dark:bg-white/[0.03]">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-foreground">Wardens</h4>
                          <Button size="sm" type="button" onClick={() => setWardens((w) => [...w, { name: '', phone: '', email: '', designation: '' }])}>Add</Button>
                        </div>

                        <div className="space-y-2">
                          {wardens.length === 0 && <div className="text-sm text-muted-foreground">No wardens added</div>}
                          {wardens.map((w, idx) => (
                            <div key={idx} className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                              <Input placeholder="Name" value={w.name} onChange={(e) => setWardens((prev) => { const copy = [...prev]; copy[idx].name = e.target.value; return copy; })} />
                              <Input placeholder="Phone" value={w.phone} onChange={(e) => setWardens((prev) => { const copy = [...prev]; copy[idx].phone = e.target.value; return copy; })} />
                              <Input placeholder="Email" value={w.email} onChange={(e) => setWardens((prev) => { const copy = [...prev]; copy[idx].email = e.target.value; return copy; })} />
                              <div className="flex items-center gap-2">
                                <Input placeholder="Designation" value={w.designation} onChange={(e) => setWardens((prev) => { const copy = [...prev]; copy[idx].designation = e.target.value; return copy; })} />
                                <Button type="button" variant="ghost" size="icon" onClick={() => setWardens((prev) => prev.filter((_, i) => i !== idx))}>✕</Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-3 text-sm text-muted-foreground">You can upload a mess menu (image or PDF) using the attachment above — it will be saved as the mess menu for this hostel.</div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-[1.5rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(248,250,252,0.78))] p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.52),rgba(8,15,28,0.42))]">
                    <div className="mb-3 text-sm font-medium text-foreground">Publishing tips</div>
                    <ul className="space-y-2.5 text-sm leading-6 text-muted-foreground">
                      <li>Use only the most relevant fields so the section stays clean and trustworthy.</li>
                      <li>For bus timing and holiday list, replace the single notice instead of creating duplicates.</li>
                      <li>Add contact numbers only after verifying them once.</li>
                    </ul>
                  </div>
                </div>
              </div>
              </div>
            </div>

            <DialogFooter className="sticky bottom-0 z-10 border-t border-border/70 bg-background/94 px-6 py-5 backdrop-blur-xl dark:bg-[rgba(8,15,28,0.94)]">
              <Button type="button" variant="outline" className="rounded-2xl" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-2xl btn-gradient-primary px-5" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingResource ? 'Save changes' : 'Create resource'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Read-only view dialog for members to see resources in a category */}
      <Dialog open={isViewDialogOpen} onOpenChange={(open) => (!open ? closeViewDialog() : setIsViewDialogOpen(true))}>
        <DialogContent
          id="campus-resource-view"
          className={cn(
            'ds-dialog max-h-[92vh] overflow-hidden rounded-[1.8rem] p-0 sm:max-w-4xl hide-default-close',
            isViewFullScreen && 'fixed inset-0 m-0 h-screen max-w-none rounded-none left-0 top-0 translate-x-0 translate-y-0'
          )}
          role="dialog"
          aria-modal="true"
        >
          <DialogHeader className="sticky top-0 z-10 border-b bg-background/95 px-5 py-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-lg font-semibold">{viewCategory ? (CATEGORY_OPTIONS.find(o => o.value === viewCategory)?.title || 'Resources') : 'Resources'}</DialogTitle>
                <div className="text-sm text-muted-foreground">Resources published by super admin</div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsViewFullScreen((s) => !s)}
                  aria-label={isViewFullScreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                  {isViewFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>

                <Button variant="ghost" size="icon" onClick={closeViewDialog} aria-label="Close">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div id="campus-resource-view-body" className="dialog-body custom-scrollbar p-5">
            {viewCategory && (resources.filter((r) => r.category === viewCategory) || []).length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">No resources published in this section yet.</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {resources
                  .filter((r) => r.category === viewCategory)
                  .map((r) => (
                    <ResourceCard
                      key={r._id}
                      resource={r}
                      section={CATEGORY_OPTIONS.find((o) => o.value === r.category) || { badge: '' }}
                      isSuperAdmin={false}
                      openEditDialog={() => {}}
                      handleDelete={() => {}}
                      formatDate={formatDate}
                      renderCategoryMeta={renderCategoryMeta}
                      onOpenDetail={openResourceDetail}
                    />
                  ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail dialog for a single resource */}
      <Dialog open={isDetailOpen} onOpenChange={(open) => (!open ? closeDetail() : setIsDetailOpen(true))}>
        <DialogContent
          id="campus-resource-detail"
          className={cn(
            'ds-dialog max-h-[92vh] overflow-hidden rounded-[1.8rem] p-0 sm:max-w-4xl hide-default-close',
            isDetailFullScreen && 'fixed inset-0 m-0 h-screen max-w-none rounded-none z-50 left-0 top-0 translate-x-0 translate-y-0'
          )}
          role="dialog"
          aria-modal="true"
        >
          <DialogHeader className="sticky top-0 z-20 border-b bg-background/95 px-5 py-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-lg font-semibold">{selectedResource ? (selectedResource.title || 'Resource') : 'Resource'}</DialogTitle>
                <div className="text-sm text-muted-foreground">Published by {selectedResource?.createdBy?.fullName || 'admin'}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsDetailFullScreen((s) => !s)}
                  aria-label={isDetailFullScreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                  {isDetailFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>

                <Button variant="ghost" size="icon" onClick={closeDetail} aria-label="Close">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div
            id="campus-resource-detail-body"
            className="dialog-body custom-scrollbar p-5"
            style={isDetailFullScreen ? { height: 'calc(100vh - 64px)', overflow: 'auto' } : undefined}
          >
            {selectedResource ? (
              <ResourceCard
                resource={selectedResource}
                section={CATEGORY_OPTIONS.find((o) => o.value === selectedResource.category) || { badge: '' }}
                isSuperAdmin={false}
                openEditDialog={() => {}}
                handleDelete={() => {}}
                formatDate={formatDate}
                renderCategoryMeta={renderCategoryMeta}
                isDetail={true}
              />
            ) : (
              <div className="py-12 text-center text-muted-foreground">Loading...</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampusResources;
