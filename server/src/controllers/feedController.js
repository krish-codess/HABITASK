const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getFeed = async (req, res, next) => {
  try {
    const friends = await prisma.friend.findMany({ where: { userId: req.user.id } });
    const friendIds = friends.map((f) => f.friendId);
    friendIds.push(req.user.id);

    const activities = await prisma.activity.findMany({
      where: { userId: { in: friendIds } },
      include: {
        user: { select: { id: true, name: true, email: true } },
        votes: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const feed = activities.map((a) => ({
      ...a,
      voteScore: a.votes.reduce((sum, v) => sum + v.value, 0),
      userVote: a.votes.find((v) => v.userId === req.user.id)?.value || 0,
    }));

    res.json(feed);
  } catch (err) {
    next(err);
  }
};

const getLeaderboard = async (req, res, next) => {
  try {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const friends = await prisma.friend.findMany({ where: { userId: req.user.id } });
    const friendIds = friends.map((f) => f.friendId);
    friendIds.push(req.user.id);

    const [users, allHabitLogs, allHabits, allWorkouts, allMealDays] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: friendIds } },
        select: { id: true, name: true, email: true },
      }),
      prisma.habitLog.groupBy({
        by: ['userId'],
        where: { userId: { in: friendIds }, date: { gte: weekStartStr } },
        _count: { id: true },
      }),
      prisma.habit.groupBy({
        by: ['userId'],
        where: { userId: { in: friendIds } },
        _count: { id: true },
      }),
      prisma.workout.groupBy({
        by: ['userId'],
        where: { userId: { in: friendIds }, date: { gte: weekStartStr } },
        _count: { id: true },
      }),
      prisma.meal.findMany({
        where: { userId: { in: friendIds }, date: { gte: weekStartStr } },
        select: { userId: true, date: true },
        distinct: ['userId', 'date'],
      }),
    ]);

    const logsByUser = Object.fromEntries(allHabitLogs.map((l) => [l.userId, l._count.id]));
    const habitsByUser = Object.fromEntries(allHabits.map((h) => [h.userId, h._count.id]));
    const workoutsByUser = Object.fromEntries(allWorkouts.map((w) => [w.userId, w._count.id]));
    const mealDaysByUser = allMealDays.reduce((acc, m) => {
      acc[m.userId] = (acc[m.userId] || 0) + 1;
      return acc;
    }, {});

    const leaderboard = users.map((user) => {
      const habitLogs = logsByUser[user.id] || 0;
      const habits = habitsByUser[user.id] || 1;
      const workouts = workoutsByUser[user.id] || 0;
      const mealDays = mealDaysByUser[user.id] || 0;
      const score = habitLogs * 10 + workouts * 15 + mealDays * 5;
      const habitRate = Math.round((habitLogs / (habits * 7)) * 100);
      return { ...user, score, habitLogs, workouts, mealDays, habitRate };
    });

    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard.forEach((u, i) => (u.rank = i + 1));

    res.json(leaderboard);
  } catch (err) {
    next(err);
  }
};

module.exports = { getFeed, getLeaderboard };
