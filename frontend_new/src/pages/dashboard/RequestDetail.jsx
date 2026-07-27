import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ArrowLeft, MessageCircle, Clock, CheckCircle2,
  User, Loader2, MapPin, Hand, ThumbsUp, ThumbsDown, Send, Trash2,
  ChevronLeft, ChevronRight, X, Phone
} from 'lucide-react';
import api from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const getStatusBadge = (status) => {
  switch (status) {
    case 'open':
    case 'in-progress':
      return (
        <Badge className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10">
          Ongoing
        </Badge>
      );
    case 'fulfilled':
      return (
        <Badge className="px-3 py-1 bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/10">
          Completed
        </Badge>
      );
    case 'expired':
      return (
        <Badge className="px-3 py-1 bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/10">
          Expired
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge className="px-3 py-1 bg-zinc-500/10 text-zinc-400 border-zinc-500/20 hover:bg-zinc-500/10">
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="glass" className="px-3 py-1 capitalize">
          {status}
        </Badge>
      );
  }
};

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [offerMessage, setOfferMessage] = useState('');
  const [showOfferInput, setShowOfferInput] = useState(false);
  const [selectedHelper, setSelectedHelper] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(null);
  const [timeNow, setTimeNow] = useState(Date.now());
  const [phone, setPhone] = useState(currentUser?.phone || '');

  useEffect(() => {
    if (currentUser?.phone) {
      setPhone(currentUser.phone);
    }
  }, [currentUser]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeNow(Date.now());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const cancelRequestMutation = useMutation({
    mutationFn: () => api.put(`/req/cancle-req/${id}`),
    onSuccess: () => {
      toast.success('Request cancelled successfully');
      queryClient.invalidateQueries(['request', id]);
      queryClient.invalidateQueries(['my-requests']);
      queryClient.invalidateQueries(['my-requests-count']);
    },
    onError: (err) => toast.error(err.message || 'Failed to cancel request'),
  });



  // ── Fetch request ──────────────────────────────────────────────
  const { data: requestData, isLoading, isError } = useQuery({
    queryKey: ['request', id],
    queryFn: () => api.get(`/req/get-req-ById/${id}`).then((res) => res.data.data.request),
    retry: false,
  });

  // ── Fetch helper offers/responses ──────────────────────────────
  const { data: responsesData } = useQuery({
    queryKey: ['responses', id],
    queryFn: () => api.get(`/res/get-req-for-res/${id}`).then((res) => res.data.data.responses),
    enabled: !!id,
  });

  const responses = responsesData || [];

  // ── Offer to help (non-owner) ──────────────────────────────────
  const offerMutation = useMutation({
    mutationFn: ({ message, phone }) =>
      api.post('/res/create-response', { requestId: id, message, phone }),
    onSuccess: () => {
      toast.success('Offer sent! The requester will review it.');
      setShowOfferInput(false);
      setOfferMessage('');
      queryClient.invalidateQueries(['responses', id]);
    },
    onError: (err) => toast.error(err.message || 'Failed to send offer'),
  });


  // ── Accept a helper's offer (owner) ───────────────────────────
  const acceptResponseMutation = useMutation({
    mutationFn: (responseId) => api.patch(`/res/${responseId}/accept`),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['responses', id]);
      queryClient.invalidateQueries(['request', id]);
      const chatId = res.data?.data?.chat?._id;
      if (chatId) {
        toast.success('Helper accepted! Chat has been created.');
        navigate(`/dashboard/chats/${chatId}`);
      } else {
        toast.success('Helper accepted! Contact information is now visible.');
      }
    },
    onError: (err) => toast.error(err.message || 'Failed to accept helper'),
  });

  // ── Reject a helper's offer (owner) ───────────────────────────
  const rejectResponseMutation = useMutation({
    mutationFn: (responseId) => api.patch(`/res/${responseId}/reject`),
    onSuccess: () => {
      toast.success('Helper offer declined.');
      queryClient.invalidateQueries(['responses', id]);
    },
    onError: (err) => toast.error(err.message || 'Failed to reject'),
  });

  // ── Mark as fulfilled (owner picks who helped) ─────────────────
  const fulfillMutation = useMutation({
    mutationFn: (helperId) =>
      api.put(`/req/full-fill-req/${id}`, { helperId }),
    onSuccess: () => {
      toast.success('Request fulfilled! 🎉');
      queryClient.invalidateQueries(['request', id]);
      queryClient.invalidateQueries(['my-requests']);
      queryClient.invalidateQueries(['my-requests-count']);
    },
    onError: (err) => toast.error(err.message || 'Failed to mark as fulfilled'),
  });

  const deleteRequestMutation = useMutation({
    mutationFn: (reason) => api.delete(`/req/admin/${id}`, { data: { reason } }),
    onSuccess: () => {
      toast.success('Request deleted by super admin');
      queryClient.invalidateQueries(['request-stats']);
      queryClient.invalidateQueries(['requests']);
      navigate('/dashboard/requests');
    },
    onError: (err) => toast.error(err.message || 'Failed to delete request'),
  });
  const handleChatClick = async (resp) => {
    if (resp.chatId) {
      navigate(`/dashboard/chats/${resp.chatId}`);
      return;
    }
    try {
      const otherUserId = resp.responder?._id || resp.responder;
      const apiResponse = await api.post('/chat/ensure', {
        requestId: id,
        otherUserId
      });
      const chat = apiResponse.data?.data?.chat;
      if (chat?._id) {
        navigate(`/dashboard/chats/${chat._id}`);
      } else {
        toast.error('Could not open chat');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to start chat');
    }
  };

  // ── Loading / error states ─────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !requestData) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="text-center p-12 rounded-3xl border border-destructive/20 bg-destructive/10 text-destructive">
          <h3 className="text-lg font-semibold">Request not found</h3>
          <p className="text-sm opacity-80 mt-2">
            This request may have been removed or expired.
          </p>
        </div>
      </div>
    );
  }

  // ── Derived state ──────────────────────────────────────────────
  const requester  = requestData.requestedBy;
  const isOwner    = currentUser?._id === requester?._id;
  const isOpen     = requestData.status === 'open';
  const isFulfilled = requestData.status === 'fulfilled';
  const requestImages = requestData.images && requestData.images.length > 0
    ? requestData.images
    : requestData.image
      ? [requestData.image]
      : [];

  const myResponse = responses.find(
    (r) =>
      r.responder?._id === currentUser?._id ||
      r.responder === currentUser?._id
  );


  // Helpers who are still in play (not rejected) — for fulfill selector
  const activeResponders = responses.filter((r) => r.status !== 'rejected');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      {/* ── Main card ── */}
      <div className="rounded-[2rem] border border-white/10 bg-white/5 overflow-hidden backdrop-blur-xl">

        {/* Header */}
        <div className="p-8 lg:p-12 border-b border-white/5 bg-gradient-to-b from-primary/10 to-transparent">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {getStatusBadge(requestData.status)}
            <Badge variant="outline" className="px-3 py-1 border-white/20 text-white capitalize">
              {requestData.category}
            </Badge>
            <div className="flex items-center text-sm text-muted-foreground ml-auto">
              <Clock className="mr-2 h-4 w-4" />
              Posted {format(new Date(requestData.createdAt), 'PPP')}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <h1 className="text-3xl lg:text-4xl font-display font-bold text-white leading-tight flex-1">
              {requestData.title}
            </h1>
            {currentUser?.role === 'super_admin' && (
              <Button
                variant="destructive"
                size="sm"
                className="shrink-0 flex items-center gap-1.5 opacity-90 hover:opacity-100"
                disabled={deleteRequestMutation.isPending}
                onClick={() => {
                  const reason = window.prompt("Reason for deleting this request:", "Removed by super admin");
                  if (reason !== null) {
                    deleteRequestMutation.mutate(reason);
                  }
                }}
              >
                {deleteRequestMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete Request (Admin)
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 w-fit">
            <Avatar className="h-12 w-12 border border-white/20">
              <AvatarImage src={requester?.avatar} />
              <AvatarFallback><User className="h-6 w-6" /></AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold text-white">{requester?.fullName}</div>
              <div className="text-sm text-muted-foreground">@{requester?.userName}</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-8 lg:p-12 space-y-8">

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Description</h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-lg">
              {requestData.description}
            </p>
          </div>

          {/* Location hint */}
          {requestData.locationHint && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              <span>{requestData.locationHint}</span>
            </div>
          )}

          {/* Attached Images */}
          {requestImages.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Attached Images ({requestImages.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {requestImages.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 hover:border-primary/50 transition-all duration-300 cursor-pointer group"
                  >
                    <img
                      src={img}
                      alt={`Attached request item ${idx + 1}`}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-xs bg-black/60 text-white px-2.5 py-1 rounded-full backdrop-blur-sm">View</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════ NON-OWNER SECTION ══════════════ */}
          {!isOwner && (
            <div>
              {myResponse ? (
                /* Already offered */
                <div className={`p-5 rounded-2xl border ${
                  myResponse.status === 'accepted' || myResponse.status === 'completed'
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : myResponse.status === 'rejected'
                    ? 'border-destructive/30 bg-destructive/5'
                    : 'border-primary/20 bg-primary/5'
                }`}>
                  <p className="text-sm font-semibold text-white">
                    {myResponse.status === 'pending'   && '⏳ Your offer is awaiting review'}
                    {myResponse.status === 'accepted'  && '✅ Your offer was accepted! Chat now.'}
                    {myResponse.status === 'rejected'  && '❌ Your offer was declined.'}
                    {myResponse.status === 'completed' && '🎉 You helped with this request!'}
                  </p>
                  {(myResponse.status === 'accepted' || myResponse.status === 'completed') && (
                    requestData.contact === 'call' ? (
                      requester?.phone ? (
                        <Button
                          className="mt-3 bg-emerald-600 hover:bg-emerald-500 text-white"
                          size="sm"
                          asChild
                        >
                          <a href={`tel:${requester.phone}`}>
                            <Phone className="mr-2 h-4 w-4" /> Call {requester.fullName} ({requester.phone})
                          </a>
                        </Button>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-2">Requester's phone number is loading...</p>
                      )
                    ) : (
                      (myResponse.chatId || myResponse.status === 'accepted' || myResponse.status === 'completed') && (
                        <Button
                          className="mt-3"
                          size="sm"
                          onClick={() => handleChatClick(myResponse)}
                        >
                          <MessageCircle className="mr-2 h-4 w-4" /> Go to Chat
                        </Button>
                      )
                    )
                  )}
                </div>
              ) : isOpen ? (
                /* Offer to help */
                showOfferInput ? (
                  <div className="space-y-3 p-5 rounded-2xl border border-primary/20 bg-primary/5">
                    <h4 className="text-sm font-semibold text-white">
                      Write a quick message to the requester:
                    </h4>
                    <textarea
                      className="flex w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground min-h-[80px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none"
                      placeholder="e.g. I have a pen, I'll bring it to you in 5 minutes!"
                      value={offerMessage}
                      onChange={(e) => setOfferMessage(e.target.value)}
                    />

                    {requestData.contact === 'call' && !currentUser?.phone && (
                      <div className="space-y-2 pt-1">
                        <label htmlFor="helperPhone" className="text-xs font-semibold text-white uppercase tracking-wider">
                          Phone Number (Required)
                        </label>
                        <input
                          id="helperPhone"
                          type="tel"
                          className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          placeholder="E.g., +91 98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          This request uses phone call contact. Please provide your phone number so the requester can call you once they accept your help.
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          if (requestData.contact === 'call' && !currentUser?.phone && !phone.trim()) {
                            toast.error("Phone number is required to offer help on this request");
                            return;
                          }
                          offerMutation.mutate({ message: offerMessage, phone });
                        }}
                        disabled={offerMutation.isPending || !offerMessage.trim() || (requestData.contact === 'call' && !currentUser?.phone && !phone.trim())}
                      >
                        {offerMutation.isPending
                          ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          : <Send className="mr-2 h-4 w-4" />
                        }
                        Send Offer
                      </Button>
                      <Button variant="ghost" onClick={() => setShowOfferInput(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>

                ) : (
                  <Button
                    size="lg"
                    className="rounded-xl shadow-lg shadow-primary/20"
                    onClick={() => setShowOfferInput(true)}
                  >
                    <Hand className="mr-2 h-5 w-5" />
                    I'll Help — Offer to {requester?.fullName?.split(' ')[0] || 'User'}
                  </Button>
                )
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  This request is no longer accepting new offers.
                </p>
              )}
            </div>
          )}

          {/* ══════════════ OWNER SECTION ══════════════ */}
          {isOwner && (
            <div className="space-y-6">

              {/* Cancel Request Section (within 30 mins) */}
              {(isOpen || requestData.status === 'in-progress') && (() => {
                const elapsedMinutes = (timeNow - new Date(requestData.createdAt)) / (1000 * 60);
                const remainingMinutes = Math.max(0, Math.ceil(30 - elapsedMinutes));
                if (remainingMinutes > 0) {
                  return (
                    <div className="p-5 rounded-2xl border border-destructive/20 bg-destructive/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-destructive">
                          Cancel Request
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          You can cancel this request within 30 minutes of posting. {remainingMinutes} min remaining.
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          if (window.confirm("Are you sure you want to cancel this request?")) {
                            cancelRequestMutation.mutate();
                          }
                        }}
                        disabled={cancelRequestMutation.isPending}
                      >
                        {cancelRequestMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Cancel Request
                      </Button>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Responses list */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  People offering to help
                  {responses.length > 0 && (
                    <span className="ml-2 text-sm text-muted-foreground font-normal">
                      ({responses.length})
                    </span>
                  )}
                </h3>

                {responses.length === 0 ? (
                  <div className="text-center p-8 rounded-2xl border border-white/5 bg-white/[0.02]">
                    <p className="text-muted-foreground text-sm">
                      No one has offered to help yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {responses.map((response) => (
                      <div
                        key={response._id}
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors ${
                          response.status === 'accepted' || response.status === 'completed'
                            ? 'border-emerald-500/30 bg-emerald-500/5'
                            : response.status === 'rejected'
                            ? 'border-white/5 bg-white/[0.02] opacity-50'
                            : 'border-white/10 bg-white/5'
                        }`}
                      >
                        <Avatar className="h-10 w-10 border border-white/20 shrink-0">
                          <AvatarImage src={response.responder?.avatar} />
                          <AvatarFallback>
                            {response.responder?.fullName?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white text-sm">
                            {response.responder?.fullName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            @{response.responder?.userName}
                            {response.responder?.helpCount !== undefined && (
                              <span className="ml-2 text-primary">
                                ⚡ {response.responder.helpCount} helped
                              </span>
                            )}
                          </div>
                          {response.message && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {response.message}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            className="capitalize"
                            variant={
                              response.status === 'accepted' || response.status === 'completed'
                                ? 'default'
                                : response.status === 'rejected'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {response.status}
                          </Badge>

                          {/* Go to chat button or call button */}
                          {(response.status === 'accepted' || response.status === 'completed') && (
                            requestData.contact === 'call' ? (
                              response.responder?.phone ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-400 group flex items-center gap-2"
                                  asChild
                                  title="Call helper"
                                >
                                  <a href={`tel:${response.responder.phone}`}>
                                    <Phone className="h-4 w-4 text-emerald-400" />
                                    <span className="hidden sm:inline">Call helper ({response.responder.phone})</span>
                                  </a>
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">Phone number loading...</span>
                              )
                            ) : (
                              (response.chatId || response.status === 'accepted' || response.status === 'completed') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-white/10 hover:border-primary/50 group"
                                  onClick={() => handleChatClick(response)}
                                  title="Message helper"
                                >
                                  <MessageCircle className="h-4 w-4 text-white group-hover:text-primary transition-colors" />
                                </Button>
                              )
                            )
                          )}

                          {/* Accept / Reject buttons (only for pending offers on open request) */}
                          {response.status === 'pending' && isOpen && (
                            <>
                              <Button
                                size="sm"
                                className="bg-emerald-500/80 hover:bg-emerald-500 text-white"
                                onClick={() => acceptResponseMutation.mutate(response._id)}
                                disabled={acceptResponseMutation.isPending}
                                title="Accept this helper"
                              >
                                <ThumbsUp className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="opacity-70 hover:opacity-100"
                                onClick={() => rejectResponseMutation.mutate(response._id)}
                                disabled={rejectResponseMutation.isPending}
                                title="Decline this helper"
                              >
                                <ThumbsDown className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Fulfill section — pick who actually helped */}
              {(isOpen || requestData.status === 'in-progress') && activeResponders.length > 0 && (
                <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-400">
                      Mark as Fulfilled
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Select who actually helped you — only that person's help count increases.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {activeResponders.map((r) => {
                      const hId = r.responder?._id || r.responder;
                      return (
                        <button
                          key={r._id}
                          onClick={() => setSelectedHelper(hId)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${
                            selectedHelper === hId
                              ? 'border-emerald-400 bg-emerald-500/20 text-white'
                              : 'border-white/10 text-muted-foreground hover:border-white/30'
                          }`}
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={r.responder?.avatar} />
                            <AvatarFallback>
                              {r.responder?.fullName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {r.responder?.fullName?.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>

                  <Button
                    className="bg-emerald-500/80 hover:bg-emerald-500 text-white"
                    onClick={() => fulfillMutation.mutate(selectedHelper)}
                    disabled={!selectedHelper || fulfillMutation.isPending}
                  >
                    {fulfillMutation.isPending
                      ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      : <CheckCircle2 className="mr-2 h-4 w-4" />
                    }
                    Mark as Fulfilled
                  </Button>
                </div>
              )}

              {/* Fulfilled state */}
              {isFulfilled && (
                <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                  <p className="text-emerald-400 font-semibold">
                    ✅ Fulfilled on {format(new Date(requestData.fulfilledAt), 'PPP')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {activeImageIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setActiveImageIndex(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          {requestImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex((prev) => (prev === 0 ? requestImages.length - 1 : prev - 1));
                }}
                className="absolute left-4 p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex((prev) => (prev === requestImages.length - 1 ? 0 : prev + 1));
                }}
                className="absolute right-4 p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <img
            src={requestImages[activeImageIndex]}
            alt="Request attachment full size"
            className="max-w-[90%] max-h-[80vh] object-contain rounded-lg shadow-2xl"
          />

          {requestImages.length > 1 && (
            <p className="text-sm text-muted-foreground mt-4">
              {activeImageIndex + 1} of {requestImages.length}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
