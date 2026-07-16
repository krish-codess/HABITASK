import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { getAnalyticsSummary, getAnalyticsHeatmap, getAnalyticsInsights } from '../../api/analytics.js';
import AppIcon from '../../components/UI/AppIcon.jsx';
import LoadingSpinner from '../../components/UI/LoadingSpinner.jsx';

// ── constants ────────────────────────────────────────────────────────────────
const RANGES = [
  { label: '7d',  days: 7  },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '1y',  days: 365},
];

const CHART_TOOLTIP = {
  contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 10, fontSize: 12 },
  labelStyle: { color: '#94a3b8' },
  cursor: { fill: 'rgba(99,102,241,0.08)' },
};

const fmt = (d) => {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// ── sub-components ───────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, trend, color = 'text-indigo-400' }) {
  return (
    <div className="card flex flex-col gap-1 min-w-0">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg bg-slate-700/50 ${color}`}>
          <AppIcon name={icon} size={16} strokeWidth={2} />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            <AppIcon name={trend >= 0 ? 'arrow-up' : 'arrow-down'} size={12} />
            {Math.abs(trend)}
          </span>
        )}
      </div>
      <p className="text-xl font-bold text-slate-100 mt-1 truncate">{value ?? '—'}</p>
      <p className="text-xs text-slate-400 truncate">{label}</p>
      {sub && <p className="text-[10px] text-slate-600 truncate">{sub}</p>}
    </div>
  );
}

function SectionTitle({ icon, title, sub }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
        <AppIcon name={icon} size={18} strokeWidth={1.8} />
      </div>
      <div>
        <h2 className="text-base font-semibold text-slate-100">{title}</h2>
        {sub && <p className="text-xs text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

// Year-long discipline heatmap
function DisciplineHeatmap({ data }) {
  const [tooltip, setTooltip] = useState(null);

  const weeks = useMemo(() => {
    if (!data?.length) return [];
    const map = {};
    data.forEach(d => { map[d.date] = d; });

    const end = new Date();
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

  function scoreColor(score) {
    if (!score) return '#1e293b';
    if (score < 25) return '#312e81';
    if (score < 50) return '#3730a3';
    if (score < 75) return '#4338ca';
    if (score < 90) return '#6366f1';
    return '#818cf8';
  }

  return (
    <div className="card">
      <SectionTitle icon="all" title="Discipline Heatmap" sub="Daily score over the past year" />
      <div className="overflow-x-auto pb-1">
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
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[10px] text-slate-600">Less</span>
        {['#1e293b','#312e81','#3730a3','#4338ca','#6366f1','#818cf8'].map(c => (
          <div key={c} className="w-2.5 h-2.5 rounded-[2px]" style={{ background: c }} />
        ))}
        <span className="text-[10px] text-slate-600">More</span>
      </div>
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs shadow-xl"
          style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
        >
          <p className="text-slate-300 font-medium">{fmt(tooltip.date)}</p>
          <p className="text-indigo-400">Score: {tooltip.score}</p>
          {tooltip.habits > 0 && <p className="text-slate-400">{tooltip.habits} habits</p>}
        </div>
      )}
    </div>
  );
}

function InsightCard({ icon, type, text }) {
  const colors = {
    positive: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    warning:  'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    neutral:  'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  };
  const iconColor = {
    positive: 'text-emerald-400',
    warning:  'text-yellow-400',
    neutral:  'text-indigo-400',
  };
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${colors[type] || colors.neutral}`}>
      <AppIcon name={icon} size={16} strokeWidth={2} className={`flex-shrink-0 mt-0.5 ${iconColor[type] || iconColor.neutral}`} />
      <p className="text-sm text-slate-300">{text}</p>
    </div>
  );
}

// ── main page ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const radarData = overview ? [
    { subject: 'Habits',   value: Math.min(overview.habitCompletionRate, 100) },
    { subject: 'Workouts', value: summary.workouts.totalSessions > 0 ? Math.min(summary.workouts.totalSessions / (days / 7 * 3) * 100, 100) : 0 },
    { subject: 'Calories', value: overview.caloriesToday > 0 ? 80 : 20 },
    { subject: 'Water',    value: Math.min((overview.waterToday / 2000) * 100, 100) },
    { subject: 'Score',    value: overview.avgScore },
  ] : [];

  const CHARTS = {
    habits:   { label: 'Habits',   color: '#6366f1', key: 'pct',      data: summary?.habits.series,   yLabel: '%',    name: 'Completion %' },
    calories: { label: 'Calories', color: '#f59e0b', key: 'calories',  data: summary?.calories.series, yLabel: 'kcal', name: 'Calories' },
    workouts: { label: 'Workouts', color: '#10b981', key: 'duration',  data: summary?.workouts.series, yLabel: 'min',  name: 'Duration' },
    water:    { label: 'Water',    color: '#38bdf8', key: 'amount',    data: summary?.water.series,    yLabel: 'ml',   name: 'Water (ml)' },
    weight:   { label: 'Weight',   color: '#e879f9', key: 'weight',    data: summary?.weight.entries,  yLabel: 'kg',   name: 'Weight' },
    score:    { label: 'Score',    color: '#fb923c', key: 'score',     data: summary?.score.series,    yLabel: 'pts',  name: 'Score' },
  };

  const chart = CHARTS[activeChart];

  return (
    <div className="space-y-5 py-4">
      {/* Range filter */}
      <div className="flex gap-2 flex-wrap">
        {RANGES.map(r => (
          <button
            key={r.days}
            onClick={() => setDays(r.days)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              days === r.days
                ? 'bg-indigo-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : (
        <>
          {/* Overview cards */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon="bolt"     label="Discipline Score"  value={`${overview?.disciplineScore ?? 0}/100`} color="text-orange-400" />
            <StatCard icon="flame"    label="Current Streak"    value={`${overview?.currentStreak ?? 0}d`}      color="text-red-400" />
            <StatCard icon="trophy"   label="Longest Streak"    value={`${overview?.longestStreak ?? 0}d`}      color="text-yellow-400" />
            <StatCard icon="lunchbox" label="Calories Today"    value={`${overview?.caloriesToday ?? 0} kcal`}  color="text-amber-400" />
            <StatCard icon="droplet"  label="Water Today"       value={`${((overview?.waterToday ?? 0)/1000).toFixed(1)}L`} color="text-blue-400" />
            <StatCard icon="scale"    label="Weight"
              value={overview?.weight ? `${overview.weight}kg` : '—'}
              trend={overview?.weightTrend}
              color="text-purple-400"
            />
          </div>

          {/* Radar chart — discipline breakdown */}
          {radarData.length > 0 && (
            <div className="card">
              <SectionTitle icon="chart-pie" title="Discipline Breakdown" sub="Across all tracked dimensions" />
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={80}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                  <Tooltip {...CHART_TOOLTIP} formatter={(v) => [`${Math.round(v)}%`, 'Score']} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Chart switcher */}
          <div className="card">
            <div className="flex gap-2 flex-wrap mb-4">
              {Object.entries(CHARTS).map(([key, c]) => (
                <button
                  key={key}
                  onClick={() => setActiveChart(key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    activeChart === key
                      ? 'text-white border-transparent'
                      : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300'
                  }`}
                  style={activeChart === key ? { background: c.color, borderColor: c.color } : {}}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <SectionTitle
              icon={activeChart === 'habits' ? 'calendar' : activeChart === 'calories' ? 'lunchbox' : activeChart === 'water' ? 'droplet' : activeChart === 'weight' ? 'scale' : 'chart-bar'}
              title={`${chart.label} Trend`}
              sub={`Last ${days} days`}
            />

            {chart.data?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                {activeChart === 'workouts' ? (
                  <BarChart data={chart.data} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={fmt} tick={{ fill: '#475569', fontSize: 10 }} interval={Math.floor(chart.data.length / 5)} />
                    <YAxis tick={{ fill: '#475569', fontSize: 10 }} unit={chart.yLabel} />
                    <Tooltip {...CHART_TOOLTIP} labelFormatter={fmt} formatter={(v) => [`${v}${chart.yLabel}`, chart.name]} />
                    <Bar dataKey={chart.key} fill={chart.color} radius={[3, 3, 0, 0]} />
                  </BarChart>
                ) : (
                  <AreaChart data={chart.data} margin={{ left: -20 }}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={chart.color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={chart.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={fmt} tick={{ fill: '#475569', fontSize: 10 }} interval={Math.floor(chart.data.length / 5)} />
                    <YAxis tick={{ fill: '#475569', fontSize: 10 }} unit={chart.yLabel} />
                    <Tooltip {...CHART_TOOLTIP} labelFormatter={fmt} formatter={(v) => [`${v}${chart.yLabel}`, chart.name]} />
                    <Area type="monotone" dataKey={chart.key} stroke={chart.color} fill="url(#areaGrad)" strokeWidth={2} dot={false} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center py-8 text-slate-600">
                <AppIcon name="chart-bar" size={32} strokeWidth={1} />
                <p className="text-sm mt-2">No data yet — start logging to see trends.</p>
              </div>
            )}
          </div>

          {/* Weekly summary row */}
          {summary && (
            <div className="card">
              <SectionTitle icon="sparkles" title="Period Summary" sub={`Last ${days} days`} />
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Avg Calories',   `${summary.calories.avgCalories} kcal`],
                  ['Avg Protein',    `${summary.calories.avgProtein}g`],
                  ['Avg Carbs',      `${summary.calories.avgCarbs}g`],
                  ['Avg Fat',        `${summary.calories.avgFat}g`],
                  ['Avg Water',      `${(summary.water.avgIntake / 1000).toFixed(1)}L`],
                  ['Total Workouts', `${summary.workouts.totalSessions} sessions`],
                  ['Habit Rate',     `${summary.habits.avgCompletionRate}%`],
                  ['Avg Score',      `${summary.overview.avgScore}/100`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-500">{label}</span>
                    <span className="text-slate-200 font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Heatmap */}
      {heatmapLoading ? (
        <div className="card flex justify-center py-8"><LoadingSpinner size="sm" /></div>
      ) : heatmap?.length > 0 ? (
        <DisciplineHeatmap data={heatmap} />
      ) : null}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="card">
          <SectionTitle icon="sparkles" title="Insights" sub="Auto-generated from your data" />
          <div className="space-y-2">
            {insights.map((ins, i) => (
              <InsightCard key={i} icon={ins.icon} type={ins.type} text={ins.text} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
