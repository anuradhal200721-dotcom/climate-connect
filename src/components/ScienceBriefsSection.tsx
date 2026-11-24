import {useMemo, useState} from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Search,
  XCircle,
} from 'lucide-react';
import type {
  ClaimVerdict,
  FactCheckEntry,
  ScienceBrief,
  ScienceTopic,
} from '../types/climate';
import {ResilientImage} from './ResilientImage';

interface ScienceBriefsSectionProps {
  briefs: ScienceBrief[];
  factChecks: FactCheckEntry[];
  loading: boolean;
}

const TOPICS: ('All Topics' | ScienceTopic)[] = [
  'All Topics',
  'Atmospheric Physics',
  'Oceans & Cryosphere',
  'Energy & Mitigation',
  'Adaptation & Health',
];

function VerdictLabel({verdict}: {verdict: ClaimVerdict}) {
  if (verdict === 'Verified by Consensus') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Verified by Consensus</span>
      </span>
    );
  }
  if (verdict === 'Requires Context') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800">
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Requires Context</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800">
      <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>Refuted by Observations</span>
    </span>
  );
}

export function ScienceBriefsSection({
  briefs,
  factChecks,
  loading,
}: ScienceBriefsSectionProps) {
  const [viewMode, setViewMode] = useState<'briefs' | 'factChecks'>('briefs');
  const [selectedTopic, setSelectedTopic] = useState<'All Topics' | ScienceTopic>('All Topics');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => ({...prev, [id]: !prev[id]}));
  }

  const filteredBriefs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return briefs.filter((b) => {
      const topicMatch = selectedTopic === 'All Topics' || b.topic === selectedTopic;
      const queryMatch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.summary.toLowerCase().includes(q) ||
        b.sourceName.toLowerCase().includes(q);
      return topicMatch && queryMatch;
    });
  }, [briefs, selectedTopic, searchTerm]);

  const filteredFactChecks = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return factChecks.filter((f) => {
      const topicMatch = selectedTopic === 'All Topics' || f.topic === selectedTopic;
      const queryMatch =
        !q ||
        f.claim.toLowerCase().includes(q) ||
        f.explanation.toLowerCase().includes(q) ||
        f.sourceName.toLowerCase().includes(q);
      return topicMatch && queryMatch;
    });
  }, [factChecks, selectedTopic, searchTerm]);

  return (
    <section id="science-briefs" className="border-b border-slate-200 bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-[1360px] px-6 lg:px-10">
        {/* Editorial Intro + Visual Anchor */}
        <div className="grid grid-cols-1 items-center gap-8 border-b border-slate-200 pb-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="text-xs font-medium tracking-wider text-slate-500">
              03. Peer-Reviewed Knowledge Base
            </p>
            <h2
              className="mt-2 font-serif text-3xl font-semibold tracking-tight text-slate-900"
              style={{textWrap: 'balance'}}
            >
              Evidence-based climate briefings and claim verification
            </h2>
            <p className="mt-3 max-w-[64ch] text-base leading-relaxed text-slate-600">
              Every explanation in Climate Connect cites primary assessments from the
              Intergovernmental Panel on Climate Change (IPCC AR6), World Meteorological
              Organization, NASA, NOAA, and the International Energy Agency.
            </p>

            {/* View Switcher & Topic Controls */}
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div
                role="tablist"
                aria-label="Science library mode"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'briefs'}
                  onClick={() => setViewMode('briefs')}
                  className={`rounded-md px-3.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    viewMode === 'briefs'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Scientific Briefs ({briefs.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'factChecks'}
                  onClick={() => setViewMode('factChecks')}
                  className={`rounded-md px-3.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    viewMode === 'factChecks'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Claim Fact-Checks ({factChecks.length})
                </button>
              </div>

              <div className="relative flex-1 min-w-[210px] max-w-xs">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <label htmlFor="science-search" className="sr-only">
                  Filter briefings or claims
                </label>
                <input
                  id="science-search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter by keyword or source..."
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white pr-3 pl-9 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-800 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <figure className="lg:col-span-5">
            <div className="aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              <ResilientImage
                src="/src/assets/images/ocean_buoy_telemetry_1795495902872.jpg"
                alt="Autonomous marine climate monitoring buoy measuring ocean surface temperature and salinity"
                fallbackTitle="Marine Climate Telemetry Network"
                className="h-full w-full object-cover"
              />
            </div>
            <figcaption className="mt-2 text-xs text-slate-500">
              <span className="font-medium text-slate-700">Fig. 2</span> — Autonomous ocean buoys
              and Argo profiling floats record over 90% of planetary excess heat storage.
            </figcaption>
          </figure>
        </div>

        {/* Topic Filter Row */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {TOPICS.map((topic) => {
            const active = selectedTopic === topic;
            return (
              <button
                key={topic}
                type="button"
                onClick={() => setSelectedTopic(topic)}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {topic}
              </button>
            );
          })}
        </div>

        {loading && (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {Array.from({length: 4}).map((_, idx) => (
              <div
                key={idx}
                className="h-52 animate-pulse rounded-xl border border-slate-200 bg-slate-50"
              />
            ))}
          </div>
        )}

        {/* Scientific Briefs Grid */}
        {!loading && viewMode === 'briefs' && (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {filteredBriefs.length === 0 ? (
              <div className="col-span-full rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                No verified briefs match your current filter. Clear the keyword search to view all
                topics.
              </div>
            ) : (
              filteredBriefs.map((brief) => {
                const expanded = !!expandedIds[brief.id];
                return (
                  <article
                    key={brief.id}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-[#fbfcfb] p-6"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-medium text-emerald-900">{brief.topic}</span>
                        <span aria-hidden="true">·</span>
                        <span>{brief.confidence}</span>
                        <span aria-hidden="true">·</span>
                        <span>{brief.publishedYear}</span>
                      </div>

                      <h3 className="mt-2 font-serif text-xl font-semibold leading-snug text-slate-900">
                        {brief.title}
                      </h3>

                      <p className="mt-3 text-sm leading-relaxed text-slate-600">
                        {brief.summary}
                      </p>

                      <div className="mt-4 border-t border-slate-200 pt-3">
                        <p className="text-xs font-semibold text-slate-800">Key Empirical Finding</p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-700">
                          {brief.keyFinding}
                        </p>
                      </div>

                      {expanded && (
                        <div className="mt-4 space-y-2 border-t border-slate-200 pt-3 text-xs leading-relaxed text-slate-600">
                          <div>
                            <span className="font-semibold text-slate-800">Methodology: </span>
                            {brief.methodology}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800">Citation: </span>
                            <span className="font-mono">{brief.citation}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                      <button
                        type="button"
                        aria-expanded={expanded}
                        onClick={() => toggleExpanded(brief.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900 cursor-pointer"
                      >
                        <span>{expanded ? 'Hide methodology' : 'Methodology & citation'}</span>
                        {expanded ? (
                          <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                      </button>

                      <a
                        href={brief.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-emerald-900 hover:underline"
                      >
                        <span>{brief.sourceName}</span>
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}

        {/* Claim Fact-Checks List */}
        {!loading && viewMode === 'factChecks' && (
          <div className="mt-8 space-y-4">
            {filteredFactChecks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                No claim fact-checks match your current search.
              </div>
            ) : (
              filteredFactChecks.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-[#fbfcfb] p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <VerdictLabel verdict={item.verdict} />
                    <span className="text-xs text-slate-500">{item.topic}</span>
                  </div>

                  <h3 className="mt-2 font-serif text-lg font-semibold text-slate-900">
                    Claim: &ldquo;{item.claim}&rdquo;
                  </h3>

                  <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                    {item.explanation}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-3">
                    <p className="font-mono text-xs text-slate-700">
                      Evidence: {item.quantitativeEvidence}
                    </p>
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-emerald-900 whitespace-nowrap shrink-0 hover:underline"
                    >
                      <span>{item.sourceName}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </div>
                </article>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
}
