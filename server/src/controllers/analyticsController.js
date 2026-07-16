const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const GRAM_UNITS = new Set(['g', 'ml', '100g']);

function calcMealCalories(entries) {
  return entries.reduce((sum, e) => {
    const factor = GRAM_UNITS.has(e.unit) ? e.quantity / 100 : e.quantity;
    return sum + e.foodItem.calories * factor;
  }, 0);
}

function prevDay(dateStr) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function daysBetween(a, b) {
  return Math.round((new Date(a) - new Date(b)) / 86400000);
}

function calcStreaks(sortedDatesDesc, todayStr) {
  if (!sortedDatesDesc.length) return { current: 0, longest: 0 };

  // unique, sorted descending
  const dates = [...new Set(sortedDatesDesc)].sort().reverse();

  // current streak — must include today or yesterday
  let current = 0;
  const first = dates[0];
  const gapFromToday = daysBetween(todayStr, first);
  if (gapFromToday <= 1) {
    let expected = first;
    for (const d of dates) {
      if (d === expected) {
        current++;
        expected = prevDay(expected);
      } else break;
    }
  }

  // longest streak
  let longest = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    if (daysBetween(dates[i - 1], dates[i]) === 1) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }
  longest = Math.max(longest, current);

  return { current, longest };
}

function disciplineScore(date, habits, habitLogs, workouts, meals, waterLogs) {
  const total = habits.length;
  if (total === 0) return 0;
  const completed = habitLogs.filter(l => l.date === date).length;
  const habitPct = Math.min(completed / total, 1) * 40;
  const workoutPts = workouts.some(w => w.date === date) ? 30 : 0;
  const mealPts = meals.some(m => m.date === date) ? 15 : 0;
  const water = waterLogs.filter(w => w.date === date).reduce((s, w) => s + w.amount, 0);
  const waterPts = Math.min(water / 2000, 1) * 15;
  return Math.round(habitPct + workoutPts + mealPts + waterPts);
}

function datesInRange(startStr, endStr) {
  const dates = [];
  const cur = new Date(startStr);
  const end = new Date(endStr);
  while (cur <= end) {
    dates.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

// GET /api/analytics/summary?days=30
const getSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const days = Math.min(parseInt(req.query.days) || 30, 365);
    const todayStr = new Date().toISOString().split('T')[0];
    const start = new Date();
    start.setDate(start.getDate() - days + 1);
    const startStr = start.toISOString().split('T')[0];

    const [
      habits,
      habitLogs,
      allHabitLogDates,
      mealsRaw,
      workouts,
      waterLogs,
      weightLogs,
    ] = await Promise.all([
      prisma.habit.findMany({ where: { userId }, select: { id: true, name: true } }),
      prisma.habitLog.findMany({
        where: { userId, date: { gte: startStr } },
        select: { habitId: true, date: true },
      }),
      prisma.habitLog.findMany({
        where: { userId },
        select: { date: true },
        distinct: ['date'],
        orderBy: { date: 'desc' },
        take: 500,
      }),
      prisma.meal.findMany({
        where: { userId, date: { gte: startStr } },
        include: { entries: { include: { foodItem: true } } },
      }),
      prisma.workout.findMany({
        where: { userId, date: { gte: startStr } },
        select: { date: true, duration: true, caloriesBurned: true, exerciseName: true },
      }),
      prisma.waterLog.findMany({
        where: { userId, date: { gte: startStr } },
        select: { date: true, amount: true },
      }),
      prisma.weightLog.findMany({
        where: { userId },
        orderBy: { date: 'asc' },
        select: { date: true, weight: true },
        take: 90,
      }),
    ]);

    // ── Streaks ──────────────────────────────────────────────────────────────
    const streaks = calcStreaks(allHabitLogDates.map(l => l.date), todayStr);

    // ── Today overview ───────────────────────────────────────────────────────
    const todayMeals = mealsRaw.filter(m => m.date === todayStr);
    const caloriesToday = Math.round(
      todayMeals.reduce((s, m) => s + calcMealCalories(m.entries), 0)
    );
    const waterToday = waterLogs.filter(w => w.date === todayStr).reduce((s, w) => s + w.amount, 0);
    const latestWeight = weightLogs.length ? weightLogs[weightLogs.length - 1].weight : null;
    const prevWeight = weightLogs.length > 1 ? weightLogs[weightLogs.length - 2].weight : null;
    const weightTrend = latestWeight && prevWeight ? +(latestWeight - prevWeight).toFixed(1) : 0;
    const todayScore = disciplineScore(todayStr, habits, habitLogs, workouts, mealsRaw, waterLogs);

    // ── Per-day series ───────────────────────────────────────────────────────
    const allDates = datesInRange(startStr, todayStr);

    const habitSeries = allDates.map(date => {
      const completed = habitLogs.filter(l => l.date === date).length;
      const pct = habits.length ? Math.round((completed / habits.length) * 100) : 0;
      return { date, completed, total: habits.length, pct };
    });

    const calorieSeries = allDates.map(date => {
      const dayMeals = mealsRaw.filter(m => m.date === date);
      const calories = Math.round(dayMeals.reduce((s, m) => s + calcMealCalories(m.entries), 0));
      const protein = Math.round(dayMeals.reduce((s, m) => s + m.entries.reduce((es, e) => {
        const f = GRAM_UNITS.has(e.unit) ? e.quantity / 100 : e.quantity;
        return es + e.foodItem.protein * f;
      }, 0), 0) * 10) / 10;
      const carbs = Math.round(dayMeals.reduce((s, m) => s + m.entries.reduce((es, e) => {
        const f = GRAM_UNITS.has(e.unit) ? e.quantity / 100 : e.quantity;
        return es + e.foodItem.carbs * f;
      }, 0), 0) * 10) / 10;
      const fat = Math.round(dayMeals.reduce((s, m) => s + m.entries.reduce((es, e) => {
        const f = GRAM_UNITS.has(e.unit) ? e.quantity / 100 : e.quantity;
        return es + e.foodItem.fat * f;
      }, 0), 0) * 10) / 10;
      return { date, calories, protein, carbs, fat };
    });

    const workoutSeries = allDates.map(date => {
      const dayWorkouts = workouts.filter(w => w.date === date);
      return {
        date,
        sessions: dayWorkouts.length,
        duration: dayWorkouts.reduce((s, w) => s + w.duration, 0),
        burned: Math.round(dayWorkouts.reduce((s, w) => s + (w.caloriesBurned || 0), 0)),
      };
    });

    const waterSeries = allDates.map(date => {
      const total = waterLogs.filter(w => w.date === date).reduce((s, w) => s + w.amount, 0);
      return { date, amount: total, pct: Math.min(Math.round((total / 2000) * 100), 100) };
    });

    const scoreSeries = allDates.map(date => ({
      date,
      score: disciplineScore(date, habits, habitLogs, workouts, mealsRaw, waterLogs),
    }));

    // ── Averages ─────────────────────────────────────────────────────────────
    const daysWithData = calorieSeries.filter(d => d.calories > 0);
    const avgCalories = daysWithData.length
      ? Math.round(daysWithData.reduce((s, d) => s + d.calories, 0) / daysWithData.length)
      : 0;
    const avgProtein = daysWithData.length
      ? Math.round((daysWithData.reduce((s, d) => s + d.protein, 0) / daysWithData.length) * 10) / 10
      : 0;
    const avgCarbs = daysWithData.length
      ? Math.round((daysWithData.reduce((s, d) => s + d.carbs, 0) / daysWithData.length) * 10) / 10
      : 0;
    const avgFat = daysWithData.length
      ? Math.round((daysWithData.reduce((s, d) => s + d.fat, 0) / daysWithData.length) * 10) / 10
      : 0;
    const avgWater = allDates.length
      ? Math.round(waterSeries.reduce((s, d) => s + d.amount, 0) / allDates.length)
      : 0;
    const avgScore = allDates.length
      ? Math.round(scoreSeries.reduce((s, d) => s + d.score, 0) / allDates.length)
      : 0;

    const habitCompletionRate = habits.length && allDates.length
      ? Math.round((habitLogs.length / (habits.length * allDates.length)) * 100)
      : 0;

    res.json({
      overview: {
        disciplineScore: todayScore,
        currentStreak: streaks.current,
        longestStreak: streaks.longest,
        caloriesToday,
        waterToday,
        weight: latestWeight,
        weightTrend,
        habitCompletionRate,
        avgScore,
      },
      habits: { series: habitSeries, avgCompletionRate: habitCompletionRate },
      calories: { series: calorieSeries, avgCalories, avgProtein, avgCarbs, avgFat },
      workouts: { series: workoutSeries, totalSessions: workouts.length },
      water: { series: waterSeries, avgIntake: avgWater },
      weight: { entries: weightLogs },
      score: { series: scoreSeries, avg: avgScore },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/heatmap  — full-year daily discipline scores
const getHeatmap = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const todayStr = new Date().toISOString().split('T')[0];
    const yearAgo = new Date();
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    const yearAgoStr = yearAgo.toISOString().split('T')[0];

    const [habits, habitLogs, workouts, mealsRaw, waterLogs] = await Promise.all([
      prisma.habit.findMany({ where: { userId }, select: { id: true } }),
      prisma.habitLog.findMany({
        where: { userId, date: { gte: yearAgoStr } },
        select: { date: true },
      }),
      prisma.workout.findMany({
        where: { userId, date: { gte: yearAgoStr } },
        select: { date: true },
      }),
      prisma.meal.findMany({
        where: { userId, date: { gte: yearAgoStr } },
        select: { date: true },
      }),
      prisma.waterLog.findMany({
        where: { userId, date: { gte: yearAgoStr } },
        select: { date: true, amount: true },
      }),
    ]);

    const dates = datesInRange(yearAgoStr, todayStr);
    const data = dates.map(date => ({
      date,
      score: disciplineScore(date, habits, habitLogs, workouts, mealsRaw, waterLogs),
      habits: habitLogs.filter(l => l.date === date).length,
      workout: workouts.some(w => w.date === date) ? 1 : 0,
      meals: mealsRaw.some(m => m.date === date) ? 1 : 0,
      water: waterLogs.filter(w => w.date === date).reduce((s, w) => s + w.amount, 0),
    }));

    res.json(data);
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/insights
const getInsights = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const days = 30;
    const start = new Date();
    start.setDate(start.getDate() - days);
    const startStr = start.toISOString().split('T')[0];

    const [habitLogs, workouts, waterLogs, weightLogs, habits] = await Promise.all([
      prisma.habitLog.findMany({ where: { userId, date: { gte: startStr } }, select: { date: true, habitId: true } }),
      prisma.workout.findMany({ where: { userId, date: { gte: startStr } }, select: { date: true, caloriesBurned: true } }),
      prisma.waterLog.findMany({ where: { userId, date: { gte: startStr } }, select: { date: true, amount: true } }),
      prisma.weightLog.findMany({ where: { userId }, orderBy: { date: 'asc' }, select: { date: true, weight: true }, take: 30 }),
      prisma.habit.findMany({ where: { userId }, select: { id: true, name: true } }),
    ]);

    const insights = [];

    // Best day of week
    const dowCount = Array(7).fill(0);
    habitLogs.forEach(l => { dowCount[new Date(l.date + 'T00:00:00').getDay()]++; });
    const dowNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const bestDow = dowCount.indexOf(Math.max(...dowCount));
    if (dowCount[bestDow] > 0) {
      insights.push({ icon: 'star', type: 'positive', text: `You are most consistent on ${dowNames[bestDow]}s.` });
    }

    // Workout ↔ water correlation
    const workoutDates = new Set(workouts.map(w => w.date));
    const waterByDate = {};
    waterLogs.forEach(w => { waterByDate[w.date] = (waterByDate[w.date] || 0) + w.amount; });
    const wkWater = Object.entries(waterByDate).filter(([d]) => workoutDates.has(d)).map(([, v]) => v);
    const noWkWater = Object.entries(waterByDate).filter(([d]) => !workoutDates.has(d)).map(([, v]) => v);
    if (wkWater.length >= 3 && noWkWater.length >= 3) {
      const avgWk = wkWater.reduce((a, b) => a + b, 0) / wkWater.length;
      const avgNo = noWkWater.reduce((a, b) => a + b, 0) / noWkWater.length;
      if (avgWk > avgNo * 1.1) {
        insights.push({ icon: 'droplet', type: 'positive', text: `You drink ~${Math.round((avgWk - avgNo) / 100) * 100}ml more water on workout days.` });
      }
    }

    // Weight trend
    if (weightLogs.length >= 4) {
      const recent = weightLogs.slice(-2);
      const older = weightLogs.slice(-8, -2);
      if (older.length >= 2) {
        const recentAvg = recent.reduce((s, w) => s + w.weight, 0) / recent.length;
        const olderAvg = older.reduce((s, w) => s + w.weight, 0) / older.length;
        const diff = +(recentAvg - olderAvg).toFixed(1);
        if (Math.abs(diff) >= 0.3) {
          insights.push({
            icon: diff < 0 ? 'trend-down' : 'trend-up',
            type: diff < 0 ? 'positive' : 'neutral',
            text: `Your weight has ${diff < 0 ? 'decreased' : 'increased'} by ${Math.abs(diff)}kg recently.`,
          });
        }
      }
    }

    // Most skipped habit
    if (habits.length > 1 && habitLogs.length > 0) {
      const countByHabit = {};
      habitLogs.forEach(l => { countByHabit[l.habitId] = (countByHabit[l.habitId] || 0) + 1; });
      const leastId = habits.reduce((least, h) =>
        (countByHabit[h.id] || 0) < (countByHabit[least.id] || 0) ? h : least
      , habits[0]);
      const leastHabit = habits.find(h => h.id === leastId.id);
      if (leastHabit && (countByHabit[leastHabit.id] || 0) < days * 0.4) {
        insights.push({ icon: 'info', type: 'warning', text: `"${leastHabit.name}" is your least completed habit this month.` });
      }
    }

    // Workout frequency
    const workoutCount = workouts.length;
    if (workoutCount >= 3) {
      insights.push({ icon: 'bolt', type: 'positive', text: `You worked out ${workoutCount} times in the last 30 days. Keep it up!` });
    } else if (workoutCount < 2) {
      insights.push({ icon: 'info', type: 'warning', text: `You only logged ${workoutCount} workout${workoutCount !== 1 ? 's' : ''} this month. Try to be more consistent.` });
    }

    // Weekend consistency
    const weekendLogs = habitLogs.filter(l => {
      const dow = new Date(l.date + 'T00:00:00').getDay();
      return dow === 0 || dow === 6;
    });
    const weekdayLogs = habitLogs.filter(l => {
      const dow = new Date(l.date + 'T00:00:00').getDay();
      return dow > 0 && dow < 6;
    });
    const weekendWeeks = days / 7 * 2;
    const weekdayWeeks = days / 7 * 5;
    if (weekdayWeeks > 0 && weekendWeeks > 0) {
      const wkdAvg = weekdayLogs.length / weekdayWeeks;
      const wkndAvg = weekendLogs.length / weekendWeeks;
      if (wkdAvg > wkndAvg * 1.5 && habits.length > 0) {
        insights.push({ icon: 'moon', type: 'neutral', text: `Your habit completion drops significantly on weekends.` });
      }
    }

    res.json(insights.slice(0, 6));
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary, getHeatmap, getInsights };
