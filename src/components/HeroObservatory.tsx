import {ArrowDownRight, ArrowUpRight} from 'lucide-react';
import type {GlobalClimatePayload} from '../types/climate';
import {ResilientImage} from './ResilientImage';

interface HeroObservatoryProps {
  globalData: GlobalClimatePayload | null;
  loading: boolean;
}

export function HeroObservatory({globalData, loading}: HeroObservatoryProps) {
  return (
    <section id="top" className="border-b border-slate-200 bg-[#f8faf9] pt-10 pb-14 lg:pt-14 lg:pb-16">
      <div className="mx-auto max-w-[1360px] px-6 lg:px-10">
        {/* 2-Column Editorial Hero Split */}
        <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="flex flex-col justify-between lg:col-span-6">
            <div>
              <p className="text-xs font-medium tracking-wider text-slate-500">
                Open Climate Science · Verified Telemetry &amp; Community Networks
              </p>

              <h1
                className="mt-4 font-serif font-semibold tracking-tight text-slate-900"
                style={{
                  fontSize: 'clamp(2.25rem, 3.6vw, 3.35rem)',
                  lineHeight: 1.12,
                  textWrap: 'balance',
                }}
              >
                Verified climate science and local resilience, open to everyone.
              </h1>

              <p className="mt-5 max-w-[62ch] text-base leading-relaxed text-slate-600">
                Climate Connect brings together peer-reviewed atmospheric records from NOAA, NASA,
                and the IPCC, real-time Copernicus meteorological lookups for any city, and a
                public directory of community-led climate action hubs.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#local-lookup"
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-900 px-5 py-2.5 text-sm font-medium text-white whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-900"
                >
                  Check Local Climate
                  <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <a
                  href="#science-briefs"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 whitespace-nowrap shrink-0 transition-colors duration-150 hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                >
                  Read Verified Briefs
                </a>
              </div>
            </div>

            <div className="mt-10 border-t border-slate-200 pt-5 text-xs text-slate-500">
              <span>Primary Data Feeds: NOAA Global Monitoring Lab</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>NASA GISS</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Copernicus ERA5 &amp; CAMS</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>IPCC AR6</span>
            </div>
          </div>

          <div className="flex flex-col lg:col-span-6">
            <figure className="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="relative flex-1 min-h-[260px] lg:min-h-[360px] overflow-hidden bg-slate-100">
                <ResilientImage
                  src="/src/assets/images/hero_climate_observatory_1795495902684.jpg"
                  alt="High-altitude alpine atmospheric climate monitoring observatory overlooking mountain glaciers at dawn"
                  fallbackTitle="High-Altitude Atmospheric Observatory"
                  className="h-full w-full object-cover"
                />
              </div>
              <figcaption className="border-t border-slate-200 px-4 py-3 text-xs text-slate-600">
                <span className="font-medium text-slate-800">Fig. 1</span>
                <span className="mx-1.5" aria-hidden="true">—</span>
                Continuous high-altitude atmospheric stations calibrate surface radiative balance,
                greenhouse gas baselines, and glacial mass-balance telemetry.
              </figcaption>
            </figure>
          </div>
        </div>

        {/* Full-Width 4-Column Planetary Telemetry Strip */}
        <div className="mt-10">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700">
              Global Atmospheric &amp; Cryosphere Indicators
            </span>
            <span>
              {loading
                ? 'Synchronizing planetary observations...'
                : globalData?.mode === 'live'
                  ? 'Source status: Live institutional series'
                  : 'Source status: Verified archival baseline'}
            </span>
          </div>

          <div className="grid grid-cols-1 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4">
            {(loading || !globalData
              ? Array.from({length: 4}).map((_, idx) => ({
                  id: `skeleton-${idx}`,
                  label: 'Loading indicator...',
                  value: '—',
                  unit: '',
                  deltaLabel: 'Fetching verified series',
                  observationDate: '—',
                  baselineNote: '—',
                  sourceName: 'NOAA / NASA / NSIDC',
                  sourceUrl: '#',
                  mode: 'reference' as const,
                }))
              : globalData.indicators
            ).map((item) => (
              <div key={item.id} className="flex flex-col justify-between p-5">
                <div>
                  <p className="text-xs font-medium text-slate-500">{item.label}</p>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="font-mono text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
                      {item.value}
                    </span>
                    {item.unit && (
                      <span className="font-mono text-xs font-medium text-slate-500">
                        {item.unit}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs font-medium text-teal-800">{item.deltaLabel}</p>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <p className="truncate">{item.observationDate}</p>
                  <p className="mt-0.5 truncate text-slate-400">{item.baselineNote}</p>
                  {item.sourceUrl !== '#' && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 font-medium text-slate-700 hover:text-emerald-900 hover:underline"
                    >
                      <span>{item.sourceName}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
