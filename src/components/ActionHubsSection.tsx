import {useMemo, useState} from 'react';
import {Check, Mail, Plus, Users} from 'lucide-react';
import type {ClimateInitiative, HubFocus, HubRegion} from '../types/climate';
import {ResilientImage} from './ResilientImage';

interface ActionHubsSectionProps {
  initiatives: ClimateInitiative[];
  loading: boolean;
  onJoinInitiative: (id: string) => Promise<void>;
  onOpenRegisterModal: () => void;
}

const REGIONS: ('All Regions' | HubRegion)[] = [
  'All Regions',
  'North America',
  'Europe',
  'Asia-Pacific',
  'Africa',
  'Latin America',
];

const FOCUSES: ('All Focuses' | HubFocus)[] = [
  'All Focuses',
  'Citizen Science',
  'Clean Energy',
  'Urban Cooling',
  'Policy & Education',
];

export function ActionHubsSection({
  initiatives,
  loading,
  onJoinInitiative,
  onOpenRegisterModal,
}: ActionHubsSectionProps) {
  const [selectedRegion, setSelectedRegion] = useState<'All Regions' | HubRegion>('All Regions');
  const [selectedFocus, setSelectedFocus] = useState<'All Focuses' | HubFocus>('All Focuses');
  const [joinedIds, setJoinedIds] = useState<Record<string, boolean>>({});
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return initiatives.filter((item) => {
      const regionMatch = selectedRegion === 'All Regions' || item.region === selectedRegion;
      const focusMatch = selectedFocus === 'All Focuses' || item.focus === selectedFocus;
      return regionMatch && focusMatch;
    });
  }, [initiatives, selectedRegion, selectedFocus]);

  async function handleConnect(id: string) {
    if (joinedIds[id] || joiningId === id) return;
    setJoiningId(id);
    try {
      await onJoinInitiative(id);
      setJoinedIds((prev) => ({...prev, [id]: true}));
    } finally {
      setJoiningId(null);
    }
  }

  return (
    <section id="action-hubs" className="border-b border-slate-200 bg-[#f8faf9] py-16 lg:py-20">
      <div className="mx-auto max-w-[1360px] px-6 lg:px-10">
        {/* Intro Split */}
        <div className="grid grid-cols-1 items-center gap-8 border-b border-slate-200 pb-10 lg:grid-cols-12">
          <figure className="lg:col-span-5">
            <div className="aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              <ResilientImage
                src="/src/assets/images/community_solar_canopy_1795495903042.jpg"
                alt="Civic community solar canopy and native wetland cooling corridor"
                fallbackTitle="Community Solar & Resilience Hub"
                className="h-full w-full object-cover"
              />
            </div>
            <figcaption className="mt-2 text-xs text-slate-500">
              <span className="font-medium text-slate-700">Fig. 3</span> — Community-managed solar
              microgrids and urban wetland corridors combine local mitigation with heat resilience.
            </figcaption>
          </figure>

          <div className="lg:col-span-7">
            <p className="text-xs font-medium tracking-wider text-slate-500">
              04. Climate Connect Community Directory
            </p>
            <h2
              className="mt-2 font-serif text-3xl font-semibold tracking-tight text-slate-900"
              style={{textWrap: 'balance'}}
            >
              Connect with verified local climate hubs
            </h2>
            <p className="mt-3 max-w-[64ch] text-base leading-relaxed text-slate-600">
              Join citizen-science monitoring stations, neighborhood urban-cooling coalitions, and
              community clean-energy cooperatives—or register your own local initiative so residents
              can participate.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onOpenRegisterModal}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-900 px-4 py-2.5 text-sm font-medium text-white whitespace-nowrap shrink-0 transition-colors hover:bg-emerald-800 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-900"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Register Local Hub</span>
              </button>
              <span className="font-mono text-xs text-slate-600 tabular-nums">
                {initiatives.length} active hubs ·{' '}
                {initiatives.reduce((acc, item) => acc + item.participantsCount, 0)} connected
                participants
              </span>
            </div>
          </div>
        </div>

        {/* Region & Focus Filters */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {REGIONS.map((region) => (
              <button
                key={region}
                type="button"
                onClick={() => setSelectedRegion(region)}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  selectedRegion === region
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {region}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="focus-filter" className="text-xs font-medium text-slate-600">
              Focus:
            </label>
            <select
              id="focus-filter"
              value={selectedFocus}
              onChange={(e) => setSelectedFocus(e.target.value as 'All Focuses' | HubFocus)}
              className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 focus:border-emerald-800 focus:outline-none"
            >
              {FOCUSES.map((focus) => (
                <option key={focus} value={focus}>
                  {focus}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Directory Cards */}
        {loading ? (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({length: 3}).map((_, idx) => (
              <div
                key={idx}
                className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-sm text-slate-600">
              No climate action hubs listed for this region and focus combination yet.
            </p>
            <button
              type="button"
              onClick={onOpenRegisterModal}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 cursor-pointer"
            >
              Register the first hub here
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((hub) => {
              const isJoined = !!joinedIds[hub.id];
              const isJoining = joiningId === hub.id;
              return (
                <article
                  key={hub.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                      <span className="font-medium text-emerald-900">{hub.focus}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {hub.city}, {hub.country}
                      </span>
                    </div>

                    <h3 className="mt-2 font-serif text-lg font-semibold leading-snug text-slate-900">
                      {hub.title}
                    </h3>

                    <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                      {hub.description}
                    </p>

                    <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
                      <p>
                        <span className="font-medium text-slate-700">Organizer: </span>
                        {hub.organizer}
                      </p>
                      <p>
                        <span className="font-medium text-slate-700">Schedule: </span>
                        {hub.schedule}
                      </p>
                      <p>
                        <span className="font-medium text-slate-700">Verification: </span>
                        {hub.verifiedMethodology}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-200 pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-600 tabular-nums">
                        <Users className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                        <span>{hub.participantsCount} members</span>
                      </span>

                      <button
                        type="button"
                        disabled={isJoined || isJoining}
                        onClick={() => void handleConnect(hub.id)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                          isJoined
                            ? 'border border-emerald-200 bg-emerald-50 text-emerald-900 cursor-default'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                      >
                        {isJoined ? (
                          <>
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Connected</span>
                          </>
                        ) : isJoining ? (
                          <span>Connecting...</span>
                        ) : (
                          <span>Connect with Hub</span>
                        )}
                      </button>
                    </div>

                    {isJoined && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs text-emerald-950">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-emerald-800" aria-hidden="true" />
                        <span className="truncate">
                          Coordinator contact: <span className="font-mono">{hub.contactChannel}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
