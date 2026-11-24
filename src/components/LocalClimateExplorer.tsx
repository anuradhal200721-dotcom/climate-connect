import {useEffect, useState} from 'react';
import {ArrowUpRight, LocateFixed, Search} from 'lucide-react';
import type {LocationClimatePayload} from '../types/climate';

const PRESET_CITIES = [
  'San Francisco',
  'New Delhi',
  'London',
  'Nairobi',
  'Tokyo',
  'São Paulo',
];

function getAqiToneClass(category: string): string {
  if (category === 'Good') return 'text-emerald-800';
  if (category === 'Moderate') return 'text-amber-700';
  if (category.includes('Unhealthy') || category === 'Hazardous') return 'text-rose-700';
  return 'text-slate-700';
}

export function LocalClimateExplorer() {
  const [queryInput, setQueryInput] = useState('San Francisco');
  const [activeCity, setActiveCity] = useState('San Francisco');
  const [data, setData] = useState<LocationClimatePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  async function fetchCityClimate(params: {query?: string; lat?: number; lon?: number}) {
    setLoading(true);
    setError(null);
    setGeoNotice(null);
    try {
      const qs =
        params.lat !== undefined && params.lon !== undefined
          ? `lat=${params.lat}&lon=${params.lon}`
          : `query=${encodeURIComponent(params.query || 'San Francisco')}`;
      const res = await fetch(`/api/climate/location?${qs}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Unable to load meteorological telemetry.');
      }
      setData(json as LocationClimatePayload);
      if (params.query) {
        setActiveCity(params.query);
      } else {
        setActiveCity(`${json.location.name}`);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to retrieve live meteorological station data.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchCityClimate({query: 'San Francisco'});
  }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = queryInput.trim();
    if (!trimmed) return;
    void fetchCityClimate({query: trimmed});
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setGeoNotice('Browser geolocation is unavailable. Search by city name instead.');
      return;
    }
    setGeoNotice('Requesting browser coordinates...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void fetchCityClimate({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      () => {
        setGeoNotice('Location permission declined. Search any city or station below.');
      },
      {timeout: 6000},
    );
  }

  return (
    <section id="local-lookup" className="border-b border-slate-200 bg-[#f8faf9] py-16 lg:py-20">
      <div className="mx-auto max-w-[1360px] px-6 lg:px-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-medium tracking-wider text-slate-500">
              02. Local Meteorological &amp; Air Quality Lookup
            </p>
            <h2
              className="mt-2 font-serif text-3xl font-semibold tracking-tight text-slate-900"
              style={{textWrap: 'balance'}}
            >
              Inspect real-time conditions for any city
            </h2>
            <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-slate-600">
              Queries live WMO station forecasts, Copernicus CAMS particulate concentrations, and
              ERA5 historical seasonal benchmarks for your exact location.
            </p>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="flex w-full flex-wrap items-center gap-2 lg:w-auto"
          >
            <div className="relative min-w-[240px] flex-1 sm:w-72">
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <label htmlFor="city-lookup-input" className="sr-only">
                Search city or region
              </label>
              <input
                id="city-lookup-input"
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Search any city (e.g. Tokyo, Nairobi)"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pr-3 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-800 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-10 rounded-lg bg-emerald-900 px-4 text-sm font-medium text-white whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-emerald-800 disabled:opacity-60 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-900"
            >
              {loading ? 'Loading...' : 'Lookup Station'}
            </button>

            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-slate-50 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              <LocateFixed className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <span>My Coordinates</span>
            </button>
          </form>
        </div>

        {/* Preset Station Selector */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-medium text-slate-500">Quick stations:</span>
          {PRESET_CITIES.map((city) => {
            const isActive = activeCity.toLowerCase() === city.toLowerCase();
            return (
              <button
                key={city}
                type="button"
                onClick={() => {
                  setQueryInput(city);
                  void fetchCityClimate({query: city});
                }}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer ${
                  isActive
                    ? 'border-emerald-900 bg-emerald-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {city}
              </button>
            );
          })}
        </div>

        {geoNotice && (
          <p className="mt-3 text-xs font-medium text-slate-600">{geoNotice}</p>
        )}

        {error && (
          <div
            role="alert"
            className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-900"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void fetchCityClimate({query: activeCity || 'San Francisco'})}
              className="rounded-md border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-900 hover:bg-rose-100 cursor-pointer"
            >
              Retry Lookup
            </button>
          </div>
        )}

        {loading && !data && (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white lg:col-span-7" />
            <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white lg:col-span-5" />
          </div>
        )}

        {data && (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Station Weather & Historical Benchmark */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="font-serif text-2xl font-semibold text-slate-900">
                      {data.location.name}
                      {data.location.admin1 ? `, ${data.location.admin1}` : ''}
                    </h3>
                    <p className="mt-1 font-mono text-xs text-slate-500">
                      {data.location.country} · {data.location.latitude.toFixed(2)}°N,{' '}
                      {data.location.longitude.toFixed(2)}°E · Elev {data.location.elevation} m ·{' '}
                      {data.observedAt.replace('T', ' ')}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-3xl font-semibold text-slate-900 tabular-nums">
                      {data.current.temperatureC.toFixed(1)}
                      <span className="ml-1 text-base font-normal text-slate-500">°C</span>
                    </div>
                    <p className="text-xs font-medium text-slate-600">
                      {data.current.weatherLabel} · Feels like{' '}
                      {data.current.apparentTemperatureC.toFixed(1)}°C
                    </p>
                  </div>
                </div>

                {/* Primary Meteorological Readings */}
                <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <dt className="text-xs text-slate-500">Relative Humidity</dt>
                    <dd className="mt-1 font-mono text-lg font-semibold text-slate-900 tabular-nums">
                      {data.current.humidityPct}%
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Wind (10 m)</dt>
                    <dd className="mt-1 font-mono text-lg font-semibold text-slate-900 tabular-nums">
                      {data.current.windSpeedKmh} <span className="text-xs font-normal text-slate-500">km/h</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Precipitation</dt>
                    <dd className="mt-1 font-mono text-lg font-semibold text-slate-900 tabular-nums">
                      {data.current.precipitationMm} <span className="text-xs font-normal text-slate-500">mm</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Solar Irradiance</dt>
                    <dd className="mt-1 font-mono text-lg font-semibold text-slate-900 tabular-nums">
                      {data.current.shortwaveRadiationWm2 !== null
                        ? data.current.shortwaveRadiationWm2
                        : '—'}{' '}
                      <span className="text-xs font-normal text-slate-500">W/m²</span>
                    </dd>
                  </div>
                </dl>

                {/* ERA5 Historical Benchmark Comparison */}
                <div className="mt-6 border-t border-slate-200 pt-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-800">
                      Copernicus ERA5 Seasonal Context
                    </p>
                    <span className="font-mono text-xs text-slate-500">
                      {data.climateContext.baselinePeriod}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-slate-500">Trailing 7-Day Mean</p>
                      <p className="mt-0.5 font-mono text-base font-semibold text-slate-900 tabular-nums">
                        {data.climateContext.recent7DayMeanC !== null
                          ? `${data.climateContext.recent7DayMeanC.toFixed(1)} °C`
                          : 'Unavailable'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">1995 Benchmark Mean</p>
                      <p className="mt-0.5 font-mono text-base font-semibold text-slate-900 tabular-nums">
                        {data.climateContext.baselineMeanC !== null
                          ? `${data.climateContext.baselineMeanC.toFixed(1)} °C`
                          : 'Unavailable'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Window Departure</p>
                      <p
                        className={`mt-0.5 font-mono text-base font-semibold tabular-nums ${
                          data.climateContext.anomalyVsBaselineC !== null &&
                          data.climateContext.anomalyVsBaselineC > 0
                            ? 'text-amber-700'
                            : 'text-teal-800'
                        }`}
                      >
                        {data.climateContext.anomalyVsBaselineC !== null
                          ? `${data.climateContext.anomalyVsBaselineC >= 0 ? '+' : ''}${data.climateContext.anomalyVsBaselineC.toFixed(1)} °C`
                          : '—'}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2.5 text-xs text-slate-500">{data.climateContext.note}</p>
                </div>
              </div>

              {/* Air Quality & Particulates Panel */}
              <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5">
                <div>
                  <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Copernicus CAMS Atmospheric Chemistry
                      </p>
                      <h3 className="mt-1 font-serif text-xl font-semibold text-slate-900">
                        Air Quality &amp; Particulates
                      </h3>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                        {data.airQuality.usAqi !== null ? data.airQuality.usAqi : '—'}
                      </span>
                      <p className="text-xs text-slate-500">US AQI</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-medium text-slate-600">Health Classification</span>
                    <span
                      className={`text-sm font-semibold ${getAqiToneClass(data.airQuality.aqiCategory)}`}
                    >
                      {data.airQuality.aqiCategory}
                    </span>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-xs text-slate-500">Fine Particulates (PM2.5)</dt>
                      <dd className="mt-1 font-mono text-base font-semibold text-slate-900 tabular-nums">
                        {data.airQuality.pm25 !== null ? data.airQuality.pm25 : '—'}{' '}
                        <span className="text-xs font-normal text-slate-500">µg/m³</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Coarse Dust (PM10)</dt>
                      <dd className="mt-1 font-mono text-base font-semibold text-slate-900 tabular-nums">
                        {data.airQuality.pm10 !== null ? data.airQuality.pm10 : '—'}{' '}
                        <span className="text-xs font-normal text-slate-500">µg/m³</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Nitrogen Dioxide (NO2)</dt>
                      <dd className="mt-1 font-mono text-base font-semibold text-slate-900 tabular-nums">
                        {data.airQuality.no2 !== null ? data.airQuality.no2 : '—'}{' '}
                        <span className="text-xs font-normal text-slate-500">µg/m³</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Surface Ozone (O3)</dt>
                      <dd className="mt-1 font-mono text-base font-semibold text-slate-900 tabular-nums">
                        {data.airQuality.ozone !== null ? data.airQuality.ozone : '—'}{' '}
                        <span className="text-xs font-normal text-slate-500">µg/m³</span>
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-6 border-t border-slate-200 pt-4 text-xs text-slate-500">
                  <p className="mb-1.5 font-medium text-slate-700">Verified Data Feeds</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {data.sources.map((src) => (
                      <a
                        key={src.name}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-900 hover:underline"
                      >
                        <span>{src.name}</span>
                        <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 7-Day Station Forecast Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-6 py-3.5">
                <h3 className="text-sm font-semibold text-slate-900">
                  7-Day Regional Meteorological Outlook
                </h3>
              </div>
              <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 sm:grid-cols-4 lg:grid-cols-7 lg:divide-y-0">
                {data.dailyForecast.map((day) => {
                  const dateObj = new Date(`${day.date}T12:00:00Z`);
                  const dayLabel = dateObj.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    timeZone: 'UTC',
                  });
                  return (
                    <div key={day.date} className="p-4">
                      <p className="font-mono text-xs font-medium text-slate-600">{dayLabel}</p>
                      <div className="mt-2 flex items-baseline gap-2 font-mono tabular-nums">
                        <span className="text-base font-semibold text-slate-900">
                          {day.tempMax.toFixed(0)}°
                        </span>
                        <span className="text-xs text-slate-400">/ {day.tempMin.toFixed(0)}°C</span>
                      </div>
                      <p className="mt-1.5 font-mono text-xs text-slate-500 tabular-nums">
                        Precip: {day.precipitationMm.toFixed(1)} mm
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
