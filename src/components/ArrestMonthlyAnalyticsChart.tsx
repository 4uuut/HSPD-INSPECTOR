import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { ArrestRecord } from '../types';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  ShieldAlert,
  Award,
  DollarSign,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Filter,
  CheckCircle2,
  AlertTriangle,
  GitCompare,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';

interface Props {
  records: ArrestRecord[];
  className?: string;
  defaultExpanded?: boolean;
  isDeveloperMode?: boolean;
}

interface MonthlyDataPoint {
  monthKey: string;     // e.g. "2026-05"
  monthLabel: string;   // e.g. "Mei 2026"
  shortLabel: string;   // e.g. "Mei"
  arrests: number;      // Total cases
  cooperative: number;  // Kooperatif
  nonCooperative: number; // Non-kooperatif
  totalFine: number;    // Total Denda ($)
  totalJail: number;    // Total Penjara (Bulan)
  totalImpound: number; // Total Impound (Hari)
  cooperativeRate: number; // %
}

interface YoYDataPoint {
  monthIndex: number;
  monthName: string;
  primaryYear: number;
  compareYear: number;
  primaryArrests: number;
  compareArrests: number;
  primaryFine: number;
  compareFine: number;
  primaryJail: number;
  compareJail: number;
  deltaArrests: number;
  growthRatePct: number | null;
}

const MONTH_NAMES_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

const FULL_MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const ArrestMonthlyAnalyticsChart: React.FC<Props> = ({
  records,
  className = '',
  defaultExpanded = true,
  isDeveloperMode = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  // View mode: 'monthly' (Tren Bulanan) vs 'yoy' (Perbandingan Tahunan YoY)
  const [viewMode, setViewMode] = useState<'monthly' | 'yoy'>('yoy');
  
  // Monthly view options
  const [chartType, setChartType] = useState<'bar' | 'area' | 'dual_line'>('bar');
  const [timeRange, setTimeRange] = useState<'6m' | '12m' | 'all'>('6m');
  const [metricFocus, setMetricFocus] = useState<'cases' | 'fines_jail'>('cases');

  // YoY view options
  const now = new Date();
  const currentYear = now.getFullYear();
  const [primaryYear, setPrimaryYear] = useState<number>(currentYear);
  const [compareYear, setCompareYear] = useState<number>(currentYear - 1);
  const [yoyChartType, setYoyChartType] = useState<'grouped_bar' | 'compare_line' | 'delta_bar'>('grouped_bar');
  const [yoyMetric, setYoyMetric] = useState<'arrests' | 'fines' | 'jail'>('arrests');

  // Available years from records
  const availableYears = useMemo(() => {
    const yearSet = new Set<number>();
    yearSet.add(currentYear);
    yearSet.add(currentYear - 1);
    records.forEach(r => {
      const ts = r.timestamp || Date.now();
      const y = new Date(ts).getFullYear();
      if (y > 2020 && y <= currentYear + 2) {
        yearSet.add(y);
      }
    });
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [records, currentYear]);

  // Map records by year and month
  const recordsByYearMonth = useMemo(() => {
    // Key format: `${year}-${monthIdx}` (monthIdx: 0-11)
    const map = new Map<string, {
      arrests: number;
      cooperative: number;
      nonCooperative: number;
      totalFine: number;
      totalJail: number;
      totalImpound: number;
    }>();

    records.forEach(r => {
      const ts = r.timestamp || Date.now();
      const d = new Date(ts);
      const y = d.getFullYear();
      const m = d.getMonth();
      const key = `${y}-${m}`;

      const curr = map.get(key) || {
        arrests: 0,
        cooperative: 0,
        nonCooperative: 0,
        totalFine: 0,
        totalJail: 0,
        totalImpound: 0
      };

      curr.arrests += 1;
      if (r.isCooperative) curr.cooperative += 1;
      else curr.nonCooperative += 1;
      curr.totalFine += Number(r.totalFine) || 0;
      curr.totalJail += Number(r.totalJail) || 0;
      curr.totalImpound += Number(r.totalImpound) || 0;

      map.set(key, curr);
    });

    return map;
  }, [records]);

  // Standard Monthly Data Timeline (6m / 12m)
  const monthlyData = useMemo(() => {
    const monthsToGenerate = timeRange === '12m' ? 12 : timeRange === 'all' ? 12 : 6;
    const currentMonthIdx = now.getMonth();
    const points: MonthlyDataPoint[] = [];

    for (let i = monthsToGenerate - 1; i >= 0; i--) {
      const targetDate = new Date(currentYear, currentMonthIdx - i, 1);
      const y = targetDate.getFullYear();
      const mIdx = targetDate.getMonth();
      const key = `${y}-${mIdx}`;

      const data = recordsByYearMonth.get(key) || {
        arrests: 0,
        cooperative: 0,
        nonCooperative: 0,
        totalFine: 0,
        totalJail: 0,
        totalImpound: 0
      };

      const rate = data.arrests > 0 ? Math.round((data.cooperative / data.arrests) * 100) : 0;

      points.push({
        monthKey: `${y}-${String(mIdx + 1).padStart(2, '0')}`,
        monthLabel: `${FULL_MONTH_NAMES_ID[mIdx]} ${y}`,
        shortLabel: `${MONTH_NAMES_ID[mIdx]} '${String(y).slice(-2)}`,
        arrests: data.arrests,
        cooperative: data.cooperative,
        nonCooperative: data.nonCooperative,
        totalFine: data.totalFine,
        totalJail: data.totalJail,
        totalImpound: data.totalImpound,
        cooperativeRate: rate
      });
    }

    return points;
  }, [recordsByYearMonth, currentYear, timeRange]);

  // Year-over-Year (YoY) Data (12 Months Side-by-Side: primaryYear vs compareYear)
  const yoyData = useMemo(() => {
    const points: YoYDataPoint[] = [];

    for (let m = 0; m < 12; m++) {
      const primaryKey = `${primaryYear}-${m}`;
      const compareKey = `${compareYear}-${m}`;

      const pData = recordsByYearMonth.get(primaryKey) || {
        arrests: 0,
        cooperative: 0,
        nonCooperative: 0,
        totalFine: 0,
        totalJail: 0,
        totalImpound: 0
      };

      const cData = recordsByYearMonth.get(compareKey) || {
        arrests: 0,
        cooperative: 0,
        nonCooperative: 0,
        totalFine: 0,
        totalJail: 0,
        totalImpound: 0
      };

      const delta = pData.arrests - cData.arrests;
      let growthPct: number | null = null;
      if (cData.arrests > 0) {
        growthPct = Math.round(((pData.arrests - cData.arrests) / cData.arrests) * 100);
      } else if (pData.arrests > 0) {
        growthPct = 100;
      }

      points.push({
        monthIndex: m,
        monthName: MONTH_NAMES_ID[m],
        primaryYear,
        compareYear,
        primaryArrests: pData.arrests,
        compareArrests: cData.arrests,
        primaryFine: pData.totalFine,
        compareFine: cData.totalFine,
        primaryJail: pData.totalJail,
        compareJail: cData.totalJail,
        deltaArrests: delta,
        growthRatePct: growthPct
      });
    }

    return points;
  }, [recordsByYearMonth, primaryYear, compareYear]);

  // YoY Aggregate Metrics
  const yoySummary = useMemo(() => {
    let totalPrimaryArrests = 0;
    let totalCompareArrests = 0;
    let totalPrimaryFines = 0;
    let totalCompareFines = 0;
    let totalPrimaryJail = 0;
    let totalCompareJail = 0;

    yoyData.forEach(p => {
      totalPrimaryArrests += p.primaryArrests;
      totalCompareArrests += p.compareArrests;
      totalPrimaryFines += p.primaryFine;
      totalCompareFines += p.compareFine;
      totalPrimaryJail += p.primaryJail;
      totalCompareJail += p.compareJail;
    });

    const netArrestsDelta = totalPrimaryArrests - totalCompareArrests;
    const netFinesDelta = totalPrimaryFines - totalCompareFines;

    let arrestGrowthPct: number = 0;
    if (totalCompareArrests > 0) {
      arrestGrowthPct = Number((((totalPrimaryArrests - totalCompareArrests) / totalCompareArrests) * 100).toFixed(1));
    } else if (totalPrimaryArrests > 0) {
      arrestGrowthPct = 100;
    }

    // Peak change month
    let maxSpike = yoyData[0];
    yoyData.forEach(item => {
      if (item.primaryArrests > maxSpike.primaryArrests) {
        maxSpike = item;
      }
    });

    return {
      totalPrimaryArrests,
      totalCompareArrests,
      netArrestsDelta,
      arrestGrowthPct,
      totalPrimaryFines,
      totalCompareFines,
      netFinesDelta,
      totalPrimaryJail,
      totalCompareJail,
      peakMonth: maxSpike
    };
  }, [yoyData]);

  // Aggregate stats across the visible period (Monthly view)
  const totalCasesInPeriod = useMemo(() => {
    return monthlyData.reduce((acc, m) => acc + m.arrests, 0);
  }, [monthlyData]);

  const totalFinesInPeriod = useMemo(() => {
    return monthlyData.reduce((acc, m) => acc + m.totalFine, 0);
  }, [monthlyData]);

  const totalJailInPeriod = useMemo(() => {
    return monthlyData.reduce((acc, m) => acc + m.totalJail, 0);
  }, [monthlyData]);

  const peakMonth = useMemo(() => {
    if (monthlyData.length === 0) return null;
    return monthlyData.reduce((prev, curr) => (curr.arrests > prev.arrests ? curr : prev), monthlyData[0]);
  }, [monthlyData]);

  const avgMonthlyCases = useMemo(() => {
    if (monthlyData.length === 0) return '0';
    return (totalCasesInPeriod / monthlyData.length).toFixed(1);
  }, [totalCasesInPeriod, monthlyData.length]);

  const overallCoopRate = useMemo(() => {
    const totalCoop = monthlyData.reduce((acc, m) => acc + m.cooperative, 0);
    return totalCasesInPeriod > 0 ? Math.round((totalCoop / totalCasesInPeriod) * 100) : 0;
  }, [monthlyData, totalCasesInPeriod]);

  // Tooltip for Standard Monthly Chart
  const CustomMonthlyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: MonthlyDataPoint = payload[0]?.payload;
      return (
        <div className="bg-[#0A0E17]/95 border border-cyan-500/50 p-3 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs text-gray-200 min-w-[210px] space-y-1.5 z-50">
          <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
            <span className="font-bold text-cyan-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              {data.monthLabel}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
              {data.arrests} Penindakan
            </span>
          </div>

          <div className="space-y-1 text-[11px] pt-1">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Kooperatif:
              </span>
              <span className="font-bold">{data.cooperative} kasus</span>
            </div>
            <div className="flex items-center justify-between text-rose-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                Non-Kooperatif:
              </span>
              <span className="font-bold">{data.nonCooperative} kasus</span>
            </div>
            <div className="flex items-center justify-between text-amber-400 pt-1 border-t border-gray-800/80">
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-amber-400" />
                Total Denda:
              </span>
              <span className="font-bold">${data.totalFine.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-indigo-300">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-400" />
                Masa Penjara:
              </span>
              <span className="font-bold">{data.totalJail} Bulan</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Tooltip for Year-over-Year (YoY) Chart
  const CustomYoYTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: YoYDataPoint = payload[0]?.payload;
      const isPositive = data.deltaArrests > 0;
      const isZero = data.deltaArrests === 0;

      return (
        <div className="bg-[#0A0E17]/95 border border-indigo-500/50 p-3 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs text-gray-200 min-w-[230px] space-y-2 z-50">
          <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
            <span className="font-bold text-indigo-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              Bulan: {FULL_MONTH_NAMES_ID[data.monthIndex]}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
              YoY Compare
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            {/* Primary Year */}
            <div className="flex items-center justify-between text-cyan-300 font-bold">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 inline-block shadow-sm" />
                Tahun {data.primaryYear}:
              </span>
              <span>
                {yoyMetric === 'arrests' ? `${data.primaryArrests} Kasus` :
                 yoyMetric === 'fines' ? `$${data.primaryFine.toLocaleString()}` :
                 `${data.primaryJail} Bln`}
              </span>
            </div>

            {/* Compare Year */}
            <div className="flex items-center justify-between text-indigo-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block shadow-sm" />
                Tahun {data.compareYear}:
              </span>
              <span>
                {yoyMetric === 'arrests' ? `${data.compareArrests} Kasus` :
                 yoyMetric === 'fines' ? `$${data.compareFine.toLocaleString()}` :
                 `${data.compareJail} Bln`}
              </span>
            </div>

            {/* Delta & Growth Rate */}
            <div className="pt-1.5 border-t border-gray-800 flex items-center justify-between text-[11px]">
              <span className="text-gray-400">Selisih (Delta YoY):</span>
              <span className={`font-bold flex items-center gap-1 ${
                isZero ? 'text-gray-400' : isPositive ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {isZero ? (
                  <span>0 (Stabil)</span>
                ) : isPositive ? (
                  <>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    +{data.deltaArrests} ({data.growthRatePct !== null ? `+${data.growthRatePct}%` : 'N/A'})
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    {data.deltaArrests} ({data.growthRatePct !== null ? `${data.growthRatePct}%` : 'N/A'})
                  </>
                )}
              </span>
            </div>

            {/* Financial Delta */}
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>Selisih Denda:</span>
              <span className={`font-mono font-bold ${
                data.primaryFine >= data.compareFine ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {data.primaryFine >= data.compareFine ? '+' : '-'}${Math.abs(data.primaryFine - data.compareFine).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="arrest-monthly-analytics-panel"
      className={`bg-gradient-to-br from-[#0B0F17] via-[#0E1420] to-[#0A0D14] border border-cyan-900/60 rounded-xl shadow-2xl p-3.5 sm:p-4 font-mono transition-all duration-300 ${className}`}
    >
      {/* Top Header & Main Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800/80">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-700/60 text-cyan-400 shadow-md shadow-cyan-950/50 shrink-0">
            {viewMode === 'yoy' ? <GitCompare className="w-4 h-4 text-indigo-400" /> : <BarChart3 className="w-4 h-4 text-cyan-300" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
                <span>{viewMode === 'yoy' ? 'Perbandingan Penindakan Tahunan (YoY)' : 'Tren Penindakan Bulanan'}</span>
                <span className="text-cyan-400 font-normal">(Arrest Analytics)</span>
              </h3>
              {isDeveloperMode && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-950 text-purple-300 border border-purple-700">
                  DEV ANALYTICS
                </span>
              )}
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                COMMAND VIEW
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-sans mt-0.5">
              {viewMode === 'yoy'
                ? `Komparasi data kriminalitas tahunan (${primaryYear} vs ${compareYear}) untuk evaluasi tren keamanan jangka panjang kepolisian.`
                : 'Grafik periodik tren frekuensi penangkapan, perbandingan kooperatif tersangka, denda pidana, dan kurungan penjara.'}
            </p>
          </div>
        </div>

        {/* View Mode Tabs & Collapse Toggle */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {/* Main Mode Toggle: Monthly vs YoY */}
          <div className="flex items-center bg-[#070A0F] border border-gray-700/80 rounded-lg p-0.5 text-[10px]">
            <button
              type="button"
              onClick={() => setViewMode('yoy')}
              className={`px-2.5 py-1 rounded font-bold transition flex items-center gap-1 cursor-pointer ${
                viewMode === 'yoy' ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <GitCompare className="w-3 h-3" />
              <span>Analisis YoY</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('monthly')}
              className={`px-2.5 py-1 rounded font-bold transition flex items-center gap-1 cursor-pointer ${
                viewMode === 'monthly' ? 'bg-cyan-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <BarChart3 className="w-3 h-3" />
              <span>Bulanan</span>
            </button>
          </div>

          {/* Toggle Expand/Collapse */}
          <button
            type="button"
            onClick={() => setIsExpanded(prev => !prev)}
            className="p-1.5 bg-[#070A0F] hover:bg-gray-800 border border-gray-700/80 text-gray-300 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
            title={isExpanded ? 'Sembunyikan Grafik' : 'Tampilkan Grafik'}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden md:inline">Tutup</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden md:inline">Buka Grafik</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="mt-3.5 space-y-3.5 animate-in fade-in duration-200">
          {/* ===================== VIEW 1: YEAR-OVER-YEAR (YoY) ===================== */}
          {viewMode === 'yoy' ? (
            <>
              {/* Year Selectors & Chart Style Controls Bar */}
              <div className="p-2.5 bg-[#070C14] border border-indigo-900/40 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Year Selectors */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Tahun Utama:</span>
                    <select
                      value={primaryYear}
                      onChange={(e) => setPrimaryYear(Number(e.target.value))}
                      className="px-2 py-1 bg-[#0A0E17] border border-cyan-500/60 text-cyan-300 rounded text-xs font-bold outline-none cursor-pointer"
                    >
                      {availableYears.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  <span className="text-gray-500 font-bold">vs</span>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Tahun Pembanding:</span>
                    <select
                      value={compareYear}
                      onChange={(e) => setCompareYear(Number(e.target.value))}
                      className="px-2 py-1 bg-[#0A0E17] border border-indigo-500/60 text-indigo-300 rounded text-xs font-bold outline-none cursor-pointer"
                    >
                      {availableYears.filter(y => y !== primaryYear).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                      {availableYears.length <= 1 && (
                        <option value={primaryYear - 1}>{primaryYear - 1}</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Metric Selector & Chart Type Selector */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Metric Switcher */}
                  <div className="flex items-center bg-[#070A0F] border border-gray-800 rounded-lg p-0.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setYoyMetric('arrests')}
                      className={`px-2 py-1 rounded font-bold transition cursor-pointer ${
                        yoyMetric === 'arrests' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      Jumlah Kasus
                    </button>
                    <button
                      type="button"
                      onClick={() => setYoyMetric('fines')}
                      className={`px-2 py-1 rounded font-bold transition cursor-pointer ${
                        yoyMetric === 'fines' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      Total Denda ($)
                    </button>
                    <button
                      type="button"
                      onClick={() => setYoyMetric('jail')}
                      className={`px-2 py-1 rounded font-bold transition cursor-pointer ${
                        yoyMetric === 'jail' ? 'bg-amber-600 text-white' : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      Masa Penjara
                    </button>
                  </div>

                  {/* Chart Type */}
                  <div className="flex items-center bg-[#070A0F] border border-gray-800 rounded-lg p-0.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setYoyChartType('grouped_bar')}
                      className={`px-2 py-1 rounded font-bold transition cursor-pointer ${
                        yoyChartType === 'grouped_bar' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-gray-200'
                      }`}
                      title="Diagram Batang Bersebelahan"
                    >
                      Batang Komparasi
                    </button>
                    <button
                      type="button"
                      onClick={() => setYoyChartType('compare_line')}
                      className={`px-2 py-1 rounded font-bold transition cursor-pointer ${
                        yoyChartType === 'compare_line' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-gray-200'
                      }`}
                      title="Grafik Garis Komparasi"
                    >
                      Garis Tren
                    </button>
                    <button
                      type="button"
                      onClick={() => setYoyChartType('delta_bar')}
                      className={`px-2 py-1 rounded font-bold transition cursor-pointer ${
                        yoyChartType === 'delta_bar' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-gray-200'
                      }`}
                      title="Grafik Selisih Pertumbuhan (+/- Delta)"
                    >
                      Delta (+/-)
                    </button>
                  </div>
                </div>
              </div>

              {/* YoY Executive KPI Summary Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                {/* 1. Kasus Tahun Berjalan vs Sebelumnya */}
                <div className="p-2.5 bg-[#070C14] border border-indigo-900/40 rounded-lg space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-cyan-400" />
                    Penindakan YoY ({primaryYear} vs {compareYear})
                  </span>
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-extrabold text-cyan-300">{yoySummary.totalPrimaryArrests}</span>
                      <span className="text-xs text-gray-400">vs</span>
                      <span className="text-sm font-bold text-indigo-300">{yoySummary.totalCompareArrests}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-sans">
                      Kasus
                    </span>
                  </div>
                </div>

                {/* 2. Pertumbuhan Tahunan (%) */}
                <div className="p-2.5 bg-[#070C14] border border-indigo-900/40 rounded-lg space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    Tingkat Pertumbuhan YoY
                  </span>
                  <div className="flex items-baseline justify-between">
                    <div className={`flex items-center gap-1 text-base font-extrabold ${
                      yoySummary.arrestGrowthPct > 0 ? 'text-rose-400' :
                      yoySummary.arrestGrowthPct < 0 ? 'text-emerald-400' : 'text-gray-300'
                    }`}>
                      {yoySummary.arrestGrowthPct > 0 ? (
                        <>
                          <ArrowUpRight className="w-4 h-4" />
                          <span>+{yoySummary.arrestGrowthPct}%</span>
                        </>
                      ) : yoySummary.arrestGrowthPct < 0 ? (
                        <>
                          <ArrowDownRight className="w-4 h-4" />
                          <span>{yoySummary.arrestGrowthPct}%</span>
                        </>
                      ) : (
                        <>
                          <Minus className="w-4 h-4" />
                          <span>0.0%</span>
                        </>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 font-sans">
                      {yoySummary.arrestGrowthPct > 0 ? 'Kenaikan Kasus' : yoySummary.arrestGrowthPct < 0 ? 'Penurunan Kasus' : 'Stabil'}
                    </span>
                  </div>
                </div>

                {/* 3. Selisih Denda Pidana */}
                <div className="p-2.5 bg-[#070C14] border border-emerald-900/40 rounded-lg space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-400" />
                    Denda YoY ({primaryYear} vs {compareYear})
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs sm:text-sm font-extrabold text-emerald-400">
                      ${yoySummary.totalPrimaryFines.toLocaleString()}
                    </span>
                    <span className={`text-[10px] font-bold ${
                      yoySummary.netFinesDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {yoySummary.netFinesDelta >= 0 ? '+' : '-'}${Math.abs(yoySummary.netFinesDelta).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 4. Bulan Puncak Aktivitas YoY */}
                <div className="p-2.5 bg-[#070C14] border border-amber-900/40 rounded-lg space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Award className="w-3 h-3 text-amber-400" />
                    Bulan Tertinggi ({primaryYear})
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold text-amber-300">
                      {yoySummary.peakMonth ? `${FULL_MONTH_NAMES_ID[yoySummary.peakMonth.monthIndex]}` : '-'}
                    </span>
                    <span className="text-[10px] text-amber-400 font-bold">
                      {yoySummary.peakMonth?.primaryArrests || 0} Kasus
                    </span>
                  </div>
                </div>
              </div>

              {/* YoY Chart Container */}
              <div className="h-64 sm:h-72 w-full pt-3 pb-1 pr-2 bg-[#06090F]/90 border border-gray-800/80 rounded-xl">
                <ResponsiveContainer width="100%" height="100%">
                  {yoyChartType === 'grouped_bar' ? (
                    <BarChart data={yoyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                      <XAxis
                        dataKey="monthName"
                        stroke="#64748B"
                        tick={{ fill: '#94A3B8', fontSize: 10 }}
                        tickLine={{ stroke: '#334155' }}
                      />
                      <YAxis
                        stroke="#64748B"
                        tick={{ fill: '#94A3B8', fontSize: 10 }}
                        tickLine={{ stroke: '#334155' }}
                        tickFormatter={(v) => yoyMetric === 'fines' ? (v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`) : v}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomYoYTooltip />} />
                      <Legend
                        verticalAlign="top"
                        height={26}
                        formatter={(value) => <span className="text-[11px] font-mono text-gray-300 font-bold">{value}</span>}
                      />
                      <Bar
                        dataKey={yoyMetric === 'arrests' ? 'primaryArrests' : yoyMetric === 'fines' ? 'primaryFine' : 'primaryJail'}
                        name={`Tahun ${primaryYear}`}
                        fill="#06B6D4"
                        radius={[3, 3, 0, 0]}
                      />
                      <Bar
                        dataKey={yoyMetric === 'arrests' ? 'compareArrests' : yoyMetric === 'fines' ? 'compareFine' : 'compareJail'}
                        name={`Tahun ${compareYear}`}
                        fill="#6366F1"
                        radius={[3, 3, 0, 0]}
                      />
                    </BarChart>
                  ) : yoyChartType === 'compare_line' ? (
                    <LineChart data={yoyData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                      <XAxis
                        dataKey="monthName"
                        stroke="#64748B"
                        tick={{ fill: '#94A3B8', fontSize: 10 }}
                        tickLine={{ stroke: '#334155' }}
                      />
                      <YAxis
                        stroke="#64748B"
                        tick={{ fill: '#94A3B8', fontSize: 10 }}
                        tickLine={{ stroke: '#334155' }}
                        tickFormatter={(v) => yoyMetric === 'fines' ? (v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`) : v}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomYoYTooltip />} />
                      <Legend
                        verticalAlign="top"
                        height={26}
                        formatter={(value) => <span className="text-[11px] font-mono text-gray-300 font-bold">{value}</span>}
                      />
                      <Line
                        type="monotone"
                        dataKey={yoyMetric === 'arrests' ? 'primaryArrests' : yoyMetric === 'fines' ? 'primaryFine' : 'primaryJail'}
                        name={`Tahun ${primaryYear}`}
                        stroke="#06B6D4"
                        strokeWidth={3}
                        dot={{ fill: '#06B6D4', r: 3.5 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey={yoyMetric === 'arrests' ? 'compareArrests' : yoyMetric === 'fines' ? 'compareFine' : 'compareJail'}
                        name={`Tahun ${compareYear}`}
                        stroke="#F59E0B"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: '#F59E0B', r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  ) : (
                    <BarChart data={yoyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                      <XAxis
                        dataKey="monthName"
                        stroke="#64748B"
                        tick={{ fill: '#94A3B8', fontSize: 10 }}
                        tickLine={{ stroke: '#334155' }}
                      />
                      <YAxis
                        stroke="#64748B"
                        tick={{ fill: '#94A3B8', fontSize: 10 }}
                        tickLine={{ stroke: '#334155' }}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomYoYTooltip />} />
                      <Legend
                        verticalAlign="top"
                        height={26}
                        formatter={() => (
                          <span className="text-[11px] font-mono text-gray-300 font-bold">
                            Selisih Kasus (+ Naik / - Turun vs {compareYear})
                          </span>
                        )}
                      />
                      <Bar
                        dataKey="deltaArrests"
                        name="Selisih Kasus YoY"
                        fill="#EC4899"
                        radius={[3, 3, 0, 0]}
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* YoY Comparison Guidance & Explanations */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-gray-400 font-sans pt-1 border-t border-gray-800/80">
                <span className="flex items-center gap-1.5 font-mono text-indigo-300">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Analisis Jangka Panjang: Mengukur efektivitas pencegahan tindak kejahatan kepolisian antar tahun.
                </span>
                <span className="text-gray-500 font-mono">
                  Tahun Terdaftar: {availableYears.join(', ')}
                </span>
              </div>
            </>
          ) : (
            /* ===================== VIEW 2: MONTHLY TREND (Original View) ===================== */
            <>
              {/* Executive KPI Summary Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                {/* 1. Total Penindakan */}
                <div className="p-2.5 bg-[#070C14] border border-cyan-900/40 rounded-lg space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-cyan-400" />
                    Total Kasus Periode
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-extrabold text-cyan-300">{totalCasesInPeriod}</span>
                    <span className="text-[10px] text-gray-500 font-sans">
                      Rata-rata {avgMonthlyCases}/bln
                    </span>
                  </div>
                </div>

                {/* 2. Puncak Kasus (Peak Month) */}
                <div className="p-2.5 bg-[#070C14] border border-amber-900/40 rounded-lg space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Award className="w-3 h-3 text-amber-400" />
                    Bulan Teraktif
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold text-amber-300 truncate max-w-[110px]">
                      {peakMonth && peakMonth.arrests > 0 ? peakMonth.monthLabel : '-'}
                    </span>
                    <span className="text-[10px] text-amber-400/90 font-mono font-bold">
                      {peakMonth?.arrests || 0} Kasus
                    </span>
                  </div>
                </div>

                {/* 3. Tingkat Kepatuhan (Coop Rate) */}
                <div className="p-2.5 bg-[#070C14] border border-emerald-900/40 rounded-lg space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Tingkat Kepatuhan
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-extrabold text-emerald-300">{overallCoopRate}%</span>
                    <span className="text-[10px] text-gray-500 font-sans">
                      Kooperatif
                    </span>
                  </div>
                </div>

                {/* 4. Akumulasi Denda */}
                <div className="p-2.5 bg-[#070C14] border border-emerald-900/40 rounded-lg space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-400" />
                    Total Denda Periode
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs sm:text-sm font-extrabold text-emerald-400">
                      ${totalFinesInPeriod.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-indigo-300 font-sans">
                      {totalJailInPeriod} Bln Sel
                    </span>
                  </div>
                </div>
              </div>

              {/* Chart Controls Bar (Chart Type & Metric Toggle) */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1">
                    <Layers className="w-3 h-3 text-cyan-400" />
                    Visualisasi:
                  </span>
                  <div className="flex bg-[#070A0F] border border-gray-800 rounded-lg p-0.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => { setChartType('bar'); setMetricFocus('cases'); }}
                      className={`px-2 py-1 rounded font-bold transition cursor-pointer ${
                        chartType === 'bar' ? 'bg-cyan-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      Diagram Batang
                    </button>
                    <button
                      type="button"
                      onClick={() => { setChartType('area'); setMetricFocus('cases'); }}
                      className={`px-2 py-1 rounded font-bold transition cursor-pointer ${
                        chartType === 'area' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      Grafik Area
                    </button>
                    <button
                      type="button"
                      onClick={() => { setChartType('dual_line'); setMetricFocus('fines_jail'); }}
                      className={`px-2 py-1 rounded font-bold transition cursor-pointer ${
                        chartType === 'dual_line' ? 'bg-amber-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      Garis Denda & Penjara
                    </button>
                  </div>
                </div>

                {/* Range Filter */}
                <div className="flex items-center bg-[#070A0F] border border-gray-700/80 rounded-lg p-0.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setTimeRange('6m')}
                    className={`px-2 py-1 rounded font-bold transition cursor-pointer ${
                      timeRange === '6m' ? 'bg-cyan-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    6 Bulan
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeRange('12m')}
                    className={`px-2 py-1 rounded font-bold transition cursor-pointer ${
                      timeRange === '12m' ? 'bg-cyan-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    12 Bulan
                  </button>
                </div>
              </div>

              {/* Main Chart Container */}
              <div className="h-64 sm:h-72 w-full pt-3 pb-1 pr-2 bg-[#06090F]/90 border border-gray-800/80 rounded-xl">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'bar' ? (
                    <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                      <XAxis
                        dataKey="shortLabel"
                        stroke="#64748B"
                        tick={{ fill: '#94A3B8', fontSize: 10 }}
                        tickLine={{ stroke: '#334155' }}
                      />
                      <YAxis
                        stroke="#64748B"
                        tick={{ fill: '#94A3B8', fontSize: 10 }}
                        tickLine={{ stroke: '#334155' }}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomMonthlyTooltip />} />
                      <Bar
                        dataKey="cooperative"
                        name="Kooperatif"
                        fill="#10B981"
                        radius={[3, 3, 0, 0]}
                        stackId="a"
                      />
                      <Bar
                        dataKey="nonCooperative"
                        name="Non-Kooperatif"
                        fill="#F43F5E"
                        radius={[4, 4, 0, 0]}
                        stackId="a"
                      />
                    </BarChart>
                  ) : chartType === 'area' ? (
                    <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorArrests" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.7} />
                          <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="colorCoop" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.6} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                      <XAxis
                        dataKey="shortLabel"
                        stroke="#64748B"
                        tick={{ fill: '#94A3B8', fontSize: 10 }}
                        tickLine={{ stroke: '#334155' }}
                      />
                      <YAxis
                        stroke="#64748B"
                        tick={{ fill: '#94A3B8', fontSize: 10 }}
                        tickLine={{ stroke: '#334155' }}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomMonthlyTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="arrests"
                        name="Total Kasus"
                        stroke="#06B6D4"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorArrests)"
                      />
                      <Area
                        type="monotone"
                        dataKey="cooperative"
                        name="Kooperatif"
                        stroke="#10B981"
                        strokeWidth={1.5}
                        fillOpacity={1}
                        fill="url(#colorCoop)"
                      />
                    </AreaChart>
                  ) : (
                    <LineChart data={monthlyData} margin={{ top: 10, right: 15, left: -5, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                      <XAxis
                        dataKey="shortLabel"
                        stroke="#64748B"
                        tick={{ fill: '#94A3B8', fontSize: 10 }}
                        tickLine={{ stroke: '#334155' }}
                      />
                      <YAxis
                        yAxisId="left"
                        stroke="#10B981"
                        tick={{ fill: '#10B981', fontSize: 10 }}
                        tickLine={{ stroke: '#10B981' }}
                        tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#F59E0B"
                        tick={{ fill: '#F59E0B', fontSize: 10 }}
                        tickLine={{ stroke: '#F59E0B' }}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomMonthlyTooltip />} />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="totalFine"
                        name="Total Denda ($)"
                        stroke="#10B981"
                        strokeWidth={2.5}
                        dot={{ fill: '#10B981', r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="totalJail"
                        name="Total Penjara (Bulan)"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        dot={{ fill: '#F59E0B', r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Guidance Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-gray-400 font-sans pt-1 border-t border-gray-800/80">
                <span className="flex items-center gap-1.5 font-mono text-cyan-300">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Database Real-time: {records.length} Berkas Penindakan terdaftar dalam sistem
                </span>
                <span className="text-gray-500">
                  Grafik diperbarui otomatis setiap kali laporan kasus baru disimpan atau disinkronkan.
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
