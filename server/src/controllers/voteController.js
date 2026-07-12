const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const vote = async (req, res, next) => {
  try {
    const { activityId, value } = req.body;
    if (!activityId || ![-1, 1].includes(Number(value))) {
      return res.status(400).json({ message: 'activityId and value (1 or -1) are required' });
    }

    const activity = await prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity) return res.status(404).json({ message: 'Activity not found' });

    const existing = await prisma.vote.findUnique({
      where: { activityId_userId: { activityId, userId: req.user.id } },
    });

    if (existing) {
      if (existing.value === Number(value)) {
        await prisma.vote.delete({ where: { id: existing.id } });
        return res.json({ message: 'Vote removed', voteRemoved: true });
      }
      const updated = await prisma.vote.update({ where: { id: existing.id }, data: { value: Number(value) } });
      return res.json(updated);
    }

    const newVote = await prisma.vote.create({
      data: { activityId, userId: req.user.id, value: Number(value) },
    });
    res.status(201).json(newVote);
  } catch (err) {
    next(err);
  }
};

module.exports = { vote };
