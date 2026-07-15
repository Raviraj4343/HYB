import React, { useState, useEffect } from 'react';
import { X, Flag, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import api from '@/api/axios';

const REASONS = [
  { value: 'harassment',            label: 'Harassment' },
  { value: 'spam',                  label: 'Spam' },
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'fraud',                 label: 'Fraud / Scam' },
  { value: 'fake_request',          label: 'Fake Request' },
  { value: 'abuse',                 label: 'Abuse' },
  { value: 'other',                 label: 'Other' },
];

/**
 * ReportModal – reports a user from a direct chat.
 *
 * Props:
 *  isOpen       {boolean}
 *  onClose      {() => void}
 *  reportedUser { _id, fullName, userName }
 *  chatId       {string}   – sent to backend so AI can fetch last 15 msgs
 */
export default function ReportModal({ isOpen, onClose, reportedUser, chatId }) {
  const [reason, setReason]           = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus]           = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg]       = useState('');

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setDescription('');
      setStatus('idle');
      setErrorMsg('');
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) { setErrorMsg('Please select a reason.'); return; }
    if (description.trim().length < 10) {
      setErrorMsg('Description must be at least 10 characters.');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      await api.post('/report', {
        reportedUserId: reportedUser._id,
        reason,
        description: description.trim(),
        chatId: chatId || undefined,
      });
      setStatus('success');
    } catch (err) {
      const msg = err?.message || 'Failed to submit report. Please try again.';
      // "duplicate report" is a known 409 / 11000 case
      if (msg.toLowerCase().includes('duplicate') || err?.status === 409) {
        setErrorMsg('You have already submitted a report with this reason for this user.');
      } else {
        setErrorMsg(msg);
      }
      setStatus('error');
    }
  };

  if (!isOpen) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '20px',
          boxShadow: '0 32px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
          width: '100%',
          maxWidth: '440px',
          padding: '0',
          overflow: 'hidden',
          animation: 'rmSlideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.05) 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            padding: '20px 24px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(239,68,68,0.4)',
              flexShrink: 0,
            }}
          >
            <Flag size={16} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>
              Report User
            </h2>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
              @{reportedUser?.userName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px',
              cursor: 'pointer', padding: '6px', color: 'rgba(255,255,255,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {/* SUCCESS STATE */}
          {status === 'success' ? (
            <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
              <div
                style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 8px 24px rgba(34,197,94,0.3)',
                }}
              >
                <CheckCircle2 size={28} color="white" />
              </div>
              <h3 style={{ color: '#fff', margin: '0 0 8px', fontSize: '18px', fontWeight: 700 }}>
                Report Submitted
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', margin: '0 0 24px', lineHeight: 1.6 }}>
                Our AI has reviewed your report using recent chat messages. The moderation team has been notified and will take appropriate action.
              </p>
              <button
                onClick={onClose}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  border: 'none', borderRadius: '12px', color: '#fff',
                  cursor: 'pointer', padding: '10px 28px', fontSize: '14px', fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
                }}
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Notice */}
              <div
                style={{
                  background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
                  borderRadius: '10px', padding: '10px 14px',
                  display: 'flex', gap: '10px', alignItems: 'flex-start',
                }}
              >
                <AlertTriangle size={16} color="#fbbf24" style={{ marginTop: '1px', flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
                  Our AI will automatically review your last 15 chat messages to verify this report. False reports may result in restrictions on your account.
                </p>
              </div>

              {/* Reason selector */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginBottom: '8px' }}>
                  Reason *
                </label>
                <select
                  value={reason}
                  onChange={(e) => { setReason(e.target.value); setErrorMsg(''); }}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                    color: reason ? '#fff' : 'rgba(255,255,255,0.35)',
                    fontSize: '14px', cursor: 'pointer', outline: 'none',
                    WebkitAppearance: 'none', appearance: 'none', boxSizing: 'border-box',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 14px center',
                    paddingRight: '38px',
                  }}
                >
                  <option value="" disabled style={{ background: '#1a1a2e' }}>Select a reason…</option>
                  {REASONS.map(r => (
                    <option key={r.value} value={r.value} style={{ background: '#1a1a2e', color: '#fff' }}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginBottom: '8px' }}>
                  Description * <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.35)' }}>(min 10 chars)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setErrorMsg(''); }}
                  placeholder="Describe what happened in detail…"
                  rows={4}
                  maxLength={500}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff', fontSize: '14px', resize: 'vertical',
                    outline: 'none', fontFamily: 'inherit', lineHeight: 1.6,
                    boxSizing: 'border-box', minHeight: '90px',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.6)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                />
                <div style={{ textAlign: 'right', fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
                  {description.length}/500
                </div>
              </div>

              {/* Error message */}
              {errorMsg && (
                <div
                  style={{
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                    borderRadius: '10px', padding: '10px 14px',
                    fontSize: '13px', color: '#fca5a5',
                  }}
                >
                  {errorMsg}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '12px',
                    background: status === 'loading'
                      ? 'rgba(239,68,68,0.4)'
                      : 'linear-gradient(135deg, #ef4444, #b91c1c)',
                    border: 'none', color: '#fff', cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                    fontSize: '14px', fontWeight: 700,
                    boxShadow: status === 'loading' ? 'none' : '0 4px 12px rgba(239,68,68,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 size={15} style={{ animation: 'rmSpin 1s linear infinite' }} />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <Flag size={14} />
                      Submit Report
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes rmSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes rmSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

