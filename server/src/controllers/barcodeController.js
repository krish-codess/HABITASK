const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const scanBarcode = async (req, res, next) => {
  try {
    const { code } = req.params;
    if (!code) return res.status(400).json({ message: 'Barcode is required' });

    const cached = await prisma.scannedFoodCache.findUnique({ where: { barcode: code } });
    if (cached) return res.json(cached.data);

    const response = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${code}.json`, { timeout: 8000 });
    const product = response.data;

    if (!product || product.status === 0) {
      return res.status(404).json({ message: 'Product not found. Try scanning again or add manually.' });
    }

    const p = product.product;
    const nutriments = p.nutriments || {};

    const foodData = {
      barcode: code,
      name: p.product_name || p.product_name_en || 'Unknown Product',
      brand: p.brands || '',
      imageUrl: p.image_url || '',
      calories: Math.round(nutriments['energy-kcal_100g'] || nutriments['energy_100g'] / 4.184 || 0),
      protein: Math.round((nutriments['proteins_100g'] || 0) * 10) / 10,
      carbs: Math.round((nutriments['carbohydrates_100g'] || 0) * 10) / 10,
      fat: Math.round((nutriments['fat_100g'] || 0) * 10) / 10,
      fiber: Math.round((nutriments['fiber_100g'] || 0) * 10) / 10,
      sugar: Math.round((nutriments['sugars_100g'] || 0) * 10) / 10,
      servingSize: p.serving_size || '100g',
      unit: '100g',
    };

    await prisma.scannedFoodCache.create({ data: { barcode: code, data: foodData } });

    res.json(foodData);
  } catch (err) {
    if (err.response?.status === 404 || err.code === 'ENOTFOUND') {
      return res.status(404).json({ message: 'Product not found' });
    }
    next(err);
  }
};

const addScannedToFoods = async (req, res, next) => {
  try {
    const { name, calories, protein, carbs, fat, unit } = req.body;
    if (!name || calories === undefined) return res.status(400).json({ message: 'Name and calories required' });

    const food = await prisma.foodItem.create({
      data: {
        name,
        calories: Number(calories),
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        unit: unit || '100g',
        isCustom: false,
      },
    });
    res.status(201).json(food);
  } catch (err) {
    next(err);
  }
};

module.exports = { scanBarcode, addScannedToFoods };
