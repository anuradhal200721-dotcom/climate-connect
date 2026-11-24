export type DataSourceMode = 'live' | 'reference';

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface GlobalIndicatorSummary {
  id: 'co2' | 'temperature' | 'methane' | 'arctic_ice';
  label: string;
  value: string;
  unit: string;
  deltaLabel: string;
  observationDate: string;
  baselineNote: string;
  sourceName: string;
  sourceUrl: string;
  mode: DataSourceMode;
}

export interface GlobalClimatePayload {
  updatedAt: string;
  mode: DataSourceMode;
  indicators: GlobalIndicatorSummary[];
  series: {
    temperature: TimeSeriesPoint[];
    co2: TimeSeriesPoint[];
    methane: TimeSeriesPoint[];
    arcticIce: TimeSeriesPoint[];
  };
}

export interface DailyForecastItem {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitationMm: number;
  weatherCode: number;
}

export interface LocationClimatePayload {
  location: {
    name: string;
    admin1?: string;
    country: string;
    latitude: number;
    longitude: number;
    elevation: number;
    timezone: string;
  };
  observedAt: string;
  current: {
    temperatureC: number;
    apparentTemperatureC: number;
    humidityPct: number;
    windSpeedKmh: number;
    precipitationMm: number;
    shortwaveRadiationWm2: number | null;
    weatherLabel: string;
  };
  climateContext: {
    baselinePeriod: string;
    baselineMeanC: number | null;
    recent7DayMeanC: number | null;
    anomalyVsBaselineC: number | null;
    note: string;
  };
  airQuality: {
    usAqi: number | null;
    europeanAqi: number | null;
    aqiCategory: string;
    pm25: number | null;
    pm10: number | null;
    no2: number | null;
    ozone: number | null;
  };
  dailyForecast: DailyForecastItem[];
  sources: {
    name: string;
    url: string;
  }[];
}

export type ScienceTopic =
  | 'Atmospheric Physics'
  | 'Oceans & Cryosphere'
  | 'Energy & Mitigation'
  | 'Adaptation & Health';

export interface ScienceBrief {
  id: string;
  title: string;
  topic: ScienceTopic;
  summary: string;
  keyFinding: string;
  methodology: string;
  confidence: string;
  publishedYear: string;
  sourceName: string;
  sourceUrl: string;
  citation: string;
}

export type ClaimVerdict =
  | 'Verified by Consensus'
  | 'Requires Context'
  | 'Refuted by Observations';

export interface FactCheckEntry {
  id: string;
  claim: string;
  verdict: ClaimVerdict;
  topic: ScienceTopic;
  explanation: string;
  quantitativeEvidence: string;
  sourceName: string;
  sourceUrl: string;
}

export interface ScienceLibraryPayload {
  briefs: ScienceBrief[];
  factChecks: FactCheckEntry[];
}

export type HubRegion =
  | 'North America'
  | 'Europe'
  | 'Asia-Pacific'
  | 'Africa'
  | 'Latin America';

export type HubFocus =
  | 'Citizen Science'
  | 'Clean Energy'
  | 'Urban Cooling'
  | 'Policy & Education';

export interface ClimateInitiative {
  id: string;
  title: string;
  region: HubRegion;
  city: string;
  country: string;
  focus: HubFocus;
  schedule: string;
  organizer: string;
  contactChannel: string;
  description: string;
  participantsCount: number;
  verifiedMethodology: string;
  createdAt: string;
}
