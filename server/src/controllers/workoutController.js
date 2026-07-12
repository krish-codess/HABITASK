const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getWorkouts = async (req, res, next) => {
  try {
    const { date, limit = 50 } = req.query;
    const where = { userId: req.user.id };
    if (date) where.date = date;
    const workouts = await prisma.workout.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    });
    res.json(workouts);
  } catch (err) {
    next(err);
  }
};

const createWorkout = async (req, res, next) => {
  try {
    const { exerciseName, duration, caloriesBurned, date, notes } = req.body;
    if (!exerciseName || !duration) return res.status(400).json({ message: 'Exercise name and duration are required' });
    const targetDate = date || new Date().toISOString().split('T')[0];

    const workout = await prisma.workout.create({
      data: {
        userId: req.user.id,
        exerciseName,
        duration: Number(duration),
        caloriesBurned: caloriesBurned ? Number(caloriesBurned) : null,
        date: targetDate,
        notes: notes || null,
      },
    });

    await prisma.activity.create({
      data: {
        userId: req.user.id,
        type: 'workout_logged',
        data: { exerciseName, duration: Number(duration), caloriesBurned: caloriesBurned ? Number(caloriesBurned) : 0, date: targetDate },
      },
    });

    res.status(201).json(workout);
  } catch (err) {
    next(err);
  }
};

const deleteWorkout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const workout = await prisma.workout.findFirst({ where: { id, userId: req.user.id } });
    if (!workout) return res.status(404).json({ message: 'Workout not found' });
    await prisma.workout.delete({ where: { id } });
    res.json({ message: 'Workout deleted' });
  } catch (err) {
    next(err);
  }
};

const getWeeklySummary = async (req, res, next) => {
  try {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const workouts = await prisma.workout.findMany({
      where: { userId: req.user.id, date: { gte: weekStartStr } },
    });

    const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);
    const totalCalories = workouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
    const totalSessions = workouts.length;

    const byDay = {};
    workouts.forEach((w) => {
      if (!byDay[w.date]) byDay[w.date] = { duration: 0, calories: 0, count: 0 };
      byDay[w.date].duration += w.duration;
      byDay[w.date].calories += w.caloriesBurned || 0;
      byDay[w.date].count++;
    });

    res.json({ totalDuration, totalCalories, totalSessions, byDay });
  } catch (err) {
    next(err);
  }
};

module.exports = { getWorkouts, createWorkout, deleteWorkout, getWeeklySummary };
