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
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const friends = await prisma.friend.findMany({ where: { userId: req.user.id } });
    const friendIds = friends.map((f) => f.friendId);
    friendIds.push(req.user.id);

    const users = await prisma.user.findMany({
      where: { id: { in: friendIds } },
      select: { id: true, name: true, email: true },
    });

    const leaderboard = await Promise.all(
      users.map(async (user) => {
        const habitLogs = await prisma.habitLog.count({ where: { userId: user.id, date: { gte: weekStartStr } } });
        const habits = await prisma.habit.count({ where: { userId: user.id } });
        const workouts = await prisma.workout.count({ where: { userId: user.id, date: { gte: weekStartStr } } });
        const mealDays = await prisma.meal.findMany({
          where: { userId: user.id, date: { gte: weekStartStr } },
          select: { date: true },
          distinct: ['date'],
        });

        const score = habitLogs * 10 + workouts * 15 + mealDays.length * 5;
        const habitRate = habits > 0 ? Math.round((habitLogs / (habits * 7)) * 100) : 0;

        return { ...user, score, habitLogs, workouts, mealDays: mealDays.length, habitRate };
      })
    );

    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard.forEach((u, i) => (u.rank = i + 1));

    res.json(leaderboard);
  } catch (err) {
    next(err);
  }
};

module.exports = { getFeed, getLeaderboard };
