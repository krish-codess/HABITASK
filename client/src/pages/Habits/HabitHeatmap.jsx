import { useMemo } from 'react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function getColor(percent) {
  if (!percent || percent === 0) return '#1e293b';
  if (percent < 30) return '#312e81';
  if (percent < 60) return '#4338ca';
  if (percent < 85) return '#6366f1';
  return '#818cf8';
}

export default function HabitHeatmap({ data }) {
  const { weeks, monthLabels } = useMemo(() => {
    const dataMap = {};
    data.forEach((d) => { dataMap[d.date] = d; });

    const today = new Date();
    const end = new Date(today);
    const start = new Date(today);
    start.setFullYear(today.getFullYear() - 1);

    while (start.getDay() !== 0) start.setDate(start.getDate() - 1);

    const allWeeks = [];
    const cur = new Date(start);
    const labels = [];
    let lastMonth = -1;

    while (cur <= end) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = cur.toISOString().split('T')[0];
        const m = cur.getMonth();
        if (d === 0 && m !== lastMonth) {
          labels.push({ week: allWeeks.length, label: MONTHS[m] });
          lastMonth = m;
        }
        week.push({
          date: dateStr,
          percent: dataMap[dateStr]?.percent || 0,
          count: dataMap[dateStr]?.count || 0,
          isPlaceholder: cur > today,
        });
        cur.setDate(cur.getDate() + 1);
      }
      allWeeks.push(week);
    }

    return { weeks: allWeeks, monthLabels: labels };
  }, [data]);

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Year Overview</h3>
      <div className="overflow-x-auto">
        <div style={{ minWidth: weeks.length * 14 + 30 }}>
          {/* Month labels */}
          <div className="flex ml-7 mb-1">
            {monthLabels.map(({ week, label }) => (
              <div key={label} style={{ position: 'relative', left: week * 14 - (monthLabels[0]?.week || 0) * 14 }} className="absolute text-[9px] text-slate-500">{label}</div>
            ))}
          </div>
          <div className="relative" style={{ height: '6px', marginBottom: '4px' }}>
            {monthLabels.map(({ week, label }, i) => (
              <span
                key={i}
                className="absolute text-[9px] text-slate-500"
                style={{ left: week * 14 + 28 }}
              >{label}</span>
            ))}
          </div>
          <div className="flex gap-0.5">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 mr-1">
              {DAYS.map((d, i) => (
                <div key={i} className="h-3 w-4 text-[9px] text-slate-600 flex items-center justify-center">{i % 2 === 1 ? d : ''}</div>
              ))}
            </div>
            {/* Grid */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((cell, di) => (
                  <div
                    key={di}
                    className="heatmap-cell h-3 w-3 cursor-pointer"
                    style={{ backgroundColor: cell.isPlaceholder ? 'transparent' : getColor(cell.percent) }}
                    title={cell.isPlaceholder ? '' : `${cell.date}: ${cell.percent}% (${cell.count} habits)`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 justify-end">
            <span className="text-[10px] text-slate-500">Less</span>
            {[0, 25, 50, 75, 100].map((p) => (
              <div key={p} className="h-3 w-3 rounded-sm" style={{ backgroundColor: getColor(p) }} />
            ))}
            <span className="text-[10px] text-slate-500">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
