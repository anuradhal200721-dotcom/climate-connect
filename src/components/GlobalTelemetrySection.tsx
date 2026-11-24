import {useMemo, useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import type {GlobalClimatePayload, TimeSeriesPoint} from '../types/climate';

interface GlobalTelemetrySectionProps {
  globalData: GlobalClimatePayload | null;
  loading: boolean;
}

type DatasetKey = 'temperature' | 'co2' | 'methane' | 'arcticIce';

interface DatasetConfig {
  key: DatasetKey;
  label: string;
  title: string;
  unit: string;
  strokeColor: string;
  fillColor: string;
  description: string;
  methodology: string;
  sourceName: string;
  sourceUrl: string;
}

const DATASET_CONFIGS: DatasetConfig[] = [
  {
    key: 'temperature',
    label: 'Global Temperature',
    title: 'Global Land-Ocean Surface Temperature Anomaly',
    unit: '°C vs. 1951–1980',
    strokeColor: '#0f766e',
    fillColor: 'rgba(15, 118, 110, 0.10)',
    description:
      'Annual global mean surface temperature anomaly combining land meteorological stations and sea-surface ship/buoy measurements relative to the 1951–1980 climatological normal.',
    methodology:
      'NASA GISS GISTEMP v4 homogenizes urban heat-island bias and interpolates station networks across 1,200 km radii using NOAA ERSST v5 ocean records.',
    sourceName: 'NASA GISS Surface Temperature Analysis',
    sourceUrl: 'https://data.giss.nasa.gov/gistemp/',
  },
  {
    key: 'co2',
    label: 'Atmospheric CO2',
    title: 'Mauna Loa Atmospheric Carbon Dioxide Concentration',
    unit: 'ppm (mole fraction)',
    strokeColor: '#14532d',
    fillColor: 'rgba(20, 83, 45, 0.10)',
    description:
      'Continuous infrared spectroscopy measurements of dry-air carbon dioxide at Mauna Loa Observatory (3,397 m elevation), representing the northern hemisphere background atmosphere.',
    methodology:
      'Calibrated hourly against World Meteorological Organization (WMO) X2019 primary reference gas standards to sub-0.1 ppm precision.',
    sourceName: 'NOAA Global Monitoring Laboratory',
    sourceUrl: 'https://gml.noaa.gov/ccgg/trends/',
  },
  {
    key: 'methane',
    label: 'Methane (CH4)',
    title: 'Global Marine Surface Atmospheric Methane',
    unit: 'ppb',
    strokeColor: '#b45309',
    fillColor: 'rgba(180, 83, 9, 0.10)',
    description:
      'Globally averaged atmospheric methane concentration measured across NOAA cooperative air sampling sites. Methane has 80+ times the 20-year warming potency of CO2.',
    methodology:
      'Flask samples collected weekly across remote marine boundary layer sites and analyzed via gas chromatography and cavity ring-down spectroscopy.',
    sourceName: 'NOAA CH4 Global Trend',
    sourceUrl: 'https://gml.noaa.gov/ccgg/trends_ch4/',
  },
  {
    key: 'arcticIce',
    label: 'Arctic Sea Ice',
    title: 'Arctic September Minimum Sea Ice Extent',
    unit: 'million km²',
    strokeColor: '#0369a1',
    fillColor: 'rgba(3, 105, 161, 0.10)',
    description:
      'Total Arctic ocean area covered by at least 15% sea ice concentration at the annual September melt minimum. Sea ice loss amplifies polar warming via reduced albedo.',
    methodology:
      'Derived from continuous passive microwave satellite radiometry (SMMR, SSM/I, SSMIS) harmonized into the NSIDC Sea Ice Index v3.',
    sourceName: 'NSIDC Sea Ice Index',
    sourceUrl: 'https://nsidc.org/sea-ice-today',
  },
];

export function GlobalTelemetrySection({globalData, loading}: GlobalTelemetrySectionProps) {
  const [selectedDataset, setSelectedDataset] = useState<DatasetKey>('temperature');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const activeConfig =
    DATASET_CONFIGS.find((item) => item.key === selectedDataset) || DATASET_CONFIGS[0];

  const points: TimeSeriesPoint[] = useMemo(() => {
    if (!globalData) return [];
    return globalData.series[selectedDataset] || [];
  }, [globalData, selectedDataset]);

  const chartGeometry = useMemo(() => {
    const width = 760;
    const height = 310;
    const padLeft = 56;
    const padRight = 24;
    const padTop = 24;
    const padBottom = 40;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    if (points.length < 2) {
      return {
        width,
        height,
        padLeft,
        padRight,
        padTop,
        padBottom,
        plotW,
        plotH,
        minVal: 0,
        maxVal: 1,
        coords: [] as {x: number; y: number; point: TimeSeriesPoint}[],
        linePath: '',
        areaPath: '',
        yTicks: [] as {value: number; y: number}[],
        xTickIndices: [] as number[],
      };
    }

    const values = points.map((p) => p.value);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const span = rawMax - rawMin || 1;
    const minVal = rawMin - span * 0.1;
    const maxVal = rawMax + span * 0.1;

    const coords = points.map((point, idx) => {
      const x = padLeft + (idx / (points.length - 1)) * plotW;
      const y = padTop + (1 - (point.value - minVal) / (maxVal - minVal)) * plotH;
      return {x, y, point};
    });

    const linePath = coords
      .map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(' ');

    const areaPath =
      `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} ` +
      `L ${coords[0].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`;

    const yTicks = Array.from({length: 5}).map((_, i) => {
      const ratio = i / 4;
      const value = minVal + (maxVal - minVal) * (1 - ratio);
      const y = padTop + ratio * plotH;
      return {value, y};
    });

    const xTickIndices = [
      0,
      Math.floor((points.length - 1) * 0.25),
      Math.floor((points.length - 1) * 0.5),
      Math.floor((points.length - 1) * 0.75),
      points.length - 1,
    ];

    return {
      width,
      height,
      padLeft,
      padRight,
      padTop,
      padBottom,
      plotW,
      plotH,
      minVal,
      maxVal,
      coords,
      linePath,
      areaPath,
      yTicks,
      xTickIndices,
    };
  }, [points]);

  const activePoint =
    hoveredIndex !== null && chartGeometry.coords[hoveredIndex]
      ? chartGeometry.coords[hoveredIndex]
      : chartGeometry.coords[chartGeometry.coords.length - 1] || null;

  return (
    <section id="observatory" className="border-b border-slate-200 bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-[1360px] px-6 lg:px-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-medium tracking-wider text-slate-500">
              01. Planetary Observatory
            </p>
            <h2
              className="mt-2 font-serif text-3xl font-semibold tracking-tight text-slate-900"
              style={{textWrap: 'balance'}}
            >
              Long-term instrumental climate records
            </h2>
          </div>

          {/* Interactive Segmented Dataset Selector */}
          <div
            role="tablist"
            aria-label="Global climate indicator charts"
            className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1"
          >
            {DATASET_CONFIGS.map((cfg) => {
              const isSelected = cfg.key === selectedDataset;
              return (
                <button
                  key={cfg.key}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => {
                    setSelectedDataset(cfg.key);
                    setHoveredIndex(null);
                  }}
                  className={`rounded-md px-3.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Interactive SVG Chart Panel */}
          <div className="rounded-xl border border-slate-200 bg-[#fbfcfb] p-6 lg:col-span-8">
            <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{activeConfig.title}</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Hover or inspect chart coordinates · Unit: {activeConfig.unit}
                </p>
              </div>

              {activePoint && (
                <div className="text-right">
                  <span className="font-mono text-xs text-slate-500">
                    {activePoint.point.date}
                  </span>
                  <div className="font-mono text-xl font-semibold text-slate-900 tabular-nums">
                    {selectedDataset === 'temperature' && activePoint.point.value > 0 ? '+' : ''}
                    {activePoint.point.value.toFixed(selectedDataset === 'methane' ? 0 : 2)}{' '}
                    <span className="text-xs font-normal text-slate-500">{activeConfig.unit}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5">
              {loading || chartGeometry.coords.length === 0 ? (
                <div className="flex h-[310px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white text-sm text-slate-500">
                  Loading empirical time series...
                </div>
              ) : (
                <svg
                  viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`}
                  className="h-auto w-full cursor-crosshair select-none"
                  role="img"
                  aria-label={`${activeConfig.title} time-series chart`}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Horizontal Gridlines & Y Labels */}
                  {chartGeometry.yTicks.map((tick, idx) => (
                    <g key={idx}>
                      <line
                        x1={chartGeometry.padLeft}
                        y1={tick.y}
                        x2={chartGeometry.width - chartGeometry.padRight}
                        y2={tick.y}
                        stroke="#e2e8f0"
                        strokeWidth="1"
                      />
                      <text
                        x={chartGeometry.padLeft - 10}
                        y={tick.y + 4}
                        textAnchor="end"
                        className="fill-slate-500 font-mono text-[11px]"
                      >
                        {tick.value.toFixed(
                          selectedDataset === 'methane' ? 0 : selectedDataset === 'co2' ? 0 : 2,
                        )}
                      </text>
                    </g>
                  ))}

                  {/* Zero Reference Line for Temperature Anomaly */}
                  {selectedDataset === 'temperature' &&
                    chartGeometry.minVal < 0 &&
                    chartGeometry.maxVal > 0 && (() => {
                      const zeroY =
                        chartGeometry.padTop +
                        (1 - (0 - chartGeometry.minVal) / (chartGeometry.maxVal - chartGeometry.minVal)) *
                          chartGeometry.plotH;
                      return (
                        <line
                          x1={chartGeometry.padLeft}
                          y1={zeroY}
                          x2={chartGeometry.width - chartGeometry.padRight}
                          y2={zeroY}
                          stroke="#94a3b8"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                        />
                      );
                    })()}

                  {/* Area & Primary Line */}
                  <path d={chartGeometry.areaPath} fill={activeConfig.fillColor} />
                  <path
                    d={chartGeometry.linePath}
                    fill="none"
                    stroke={activeConfig.strokeColor}
                    strokeWidth="2.25"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />

                  {/* X-Axis Labels */}
                  {chartGeometry.xTickIndices.map((ptIdx) => {
                    const coord = chartGeometry.coords[ptIdx];
                    if (!coord) return null;
                    return (
                      <text
                        key={ptIdx}
                        x={coord.x}
                        y={chartGeometry.height - 12}
                        textAnchor="middle"
                        className="fill-slate-500 font-mono text-[11px]"
                      >
                        {coord.point.date.slice(0, 7)}
                      </text>
                    );
                  })}

                  {/* Active Crosshair */}
                  {activePoint && (
                    <g>
                      <line
                        x1={activePoint.x}
                        y1={chartGeometry.padTop}
                        x2={activePoint.x}
                        y2={chartGeometry.padTop + chartGeometry.plotH}
                        stroke="#64748b"
                        strokeDasharray="3 3"
                        strokeWidth="1"
                      />
                      <circle
                        cx={activePoint.x}
                        cy={activePoint.y}
                        r="4.5"
                        fill={activeConfig.strokeColor}
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                    </g>
                  )}

                  {/* Invisible Hit Columns for Smooth Crosshair Tracking */}
                  {chartGeometry.coords.map((coord, idx) => {
                    const colW = chartGeometry.plotW / Math.max(1, chartGeometry.coords.length - 1);
                    return (
                      <rect
                        key={coord.point.date + idx}
                        x={coord.x - colW / 2}
                        y={chartGeometry.padTop}
                        width={Math.max(colW, 6)}
                        height={chartGeometry.plotH}
                        fill="transparent"
                        onMouseEnter={() => setHoveredIndex(idx)}
                      />
                    );
                  })}
                </svg>
              )}
            </div>
          </div>

          {/* Empirical Context & Citation Sidebar */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 lg:col-span-4">
            <div>
              <p className="text-xs font-medium tracking-wider text-slate-500">
                Empirical Context
              </p>
              <h3 className="mt-2 font-serif text-xl font-semibold text-slate-900">
                {activeConfig.label} Methodology
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {activeConfig.description}
              </p>

              <div className="mt-6 border-t border-slate-200 pt-5">
                <p className="text-xs font-medium text-slate-800">Measurement &amp; Calibration</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {activeConfig.methodology}
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-4">
              <p className="text-xs text-slate-500">Primary Institutional Source</p>
              <a
                href={activeConfig.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-900 hover:underline"
              >
                <span>{activeConfig.sourceName}</span>
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
