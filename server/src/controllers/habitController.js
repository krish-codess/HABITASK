const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getHabits = async (req, res, next) => {
  try {
    const habits = await prisma.habit.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'asc' },
    });
    res.json(habits);
  } catch (err) {
    next(err);
  }
};

const createHabit = async (req, res, next) => {
  try {
    const { name, icon } = req.body;
    if (!name) return res.status(400).json({ message: 'Habit name is required' });
    const habit = await prisma.habit.create({
      data: { userId: req.user.id, name, icon: icon || '✅' },
    });
    res.status(201).json(habit);
  } catch (err) {
    next(err);
  }
};

const updateHabit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, icon } = req.body;
    const habit = await prisma.habit.findFirst({ where: { id, userId: req.user.id } });
    if (!habit) return res.status(404).json({ message: 'Habit not found' });
    const updated = await prisma.habit.update({ where: { id }, data: { ...(name && { name }), ...(icon && { icon }) } });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

const deleteHabit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const habit = await prisma.habit.findFirst({ where: { id, userId: req.user.id } });
    if (!habit) return res.status(404).json({ message: 'Habit not found' });
    await prisma.habit.delete({ where: { id } });
    res.json({ message: 'Habit deleted' });
  } catch (err) {
    next(err);
  }
};

const getLogs = async (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const logs = await prisma.habitLog.findMany({
      where: { userId: req.user.id, date: targetDate },
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
};

const toggleLog = async (req, res, next) => {
  try {
    const { habitId } = req.params;
    const { date } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const habit = await prisma.habit.findFirst({ where: { id: habitId, userId: req.user.id } });
    if (!habit) return res.status(404).json({ message: 'Habit not found' });

    const existing = await prisma.habitLog.findUnique({ where: { habitId_date: { habitId, date: targetDate } } });

    if (existing) {
      await prisma.habitLog.delete({ where: { id: existing.id } });
      return res.json({ completed: false, date: targetDate });
    }

    const log = await prisma.habitLog.create({
      data: { userId: req.user.id, habitId, date: targetDate, completed: true },
    });

    await prisma.activity.create({
      data: { userId: req.user.id, type: 'habit_completed', data: { habitId, habitName: habit.name, date: targetDate } },
    });

    res.json({ completed: true, log });
  } catch (err) {
    next(err);
  }
};

const getHeatmap = async (req, res, next) => {
  try {
    const since = new Date();
    since.setFullYear(since.getFullYear() - 1);
    const sinceStr = since.toISOString().split('T')[0];

    const logs = await prisma.habitLog.findMany({
      where: { userId: req.user.id, date: { gte: sinceStr } },
    });

    const habits = await prisma.habit.findMany({ where: { userId: req.user.id } });
    const totalHabits = habits.length || 1;

    const dateMap = {};
    logs.forEach((log) => {
      if (!dateMap[log.date]) dateMap[log.date] = 0;
      dateMap[log.date]++;
    });

    const heatmap = Object.entries(dateMap).map(([date, count]) => ({
      date,
      count,
      percent: Math.round((count / totalHabits) * 100),
    }));

    res.json(heatmap);
  } catch (err) {
    next(err);
  }
};

const getStreak = async (req, res, next) => {
  try {
    const { habitId } = req.params;
    const habit = await prisma.habit.findFirst({ where: { id: habitId, userId: req.user.id } });
    if (!habit) return res.status(404).json({ message: 'Habit not found' });

    const logs = await prisma.habitLog.findMany({
      where: { habitId, userId: req.user.id },
      orderBy: { date: 'desc' },
    });

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < logs.length; i++) {
      const logDate = new Date(logs[i].date);
      logDate.setHours(0, 0, 0, 0);
      const expected = new Date(today);
      expected.setDate(today.getDate() - i);
      if (logDate.getTime() === expected.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    res.json({ streak });
  } catch (err) {
    next(err);
  }
};

module.exports = { getHabits, createHabit, updateHabit, deleteHabit, getLogs, toggleLog, getHeatmap, getStreak };
