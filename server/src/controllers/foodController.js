const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const searchFoods = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) return res.json([]);

    const foods = await prisma.foodItem.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { nameHi: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 20,
    });
    res.json(foods);
  } catch (err) {
    next(err);
  }
};

const getFoodById = async (req, res, next) => {
  try {
    const food = await prisma.foodItem.findUnique({ where: { id: req.params.id } });
    if (!food) return res.status(404).json({ message: 'Food not found' });
    res.json(food);
  } catch (err) {
    next(err);
  }
};

const createCustomFood = async (req, res, next) => {
  try {
    const { name, nameHi, calories, protein, carbs, fat, unit } = req.body;
    if (!name || calories === undefined) {
      return res.status(400).json({ message: 'Name and calories are required' });
    }
    const food = await prisma.foodItem.create({
      data: {
        name,
        nameHi: nameHi || null,
        calories: Number(calories),
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        unit: unit || '100g',
        isCustom: true,
        userId: req.user.id,
      },
    });
    res.status(201).json(food);
  } catch (err) {
    next(err);
  }
};

module.exports = { searchFoods, getFoodById, createCustomFood };
