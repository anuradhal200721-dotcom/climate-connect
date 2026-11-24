import express from 'express';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import dotenv from 'dotenv';
import {
  FACT_CHECKS,
  INITIAL_INITIATIVES,
  REFERENCE_GLOBAL_DATA,
  SCIENCE_BRIEFS,
} from './server/climateData.ts';
import type {
  ClimateInitiative,
  GlobalClimatePayload,
  HubFocus,
  HubRegion,
  LocationClimatePayload,
  TimeSeriesPoint,
} from './src/types/climate.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const DATA_DIR = path.join(__dirname, 'data');
const INITIATIVES_FILE = path.join(DATA_DIR, 'initiatives.json');

const VALID_REGIONS: readonly HubRegion[] = [
  'North America',
  'Europe',
  'Asia-Pacific',
  'Africa',
  'Latin America',
];

const VALID_FOCUSES: readonly HubFocus[] = [
  'Citizen Science',
  'Clean Energy',
  'Urban Cooling',
  'Policy & Education',
];

function ensureInitiativesStore(): ClimateInitiative[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, {recursive: true});
    }
    if (!fs.existsSync(INITIATIVES_FILE)) {
      fs.writeFileSync(
        INITIATIVES_FILE,
        JSON.stringify(INITIAL_INITIATIVES, null, 2),
        'utf-8',
      );
      return [...INITIAL_INITIATIVES];
    }
    const raw = fs.readFileSync(INITIATIVES_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as ClimateInitiative[];
    }
  } catch {
    // Fallback to initial seed in memory if filesystem is read-only
  }
  return [...INITIAL_INITIATIVES];
}

let initiativesStore: ClimateInitiative[] = ensureInitiativesStore();

function saveInitiativesStore(items: ClimateInitiative[]): void {
  initiativesStore = items;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, {recursive: true});
    }
    fs.writeFileSync(INITIATIVES_FILE, JSON.stringify(items, null, 2), 'utf-8');
  } catch {
    // Continue safely in-memory if disk write fails
  }
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = 5500): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ClimateConnect-PublicObservatory/1.0',
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from upstream`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

let cachedGlobalClimate: {expiresAt: number; payload: GlobalClimatePayload} | null =
  null;

function downsampleSeries(points: TimeSeriesPoint[], maxPoints = 48): TimeSeriesPoint[] {
  if (points.length <= maxPoints) return points;
  const step = Math.ceil(points.length / maxPoints);
  const sampled: TimeSeriesPoint[] = [];
  for (let i = 0; i < points.length; i += step) {
    sampled.push(points[i]);
  }
  const last = points[points.length - 1];
  if (sampled[sampled.length - 1]?.date !== last.date) {
    sampled.push(last);
  }
  return sampled;
}

async function getGlobalClimateData(): Promise<GlobalClimatePayload> {
  if (cachedGlobalClimate && Date.now() < cachedGlobalClimate.expiresAt) {
    return cachedGlobalClimate.payload;
  }

  try {
    const [tempRes, co2Res, methaneRes, arcticRes] = await Promise.all([
      fetchJsonWithTimeout<{result?: {time: string; station: string; land: string}[]}>(
        'https://global-warming.org/api/temperature-api',
      ),
      fetchJsonWithTimeout<{co2?: {year: string; month: string; day: string; trend: string; cycle: string}[]}>(
        'https://global-warming.org/api/co2-api',
      ),
      fetchJsonWithTimeout<{methane?: {date: string; average: string; trend: string}[]}>(
        'https://global-warming.org/api/methane-api',
      ),
      fetchJsonWithTimeout<{arcticData?: {data?: Record<string, {value: number; anom: number}>}}>(
        'https://global-warming.org/api/arctic-api',
      ),
    ]);

    const tempPoints: TimeSeriesPoint[] = (tempRes.result || [])
      .map((item) => ({
        date: item.time.split('.')[0],
        value: Number(item.station),
      }))
      .filter((p) => Number.isFinite(p.value));

    // Average per year for clean multi-decade chart
    const tempByYear = new Map<string, number[]>();
    for (const pt of tempPoints) {
      const arr = tempByYear.get(pt.date) || [];
      arr.push(pt.value);
      tempByYear.set(pt.date, arr);
    }
    const annualTemp: TimeSeriesPoint[] = Array.from(tempByYear.entries())
      .map(([year, vals]) => ({
        date: year,
        value: Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)),
      }))
      .sort((a, b) => Number(a.date) - Number(b.date));

    const co2List = (co2Res.co2 || [])
      .map((item) => ({
        date: `${item.year}-${item.month.padStart(2, '0')}-${item.day.padStart(2, '0')}`,
        value: Number(item.trend || item.cycle),
      }))
      .filter((p) => Number.isFinite(p.value));

    const methaneList = (methaneRes.methane || [])
      .map((item) => ({
        date: item.date,
        value: Number(item.average || item.trend),
      }))
      .filter((p) => Number.isFinite(p.value));

    const arcticRaw = arcticRes.arcticData?.data || {};
    const arcticList: TimeSeriesPoint[] = Object.entries(arcticRaw)
      .filter(([key, val]) => key.endsWith('09') && typeof val?.value === 'number' && val.value > 0)
      .map(([key, val]) => ({
        date: key.slice(0, 4),
        value: Number(val.value.toFixed(2)),
      }))
      .sort((a, b) => Number(a.date) - Number(b.date));

    if (annualTemp.length < 10 || co2List.length < 10) {
      throw new Error('Incomplete upstream series');
    }

    const latestTemp = annualTemp[annualTemp.length - 1];
    const latestCo2 = co2List[co2List.length - 1];
    const latestMethane =
      methaneList[methaneList.length - 1] ||
      REFERENCE_GLOBAL_DATA.series.methane[REFERENCE_GLOBAL_DATA.series.methane.length - 1];
    const latestArctic =
      arcticList[arcticList.length - 1] ||
      REFERENCE_GLOBAL_DATA.series.arcticIce[REFERENCE_GLOBAL_DATA.series.arcticIce.length - 1];

    const payload: GlobalClimatePayload = {
      updatedAt: new Date().toISOString(),
      mode: 'live',
      indicators: [
        {
          id: 'co2',
          label: 'Atmospheric CO2',
          value: latestCo2.value.toFixed(1),
          unit: 'ppm',
          deltaLabel: 'Daily trend at Mauna Loa',
          observationDate: latestCo2.date,
          baselineNote: 'Pre-industrial ~278 ppm (1750)',
          sourceName: 'NOAA Global Monitoring Lab',
          sourceUrl: 'https://gml.noaa.gov/ccgg/trends/',
          mode: 'live',
        },
        {
          id: 'temperature',
          label: 'Global Temperature Anomaly',
          value: `${latestTemp.value >= 0 ? '+' : ''}${latestTemp.value.toFixed(2)}`,
          unit: '°C',
          deltaLabel: 'vs. 1951–1980 baseline',
          observationDate: `${latestTemp.date} Annual Mean`,
          baselineNote: 'Equates to ~+1.5°C vs. 1850–1900',
          sourceName: 'NASA Goddard Institute',
          sourceUrl: 'https://data.giss.nasa.gov/gistemp/',
          mode: 'live',
        },
        {
          id: 'methane',
          label: 'Atmospheric Methane (CH4)',
          value: latestMethane.value.toFixed(1),
          unit: 'ppb',
          deltaLabel: 'Global marine surface mean',
          observationDate: latestMethane.date,
          baselineNote: 'Pre-industrial ~729 ppb (1750)',
          sourceName: 'NOAA Global Monitoring Lab',
          sourceUrl: 'https://gml.noaa.gov/ccgg/trends_ch4/',
          mode: 'live',
        },
        {
          id: 'arctic_ice',
          label: 'Arctic Sea Ice Minimum',
          value: latestArctic.value.toFixed(2),
          unit: 'M km²',
          deltaLabel: 'September sea ice extent',
          observationDate: `Sept ${latestArctic.date}`,
          baselineNote: '1981–2010 Sept median: 6.41 M km²',
          sourceName: 'National Snow & Ice Data Center',
          sourceUrl: 'https://nsidc.org/sea-ice-today',
          mode: 'live',
        },
      ],
      series: {
        temperature: downsampleSeries(annualTemp, 45),
        co2: downsampleSeries(co2List, 45),
        methane: methaneList.length >= 5 ? downsampleSeries(methaneList, 35) : REFERENCE_GLOBAL_DATA.series.methane,
        arcticIce: arcticList.length >= 5 ? downsampleSeries(arcticList, 35) : REFERENCE_GLOBAL_DATA.series.arcticIce,
      },
    };

    cachedGlobalClimate = {
      expiresAt: Date.now() + 15 * 60 * 1000,
      payload,
    };
    return payload;
  } catch {
    return REFERENCE_GLOBAL_DATA;
  }
}

function describeWmoWeatherCode(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code === 45 || code === 48) return 'Fog';
  if (code >= 51 && code <= 57) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snowfall';
  if (code >= 80 && code <= 82) return 'Rain showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Variable clouds';
}

function classifyUsAqi(aqi: number | null): string {
  if (aqi === null) return 'Unavailable';
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

const locationCache = new Map<string, {expiresAt: number; payload: LocationClimatePayload}>();

async function resolveAndFetchLocationClimate(
  query: string,
  latParam?: number,
  lonParam?: number,
): Promise<LocationClimatePayload> {
  const cacheKey = query
    ? `q:${query.toLowerCase().trim()}`
    : `c:${latParam?.toFixed(2)},${lonParam?.toFixed(2)}`;
  const cached = locationCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.payload;
  }

  let locMeta: {
    name: string;
    admin1?: string;
    country: string;
    latitude: number;
    longitude: number;
    elevation: number;
    timezone: string;
  };

  if (
    typeof latParam === 'number' &&
    Number.isFinite(latParam) &&
    typeof lonParam === 'number' &&
    Number.isFinite(lonParam)
  ) {
    locMeta = {
      name: query || `${latParam.toFixed(2)}, ${lonParam.toFixed(2)}`,
      country: 'Coordinates',
      latitude: latParam,
      longitude: lonParam,
      elevation: 0,
      timezone: 'auto',
    };
  } else {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query,
    )}&count=1&language=en&format=json`;
    const geo = await fetchJsonWithTimeout<{
      results?: {
        name: string;
        admin1?: string;
        country?: string;
        latitude: number;
        longitude: number;
        elevation?: number;
        timezone?: string;
      }[];
    }>(geoUrl, 6000);

    if (!geo.results || geo.results.length === 0) {
      throw new Error(`No matching meteorological location found for "${query}".`);
    }
    const top = geo.results[0];
    locMeta = {
      name: top.name,
      admin1: top.admin1,
      country: top.country || 'International',
      latitude: top.latitude,
      longitude: top.longitude,
      elevation: top.elevation ?? 0,
      timezone: top.timezone || 'UTC',
    };
  }

  const lat = locMeta.latitude.toFixed(4);
  const lon = locMeta.longitude.toFixed(4);

  const forecastUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,shortwave_radiation` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum` +
    `&past_days=7&forecast_days=7&timezone=auto`;

  const airQualityUrl =
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}` +
    `&current=us_aqi,european_aqi,pm10,pm2_5,nitrogen_dioxide,ozone&timezone=auto`;

  // Same calendar window in 1991–2000 ERA5 baseline (using 1995 representative decade year + recent comparison)
  const now = new Date();
  const endBaseline = new Date(Date.UTC(1995, now.getUTCMonth(), now.getUTCDate()));
  const startBaseline = new Date(endBaseline.getTime() - 14 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const archiveUrl =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}` +
    `&start_date=${fmt(startBaseline)}&end_date=${fmt(endBaseline)}&daily=temperature_2m_mean&timezone=UTC`;

  const [forecastRes, airRes, archiveRes] = await Promise.all([
    fetchJsonWithTimeout<{
      timezone?: string;
      elevation?: number;
      current?: {
        time: string;
        temperature_2m: number;
        relative_humidity_2m: number;
        apparent_temperature: number;
        precipitation: number;
        weather_code: number;
        wind_speed_10m: number;
        shortwave_radiation?: number;
      };
      daily?: {
        time: string[];
        weather_code: number[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        precipitation_sum: number[];
      };
    }>(forecastUrl, 6500),
    fetchJsonWithTimeout<{
      current?: {
        us_aqi?: number;
        european_aqi?: number;
        pm10?: number;
        pm2_5?: number;
        nitrogen_dioxide?: number;
        ozone?: number;
      };
    }>(airQualityUrl, 6500).catch(() => ({current: undefined})),
    fetchJsonWithTimeout<{
      daily?: {temperature_2m_mean?: (number | null)[]};
    }>(archiveUrl, 6500).catch(() => ({daily: undefined})),
  ]);

  if (!forecastRes.current || !forecastRes.daily) {
    throw new Error('Upstream meteorological feed returned incomplete data.');
  }

  const todayIso = forecastRes.current.time.slice(0, 10);
  const allDates = forecastRes.daily.time;
  const maxTemps = forecastRes.daily.temperature_2m_max;
  const minTemps = forecastRes.daily.temperature_2m_min;
  const precipSums = forecastRes.daily.precipitation_sum;
  const codes = forecastRes.daily.weather_code;

  const recentMeans: number[] = [];
  const forecastItems: LocationClimatePayload['dailyForecast'] = [];

  for (let i = 0; i < allDates.length; i++) {
    const d = allDates[i];
    const meanDay = (maxTemps[i] + minTemps[i]) / 2;
    if (d < todayIso && Number.isFinite(meanDay)) {
      recentMeans.push(meanDay);
    }
    if (d >= todayIso && forecastItems.length < 7) {
      forecastItems.push({
        date: d,
        tempMax: Number(maxTemps[i].toFixed(1)),
        tempMin: Number(minTemps[i].toFixed(1)),
        precipitationMm: Number((precipSums[i] ?? 0).toFixed(1)),
        weatherCode: codes[i] ?? 0,
      });
    }
  }

  const recent7DayMeanC =
    recentMeans.length > 0
      ? Number((recentMeans.reduce((a, b) => a + b, 0) / recentMeans.length).toFixed(1))
      : null;

  const baselineVals = (archiveRes.daily?.temperature_2m_mean || []).filter(
    (v): v is number => typeof v === 'number' && Number.isFinite(v),
  );
  const baselineMeanC =
    baselineVals.length > 0
      ? Number((baselineVals.reduce((a, b) => a + b, 0) / baselineVals.length).toFixed(1))
      : null;

  const anomalyVsBaselineC =
    recent7DayMeanC !== null && baselineMeanC !== null
      ? Number((recent7DayMeanC - baselineMeanC).toFixed(1))
      : null;

  const usAqi =
    typeof airRes.current?.us_aqi === 'number' ? Math.round(airRes.current.us_aqi) : null;

  const payload: LocationClimatePayload = {
    location: {
      ...locMeta,
      elevation: Math.round(forecastRes.elevation ?? locMeta.elevation),
      timezone: forecastRes.timezone || locMeta.timezone,
    },
    observedAt: forecastRes.current.time,
    current: {
      temperatureC: Number(forecastRes.current.temperature_2m.toFixed(1)),
      apparentTemperatureC: Number(forecastRes.current.apparent_temperature.toFixed(1)),
      humidityPct: Math.round(forecastRes.current.relative_humidity_2m),
      windSpeedKmh: Number(forecastRes.current.wind_speed_10m.toFixed(1)),
      precipitationMm: Number(forecastRes.current.precipitation.toFixed(1)),
      shortwaveRadiationWm2:
        typeof forecastRes.current.shortwave_radiation === 'number'
          ? Math.round(forecastRes.current.shortwave_radiation)
          : null,
      weatherLabel: describeWmoWeatherCode(forecastRes.current.weather_code),
    },
    climateContext: {
      baselinePeriod: 'ERA5 Calendar Window (1995 Benchmark)',
      baselineMeanC,
      recent7DayMeanC,
      anomalyVsBaselineC,
      note:
        anomalyVsBaselineC !== null
          ? 'Compares the trailing 7-day station mean against the same 14-day seasonal window in the Copernicus ERA5 archive.'
          : 'Historical ERA5 comparison temporarily unavailable for this station.',
    },
    airQuality: {
      usAqi,
      europeanAqi:
        typeof airRes.current?.european_aqi === 'number'
          ? Math.round(airRes.current.european_aqi)
          : null,
      aqiCategory: classifyUsAqi(usAqi),
      pm25:
        typeof airRes.current?.pm2_5 === 'number'
          ? Number(airRes.current.pm2_5.toFixed(1))
          : null,
      pm10:
        typeof airRes.current?.pm10 === 'number'
          ? Number(airRes.current.pm10.toFixed(1))
          : null,
      no2:
        typeof airRes.current?.nitrogen_dioxide === 'number'
          ? Number(airRes.current.nitrogen_dioxide.toFixed(1))
          : null,
      ozone:
        typeof airRes.current?.ozone === 'number'
          ? Number(airRes.current.ozone.toFixed(1))
          : null,
    },
    dailyForecast: forecastItems,
    sources: [
      {name: 'Open-Meteo WMO Forecast', url: 'https://open-meteo.com/en/docs'},
      {name: 'Copernicus CAMS Air Quality', url: 'https://atmosphere.copernicus.eu/'},
      {name: 'Copernicus ERA5 Reanalysis', url: 'https://cds.climate.copernicus.eu/'},
    ],
  };

  locationCache.set(cacheKey, {
    expiresAt: Date.now() + 10 * 60 * 1000,
    payload,
  });

  return payload;
}

async function startServer() {
  const app = express();
  app.use(express.json({limit: '256kb'}));

  app.get('/api/health', (_req, res) => {
    res.json({status: 'ok', timestamp: new Date().toISOString()});
  });

  app.get('/api/climate/global', async (_req, res) => {
    const data = await getGlobalClimateData();
    res.json(data);
  });

  app.get('/api/climate/location', async (req, res) => {
    const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';
    const latRaw = typeof req.query.lat === 'string' ? Number(req.query.lat) : undefined;
    const lonRaw = typeof req.query.lon === 'string' ? Number(req.query.lon) : undefined;

    if (!query && (latRaw === undefined || lonRaw === undefined)) {
      res.status(400).json({error: 'Provide a city query or latitude/longitude coordinates.'});
      return;
    }
    if (query.length > 100) {
      res.status(400).json({error: 'Location query is too long.'});
      return;
    }

    try {
      const data = await resolveAndFetchLocationClimate(
        query || 'Selected Coordinates',
        latRaw,
        lonRaw,
      );
      res.json(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to fetch regional climate telemetry.';
      res.status(502).json({error: message});
    }
  });

  app.get('/api/science/briefs', (_req, res) => {
    res.json({
      briefs: SCIENCE_BRIEFS,
      factChecks: FACT_CHECKS,
    });
  });

  app.get('/api/initiatives', (_req, res) => {
    res.json({initiatives: initiativesStore});
  });

  app.post('/api/initiatives', (req, res) => {
    const body = req.body as Record<string, unknown>;
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const city = typeof body.city === 'string' ? body.city.trim() : '';
    const country = typeof body.country === 'string' ? body.country.trim() : '';
    const region = body.region as HubRegion;
    const focus = body.focus as HubFocus;
    const schedule = typeof body.schedule === 'string' ? body.schedule.trim() : '';
    const organizer = typeof body.organizer === 'string' ? body.organizer.trim() : '';
    const contactChannel =
      typeof body.contactChannel === 'string' ? body.contactChannel.trim() : '';
    const description =
      typeof body.description === 'string' ? body.description.trim() : '';
    const verifiedMethodology =
      typeof body.verifiedMethodology === 'string'
        ? body.verifiedMethodology.trim()
        : '';

    if (
      title.length < 4 ||
      city.length < 2 ||
      country.length < 2 ||
      !VALID_REGIONS.includes(region) ||
      !VALID_FOCUSES.includes(focus) ||
      organizer.length < 2 ||
      description.length < 15
    ) {
      res.status(400).json({
        error:
          'Please complete all required hub fields (title, city, country, region, focus, organizer, and a clear description).',
      });
      return;
    }

    const created: ClimateInitiative = {
      id: `hub-${Date.now().toString(36)}`,
      title: title.slice(0, 120),
      region,
      city: city.slice(0, 60),
      country: country.slice(0, 60),
      focus,
      schedule: (schedule || 'Monthly · Open Schedule').slice(0, 60),
      organizer: organizer.slice(0, 80),
      contactChannel: (contactChannel || 'community@climateconnect.org').slice(0, 120),
      description: description.slice(0, 420),
      participantsCount: 1,
      verifiedMethodology: (
        verifiedMethodology || 'Community-reported open environmental protocol'
      ).slice(0, 160),
      createdAt: new Date().toISOString(),
    };

    saveInitiativesStore([created, ...initiativesStore]);
    res.status(201).json({initiative: created});
  });

  app.post('/api/initiatives/:id/join', (req, res) => {
    const {id} = req.params;
    const idx = initiativesStore.findIndex((item) => item.id === id);
    if (idx === -1) {
      res.status(404).json({error: 'Climate initiative not found.'});
      return;
    }
    const updated: ClimateInitiative = {
      ...initiativesStore[idx],
      participantsCount: initiativesStore[idx].participantsCount + 1,
    };
    const next = [...initiativesStore];
    next[idx] = updated;
    saveInitiativesStore(next);
    res.json({initiative: updated});
  });

  if (!IS_PRODUCTION) {
    const {createServer: createViteServer} = await import('vite');
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Climate Connect server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
