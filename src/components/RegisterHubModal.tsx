import {useEffect, useState} from 'react';
import {X} from 'lucide-react';
import type {ClimateInitiative, HubFocus, HubRegion} from '../types/climate';

interface RegisterHubModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (initiative: ClimateInitiative) => void;
}

const REGIONS: HubRegion[] = [
  'North America',
  'Europe',
  'Asia-Pacific',
  'Africa',
  'Latin America',
];

const FOCUSES: HubFocus[] = [
  'Citizen Science',
  'Clean Energy',
  'Urban Cooling',
  'Policy & Education',
];

export function RegisterHubModal({open, onClose, onCreated}: RegisterHubModalProps) {
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState<HubRegion>('North America');
  const [focus, setFocus] = useState<HubFocus>('Citizen Science');
  const [organizer, setOrganizer] = useState('');
  const [schedule, setSchedule] = useState('');
  const [contactChannel, setContactChannel] = useState('');
  const [verifiedMethodology, setVerifiedMethodology] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/initiatives', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          title,
          city,
          country,
          region,
          focus,
          organizer,
          schedule,
          contactChannel,
          verifiedMethodology,
          description,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Could not register climate hub.');
      }
      onCreated(json.initiative as ClimateInitiative);
      setTitle('');
      setCity('');
      setCountry('');
      setOrganizer('');
      setSchedule('');
      setContactChannel('');
      setVerifiedMethodology('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit initiative.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-hub-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 id="register-hub-title" className="font-serif text-xl font-semibold text-slate-900">
              Register a Local Climate Hub
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Publish a verifiable community climate initiative, monitoring station, or public
              resilience group.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-900"
            >
              {error}
            </div>
          )}

          <div>
            <label htmlFor="hub-title" className="block text-xs font-medium text-slate-700">
              Initiative Title *
            </label>
            <input
              id="hub-title"
              type="text"
              required
              minLength={4}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Harbor Watershed Heat & Tide Monitor"
              className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="hub-city" className="block text-xs font-medium text-slate-700">
                City *
              </label>
              <input
                id="hub-city"
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Vancouver"
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="hub-country" className="block text-xs font-medium text-slate-700">
                Country *
              </label>
              <input
                id="hub-country"
                type="text"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. Canada"
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="hub-region" className="block text-xs font-medium text-slate-700">
                Region *
              </label>
              <select
                id="hub-region"
                value={region}
                onChange={(e) => setRegion(e.target.value as HubRegion)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="hub-focus" className="block text-xs font-medium text-slate-700">
                Focus Area *
              </label>
              <select
                id="hub-focus"
                value={focus}
                onChange={(e) => setFocus(e.target.value as HubFocus)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
              >
                {FOCUSES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="hub-organizer" className="block text-xs font-medium text-slate-700">
                Organizer / Group *
              </label>
              <input
                id="hub-organizer"
                type="text"
                required
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                placeholder="e.g. Pacific Estuary Commons"
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="hub-schedule" className="block text-xs font-medium text-slate-700">
                Meeting Schedule
              </label>
              <input
                id="hub-schedule"
                type="text"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                placeholder="e.g. Saturdays · 09:00 PST"
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="hub-contact" className="block text-xs font-medium text-slate-700">
                Contact Email or Channel
              </label>
              <input
                id="hub-contact"
                type="text"
                value={contactChannel}
                onChange={(e) => setContactChannel(e.target.value)}
                placeholder="e.g. team@localhub.org"
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="hub-methodology" className="block text-xs font-medium text-slate-700">
                Verification Protocol
              </label>
              <input
                id="hub-methodology"
                type="text"
                value={verifiedMethodology}
                onChange={(e) => setVerifiedMethodology(e.target.value)}
                placeholder="e.g. Calibrated WMO surface logger"
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="hub-description" className="block text-xs font-medium text-slate-700">
              Description &amp; Public Goal *
            </label>
            <textarea
              id="hub-description"
              required
              minLength={15}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what residents measure, build, or advocate for, and how newcomers can participate."
              className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-emerald-900 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Publishing...' : 'Publish Hub'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
