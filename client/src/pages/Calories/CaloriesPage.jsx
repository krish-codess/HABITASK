import { useState, useEffect, useCallback } from 'react';
import { getMeals, addFoodToMeal, removeMealEntry, getDailyCalories, searchFoods, createCustomFood } from '../../api/meals.js';
import { getWater, addWater, deleteWater } from '../../api/water.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Modal from '../../components/UI/Modal.jsx';
import LoadingSpinner from '../../components/UI/LoadingSpinner.jsx';
import BarcodeScanner from './BarcodeScanner.jsx';
import { TrashIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const today = () => new Date().toISOString().split('T')[0];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' };
const UNITS = ['g', 'ml', 'piece', 'bowl', 'plate', 'cup', 'tsp', 'tbsp'];

function WaterTracker({ date }) {
  const [water, setWater] = useState({ logs: [], total: 0 });
  const [adding, setAdding] = useState(false);

  const load = async () => {
    try { setWater(await getWater(date)); } catch {}
  };

  useEffect(() => { load(); }, [date]);

  const handleAdd = async (amount) => {
    setAdding(true);
    try {
      await addWater(amount, date);
      await load();
    } catch {}
    setAdding(false);
  };

  const handleDelete = async (id) => {
    await deleteWater(id);
    await load();
  };

  const goal = 2000;
  const pct = Math.min((water.total / goal) * 100, 100);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">💧</span>
          <div>
            <p className="font-semibold text-slate-100 text-sm">Water Intake</p>
            <p className="text-xs text-slate-400">{water.total}ml / {goal}ml</p>
          </div>
        </div>
        <span className="text-sm font-bold text-blue-400">{Math.round(pct)}%</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full mb-3 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex gap-2 flex-wrap">
        {[150, 250, 350, 500].map((ml) => (
          <button key={ml} onClick={() => handleAdd(ml)} disabled={adding} className="btn-secondary text-xs py-1.5 px-3">
            +{ml}ml
          </button>
        ))}
      </div>
      {water.logs.length > 0 && (
        <div className="mt-3 space-y-1">
          {water.logs.map((l) => (
            <div key={l.id} className="flex items-center justify-between text-xs text-slate-400">
              <span>💧 {l.amount}ml</span>
              <button onClick={() => handleDelete(l.id)} className="text-slate-600 hover:text-red-400"><TrashIcon className="h-3 w-3" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MealSection({ meal, mealType, date, onAdd, onRemove }) {
  const entries = meal?.entries || [];
  const totalCal = entries.reduce((sum, e) => sum + e.foodItem.calories * (e.quantity / 100), 0);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{MEAL_ICONS[mealType]}</span>
          <div>
            <p className="font-semibold text-slate-100 capitalize">{mealType}</p>
            {entries.length > 0 && (
              <p className="text-xs text-slate-400">{Math.round(totalCal)} kcal</p>
            )}
          </div>
        </div>
        <button onClick={() => onAdd(mealType)} className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-sm font-medium">
          <PlusIcon className="h-4 w-4" />
          Add
        </button>
      </div>
      {entries.length > 0 ? (
        <div className="space-y-2">
          {entries.map((entry) => {
            const kcal = Math.round(entry.foodItem.calories * (entry.quantity / 100));
            return (
              <div key={entry.id} className="flex items-center justify-between py-1.5 border-t border-slate-700/50">
                <div>
                  <p className="text-sm text-slate-200">{entry.foodItem.name}</p>
                  <p className="text-xs text-slate-500">{entry.quantity}{entry.unit} · {kcal} kcal</p>
                </div>
                <button onClick={() => onRemove(entry.id)} className="text-slate-600 hover:text-red-400 p-1.5 hover:bg-red-400/10 rounded-lg">
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-slate-600 text-center py-2">Nothing logged yet</p>
      )}
    </div>
  );
}

export default function CaloriesPage() {
  const { user } = useAuth();
  const [meals, setMeals] = useState([]);
  const [dailyStats, setDailyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(today());
  const [activeMealType, setActiveMealType] = useState('');
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [showBarcode, setShowBarcode] = useState(false);
  const [showCustomFood, setShowCustomFood] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState('100');
  const [unit, setUnit] = useState('g');
  const [customForm, setCustomForm] = useState({ name: '', nameHi: '', calories: '', protein: '', carbs: '', fat: '', unit: '100g' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, s] = await Promise.all([getMeals(selectedDate), getDailyCalories(selectedDate)]);
      setMeals(m);
      setDailyStats(s);
    } catch {}
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (searchQuery.trim().length < 1) { setSearchResults([]); return; }
      setSearching(true);
      try { setSearchResults(await searchFoods(searchQuery)); } catch {}
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleAddFood = (mealType) => {
    setActiveMealType(mealType);
    setShowFoodSearch(true);
    setSelectedFood(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSelectFood = (food) => {
    setSelectedFood(food);
    setQuantity('100');
    setUnit('g');
  };

  const handleConfirmAdd = async () => {
    if (!selectedFood) return;
    try {
      await addFoodToMeal({ mealType: activeMealType, foodItemId: selectedFood.id, quantity: Number(quantity), unit, date: selectedDate });
      await load();
      setShowFoodSearch(false);
      setSelectedFood(null);
      setSearchQuery('');
    } catch {}
  };

  const handleRemoveEntry = async (id) => {
    await removeMealEntry(id);
    await load();
  };

  const handleBarcodeFound = async (productData) => {
    try {
      const food = await createCustomFood({
        name: productData.name,
        calories: productData.calories,
        protein: productData.protein,
        carbs: productData.carbs,
        fat: productData.fat,
        unit: '100g',
      });
      setSelectedFood(food);
      setShowBarcode(false);
      setActiveMealType(activeMealType || 'snack');
      setShowFoodSearch(true);
    } catch {}
  };

  const handleCreateCustomFood = async (e) => {
    e.preventDefault();
    try {
      const food = await createCustomFood(customForm);
      setSelectedFood(food);
      setShowCustomFood(false);
      setShowFoodSearch(true);
    } catch {}
  };

  const goalCal = user?.goalCalories || 2000;
  const macroData = dailyStats ? [
    { name: 'Protein', value: dailyStats.protein, color: '#6366f1' },
    { name: 'Carbs', value: dailyStats.carbs, color: '#f59e0b' },
    { name: 'Fat', value: dailyStats.fat, color: '#ef4444' },
  ] : [];

  const getMealData = (type) => meals.find((m) => m.type === type) || null;

  return (
    <div className="space-y-4 py-4">
      {/* Date */}
      <div className="flex items-center gap-2">
        <input type="date" value={selectedDate} max={today()} onChange={(e) => setSelectedDate(e.target.value)} className="input-field text-sm flex-1" />
        <button onClick={() => setSelectedDate(today())} className="btn-secondary text-sm py-2 px-3">Today</button>
        <button onClick={() => { setActiveMealType('snack'); setShowBarcode(true); }} className="btn-secondary text-sm py-2 px-3 flex items-center gap-1">
          <span>📷</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><LoadingSpinner /></div>
      ) : (
        <>
          {/* Daily Summary */}
          {dailyStats && (
            <div className="card">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-slate-400 mb-1">Calories Today</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-slate-100">{dailyStats.calories}</span>
                    <span className="text-slate-500 text-sm">/ {goalCal} kcal</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${dailyStats.calories > goalCal ? 'bg-red-500' : 'bg-gradient-to-r from-green-500 to-emerald-400'}`}
                      style={{ width: `${Math.min((dailyStats.calories / goalCal) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex gap-4 mt-3">
                    {[
                      { label: 'P', value: dailyStats.protein, unit: 'g', color: 'text-indigo-400' },
                      { label: 'C', value: dailyStats.carbs, unit: 'g', color: 'text-yellow-400' },
                      { label: 'F', value: dailyStats.fat, unit: 'g', color: 'text-red-400' },
                    ].map(({ label, value, unit, color }) => (
                      <div key={label} className="text-center">
                        <p className={`text-sm font-bold ${color}`}>{value}g</p>
                        <p className="text-xs text-slate-500">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {macroData.some((m) => m.value > 0) && (
                  <div className="h-24 w-24 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={macroData} dataKey="value" cx="50%" cy="50%" innerRadius={25} outerRadius={40} strokeWidth={0}>
                          {macroData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => `${v}g`} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Water */}
          <WaterTracker date={selectedDate} />

          {/* Meals */}
          {MEAL_TYPES.map((type) => (
            <MealSection
              key={type}
              mealType={type}
              meal={getMealData(type)}
              date={selectedDate}
              onAdd={handleAddFood}
              onRemove={handleRemoveEntry}
            />
          ))}
        </>
      )}

      {/* Food Search Modal */}
      <Modal isOpen={showFoodSearch} onClose={() => { setShowFoodSearch(false); setSelectedFood(null); }} title={`Add to ${activeMealType}`} size="lg">
        {!selectedFood ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  className="input-field pl-9"
                  placeholder="Search food (English or Hindi)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
              <button onClick={() => { setShowFoodSearch(false); setShowBarcode(true); }} className="btn-secondary px-3 flex-shrink-0">
                📷
              </button>
            </div>

            {searching && <div className="text-center py-4"><LoadingSpinner size="sm" /></div>}

            <div className="space-y-1 max-h-64 overflow-y-auto">
              {searchResults.map((food) => (
                <button
                  key={food.id}
                  onClick={() => handleSelectFood(food)}
                  className="w-full text-left p-3 rounded-xl hover:bg-slate-700/50 transition-colors flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-200">{food.name}</p>
                    {food.nameHi && <p className="text-xs text-slate-500">{food.nameHi}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-orange-400">{food.calories} kcal</p>
                    <p className="text-xs text-slate-500">per {food.unit}</p>
                  </div>
                </button>
              ))}
              {searchQuery.length > 0 && searchResults.length === 0 && !searching && (
                <div className="text-center py-4 text-slate-500 text-sm">
                  <p>No results. <button onClick={() => setShowCustomFood(true)} className="text-indigo-400 underline">Add custom food</button></p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-700/50 rounded-xl p-3">
              <p className="font-semibold text-slate-100">{selectedFood.name}</p>
              <p className="text-xs text-slate-400">{selectedFood.calories} kcal per {selectedFood.unit}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Quantity</label>
                <input type="number" className="input-field" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Unit</label>
                <select className="input-field" value={unit} onChange={(e) => setUnit(e.target.value)}>
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="bg-slate-700/30 rounded-xl p-3 text-center">
              <p className="text-sm text-slate-400">Estimated calories</p>
              <p className="text-2xl font-bold text-orange-400">
                {Math.round(selectedFood.calories * (Number(quantity) / 100))} kcal
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSelectedFood(null)} className="btn-secondary flex-1">Back</button>
              <button onClick={handleConfirmAdd} className="btn-primary flex-1">Add to Meal</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Barcode Modal */}
      <Modal isOpen={showBarcode} onClose={() => setShowBarcode(false)} title="Scan Barcode" size="lg">
        <BarcodeScanner
          onFound={handleBarcodeFound}
          onClose={() => setShowBarcode(false)}
        />
      </Modal>

      {/* Custom Food Modal */}
      <Modal isOpen={showCustomFood} onClose={() => setShowCustomFood(false)} title="Add Custom Food">
        <form onSubmit={handleCreateCustomFood} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Name</label>
            <input type="text" className="input-field" placeholder="Food name" value={customForm.name} onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Hindi Name (optional)</label>
            <input type="text" className="input-field" placeholder="हिंदी नाम" value={customForm.nameHi} onChange={(e) => setCustomForm({ ...customForm, nameHi: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[['calories', 'Calories (kcal)'], ['protein', 'Protein (g)'], ['carbs', 'Carbs (g)'], ['fat', 'Fat (g)']].map(([k, label]) => (
              <div key={k}>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
                <input type="number" className="input-field" placeholder="0" value={customForm[k]} onChange={(e) => setCustomForm({ ...customForm, [k]: e.target.value })} min="0" required={k === 'calories'} />
              </div>
            ))}
          </div>
          <button type="submit" className="btn-primary w-full">Create Food</button>
        </form>
      </Modal>
    </div>
  );
}
