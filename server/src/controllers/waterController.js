const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getWater = async (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const logs = await prisma.waterLog.findMany({
      where: { userId: req.user.id, date: targetDate },
      orderBy: { createdAt: 'asc' },
    });
    const total = logs.reduce((sum, l) => sum + l.amount, 0);
    res.json({ logs, total });
  } catch (err) {
    next(err);
  }
};

const addWater = async (req, res, next) => {
  try {
    const { amount, date } = req.body;
    if (!amount) return res.status(400).json({ message: 'amount is required' });
    const targetDate = date || new Date().toISOString().split('T')[0];
    const log = await prisma.waterLog.create({
      data: { userId: req.user.id, amount: Number(amount), date: targetDate },
    });
    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
};

const deleteWater = async (req, res, next) => {
  try {
    const { id } = req.params;
    const log = await prisma.waterLog.findFirst({ where: { id, userId: req.user.id } });
    if (!log) return res.status(404).json({ message: 'Log not found' });
    await prisma.waterLog.delete({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getWater, addWater, deleteWater };
