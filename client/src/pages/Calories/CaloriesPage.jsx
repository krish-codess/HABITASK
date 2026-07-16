import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getMeals, addFoodToMeal, removeMealEntry,
  getDailyCalories, searchFoods, createCustomFood,
} from '../../api/meals.js';
import { getWater, addWater, deleteWater } from '../../api/water.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Modal from '../../components/UI/Modal.jsx';
import LoadingSpinner from '../../components/UI/LoadingSpinner.jsx';
import BarcodeScanner from './BarcodeScanner.jsx';
import AppIcon from '../../components/UI/AppIcon.jsx';

const todayStr = () => new Date().toISOString().split('T')[0];

const MEAL_TYPES  = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_ICONS  = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' };
const UNITS       = ['g', 'ml', 'piece', 'bowl', 'plate', 'cup', 'tsp', 'tbsp', 'glass'];
const GRAM_UNITS  = new Set(['g', 'ml', '100g']);

function estimateCalories(foodCalories, quantity, unit) {
  if (GRAM_UNITS.has(unit)) return foodCalories * (Number(quantity) / 100);
  return foodCalories * Number(quantity);
}
function entryCalories(entry) {
  return estimateCalories(entry.foodItem.calories, entry.quantity, entry.unit);
}

function TrashMini() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}

/* ─── Water tracker ──────────────────────────────────────── */
function WaterTracker({ date }) {
  const [water, setWater]   = useState({ logs: [], total: 0 });
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    try { setWater(await getWater(date)); } catch {}
  }, [date]);
  useEffect(() => { load(); }, [load]);

  const handleAdd = async (amount) => {
    setAdding(true);
    try { await addWater(amount, date); await load(); } catch {}
    setAdding(false);
  };
  const handleDelete = async (id) => {
    try { await deleteWater(id); await load(); } catch {}
  };

  const goal = 2000;
  const pct  = Math.min((water.total / goal) * 100, 100);

  return (
    <div className="card space-y-3">
      {/* Header row */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
          <span className="text-base leading-none">💧</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ht-text-1">Water</p>
            <span className={`text-xs font-semibold tabular-nums ${pct >= 100 ? 'text-ht-success' : 'text-blue-400'}`}>
              {water.total}<span className="font-normal text-ht-text-3">/{goal}ml</span>
            </span>
          </div>
          <div className="h-1.5 bg-ht-elevated rounded-full mt-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-blue-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick-add pills */}
      <div className="flex gap-1.5 flex-wrap">
        {[150, 250, 350, 500].map((ml) => (
          <button key={ml} onClick={() => handleAdd(ml)} disabled={adding}
            className="h-7 px-3 rounded-lg bg-ht-elevated border border-ht-border text-xs font-medium text-ht-text-2 hover:text-ht-text-1 hover:border-ht-border-2 transition-all disabled:opacity-50">
            +{ml}ml
          </button>
        ))}
        {water.logs.length > 0 && (
          <button onClick={() => setExpanded((v) => !v)}
            className="h-7 px-3 rounded-lg bg-ht-elevated border border-ht-border text-xs text-ht-text-3 hover:text-ht-text-2 transition-all ml-auto">
            {expanded ? 'Hide' : `${water.logs.length} log${water.logs.length !== 1 ? 's' : ''}`}
          </button>
        )}
      </div>

      {/* Log list */}
      {expanded && water.logs.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-ht-border animate-fade-in">
          {water.logs.map((l) => (
            <div key={l.id} className="flex items-center justify-between text-xs text-ht-text-3 group">
              <span>💧 {l.amount}ml</span>
              <button onClick={() => handleDelete(l.id)}
                className="opacity-0 group-hover:opacity-100 hover:text-ht-danger transition-all p-0.5">
                <TrashMini />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Meal section ───────────────────────────────────────── */
function MealSection({ meal, mealType, onAdd, onRemove }) {
  const entries   = meal?.entries || [];
  const totalCal  = Math.round(entries.reduce((sum, e) => sum + entryCalories(e), 0));
  const hasItems  = entries.length > 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-0.5 mb-1.5">
        <span className="text-sm leading-none">{MEAL_ICONS[mealType]}</span>
        <p className="text-sm font-medium text-ht-text-1 capitalize flex-1">{mealType}</p>
        {hasItems && (
          <span className="text-xs text-ht-text-3 tabular-nums">{totalCal} kcal</span>
        )}
        <button onClick={() => onAdd(mealType)} className="text-xs text-ht-accent hover:text-ht-accent-2 font-medium transition-colors">
          + Add
        </button>
      </div>

      {/* Entries */}
      {hasItems && (
        <div className="space-y-px">
          {entries.map((entry) => {
            const kcal = Math.round(entryCalories(entry));
            return (
              <div key={entry.id} className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-ht-surface border border-ht-border group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ht-text-1 truncate">{entry.foodItem.name}</p>
                  <p className="text-[11px] text-ht-text-3">
                    {entry.quantity}{entry.unit} · {kcal} kcal
                  </p>
                </div>
                <button onClick={() => onRemove(entry.id)}
                  className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-md text-ht-text-3 hover:text-ht-danger hover:bg-ht-danger/10 opacity-40 group-hover:opacity-100 transition-all">
                  <TrashMini />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────── */
export default function CaloriesPage() {
  const { user } = useAuth();
  const [meals, setMeals]         = useState([]);
  const [dailyStats, setDailyStats] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayStr());

  // Food search state
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [showBarcode, setShowBarcode]       = useState(false);
  const [showCustomFood, setShowCustomFood] = useState(false);
  const [activeMealType, setActiveMealType] = useState('snack');
  const [searchQuery, setSearchQuery]       = useState('');
  const [searchResults, setSearchResults]   = useState([]);
  const [searching, setSearching]           = useState(false);
  const [selectedFood, setSelectedFood]     = useState(null);
  const [quantity, setQuantity]             = useState('1');
  const [unit, setUnit]                     = useState('piece');
  const [addingEntry, setAddingEntry]       = useState(false);
  const [addError, setAddError]             = useState('');
  const [customForm, setCustomForm]         = useState({ name: '', nameHi: '', calories: '', protein: '', carbs: '', fat: '', unit: 'piece' });

  const dateInputRef = useRef(null);
  const isToday = selectedDate === todayStr();

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

  // Debounced food search
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
    setAddError('');
  };

  const handleSelectFood = (food) => {
    setSelectedFood(food);
    if (food.unit === '100g') { setQuantity('100'); setUnit('g'); }
    else { setQuantity('1'); setUnit(food.unit || 'piece'); }
  };

  const handleConfirmAdd = async () => {
    if (!selectedFood || !quantity) return;
    setAddingEntry(true);
    setAddError('');
    try {
      await addFoodToMeal({ mealType: activeMealType, foodItemId: selectedFood.id, quantity: Number(quantity), unit, date: selectedDate });
      await load();
      setShowFoodSearch(false);
      setSelectedFood(null);
      setSearchQuery('');
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add food');
    }
    setAddingEntry(false);
  };

  const handleRemoveEntry = async (id) => {
    try { await removeMealEntry(id); await load(); } catch {}
  };

  const handleBarcodeFound = async (productData) => {
    try {
      const food = await createCustomFood({ name: productData.name, calories: productData.calories, protein: productData.protein, carbs: productData.carbs, fat: productData.fat, unit: '100g' });
      handleSelectFood(food);
      setShowBarcode(false);
      setShowFoodSearch(true);
    } catch {}
  };

  const handleCreateCustomFood = async (e) => {
    e.preventDefault();
    try {
      const food = await createCustomFood(customForm);
      handleSelectFood(food);
      setShowCustomFood(false);
      setShowFoodSearch(true);
    } catch {}
  };

  const goalCal = user?.goalCalories || 2000;
  const caloriesPct = dailyStats ? Math.min((dailyStats.calories / goalCal) * 100, 100) : 0;
  const over = dailyStats && dailyStats.calories > goalCal;
  const getMealData = (type) => meals.find((m) => m.type === type) || null;
  const estimatedKcal = selectedFood
    ? Math.round(estimateCalories(selectedFood.calories, quantity || 0, unit))
    : 0;

  return (
    <div className="space-y-4 py-4">

      {/* Date header */}
      <div className="flex items-center justify-between">
        <div>
          {!isToday && (
            <span className="badge-warning">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              <button onClick={() => setSelectedDate(todayStr())} className="ml-1 opacity-70 hover:opacity-100">×</button>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => { setActiveMealType('snack'); setShowBarcode(true); }} className="btn-icon h-8 w-8" title="Scan barcode">
            <span className="text-sm">📷</span>
          </button>
          <div className="relative h-8 w-8">
            <input ref={dateInputRef} type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} max={todayStr()} aria-label="Select date" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
            <button className="btn-icon h-8 w-8" tabIndex={-1} aria-hidden="true">
              <AppIcon name="calendar" size={15} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><LoadingSpinner /></div>
      ) : (
        <>
          {/* Calorie summary */}
          {dailyStats && (
            <div className="card space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="section-label">Calories today</p>
                  <p className="text-3xl font-bold text-ht-text-1 mt-1 tabular-nums">
                    {dailyStats.calories}
                    <span className="text-sm font-normal text-ht-text-3 ml-1">/ {goalCal} kcal</span>
                  </p>
                </div>
                {over && <span className="badge-danger mb-1">Over goal</span>}
              </div>
              <div className="h-1.5 bg-ht-elevated rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${over ? 'bg-ht-danger' : 'bg-ht-accent'}`}
                  style={{ width: `${caloriesPct}%` }}
                />
              </div>
              <div className="flex gap-4">
                {[
                  { label: 'Protein', value: dailyStats.protein, color: 'text-ht-accent-2' },
                  { label: 'Carbs',   value: dailyStats.carbs,   color: 'text-ht-warning' },
                  { label: 'Fat',     value: dailyStats.fat,     color: 'text-ht-danger' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <p className={`text-sm font-bold ${color} tabular-nums`}>{value}g</p>
                    <p className="text-[11px] text-ht-text-3 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Water tracker */}
          <WaterTracker date={selectedDate} />

          {/* Meals */}
          <div className="card space-y-4">
            <p className="section-label">Meals</p>
            {MEAL_TYPES.map((type, i) => (
              <div key={type}>
                {i > 0 && <div className="divider -mx-4" />}
                <div className={i > 0 ? 'pt-4' : ''}>
                  <MealSection
                    mealType={type}
                    meal={getMealData(type)}
                    onAdd={handleAddFood}
                    onRemove={handleRemoveEntry}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Food Search Modal */}
      <Modal
        isOpen={showFoodSearch}
        onClose={() => { setShowFoodSearch(false); setSelectedFood(null); setAddError(''); }}
        title={`Add to ${activeMealType}`}
        size="lg"
      >
        {!selectedFood ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ht-text-3">
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  className="input-field pl-9"
                  placeholder="Search food (English or Hindi)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
              <button
                onClick={() => { setShowFoodSearch(false); setShowBarcode(true); }}
                className="btn-ghost h-9 w-9 px-0 flex-shrink-0"
                title="Scan barcode"
              >
                <span className="text-sm">📷</span>
              </button>
            </div>

            {searching && <div className="flex justify-center py-4"><LoadingSpinner size="sm" /></div>}

            <div className="space-y-px max-h-64 overflow-y-auto">
              {searchResults.map((food) => (
                <button
                  key={food.id}
                  onClick={() => handleSelectFood(food)}
                  className="w-full text-left px-3 py-3 rounded-lg hover:bg-ht-elevated transition-colors flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ht-text-1 truncate">{food.name}</p>
                    {food.nameHi && <p className="text-xs text-ht-text-3">{food.nameHi}</p>}
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-sm font-bold text-orange-400">{food.calories}</p>
                    <p className="text-[11px] text-ht-text-3">kcal/{food.unit}</p>
                  </div>
                </button>
              ))}
              {searchQuery.length > 0 && !searching && searchResults.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-sm text-ht-text-3 mb-2">No results found</p>
                  <button
                    onClick={() => { setShowFoodSearch(false); setShowCustomFood(true); }}
                    className="text-ht-accent text-sm hover:text-ht-accent-2 font-medium"
                  >
                    + Add custom food
                  </button>
                </div>
              )}
              {searchQuery.length === 0 && (
                <p className="text-center text-ht-text-3 text-xs py-6">
                  Search from 100+ Indian foods in English or Hindi
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Food info */}
            <div className="px-3 py-3 rounded-lg bg-ht-elevated border border-ht-border">
              <p className="text-sm font-semibold text-ht-text-1">{selectedFood.name}</p>
              {selectedFood.nameHi && <p className="text-xs text-ht-text-2 mt-0.5">{selectedFood.nameHi}</p>}
              <p className="text-xs text-ht-text-3 mt-1">
                {selectedFood.calories} kcal · {selectedFood.protein}g protein · per {selectedFood.unit}
              </p>
            </div>

            {/* Quantity + unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Quantity</label>
                <input
                  type="number"
                  className="input-field"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="0.1"
                  step="0.5"
                  autoFocus
                />
              </div>
              <div>
                <label className="field-label">Unit</label>
                <select className="input-field" value={unit} onChange={(e) => setUnit(e.target.value)}>
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            {/* Calorie preview */}
            <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-ht-elevated border border-ht-border">
              <p className="text-xs text-ht-text-3">Estimated calories</p>
              <p className="text-xl font-bold text-orange-400 tabular-nums">{estimatedKcal} kcal</p>
            </div>

            {addError && (
              <p className="text-xs text-ht-danger bg-ht-danger/10 px-3 py-2 rounded-lg">{addError}</p>
            )}

            <div className="flex gap-2">
              <button onClick={() => setSelectedFood(null)} className="btn-ghost flex-1">← Back</button>
              <button onClick={handleConfirmAdd} className="btn-primary flex-1" disabled={addingEntry}>
                {addingEntry ? 'Adding…' : 'Add to meal'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Barcode Modal */}
      <Modal isOpen={showBarcode} onClose={() => setShowBarcode(false)} title="Scan Barcode" size="lg">
        <BarcodeScanner onFound={handleBarcodeFound} onClose={() => setShowBarcode(false)} />
      </Modal>

      {/* Custom Food Modal */}
      <Modal isOpen={showCustomFood} onClose={() => setShowCustomFood(false)} title="Add Custom Food">
        <form onSubmit={handleCreateCustomFood} className="space-y-3">
          <div>
            <label className="field-label">Name (English)</label>
            <input type="text" className="input-field" placeholder="e.g. Paneer Bhurji" value={customForm.name} onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })} required autoFocus />
          </div>
          <div>
            <label className="field-label">Hindi name (optional)</label>
            <input type="text" className="input-field" placeholder="पनीर भुर्जी" value={customForm.nameHi} onChange={(e) => setCustomForm({ ...customForm, nameHi: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[['calories','Calories (kcal)',true],['protein','Protein (g)',false],['carbs','Carbs (g)',false],['fat','Fat (g)',false]].map(([k, label, req]) => (
              <div key={k}>
                <label className="field-label">{label}</label>
                <input type="number" className="input-field" placeholder="0" min="0" step="0.1" value={customForm[k]} onChange={(e) => setCustomForm({ ...customForm, [k]: e.target.value })} required={req} />
              </div>
            ))}
          </div>
          <div>
            <label className="field-label">Serving unit</label>
            <select className="input-field" value={customForm.unit} onChange={(e) => setCustomForm({ ...customForm, unit: e.target.value })}>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary w-full">Create food</button>
        </form>
      </Modal>
    </div>
  );
}
