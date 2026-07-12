const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getMeals = async (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const meals = await prisma.meal.findMany({
      where: { userId: req.user.id, date: targetDate },
      include: { entries: { include: { foodItem: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json(meals);
  } catch (err) {
    next(err);
  }
};

const addFoodToMeal = async (req, res, next) => {
  try {
    const { mealType, foodItemId, quantity, unit, date } = req.body;
    if (!mealType || !foodItemId || !quantity) {
      return res.status(400).json({ message: 'mealType, foodItemId and quantity are required' });
    }
    const targetDate = date || new Date().toISOString().split('T')[0];

    let meal = await prisma.meal.findFirst({
      where: { userId: req.user.id, type: mealType, date: targetDate },
    });

    if (!meal) {
      meal = await prisma.meal.create({
        data: { userId: req.user.id, type: mealType, date: targetDate },
      });
    }

    const entry = await prisma.mealEntry.create({
      data: { mealId: meal.id, foodItemId, quantity: Number(quantity), unit: unit || 'g' },
      include: { foodItem: true },
    });

    const foodItem = await prisma.foodItem.findUnique({ where: { id: foodItemId } });
    await prisma.activity.create({
      data: {
        userId: req.user.id,
        type: 'meal_logged',
        data: { mealType, foodName: foodItem?.name, quantity: Number(quantity), unit: unit || 'g', date: targetDate },
      },
    });

    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
};

const removeMealEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const entry = await prisma.mealEntry.findFirst({
      where: { id },
      include: { meal: true },
    });
    if (!entry || entry.meal.userId !== req.user.id) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    await prisma.mealEntry.delete({ where: { id } });
    res.json({ message: 'Entry removed' });
  } catch (err) {
    next(err);
  }
};

const getDailyCalories = async (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const meals = await prisma.meal.findMany({
      where: { userId: req.user.id, date: targetDate },
      include: { entries: { include: { foodItem: true } } },
    });

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    meals.forEach((meal) => {
      meal.entries.forEach((entry) => {
        const factor = entry.quantity / 100;
        totalCalories += entry.foodItem.calories * factor;
        totalProtein += entry.foodItem.protein * factor;
        totalCarbs += entry.foodItem.carbs * factor;
        totalFat += entry.foodItem.fat * factor;
      });
    });

    res.json({
      date: targetDate,
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      fat: Math.round(totalFat * 10) / 10,
    });
  } catch (err) {
    next(err);
  }
};

const getCalorieTrend = async (req, res, next) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceStr = since.toISOString().split('T')[0];

    const meals = await prisma.meal.findMany({
      where: { userId: req.user.id, date: { gte: sinceStr } },
      include: { entries: { include: { foodItem: true } } },
    });

    const byDate = {};
    meals.forEach((meal) => {
      if (!byDate[meal.date]) byDate[meal.date] = 0;
      meal.entries.forEach((entry) => {
        byDate[meal.date] += entry.foodItem.calories * (entry.quantity / 100);
      });
    });

    const trend = Object.entries(byDate).map(([date, calories]) => ({ date, calories: Math.round(calories) })).sort((a, b) => a.date.localeCompare(b.date));
    res.json(trend);
  } catch (err) {
    next(err);
  }
};

module.exports = { getMeals, addFoodToMeal, removeMealEntry, getDailyCalories, getCalorieTrend };
