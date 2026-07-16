import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { getAnalyticsSummary, getAnalyticsHeatmap, getAnalyticsInsights } from '../../api/analytics.js';
import AppIcon from '../../components/UI/AppIcon.jsx';
import LoadingSpinner from '../../components/UI/LoadingSpinner.jsx';

const RANGES = [
  { label: '7d',  days: 7   },
  { label: '30d', days: 30  },
  { label: '90d', days: 90  },
  { label: '1y',  days: 365 },
];

const CHART_TOOLTIP = {
  contentStyle: { background: '#1a1a2e', border: '1px solid #252538', borderRadius: 8, fontSize: 12 },
  labelStyle:   { color: '#8c8ca8' },
  cursor:       { fill: 'rgba(124,106,247,0.06)' },
};

const fmt = (d) => {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

/* ── Stat card ──────────────────────────────────────────── */
function StatCard({ label, value, sub, accentClass = 'text-ht-accent-2' }) {
  return (
    <div className="card flex flex-col gap-1.5">
      <p className="section-label">{label}</p>
      <p className={`text-xl font-bold tabular-nums truncate ${accentClass}`}>{value ?? '—'}</p>
      {sub && <p className="text-[11px] text-ht-text-3 truncate">{sub}</p>}
    </div>
  );
}

/* ── Discipline heatmap ─────────────────────────────────── */
function scoreColor(score) {
  if (!score) return '#1a1a2e';
  if (score < 25) return '#2a1f50';
  if (score < 50) return '#46358a';
  if (score < 75) return '#6050c8';
  if (score < 90) return '#7c6af7';
  return '#a294fc';
}

function DisciplineHeatmap({ data }) {
  const [tooltip, setTooltip] = useState(null);

  const weeks = useMemo(() => {
    if (!data?.length) return [];
    const map = {};
    data.forEach((d) => { map[d.date] = d; });

    const end   = new Date();
    const start = new Date(end);
    start.setFullYear(start.getFullYear() - 1);
    start.setDate(start.getDate() - start.getDay());

    const ws = [];
    const cur = new Date(start);
    while (cur <= end) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        const str = cur.toISOString().split('T')[0];
        week.push(map[str] || { date: str, score: 0 });
        cur.setDate(cur.getDate() + 1);
      }
      ws.push(week);
    }
    return ws;
  }, [data]);

  return (
    <div className="card space-y-3">
      <p className="section-label">Year overview</p>
      <div className="overflow-x-auto">
        <div className="flex gap-[3px]" style={{ minWidth: weeks.length * 13 }}>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day) => (
                <div
                  key={day.date}
                  className="w-[10px] h-[10px] rounded-[2px] cursor-pointer transition-transform hover:scale-125"
                  style={{ background: scoreColor(day.score) }}
                  onMouseEnter={(e) => setTooltip({ ...day, x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => setTooltip(null)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-ht-text-3">Less</span>
        {['#1a1a2e','#2a1f50','#46358a','#6050c8','#7c6af7','#a294fc'].map((c) => (
          <div key={c} className="w-2.5 h-2.5 rounded-[2px]" style={{ background: c }} />
        ))}
        <span className="text-[10px] text-ht-text-3">More</span>
      </div>
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-ht-elevated border border-ht-border-2 rounded-lg px-3 py-2 text-xs shadow-xl"
          style={{ left: tooltip.x + 12, top: tooltip.y - 44 }}
        >
          <p className="text-ht-text-1 font-medium">{fmt(tooltip.date)}</p>
          <p className="text-ht-accent">Score: {tooltip.score}</p>
          {tooltip.habits > 0 && <p className="text-ht-text-3">{tooltip.habits} habits</p>}
        </div>
      )}
    </div>
  );
}

/* ── Insight card ───────────────────────────────────────── */
function InsightCard({ icon, type, text }) {
  const cls = {
    positive: 'bg-ht-success/8 border-ht-success/20 text-ht-success',
    warning:  'bg-ht-warning/8 border-ht-warning/20 text-ht-warning',
    neutral:  'bg-ht-accent/8 border-ht-accent/20 text-ht-accent-2',
  }[type] || 'bg-ht-accent/8 border-ht-accent/20 text-ht-accent-2';

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${cls}`}>
      <AppIcon name={icon} size={15} strokeWidth={2} className="flex-shrink-0 mt-0.5" />
      <p className="text-sm text-ht-text-1">{text}</p>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────── */
export default function AnalyticsPage() {
  const [days, setDays]           = useState(30);
  const [summary, setSummary]     = useState(null);
  const [heatmap, setHeatmap]     = useState(null);
  const [insights, setInsights]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [heatmapLoading, setHeatmapLoading] = useState(true);
  const [activeChart, setActiveChart] = useState('habits');

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try { setSummary(await getAnalyticsSummary(days)); } catch {}
    setLoading(false);
  }, [days]);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  useEffect(() => {
    setHeatmapLoading(true);
    getAnalyticsHeatmap().then(setHeatmap).catch(() => {}).finally(() => setHeatmapLoading(false));
    getAnalyticsInsights().then(setInsights).catch(() => {});
  }, []);

  const overview = summary?.overview;

  const CHARTS = {
    habits:   { label: 'Habits',   color: '#7c6af7', key: 'pct',      data: summary?.habits.series,   unit: '%',    name: 'Completion' },
    calories: { label: 'Calories', color: '#fbbf24', key: 'calories',  data: summary?.calories.series, unit: 'kcal', name: 'Calories' },
    workouts: { label: 'Workouts', color: '#4ade80', key: 'duration',  data: summary?.workouts.series, unit: 'min',  name: 'Duration' },
    water:    { label: 'Water',    color: '#38bdf8', key: 'amount',    data: summary?.water.series,    unit: 'ml',   name: 'Water' },
    weight:   { label: 'Weight',   color: '#e879f9', key: 'weight',    data: summary?.weight.entries,  unit: 'kg',   name: 'Weight' },
    score:    { label: 'Score',    color: '#fb923c', key: 'score',     data: summary?.score.series,    unit: 'pts',  name: 'Score' },
  };

  const chart = CHARTS[activeChart];

  const radarData = overview ? [
    { subject: 'Habits',   value: Math.min(overview.habitCompletionRate, 100) },
    { subject: 'Workouts', value: summary.workouts.totalSessions > 0 ? Math.min(summary.workouts.totalSessions / (days / 7 * 3) * 100, 100) : 0 },
    { subject: 'Calories', value: overview.caloriesToday > 0 ? 80 : 20 },
    { subject: 'Water',    value: Math.min((overview.waterToday / 2000) * 100, 100) },
    { subject: 'Score',    value: overview.avgScore },
  ] : [];

  return (
    <div className="space-y-4 py-4">

      {/* Year heatmap — hero element at top */}
      {heatmapLoading ? (
        <div className="card flex justify-center py-6"><LoadingSpinner size="sm" /></div>
      ) : heatmap?.length > 0 ? (
        <DisciplineHeatmap data={heatmap} />
      ) : null}

      {/* Range filter */}
      <div className="tab-bar">
        {RANGES.map((r) => (
          <button
            key={r.days}
            onClick={() => setDays(r.days)}
            className={days === r.days ? 'tab-item-active' : 'tab-item'}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Discipline Score"  value={`${overview?.disciplineScore ?? 0}`}       sub="out of 100"          accentClass="text-orange-400" />
            <StatCard label="Current Streak"    value={`${overview?.currentStreak ?? 0}d`}         sub="days in a row"       accentClass="text-ht-danger" />
            <StatCard label="Longest Streak"    value={`${overview?.longestStreak ?? 0}d`}         sub="personal best"       accentClass="text-ht-warning" />
            <StatCard label="Habit Rate"        value={`${overview?.habitCompletionRate ?? 0}%`}   sub={`last ${days} days`} accentClass="text-ht-accent-2" />
            <StatCard label="Water Today"       value={`${((overview?.waterToday ?? 0)/1000).toFixed(1)}L`} sub="goal: 2L" accentClass="text-blue-400" />
            <StatCard label="Weight"
              value={overview?.weight ? `${overview.weight}kg` : '—'}
              sub={overview?.weightTrend != null ? `${overview.weightTrend > 0 ? '+' : ''}${overview.weightTrend}kg trend` : 'no data'}
              accentClass="text-purple-400"
            />
          </div>

          {/* Radar chart */}
          {radarData.some((d) => d.value > 0) && (
            <div className="card">
              <p className="section-label mb-4">Discipline breakdown</p>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={75}>
                  <PolarGrid stroke="#252538" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#505068', fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="value" stroke="#7c6af7" fill="#7c6af7" fillOpacity={0.2} strokeWidth={2} />
                  <Tooltip {...CHART_TOOLTIP} formatter={(v) => [`${Math.round(v)}%`, 'Score']} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Chart switcher + trend chart */}
          <div className="card space-y-4">
            <div className="tab-bar">
              {Object.entries(CHARTS).map(([key, c]) => (
                <button
                  key={key}
                  onClick={() => setActiveChart(key)}
                  className={activeChart === key ? 'tab-item-active' : 'tab-item'}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div>
              <p className="section-label mb-3">{chart.label} — last {days} days</p>
              {chart.data?.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  {activeChart === 'workouts' ? (
                    <BarChart data={chart.data} margin={{ left: -20, right: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" vertical={false} />
                      <XAxis dataKey="date" tickFormatter={fmt} tick={{ fill: '#505068', fontSize: 10 }} interval={Math.floor(chart.data.length / 5)} />
                      <YAxis tick={{ fill: '#505068', fontSize: 10 }} unit={chart.unit} />
                      <Tooltip {...CHART_TOOLTIP} labelFormatter={fmt} formatter={(v) => [`${v}${chart.unit}`, chart.name]} />
                      <Bar dataKey={chart.key} fill={chart.color} radius={[3, 3, 0, 0]} fillOpacity={0.8} />
                    </BarChart>
                  ) : (
                    <AreaChart data={chart.data} margin={{ left: -20, right: 4 }}>
                      <defs>
                        <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={chart.color} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={chart.color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" vertical={false} />
                      <XAxis dataKey="date" tickFormatter={fmt} tick={{ fill: '#505068', fontSize: 10 }} interval={Math.floor(chart.data.length / 5)} />
                      <YAxis tick={{ fill: '#505068', fontSize: 10 }} unit={chart.unit} />
                      <Tooltip {...CHART_TOOLTIP} labelFormatter={fmt} formatter={(v) => [`${v}${chart.unit}`, chart.name]} />
                      <Area type="monotone" dataKey={chart.key} stroke={chart.color} fill="url(#ag)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center py-8 text-ht-text-3">
                  <AppIcon name="chart-bar" size={28} strokeWidth={1} />
                  <p className="text-sm mt-2">No data yet</p>
                  <p className="text-xs mt-1">Start logging to see trends</p>
                </div>
              )}
            </div>
          </div>

          {/* Period summary table */}
          {summary && (
            <div className="card">
              <p className="section-label mb-3">Period summary</p>
              <div className="space-y-0 divide-y divide-ht-border">
                {[
                  ['Avg daily calories',  `${summary.calories.avgCalories} kcal`],
                  ['Avg protein',         `${summary.calories.avgProtein}g`],
                  ['Avg water intake',    `${(summary.water.avgIntake / 1000).toFixed(1)}L`],
                  ['Total workout sessions', `${summary.workouts.totalSessions}`],
                  ['Avg habit completion', `${summary.habits.avgCompletionRate}%`],
                  ['Avg discipline score', `${summary.overview.avgScore}/100`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2.5">
                    <span className="text-sm text-ht-text-3">{label}</span>
                    <span className="text-sm text-ht-text-1 font-medium tabular-nums">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          {insights.length > 0 && (
            <div className="card space-y-2">
              <p className="section-label mb-1">Insights</p>
              {insights.map((ins, i) => (
                <InsightCard key={i} icon={ins.icon} type={ins.type} text={ins.text} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
