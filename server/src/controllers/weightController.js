const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getWeightLogs = async (req, res, next) => {
  try {
    const logs = await prisma.weightLog.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'asc' },
      take: 90,
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
};

const addWeight = async (req, res, next) => {
  try {
    const { weight, date } = req.body;
    if (!weight) return res.status(400).json({ message: 'weight is required' });
    const targetDate = date || new Date().toISOString().split('T')[0];
    const log = await prisma.weightLog.create({
      data: { userId: req.user.id, weight: Number(weight), date: targetDate },
    });
    await prisma.user.update({ where: { id: req.user.id }, data: { weight: Number(weight) } });
    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
};

const deleteWeight = async (req, res, next) => {
  try {
    const { id } = req.params;
    const log = await prisma.weightLog.findFirst({ where: { id, userId: req.user.id } });
    if (!log) return res.status(404).json({ message: 'Log not found' });
    await prisma.weightLog.delete({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getWeightLogs, addWeight, deleteWeight };
