'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiPost, apiFetch } from '../../lib';
import { Shield, Check, X, Clock, User, ChevronDown, ChevronUp } from 'lucide-react';

interface AdminRequest {
  id: string;
  status: string;
  fullName: string;
  submittedAt: string;
  notes: string | null;
  reason: string | null;
  rejectionReason: string | null;
  referredBy: string | null;
  requestedRole: string | null;
  user: {
    id: string;
    email: string;
    name: string | null;
    photoUrl: string | null;
    createdAt: string;
  };
}

const ROLES = ['admin', 'manager', 'editor'];

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewModal, setReviewModal] = useState<{ request: AdminRequest; action: 'approve' | 'reject' } | null>(null);
  const [selectedRole, setSelectedRole] = useState('admin');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('admin/requests');
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleReview = useCallback(async () => {
    if (!reviewModal) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { action: reviewModal.action };
      if (reviewModal.action === 'approve') {
        body.role = selectedRole;
      } else {
        body.notes = rejectionReason;
      }
      await apiPost(`admin/requests/${reviewModal.request.id}`, body);
      setReviewModal(null);
      setSelectedRole('admin');
      setRejectionReason('');
      fetchRequests();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to review request');
    } finally {
      setSubmitting(false);
    }
  }, [reviewModal, selectedRole, rejectionReason, fetchRequests]);

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6 lg:p-8" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-[24px] sm:text-[28px] md:text-[32px] font-bold tracking-tight">Admin Requests</h1>
          <p className="mt-1 sm:mt-2 text-[12px] sm:text-[13px] md:text-[14px]" style={{ color: 'var(--text-muted)' }}>Review and manage admin account requests</p>
        </div>

        {error && (
          <div className="p-3 sm:p-4 rounded-[10px] sm:rounded-[12px] border-2 mb-4 sm:mb-6" style={{ borderColor: 'var(--error)', backgroundColor: 'var(--bg-elevated)' }}>
            <p className="text-[13px] sm:text-[14px] font-bold" style={{ color: 'var(--error)' }}>{error}</p>
          </div>
        )}

        {/* Stats - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="p-3 sm:p-4 rounded-[10px] sm:rounded-[12px] border-2" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-2 sm:gap-3">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[12px] sm:text-[13px] md:text-[14px]">Pending</span>
            </div>
            <p className="text-[24px] sm:text-[28px] md:text-[32px] font-bold mt-1 sm:mt-2">{pendingRequests.length}</p>
          </div>
          <div className="p-3 sm:p-4 rounded-[10px] sm:rounded-[12px] border-2" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-2 sm:gap-3">
              <Check className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--success)' }} />
              <span className="text-[12px] sm:text-[13px] md:text-[14px]">Approved</span>
            </div>
            <p className="text-[24px] sm:text-[28px] md:text-[32px] font-bold mt-1 sm:mt-2">{requests.filter(r => r.status === 'approved').length}</p>
          </div>
          <div className="p-3 sm:p-4 rounded-[10px] sm:rounded-[12px] border-2" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-2 sm:gap-3">
              <X className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--error)' }} />
              <span className="text-[12px] sm:text-[13px] md:text-[14px]">Rejected</span>
            </div>
            <p className="text-[24px] sm:text-[28px] md:text-[32px] font-bold mt-1 sm:mt-2">{requests.filter(r => r.status === 'rejected').length}</p>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-[18px] sm:text-[20px] md:text-[24px] font-bold mb-3 sm:mb-4">Pending Requests ({pendingRequests.length})</h2>
          {loading ? (
            <div className="text-center py-8 sm:py-12">
              <span className="h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-[10px] sm:rounded-[12px] border-2 inline-block" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--bg)' }} />
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="p-6 sm:p-8 rounded-[10px] sm:rounded-[12px] border-2 text-center" style={{ borderColor: 'var(--border-subtle)' }}>
              <Shield className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-[16px] sm:text-[18px] font-semibold">No pending requests</p>
              <p className="text-[12px] sm:text-[13px] md:text-[14px] mt-1 sm:mt-2 opacity-70">All admin requests have been reviewed</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {pendingRequests.map(request => (
                <div key={request.id} className="p-4 sm:p-5 md:p-6 rounded-[10px] sm:rounded-[12px] border-2" style={{ borderColor: 'var(--border-subtle)' }}>
                  {/* Mobile: Stacked layout, Desktop: Side by side */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[10px] sm:rounded-[12px] border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
                        <User className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[16px] sm:text-[17px] md:text-[18px] font-bold truncate">{request.fullName || request.user.name || 'Unknown'}</h3>
                        <p className="text-[12px] sm:text-[13px] md:text-[14px] opacity-70 truncate">{request.user.email}</p>
                        <p className="text-[11px] sm:text-[12px] opacity-50 mt-1">
                          Requested {new Date(request.submittedAt).toLocaleDateString()}
                        </p>
                        
                        {/* Expandable details on mobile */}
                        <button
                          onClick={() => setExpandedRequest(expandedRequest === request.id ? null : request.id)}
                          className="mt-2 flex items-center gap-1 text-[12px] sm:text-[13px] font-semibold sm:hidden"
                        >
                          {expandedRequest === request.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          Details
                        </button>
                        
                        {/* Details - Always visible on desktop, toggle on mobile */}
                        <div className={`${expandedRequest === request.id ? 'block' : 'hidden'} sm:block mt-2 sm:mt-3 space-y-2`}>
                          {request.reason && (
                            <div className="p-2 sm:p-3 rounded-[10px] sm:rounded-[12px] border" style={{ borderColor: 'var(--border-subtle)' }}>
                              <p className="text-[11px] sm:text-[12px] opacity-50 mb-1">Reason</p>
                              <p className="text-[12px] sm:text-[13px] md:text-[14px]">{request.reason}</p>
                            </div>
                          )}
                          {request.referredBy && (
                            <div className="p-2 sm:p-3 rounded-[10px] sm:rounded-[12px] border" style={{ borderColor: 'var(--border-subtle)' }}>
                              <p className="text-[11px] sm:text-[12px] opacity-50 mb-1">Referred by</p>
                              <p className="text-[12px] sm:text-[13px] md:text-[14px]">{request.referredBy}</p>
                            </div>
                          )}
                          {request.notes && (
                            <div className="p-2 sm:p-3 rounded-[10px] sm:rounded-[12px] border" style={{ borderColor: 'var(--border-subtle)' }}>
                              <p className="text-[11px] sm:text-[12px] opacity-50 mb-1">Notes</p>
                              <p className="text-[12px] sm:text-[13px] md:text-[14px]">{request.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action buttons - Full width on mobile, inline on desktop */}
                    <div className="flex gap-2 sm:flex-shrink-0">
                      <button
                        onClick={() => setReviewModal({ request, action: 'approve' })}
                        className="flex-1 sm:flex-initial h-10 sm:h-11 px-4 sm:px-5 md:px-6 rounded-[10px] sm:rounded-[12px] font-semibold transition-colors flex items-center justify-center gap-2 text-[13px] sm:text-[14px]"
                        style={{ backgroundColor: 'var(--primary)', color: 'var(--on-accent)' }}
                      >
                        <Check className="w-4 h-4" /> Approve
                      </button>
                      <button
                        onClick={() => setReviewModal({ request, action: 'reject' })}
                        className="flex-1 sm:flex-initial h-10 sm:h-11 px-4 sm:px-5 md:px-6 rounded-[10px] sm:rounded-[12px] border-2 font-semibold transition-colors flex items-center justify-center gap-2 text-[13px] sm:text-[14px]"
                        style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                      >
                        <X className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Processed Requests */}
        {processedRequests.length > 0 && (
          <div>
            <h2 className="text-[18px] sm:text-[20px] md:text-[24px] font-bold mb-3 sm:mb-4">Processed Requests ({processedRequests.length})</h2>
            <div className="space-y-3 sm:space-y-4">
              {processedRequests.map(request => (
                <div key={request.id} className="p-4 sm:p-5 md:p-6 rounded-[10px] sm:rounded-[12px] border-2 opacity-70" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[10px] sm:rounded-[12px] border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
                      {request.status === 'approved' ? <Check className="w-5 h-5 sm:w-6 sm:h-6" /> : <X className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <h3 className="text-[16px] sm:text-[17px] md:text-[18px] font-bold truncate">{request.fullName || request.user.name || 'Unknown'}</h3>
                        <span
                          className="px-2 sm:px-3 py-1 rounded-[10px] sm:rounded-[12px] text-[11px] sm:text-[12px] font-semibold"
                          style={{
                            backgroundColor: request.status === 'approved' ? 'var(--primary)' : 'transparent',
                            color: request.status === 'approved' ? 'var(--on-accent)' : 'var(--text-muted)',
                            border: request.status === 'approved' ? 'none' : '1px solid var(--border)',
                          }}
                        >
                          {request.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[12px] sm:text-[13px] md:text-[14px] opacity-70 truncate">{request.user.email}</p>
                      {request.reason && (
                        <p className="text-[12px] sm:text-[13px] md:text-[14px] mt-1 sm:mt-2 opacity-70">Reason: {request.reason}</p>
                      )}
                      {request.rejectionReason && (
                        <p className="text-[12px] sm:text-[13px] md:text-[14px] mt-1 sm:mt-2 opacity-70">Rejection reason: {request.rejectionReason}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review Modal - Responsive */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}>
          <div className="w-full sm:max-w-md rounded-t-[16px] sm:rounded-[12px] border-2 border-b-0 sm:border-b-2 p-4 sm:p-6 max-h-[90vh] overflow-y-auto" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-elevated)' }}>
            <h3 className="text-[20px] sm:text-[22px] md:text-[24px] font-bold mb-3 sm:mb-4">
              {reviewModal.action === 'approve' ? 'Approve Request' : 'Reject Request'}
            </h3>
            <p className="text-[13px] sm:text-[14px] mb-4 sm:mb-6">
              {reviewModal.action === 'approve'
                ? `Approve ${reviewModal.request.fullName || reviewModal.request.user.email}'s admin request?`
                : `Reject ${reviewModal.request.fullName || reviewModal.request.user.email}'s admin request?`}
            </p>

            {reviewModal.action === 'approve' && (
              <div className="mb-4 sm:mb-6">
                <label className="block mb-2 text-[13px] sm:text-[14px] font-semibold">Assign Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map(role => (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      className="h-10 sm:h-11 rounded-[10px] sm:rounded-[12px] border-2 font-semibold transition-colors capitalize text-[13px] sm:text-[14px]"
                      style={{
                        borderColor: 'var(--border)',
                        backgroundColor: selectedRole === role ? 'var(--primary)' : 'transparent',
                        color: selectedRole === role ? 'var(--on-accent)' : 'var(--text)',
                      }}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {reviewModal.action === 'reject' && (
              <div className="mb-4 sm:mb-6">
                <label className="block mb-2 text-[13px] sm:text-[14px] font-semibold">Rejection Reason</label>
                <textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  className="w-full h-20 sm:h-24 rounded-[10px] sm:rounded-[12px] border-2 p-3 text-[13px] sm:text-[14px] outline-none resize-none"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                />
              </div>
            )}

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => { setReviewModal(null); setSelectedRole('admin'); setRejectionReason(''); }}
                className="flex-1 h-10 sm:h-11 rounded-[10px] sm:rounded-[12px] border-2 font-semibold transition-colors text-[13px] sm:text-[14px]"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={submitting || (reviewModal.action === 'reject' && !rejectionReason.trim())}
                className="flex-1 h-10 sm:h-11 rounded-[10px] sm:rounded-[12px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-[13px] sm:text-[14px]"
                style={{
                  backgroundColor: reviewModal.action === 'approve' ? 'var(--primary)' : 'var(--error)',
                  color: reviewModal.action === 'approve' ? 'var(--on-accent)' : '#f6f3ea',
                  border: `2px solid ${reviewModal.action === 'approve' ? 'var(--primary)' : 'var(--error)'}`,
                }}
              >
                {submitting ? 'Processing...' : reviewModal.action === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
