import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AlertTriangle, CalendarClock, Check, Filter, Image as ImageIcon, Loader2, MessageCircle, PackageCheck, Phone, Plus, RotateCcw, Search, ShoppingBag, SlidersHorizontal, Tag, Upload, User, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/api/axios';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const categories = ['books', 'electronics', 'stationery', 'room', 'cycle', 'lab', 'sports', 'clothing', 'other'];
const conditions = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like new' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'used', label: 'Used' },
];
const emptyForm = { title: '', description: '', category: 'books', listingType: 'sell', price: '', condition: 'good', contactPhone: '', securityDeposit: '', maxBorrowDuration: '' };
const LISTINGS_PAGE_SIZE = 12;

const formatMoney = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`;
const conditionLabel = (value) => conditions.find((item) => item.value === value)?.label || value;

function ListingTypePill({ type }) {
  const isSell = type === 'sell';
  return (
    <Badge className={cn(
      'gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide shadow-lg backdrop-blur',
      isSell
        ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-100 shadow-emerald-950/30'
        : 'border-sky-400/40 bg-sky-500/20 text-sky-100 shadow-sky-950/30'
    )}>
      {isSell ? <ShoppingBag className="h-3 w-3" /> : <RotateCcw className="h-3 w-3" />}
      {isSell ? 'For Sale' : 'For Borrow'}
    </Badge>
  );
}

function ListingCard({ listing, onOpen }) {
  const cover = listing.images?.[0];

  return (
    <Card className="group overflow-hidden rounded-2xl border-white/10 bg-[#15151c] shadow-xl shadow-black/20 transition-all hover:-translate-y-1 hover:border-primary/40 hover:bg-[#191923]">
      <button onClick={() => onOpen(listing)} className="block w-full text-left">
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-white via-zinc-100 to-zinc-200 p-3">
          {cover ? <img src={cover} alt={listing.title} loading="lazy" className="h-full w-full rounded-xl object-contain transition-transform duration-500 group-hover:scale-105" /> : (
            <div className="flex h-full w-full items-center justify-center"><ImageIcon className="h-10 w-10 text-muted-foreground" /></div>
          )}
          <div className="absolute left-3 top-3"><ListingTypePill type={listing.listingType} /></div>
          <div className="absolute right-3 top-3 rounded-full border border-black/10 bg-black/70 px-2.5 py-1 text-xs font-semibold capitalize text-white shadow-lg backdrop-blur">{listing.availability}</div>
        </div>
        <div className="space-y-4 p-4">
          <div className="space-y-1.5">
            <h3 className="line-clamp-1 text-base font-semibold text-white">{listing.title}</h3>
            <p className="line-clamp-2 min-h-[2.5rem] text-sm leading-5 text-muted-foreground">{listing.description}</p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-2xl font-bold text-white">{formatMoney(listing.price)}</div>
            <Badge variant="outline" className="border-white/10 capitalize text-muted-foreground">{listing.category}</Badge>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-3">
            <div className="flex min-w-0 items-center gap-2">
              <Avatar className="h-7 w-7 border border-white/10">
                <AvatarImage src={listing.owner?.avatar} />
                <AvatarFallback>{listing.owner?.fullName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <span className="truncate text-xs font-medium text-muted-foreground">{listing.owner?.fullName || 'Student'}</span>
            </div>
            <span className="text-xs text-muted-foreground">{conditionLabel(listing.condition)}</span>
          </div>
        </div>
      </button>
    </Card>
  );
}

function ListingForm({ initialListing, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [existingImages, setExistingImages] = useState([]);
  const [files, setFiles] = useState([]);
  const [moderationReason, setModerationReason] = useState('');
  const isEditing = Boolean(initialListing?._id);

  useEffect(() => {
    if (!initialListing) {
      setForm(emptyForm);
      setExistingImages([]);
      setFiles([]);
      return;
    }
    setForm({
      title: initialListing.title || '',
      description: initialListing.description || '',
      category: initialListing.category || 'books',
      listingType: initialListing.listingType || 'sell',
      price: initialListing.price ?? '',
      condition: initialListing.condition || 'good',
      contactPhone: initialListing.contactPhone || '',
      securityDeposit: initialListing.securityDeposit ?? '',
      maxBorrowDuration: initialListing.maxBorrowDuration || '',
    });
    setExistingImages(initialListing.images || []);
    setFiles([]);
  }, [initialListing]);

  const mutation = useMutation({
    mutationFn: (payload) => {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      return isEditing ? api.put(`/marketplace/${initialListing._id}`, payload, config) : api.post('/marketplace', payload, config);
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Listing updated' : 'Listing published');
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-mine'] });
      onClose();
    },
    onError: (error) => {
      const message = error.message || 'Could not save listing';
      if (message.includes('AI Marketplace Moderation Warning:')) {
        setModerationReason(message.replace('AI Marketplace Moderation Warning:', '').trim());
        return;
      }
      toast.error(message);
    },
  });

  const handleFiles = (event) => {
    const nextFiles = Array.from(event.target.files || []);
    if (existingImages.length + files.length + nextFiles.length > 6) return toast.error('You can upload up to 6 images.');
    if (nextFiles.some((file) => !file.type.startsWith('image/'))) return toast.error('Only image files are allowed.');
    setFiles((current) => [...current, ...nextFiles]);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value ?? ''));
    payload.append('existingImages', JSON.stringify(existingImages));
    files.forEach((file) => payload.append('images', file));
    mutation.mutate(payload);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4 backdrop-blur-md">
      <div className="mx-auto my-6 max-w-3xl rounded-2xl border border-white/10 bg-[#101017] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <div>
            <h2 className="text-xl font-semibold text-white">{isEditing ? 'Edit listing' : 'Create marketplace listing'}</h2>
            <p className="text-sm text-muted-foreground">Add the essentials students need before they reach out.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Scientific calculator, drafter, cycle..." required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Short description</Label>
              <Textarea id="description" className="min-h-[110px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Condition, accessories, pickup preference..." required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="listingType">Listing type</Label>
              <select id="listingType" className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" value={form.listingType} onChange={(e) => setForm({ ...form, listingType: e.target.value })}>
                <option className="bg-background" value="sell">Sell</option>
                <option className="bg-background" value="borrow">Borrow / lend</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select id="category" className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {categories.map((category) => <option className="bg-background capitalize" key={category} value={category}>{category}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">{form.listingType === 'sell' ? 'Price' : 'Borrowing fee'}</Label>
              <Input id="price" type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <select id="condition" className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
                {conditions.map((condition) => <option className="bg-background" key={condition.value} value={condition.value}>{condition.label}</option>)}
              </select>
            </div>
            {form.listingType === 'borrow' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="securityDeposit">Security deposit</Label>
                  <Input id="securityDeposit" type="number" min="0" value={form.securityDeposit} onChange={(e) => setForm({ ...form, securityDeposit: e.target.value })} placeholder="Optional" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxBorrowDuration">Max duration</Label>
                  <Input id="maxBorrowDuration" value={form.maxBorrowDuration} onChange={(e) => setForm({ ...form, maxBorrowDuration: e.target.value })} placeholder="E.g., 3 days" />
                </div>
              </>
            )}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="contactPhone">Contact phone <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input id="contactPhone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="+91 98765 43210" />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Images ({existingImages.length + files.length}/6)</Label>
            <div className="relative flex min-h-[130px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-center transition-colors hover:border-primary/50">
              <input className="absolute inset-0 cursor-pointer opacity-0" type="file" accept="image/*" multiple onChange={handleFiles} />
              <Upload className="mb-3 h-7 w-7 text-primary" />
              <p className="text-sm font-semibold text-white">Upload up to 6 item photos</p>
              <p className="text-xs text-muted-foreground">Clear photos help listings move faster.</p>
            </div>
            {(existingImages.length > 0 || files.length > 0) && (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {existingImages.map((image) => (
                  <div key={image} className="relative aspect-square overflow-hidden rounded-xl border border-white/10">
                    <img src={image} alt="Existing listing" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => setExistingImages((current) => current.filter((item) => item !== image))} className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
                {files.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="relative aspect-square overflow-hidden rounded-xl border border-white/10">
                    <img src={URL.createObjectURL(file)} alt="New listing" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-white/10 pt-5">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              {isEditing ? 'Save changes' : 'Publish listing'}
            </Button>
          </div>
        </form>
      </div>

      {moderationReason && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-amber-500/30 bg-[#111018] shadow-2xl">
            <div className="flex items-center gap-3 border-b border-amber-500/20 bg-amber-500/10 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 text-amber-200">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Listing blocked by moderation</h3>
                <p className="text-xs text-amber-200/80">Review your item details before publishing.</p>
              </div>
            </div>
            <div className="space-y-4 p-5">
              <p className="text-sm leading-6 text-muted-foreground">{moderationReason}</p>
              <Button className="w-full" onClick={() => setModerationReason('')}>Edit listing</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ListingDetail({ listing, onClose, onEdit }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeImage, setActiveImage] = useState(0);
  const images = listing.images?.length ? listing.images : [];
  const isOwner = user?._id === listing.owner?._id;

  const requestMutation = useMutation({
    mutationFn: () => api.post(`/marketplace/${listing._id}/request`),
    onSuccess: (response) => {
      const chatId = response.data?.data?.chat?._id;
      toast.success('Owner notified. Chat opened.');
      if (chatId) navigate(`/dashboard/chats/${chatId}`);
    },
    onError: (error) => toast.error(error.message || 'Could not request listing'),
  });

  const availabilityMutation = useMutation({
    mutationFn: (availability) => api.patch(`/marketplace/${listing._id}/availability`, { availability }),
    onSuccess: () => {
      toast.success('Listing status updated');
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-mine'] });
      onClose();
    },
    onError: (error) => toast.error(error.message || 'Could not update status'),
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-4 backdrop-blur-md">
      <div className="mx-auto my-6 max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-[#101017] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center gap-3">
            <ListingTypePill type={listing.listingType} />
            <Badge variant="outline" className="border-white/10 capitalize text-muted-foreground">{listing.availability}</Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>

        <div className="grid lg:grid-cols-[1.16fr_0.84fr]">
          <div className="bg-[#0b0b10] p-5">
            <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white via-zinc-100 to-zinc-200 p-4 shadow-inner">
              {images[activeImage] ? <img src={images[activeImage]} alt={listing.title} className="h-full w-full rounded-xl object-contain" /> : (
                <div className="flex h-full items-center justify-center"><ImageIcon className="h-12 w-12 text-muted-foreground" /></div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 grid grid-cols-6 gap-2">
                {images.map((image, index) => (
                  <button key={image} onClick={() => setActiveImage(index)} className={cn('aspect-square overflow-hidden rounded-xl border bg-white p-1', activeImage === index ? 'border-primary ring-2 ring-primary/25' : 'border-white/10')}>
                    <img src={image} alt={`Listing ${index + 1}`} className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6 border-l border-white/5 p-6 lg:p-8">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 capitalize"><Tag className="h-3.5 w-3.5" /> {listing.category}</span>
                <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> {format(new Date(listing.createdAt), 'MMM d, yyyy')}</span>
              </div>
              <h2 className="text-3xl font-bold leading-tight text-white">{listing.title}</h2>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <div className="text-4xl font-bold text-white">{formatMoney(listing.price)}</div>
                <span className="pb-1 text-sm text-muted-foreground">{listing.listingType === 'sell' ? 'fixed campus sale price' : 'borrowing fee'}</span>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{listing.description}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Info label="Condition" value={conditionLabel(listing.condition)} />
              <Info label={listing.listingType === 'sell' ? 'Price' : 'Borrowing fee'} value={formatMoney(listing.price)} />
              {listing.listingType === 'borrow' && <Info label="Deposit" value={listing.securityDeposit ? formatMoney(listing.securityDeposit) : 'Not required'} />}
              {listing.listingType === 'borrow' && <Info label="Max duration" value={listing.maxBorrowDuration || 'Discuss in chat'} />}
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <Avatar className="h-12 w-12 border border-white/10">
                <AvatarImage src={listing.owner?.avatar} />
                <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold text-white">{listing.owner?.fullName}</p>
                <p className="text-sm text-muted-foreground">@{listing.owner?.userName}</p>
              </div>
            </div>

            {listing.contactPhone && <a href={`tel:${listing.contactPhone}`} className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-200"><Phone className="h-4 w-4" /> {listing.contactPhone}</a>}

            {isOwner ? (
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => onEdit(listing)}><SlidersHorizontal className="mr-2 h-4 w-4" /> Edit listing</Button>
                {listing.availability === 'available' ? (
                  <Button variant="outline" onClick={() => availabilityMutation.mutate(listing.listingType === 'sell' ? 'sold' : 'lent')} disabled={availabilityMutation.isPending}>
                    <PackageCheck className="mr-2 h-4 w-4" /> Mark as {listing.listingType === 'sell' ? 'Sold' : 'Lent'}
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => availabilityMutation.mutate('available')} disabled={availabilityMutation.isPending}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Mark Available
                  </Button>
                )}
              </div>
            ) : (
              <Button size="lg" className="w-full" disabled={requestMutation.isPending || listing.availability !== 'available'} onClick={() => requestMutation.mutate()}>
                {requestMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageCircle className="mr-2 h-5 w-5" />}
                {listing.listingType === 'sell' ? 'Buy' : 'Request to Borrow'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}

export default function Marketplace() {
  const [filters, setFilters] = useState({ search: '', listingType: 'all', category: 'all', condition: 'all', minPrice: '', maxPrice: '', sort: 'newest' });
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedListing, setSelectedListing] = useState(null);
  const [editingListing, setEditingListing] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const loadMoreRef = useRef(null);

  const baseParams = useMemo(() => {
    const next = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') next.set(key, value);
    });
    return next.toString();
  }, [filters]);

  const marketplaceQuery = useInfiniteQuery({
    queryKey: ['marketplace', baseParams],
    initialPageParam: 1,
    enabled: activeTab === 'browse',
    queryFn: ({ pageParam }) => {
      const query = new URLSearchParams(baseParams);
      query.set('page', String(pageParam));
      query.set('limit', String(LISTINGS_PAGE_SIZE));
      if (pageParam === 1) query.set('includeTotal', 'true');
      return api.get(`/marketplace?${query.toString()}`).then((res) => res.data.data);
    },
    getNextPageParam: (lastPage) => (
      lastPage?.pagination?.hasNextPage ? lastPage.pagination.nextPage : undefined
    ),
  });

  const myListingsQuery = useInfiniteQuery({
    queryKey: ['marketplace-mine'],
    initialPageParam: 1,
    enabled: activeTab === 'mine',
    queryFn: ({ pageParam }) => (
      api.get(`/marketplace/mine?page=${pageParam}&limit=${LISTINGS_PAGE_SIZE}`).then((res) => res.data.data)
    ),
    getNextPageParam: (lastPage) => (
      lastPage?.pagination?.hasNextPage ? lastPage.pagination.nextPage : undefined
    ),
  });

  const browseListings = marketplaceQuery.data?.pages?.flatMap((page) => page.listings || []) || [];
  const myListings = myListingsQuery.data?.pages?.flatMap((page) => page.listings || []) || [];
  const visibleListings = activeTab === 'browse' ? browseListings : myListings;
  const activeQuery = activeTab === 'browse' ? marketplaceQuery : myListingsQuery;
  const loading = activeQuery.isLoading;
  const isLoadingMore = activeQuery.isFetchingNextPage;
  const marketplaceTotal = marketplaceQuery.data?.pages?.[0]?.pagination?.total ?? browseListings.length;

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || loading || !activeQuery.hasNextPage) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && activeQuery.hasNextPage && !activeQuery.isFetchingNextPage) {
          activeQuery.fetchNextPage();
        }
      },
      { rootMargin: '420px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [
    activeTab,
    activeQuery.hasNextPage,
    activeQuery.isFetchingNextPage,
    activeQuery.fetchNextPage,
    loading,
  ]);

  const resetFilters = () => setFilters({ search: '', listingType: 'all', category: 'all', condition: 'all', minPrice: '', maxPrice: '', sort: 'newest' });
  const openCreate = () => {
    setEditingListing(null);
    setIsFormOpen(true);
  };
  const openEdit = (listing) => {
    setSelectedListing(null);
    setEditingListing(listing);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-7 pt-1">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121219] shadow-2xl shadow-black/20">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:p-8">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge className="border-primary/20 bg-primary/10 text-primary">Campus Marketplace</Badge>
              <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-300">Sell</Badge>
              <Badge className="border-sky-500/20 bg-sky-500/10 text-sky-300">Borrow</Badge>
            </div>
            <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl">Campus deals and short-term lends in one trusted place.</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">Browse student-owned items with verified HYB profiles, clear availability, direct chat, and optional phone contact.</p>
            <div className="mt-6 grid max-w-xl grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <p className="text-lg font-bold text-white">{marketplaceTotal}</p>
                <p className="text-xs text-muted-foreground">Active listings</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <p className="text-lg font-bold text-white">6</p>
                <p className="text-xs text-muted-foreground">Photos max</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <p className="text-lg font-bold text-white">1:1</p>
                <p className="text-xs text-muted-foreground">Private chat</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-start gap-3">
            <Button variant={activeTab === 'browse' ? 'default' : 'outline'} onClick={() => setActiveTab('browse')}>Browse</Button>
            <Button variant={activeTab === 'mine' ? 'default' : 'outline'} onClick={() => setActiveTab('mine')}>My listings</Button>
            <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Post</Button>
          </div>
        </div>
      </div>

      {activeTab === 'browse' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input className="h-12 pl-10" placeholder="Search by item, description, category, or seller..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
            </div>
            <Button variant={showFilters ? 'default' : 'outline'} className="h-12" onClick={() => setShowFilters((value) => !value)}><Filter className="mr-2 h-4 w-4" /> Filters</Button>
          </div>

          {showFilters && (
            <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:grid-cols-3 lg:grid-cols-6">
              <FilterSelect value={filters.listingType} onChange={(value) => setFilters({ ...filters, listingType: value })} options={[['all', 'All types'], ['sell', 'Sell'], ['borrow', 'Borrow']]} />
              <FilterSelect value={filters.category} onChange={(value) => setFilters({ ...filters, category: value })} options={[['all', 'All categories'], ...categories.map((category) => [category, category])]} />
              <FilterSelect value={filters.condition} onChange={(value) => setFilters({ ...filters, condition: value })} options={[['all', 'Any condition'], ...conditions.map((condition) => [condition.value, condition.label])]} />
              <Input type="number" min="0" placeholder="Min price" value={filters.minPrice} onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })} />
              <Input type="number" min="0" placeholder="Max price" value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} />
              <FilterSelect value={filters.sort} onChange={(value) => setFilters({ ...filters, sort: value })} options={[['newest', 'Newest'], ['oldest', 'Oldest'], ['price_asc', 'Price low'], ['price_desc', 'Price high']]} />
              <div className="md:col-span-3 lg:col-span-6"><Button variant="ghost" size="sm" onClick={resetFilters}>Reset filters</Button></div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">{activeTab === 'browse' ? 'Available listings' : 'Listing history'}</h2>
          <p className="text-sm text-muted-foreground">
            {activeTab === 'browse'
              ? `${marketplaceTotal} active campus listings · showing ${visibleListings.length}`
              : `Showing ${visibleListings.length} of your listings`}
          </p>
        </div>
        {activeTab === 'mine' && <Button variant="outline" onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> New listing</Button>}
      </div>

      {loading ? (
        <div className="flex min-h-[260px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : visibleListings.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-12 text-center">
          <PackageCheck className="mx-auto mb-4 h-10 w-10 text-primary" />
          <h3 className="text-lg font-semibold text-white">No listings found</h3>
          <p className="mt-1 text-sm text-muted-foreground">Try different filters or publish the first listing in this space.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {visibleListings.map((listing) => <ListingCard key={listing._id} listing={listing} onOpen={setSelectedListing} />)}
          </div>
          <div ref={loadMoreRef} className="flex min-h-16 items-center justify-center pt-2">
            {isLoadingMore && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
            {!isLoadingMore && activeQuery.hasNextPage && (
              <Button variant="outline" onClick={() => activeQuery.fetchNextPage()}>
                Load more listings
              </Button>
            )}
          </div>
        </>
      )}

      {selectedListing && <ListingDetail listing={selectedListing} onClose={() => setSelectedListing(null)} onEdit={openEdit} />}
      {isFormOpen && <ListingForm initialListing={editingListing} onClose={() => setIsFormOpen(false)} />}
    </div>
  );
}

function FilterSelect({ value, onChange, options }) {
  return (
    <select className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm capitalize text-white" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map(([optionValue, label]) => <option className="bg-background" key={optionValue} value={optionValue}>{label}</option>)}
    </select>
  );
}
