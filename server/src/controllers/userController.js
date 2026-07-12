const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, age: true, height: true, weight: true, goalWeight: true, goalCalories: true, goalSteps: true, createdAt: true },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, age, height, weight } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(age !== undefined && { age: Number(age) }),
        ...(height !== undefined && { height: Number(height) }),
        ...(weight !== undefined && { weight: Number(weight) }),
      },
      select: { id: true, name: true, email: true, age: true, height: true, weight: true, goalWeight: true, goalCalories: true, goalSteps: true },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

const updateGoals = async (req, res, next) => {
  try {
    const { goalWeight, goalCalories, goalSteps } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(goalWeight !== undefined && { goalWeight: Number(goalWeight) }),
        ...(goalCalories !== undefined && { goalCalories: Number(goalCalories) }),
        ...(goalSteps !== undefined && { goalSteps: Number(goalSteps) }),
      },
      select: { id: true, name: true, goalWeight: true, goalCalories: true, goalSteps: true },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json([]);
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { email: { contains: q, mode: 'insensitive' } },
          { id: { not: req.user.id } },
        ],
      },
      select: { id: true, name: true, email: true },
      take: 10,
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile, updateGoals, searchUsers };
