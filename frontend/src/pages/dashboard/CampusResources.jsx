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
  Phone,
  Plus,
  Sparkles,
  ShieldCheck,
  Trash2,
  Upload,
  UserSquare2
} from 'lucide-react';
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
    title: 'Professor Contacts',
    description: 'Faculty phone numbers, office timings, and department support lines.',
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
    showTitle: true,
    showDescription: true,
    showContactName: true,
    showPhoneNumber: true,
    showLocation: true,
    showExternalLink: false,
    showEffectiveDate: false,
    attachmentLabel: 'Optional supporting image',
    attachmentAccept: 'image/*',
  },
  hostel_updates: {
    showTitle: true,
    showDescription: true,
    showContactName: true,
    showPhoneNumber: true,
    showLocation: true,
    showExternalLink: true,
    showEffectiveDate: false,
    attachmentLabel: 'Optional image or mess menu photo',
    attachmentAccept: 'image/*',
  },
  bus_timing: {
    showTitle: false,
    showDescription: false,
    showContactName: false,
    showPhoneNumber: false,
    showLocation: false,
    showExternalLink: false,
    showEffectiveDate: true,
    attachmentLabel: 'Upload the latest bus timing image or PDF',
    attachmentAccept: 'image/*,.pdf,application/pdf',
  },
  holiday_notice: {
    showTitle: false,
    showDescription: false,
    showContactName: false,
    showPhoneNumber: false,
    showLocation: false,
    showExternalLink: false,
    showEffectiveDate: true,
    attachmentLabel: 'Upload the latest holiday list image or PDF',
    attachmentAccept: 'image/*,.pdf,application/pdf',
  },
  campus_news: {
    showTitle: true,
    showDescription: true,
    showContactName: false,
    showPhoneNumber: false,
    showLocation: false,
    showExternalLink: true,
    showEffectiveDate: true,
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
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
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
    setRemoveImage(false);
    setIsDialogOpen(true);
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
    });
    setImageFile(null);
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
      const payload = new FormData();
      const normalizedForm = {
        ...form,
        title: fieldRules.showTitle ? form.title : '',
        description: fieldRules.showDescription ? form.description : '',
        contactName: fieldRules.showContactName ? form.contactName : '',
        phoneNumber: fieldRules.showPhoneNumber ? form.phoneNumber : '',
        location: fieldRules.showLocation ? form.location : '',
        externalLink: fieldRules.showExternalLink ? form.externalLink : '',
        effectiveDate: fieldRules.showEffectiveDate ? form.effectiveDate : '',
      };

      Object.entries(normalizedForm).forEach(([key, value]) => {
        payload.append(key, value ?? '');
      });

      if (imageFile) {
        payload.append('image', imageFile);
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

  return (
    <div className="space-y-8">
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

      <section className="space-y-6">
        {CATEGORY_OPTIONS.map((section) => {
          const Icon = section.icon;
          const items = groupedResources[section.value] || [];
          const isSingleImageSection = SINGLE_IMAGE_CATEGORIES.has(section.value);
          const hasExistingSingleItem = isSingleImageSection && items.length > 0;

          return (
            <Card key={section.value} className="overflow-hidden rounded-[1.8rem] border border-border/70 bg-card/80 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:bg-[linear-gradient(180deg,rgba(8,15,28,0.94),rgba(8,12,22,0.92))]">
              <CardContent className="p-0">
                <div className={cn('border-b border-border/70 px-6 py-5 dark:border-white/10', `bg-gradient-to-r ${section.accent}`)}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-black/10 text-foreground shadow-sm dark:text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-2xl font-display font-semibold text-foreground dark:text-white">{section.title}</h2>
                          <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
                            {section.badge}
                          </Badge>
                        </div>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground/72 dark:text-white/68">
                          {section.description}
                        </p>
                      </div>
                    </div>

                    {isSuperAdmin && (
                      <Button
                        variant="outline"
                        className="h-11 rounded-2xl border-primary/15 bg-background/80 px-4 shadow-sm dark:bg-white/[0.03]"
                        onClick={() => {
                          if (hasExistingSingleItem) {
                            openEditDialog(items[0]);
                            return;
                          }
                          openCreateDialog(section.value);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {hasExistingSingleItem ? `Edit ${section.title}` : `Add to ${section.title}`}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  {isSingleImageSection && (
                    <div className="mb-5 rounded-[1.25rem] border border-primary/15 bg-primary/6 px-4 py-3 text-sm text-muted-foreground">
                      This section is managed as a single visual notice. Upload one latest image and update that same entry whenever timing or holiday information changes.
                    </div>
                  )}
                  {isLoading ? (
                    <div className="rounded-[1.4rem] border border-dashed border-border/70 px-5 py-10 text-center text-muted-foreground">
                      Loading resources...
                    </div>
                  ) : items.length === 0 ? (
                    <div className="rounded-[1.4rem] border border-dashed border-border/70 px-5 py-10 text-center text-muted-foreground">
                      No resources added in this section yet.
                    </div>
                  ) : (
                    <div className={cn(
                      'custom-scrollbar',
                      items.length > 2 ? 'max-h-[44rem] overflow-y-auto pr-1' : ''
                    )}>
                      <div className="grid gap-4 xl:grid-cols-2">
                      {items.map((resource) => (
                        <article
                          key={resource._id}
                          className="group overflow-hidden rounded-[1.55rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,255,255,0.56))] shadow-[0_16px_34px_rgba(15,23,42,0.06)] transition hover:-translate-y-1.5 hover:border-primary/25 hover:shadow-[0_24px_50px_rgba(20,184,166,0.12)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(14,22,36,0.98),rgba(8,14,25,0.95))]"
                        >
                          {resource.image && resource.attachmentType !== 'pdf' && (
                            <div className="relative overflow-hidden">
                              <img
                                src={resource.image}
                                alt={resource.title}
                                className="h-52 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                              />
                              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(2,6,23,0.14))]" />
                            </div>
                          )}

                          <div className="space-y-4 p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="text-xl font-display font-semibold text-foreground dark:text-white">
                                  {resource.title}
                                </h3>
                                {resource.effectiveDate && (
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    Effective {formatDate(resource.effectiveDate)}
                                  </p>
                                )}
                              </div>

                              {isSuperAdmin && (
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="h-10 rounded-xl border-primary/20 bg-primary/10 px-3 text-primary hover:bg-primary/15 hover:text-primary"
                                    onClick={() => openEditDialog(resource)}
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="h-10 rounded-xl border-destructive/20 bg-destructive/10 px-3 text-destructive hover:bg-destructive/15 hover:text-destructive"
                                    onClick={() => handleDelete(resource._id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </Button>
                                </div>
                              )}
                            </div>

                            {resource.attachmentType === 'pdf' && resource.image && (
                              <div className="rounded-[1.25rem] border border-border/70 bg-background/75 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                                <div className="flex items-start gap-3">
                                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                                    <FileText className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-medium text-foreground dark:text-white">
                                      {resource.attachmentName || 'Attached PDF notice'}
                                    </div>
                                    <div className="mt-1 text-sm text-muted-foreground">
                                      Open the latest uploaded document for this notice.
                                    </div>
                                  </div>
                                  <Button asChild variant="outline" className="rounded-xl">
                                    <a href={resource.image} target="_blank" rel="noreferrer">
                                      Open PDF
                                    </a>
                                  </Button>
                                </div>
                              </div>
                            )}

                            <p className="text-sm leading-7 text-foreground/78 dark:text-white/72">
                              {resource.description}
                            </p>

                            <div className="grid gap-3 sm:grid-cols-2">
                              {resource.contactName && (
                                <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                                  <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Contact</div>
                                  <div className="mt-2 text-sm font-medium text-foreground dark:text-white">{resource.contactName}</div>
                                </div>
                              )}

                              {resource.phoneNumber && (
                                <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                                    <Phone className="h-3.5 w-3.5" />
                                    Phone
                                  </div>
                                  <div className="mt-2 text-sm font-medium text-foreground dark:text-white">{resource.phoneNumber}</div>
                                </div>
                              )}

                              {resource.location && (
                                <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                                  <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Location</div>
                                  <div className="mt-2 text-sm font-medium text-foreground dark:text-white">{resource.location}</div>
                                </div>
                              )}

                              {resource.externalLink && (
                                <a
                                  href={resource.externalLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 transition hover:border-primary/25 hover:text-primary dark:border-white/10 dark:bg-white/[0.03]"
                                >
                                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Link
                                  </div>
                                  <div className="mt-2 text-sm font-medium text-foreground dark:text-white">Open attachment</div>
                                </a>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span>Updated {formatDate(resource.updatedAt)}</span>
                              {resource.updatedBy?.fullName && <span>by {resource.updatedBy.fullName}</span>}
                            </div>
                          </div>
                        </article>
                      ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Dialog open={isDialogOpen} onOpenChange={(open) => (!open ? closeDialog() : setIsDialogOpen(true))}>
        <DialogContent className="max-h-[92vh] overflow-hidden rounded-[1.8rem] border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-0 shadow-[0_30px_90px_rgba(15,23,42,0.18)] dark:bg-[linear-gradient(180deg,rgba(8,15,28,0.98),rgba(6,10,18,0.98))] sm:max-w-4xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="sticky top-0 z-10 border-b border-border/70 bg-background/92 px-6 py-5 backdrop-blur-xl dark:bg-[rgba(8,15,28,0.94)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    Super Admin Editor
                  </div>
                  <DialogTitle className="text-2xl font-display">
                    {editingResource ? 'Edit campus resource' : 'Add campus resource'}
                  </DialogTitle>
                  <DialogDescription className="mt-2 max-w-2xl">
                    Publish structured college information that every student can access, while keeping moderation locked to super admin only.
                  </DialogDescription>
                </div>
                <div className="rounded-2xl border border-primary/15 bg-primary/8 px-4 py-3 text-sm text-muted-foreground">
                  Keep details crisp and verified so students can trust this hub.
                </div>
              </div>
            </DialogHeader>

            <div className="max-h-[calc(92vh-170px)] overflow-y-auto px-6 py-6 custom-scrollbar">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-6">
                  <div className="rounded-[1.5rem] border border-border/70 bg-card/70 p-5">
                    <div className="mb-4">
                      <h3 className="text-lg font-display font-semibold text-foreground">Core details</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {SINGLE_IMAGE_CATEGORIES.has(form.category)
                          ? 'This section is a single notice upload, so the form stays minimal on purpose.'
                          : 'Only the fields relevant to this category are shown here.'}
                      </p>
                    </div>

                    <div className={cn(
                      'grid gap-5',
                      fieldRules.showTitle ? 'md:grid-cols-2' : 'md:grid-cols-1'
                    )}>
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
                        <Input className="h-12 rounded-2xl" value={form.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="e.g. Prof. Sharma - CSE Office" required />
                      </div>
                      )}
                    </div>

                    {fieldRules.showDescription && (
                    <div className="mt-5 space-y-2">
                      <label className="text-sm font-medium text-foreground">Description</label>
                      <Textarea className="min-h-[150px] rounded-[1.4rem]" value={form.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Write the details students should know..." required />
                    </div>
                    )}
                  </div>

                  {(fieldRules.showContactName || fieldRules.showPhoneNumber || fieldRules.showLocation || fieldRules.showExternalLink || fieldRules.showEffectiveDate) && (
                  <div className="rounded-[1.5rem] border border-border/70 bg-card/70 p-5">
                    <div className="mb-4">
                      <h3 className="text-lg font-display font-semibold text-foreground">Useful metadata</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Add the person, number, location, or date that makes this resource actionable.</p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                      {fieldRules.showContactName && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Contact Name</label>
                        <Input className="h-12 rounded-2xl" value={form.contactName} onChange={(e) => handleChange('contactName', e.target.value)} placeholder="Warden / professor / office" />
                      </div>
                      )}
                      {fieldRules.showPhoneNumber && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Phone Number</label>
                        <Input className="h-12 rounded-2xl" value={form.phoneNumber} onChange={(e) => handleChange('phoneNumber', e.target.value)} placeholder="+91 ..." />
                      </div>
                      )}
                      {fieldRules.showLocation && (
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

                <div className="space-y-5">
                  <div className="rounded-[1.5rem] border border-border/70 bg-card/70 p-5">
                    <div className="mb-4">
                      <h3 className="text-lg font-display font-semibold text-foreground">Attachment</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {fieldRules.attachmentLabel}
                      </p>
                    </div>

                    <div className="space-y-3 rounded-[1.35rem] border border-border/70 bg-background/70 p-4">
                      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-medium text-primary transition hover:bg-primary/15">
                        <Upload className="h-4 w-4" />
                        Upload file
                        <input type="file" accept={fieldRules.attachmentAccept} className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                      </label>

                      {(editingResource?.image || imageFile) && (
                        <div className="space-y-3 text-sm">
                          <span className="block rounded-2xl border border-border/70 bg-background/80 px-3 py-2.5 text-foreground">
                            {imageFile ? imageFile.name : 'Current image attached'}
                          </span>
                          {editingResource?.image && !imageFile && (
                            <button
                              type="button"
                              className={cn(
                                'w-full rounded-2xl border px-3 py-2.5 transition',
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

                  <div className="rounded-[1.5rem] border border-border/70 bg-card/70 p-5">
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
    </div>
  );
};

export default CampusResources;
