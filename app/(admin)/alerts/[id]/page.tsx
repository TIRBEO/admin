'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AdminSection, StatusBadge } from '@tirbeo/ui';
import { apiFetch } from '../../../lib';
import { ArrowLeft, Clock, User, MessageSquare, Plus, Loader2 } from 'lucide-react';

interface IncidentEvent {
  id: string;
  type: string;
  message?: string;
  userId?: string;
  createdAt: string;
}

interface Incident {
  id: string;
  title: string;
  description?: string;
  severity: string;
  status: string;
  services?: any;
  applications?: any;
  createdAt: string;
  resolvedAt?: string;
  events?: IncidentEvent[];
}

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [events, setEvents] = useState<IncidentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEvent, setNewEvent] = useState({ type: 'comment', message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadIncident();
    loadEvents();
  }, [id]);

  const loadIncident = async () => {
    try {
      const res = await apiFetch(`/api/content/incidents`);
      if (res.ok) {
        const data = await res.json();
        const incidents = data.incidents || data.data || data || [];
        const found = incidents.find((i: any) => i.id === id);
        setIncident(found || null);
      }
    } catch {}
    setLoading(false);
  };

  const loadEvents = async () => {
    try {
      const res = await apiFetch(`/api/content/incidents/${id}/events`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch {}
  };

  const addEvent = async () => {
    if (!newEvent.message.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/content/incidents/${id}/events`, {
        method: 'POST',
        body: JSON.stringify(newEvent),
      });
      if (res.ok) {
        setNewEvent({ type: 'comment', message: '' });
        loadEvents();
      }
    } catch {}
    setSubmitting(false);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'created': return <div className="w-3 h-3 rounded-full bg-[var(--color-info)]" />;
      case 'updated': return <div className="w-3 h-3 rounded-full bg-[var(--color-warning)]" />;
      case 'resolved': return <div className="w-3 h-3 rounded-full bg-[var(--color-success)]" />;
      case 'comment': return <MessageSquare className="w-4 h-4 text-[var(--color-admin-text-muted)]" />;
      default: return <div className="w-3 h-3 rounded-full bg-[var(--color-admin-text-muted)]" />;
    }
  };

  const severityColor = (sev: string) => {
    switch (sev) {
      case 'critical': return 'error';
      case 'major': return 'suspended';
      case 'minor': return 'active';
      default: return 'default';
    }
  };

  const tabs = [{ id: 'details', label: 'Details' }, { id: 'timeline', label: 'Timeline' }];

  if (loading) {
    return (
      <AdminSection title="Incident Details" description="Loading..." tabs={tabs} activeTab="details" onTabChange={() => {}}>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-admin-text-muted)]" />
        </div>
      </AdminSection>
    );
  }

  if (!incident) {
    return (
      <AdminSection title="Incident Details" description="Incident not found" tabs={tabs} activeTab="details" onTabChange={() => {}}>
        <div className="p-12 text-center">
          <p className="text-[var(--color-admin-text-secondary)]">Incident not found</p>
          <button onClick={() => router.push('/admin/alerts')} className="mt-4 text-sm text-[var(--color-admin-primary)] hover:underline">
            Back to incidents
          </button>
        </div>
      </AdminSection>
    );
  }

  return (
    <AdminSection title={incident.title} description={`Incident details and event timeline`} tabs={tabs} activeTab="details" onTabChange={() => {}}>
      <button
        onClick={() => router.push('/admin/alerts')}
        className="inline-flex items-center gap-2 text-sm text-[var(--color-admin-text-secondary)] hover:text-[var(--color-admin-text)] mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to incidents
      </button>

      {/* Incident Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg">
          <p className="text-xs text-[var(--color-admin-text-muted)] mb-1">Severity</p>
          <StatusBadge status={severityColor(incident.severity)} label={incident.severity?.charAt(0).toUpperCase() + incident.severity?.slice(1)} />
        </div>
        <div className="p-4 bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg">
          <p className="text-xs text-[var(--color-admin-text-muted)] mb-1">Status</p>
          <StatusBadge status={incident.status === 'resolved' ? 'active' : 'error'} label={incident.status?.charAt(0).toUpperCase() + incident.status?.slice(1)} />
        </div>
        <div className="p-4 bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg">
          <p className="text-xs text-[var(--color-admin-text-muted)] mb-1">Services</p>
          <p className="text-sm text-[var(--color-admin-text)]">
            {Array.isArray(incident.services) ? incident.services.join(', ') : incident.services || '—'}
          </p>
        </div>
      </div>

      {incident.description && (
        <div className="mb-8 p-4 bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg">
          <p className="text-sm text-[var(--color-admin-text-secondary)] whitespace-pre-wrap">{incident.description}</p>
        </div>
      )}

      {/* Event Timeline */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-[var(--color-admin-text)] mb-4">Event Timeline</h3>
        
        {events.length === 0 ? (
          <div className="p-8 text-center bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg">
            <Clock className="w-10 h-10 mx-auto mb-3 text-[var(--color-admin-text-muted)]" />
            <p className="text-sm text-[var(--color-admin-text-secondary)]">No events recorded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="flex gap-4 p-4 bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-[var(--color-admin-text)] capitalize">{event.type}</span>
                    <span className="text-xs text-[var(--color-admin-text-muted)]">
                      {new Date(event.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {event.message && (
                    <p className="text-sm text-[var(--color-admin-text-secondary)] whitespace-pre-wrap">{event.message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Event Form */}
      {incident.status !== 'resolved' && (
        <div className="p-4 bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg">
          <h4 className="text-sm font-semibold text-[var(--color-admin-text)] mb-3">Add Event</h4>
          <div className="flex gap-3">
            <select
              value={newEvent.type}
              onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
              className="px-3 py-2 border border-[var(--color-admin-border)] rounded-lg text-sm bg-[var(--color-admin-bg)] text-[var(--color-admin-text)]"
            >
              <option value="comment">Comment</option>
              <option value="updated">Updated</option>
              <option value="resolved">Resolved</option>
            </select>
            <input
              type="text"
              value={newEvent.message}
              onChange={(e) => setNewEvent({ ...newEvent, message: e.target.value })}
              placeholder="Event message..."
              className="flex-1 px-3 py-2 border border-[var(--color-admin-border)] rounded-lg text-sm bg-[var(--color-admin-bg)] text-[var(--color-admin-text)]"
              onKeyDown={(e) => e.key === 'Enter' && addEvent()}
            />
            <button
              onClick={addEvent}
              disabled={!newEvent.message.trim() || submitting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-admin-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-admin-primary-hover)] disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </button>
          </div>
        </div>
      )}
    </AdminSection>
  );
}
