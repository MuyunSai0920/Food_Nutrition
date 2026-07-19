"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type Nutrients = { carbs: number; protein: number; fat: number };
type Food = Nutrients & { id: string; name: string; category: string; aliases: string[]; fdcId: number; fdcDescription: string; kcal: number };
type MealItem = Food & { rowId: string; grams: number };
type DayRecord = { id: string; date: string; createdAt: string; items: MealItem[] };

const FOODS: Food[] = [
  { id: "apple", name: "Apple, Raw, With Skin", category: "Fruit", aliases: ["apple"], fdcId: 171688, fdcDescription: "Apples, raw, with skin", carbs: 13.8, protein: 0.26, fat: 0.17, kcal: 52 },
  { id: "banana", name: "Banana, Raw", category: "Fruit", aliases: ["banana"], fdcId: 173944, fdcDescription: "Bananas, raw", carbs: 22.8, protein: 1.09, fat: 0.33, kcal: 89 },
  { id: "rice", name: "White Rice, Cooked", category: "Grains", aliases: ["rice"], fdcId: 169757, fdcDescription: "Rice, white, long-grain, regular, unenriched, cooked without salt", carbs: 28.2, protein: 2.69, fat: 0.28, kcal: 130 },
  { id: "chicken", name: "Chicken Breast, Roasted", category: "Protein", aliases: ["chicken", "chicken breast"], fdcId: 171477, fdcDescription: "Chicken, broilers or fryers, breast, meat only, cooked, roasted", carbs: 0, protein: 31, fat: 3.57, kcal: 165 },
  { id: "egg", name: "Egg, Hard-Boiled", category: "Protein", aliases: ["egg"], fdcId: 173424, fdcDescription: "Egg, whole, cooked, hard-boiled", carbs: 1.12, protein: 12.6, fat: 10.6, kcal: 155 },
  { id: "salmon", name: "Atlantic Salmon, Farmed, Raw", category: "Seafood", aliases: ["salmon"], fdcId: 175167, fdcDescription: "Fish, salmon, Atlantic, farmed, raw", carbs: 0, protein: 20.4, fat: 13.4, kcal: 208 },
  { id: "broccoli", name: "Broccoli, Raw", category: "Vegetables", aliases: ["broccoli"], fdcId: 170379, fdcDescription: "Broccoli, raw", carbs: 6.64, protein: 2.82, fat: 0.37, kcal: 34 },
  { id: "tofu", name: "Firm Tofu", category: "Plant Protein", aliases: ["tofu"], fdcId: 172475, fdcDescription: "Tofu, raw, firm, prepared with calcium sulfate", carbs: 2.78, protein: 17.3, fat: 8.72, kcal: 144 },
  { id: "avocado", name: "Avocado, Raw, California", category: "Fruit", aliases: ["avocado"], fdcId: 171706, fdcDescription: "Avocados, raw, California", carbs: 8.64, protein: 1.96, fat: 15.4, kcal: 167 },
  { id: "milk", name: "Whole Milk, 3.25% Fat", category: "Dairy", aliases: ["milk"], fdcId: 171265, fdcDescription: "Milk, whole, 3.25% milkfat, with added vitamin D", carbs: 4.8, protein: 3.15, fat: 3.25, kcal: 61 },
];

const dbName = "shike-nutrition";
const storeName = "daily-records";
const round = (value: number) => Math.round(value * 10) / 10;
const energyPer100 = (food: Nutrients & { kcal?: number }) => food.kcal ?? round(food.carbs * 4 + food.protein * 4 + food.fat * 9);
const itemNutrients = (item: MealItem) => ({ carbs: round((item.carbs * item.grams) / 100), protein: round((item.protein * item.grams) / 100), fat: round((item.fat * item.grams) / 100) });
const itemEnergy = (item: MealItem) => round((energyPer100(item) * item.grams) / 100);
const today = () => new Date().toLocaleDateString("en-CA");

async function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function loadRecords() {
  const db = await openDb();
  return new Promise<DayRecord[]>((resolve, reject) => {
    const request = db.transaction(storeName, "readonly").objectStore(storeName).getAll();
    request.onsuccess = () => resolve((request.result as DayRecord[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    request.onerror = () => reject(request.error);
  });
}
async function saveRecord(record: DayRecord) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const request = db.transaction(storeName, "readwrite").objectStore(storeName).put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
function foodToMeal(food: Food, grams = 100): MealItem { return { ...food, grams, rowId: `${food.id}-${crypto.randomUUID()}` }; }

export default function Home() {
  const [tab, setTab] = useState<"scan" | "history" | "foods">("scan");
  const [date, setDate] = useState(today());
  const [items, setItems] = useState<MealItem[]>([]);
  const [records, setRecords] = useState<DayRecord[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [scanMessage, setScanMessage] = useState("Upload a meal photo to start local recognition.");
  const [search, setSearch] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { loadRecords().then(setRecords).catch(() => setScanMessage("Browser storage is unavailable. Please check private-browsing settings.")); }, []);
  const totals = useMemo(() => items.reduce((sum, item) => { const n = itemNutrients(item); return { carbs: sum.carbs + n.carbs, protein: sum.protein + n.protein, fat: sum.fat + n.fat }; }, { carbs: 0, protein: 0, fat: 0 }), [items]);
  const totalEnergy = useMemo(() => round(items.reduce((sum, item) => sum + itemEnergy(item), 0)), [items]);
  const filteredFoods = useMemo(() => FOODS.filter((f) => `${f.name}${f.category}${f.aliases.join("")}`.toLowerCase().includes(search.toLowerCase())), [search]);

  function scanFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    if (imageUrl) URL.revokeObjectURL(imageUrl); setImageUrl(URL.createObjectURL(file)); setIsScanning(true); setScanMessage("Analyzing image…");
    window.setTimeout(() => {
      const found = FOODS.filter((food) => food.aliases.some((alias) => file.name.toLowerCase().includes(alias.toLowerCase())));
      if (found.length) { setItems(found.map((food) => foodToMeal(food))); setScanMessage(`Found ${found.map((food) => food.name).join(", ")}. Please confirm the portions.`); }
      else { setItems([]); setScanMessage("The local food library could not identify this image. Add food below, or rename the image with an English food name and upload it again."); }
      setIsScanning(false);
    }, 650);
  }
  function addFood(food: Food) { setItems((current) => [...current, foodToMeal(food)]); setTab("scan"); }
  function updateItem(rowId: string, patch: Partial<MealItem>) { setItems((current) => current.map((item) => item.rowId === rowId ? { ...item, ...patch } : item)); }
  async function saveToday() { if (!items.length) { setScanMessage("Add at least one food before saving this day."); return; } const record = { id: crypto.randomUUID(), date, createdAt: new Date().toISOString(), items }; await saveRecord(record); setRecords((current) => [record, ...current]); setScanMessage("Saved to this device."); }

  return <main className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">B</span><span>BiteLog</span><small>Local nutrition tracker</small></div><div className="privacy"><span>●</span> Data stays on this device</div></header>
    <section className="hero"><div><p className="eyebrow">SMART FOOD LOG</p><h1>See your meal.<br /><em>Know your nutrition.</em></h1><p>Upload a meal photo, confirm food and portions, and get calories with your three key macros.</p></div><div className="hero-orb"><span>4</span><b>kcal / g<br />energy formula</b></div></section>
    <nav className="tabs" aria-label="App navigation"><button className={tab === "scan" ? "active" : ""} onClick={() => setTab("scan")}>⌁ Scan & log</button><button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}>◷ History</button><button className={tab === "foods" ? "active" : ""} onClick={() => setTab("foods")}>⌕ Food library</button></nav>
    {tab === "scan" && <section className="content-grid">
      <div className="scan-card card"><div className="section-head"><div><p className="eyebrow">STEP 01</p><h2>Scan your meal</h2></div><label className="date-control">Log date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label></div><input ref={inputRef} className="visually-hidden" type="file" accept="image/*" onChange={scanFile} /><button className={`dropzone ${imageUrl ? "has-image" : ""}`} onClick={() => inputRef.current?.click()} aria-label="Upload a food image">{imageUrl ? <img src={imageUrl} alt="Food to identify" /> : <><span className="upload-icon">⌑</span><strong>Upload a food image</strong><small>JPG, PNG, or HEIC</small></>}{isScanning && <span className="scanning">Scanning</span>}</button><p className="scan-note">{scanMessage}</p><div className="quick-add"><span>Quick add</span>{FOODS.slice(0, 5).map((food) => <button key={food.id} onClick={() => addFood(food)}>+ {food.name}</button>)}</div></div>
      <aside className="summary-card card"><p className="eyebrow">TODAY&apos;S TOTAL</p><div className="calorie-total"><strong>{totalEnergy}</strong><span>kcal</span></div><p className="summary-subtitle">{items.length} food {items.length === 1 ? "item" : "items"} logged</p><div className="macro-list"><Macro name="Carbs" value={totals.carbs} color="orange" /><Macro name="Protein" value={totals.protein} color="mint" /><Macro name="Fat" value={totals.fat} color="purple" /></div><button className="primary-button" onClick={saveToday}>Save today&apos;s log <span>→</span></button></aside>
      <section className="items-card card wide"><div className="section-head"><div><p className="eyebrow">STEP 02</p><h2>Confirm food & portions</h2></div><span className="hint">Values are editable</span></div>{items.length === 0 ? <div className="empty-state">Upload an image, or add food from the Food library.</div> : <div className="items-table"><div className="table-label"><span>Food</span><span>Weight</span><span>Carbs</span><span>Protein</span><span>Fat</span><span>Calories</span><span /></div>{items.map((item) => { const n = itemNutrients(item); return <div className="food-row" key={item.rowId}><div><strong>{item.name}</strong><small>{item.category}</small></div><label><input aria-label={`${item.name} weight`} type="number" min="0" value={item.grams} onChange={(e) => updateItem(item.rowId, { grams: Math.max(0, Number(e.target.value)) })}/><span>g</span></label><span>{n.carbs}g</span><span>{n.protein}g</span><span>{n.fat}g</span><strong>{itemEnergy(item)}<small> kcal</small></strong><button className="delete" onClick={() => setItems((current) => current.filter((row) => row.rowId !== item.rowId))} aria-label={`Remove ${item.name}`}>×</button></div>; })}</div>}</section>
    </section>}
    {tab === "history" && <section className="card history-card"><div className="section-head"><div><p className="eyebrow">YOUR TIMELINE</p><h2>Meal history</h2></div><span className="hint">Saved in this browser</span></div>{records.length === 0 ? <div className="empty-state tall">No saved meals yet. Save a meal to see it here.</div> : <div className="record-list">{records.map((record) => { const total = record.items.reduce((sum, item) => { const n = itemNutrients(item); return { carbs: sum.carbs + n.carbs, protein: sum.protein + n.protein, fat: sum.fat + n.fat }; }, { carbs: 0, protein: 0, fat: 0 }); const recordEnergy = round(record.items.reduce((sum, item) => sum + itemEnergy(item), 0)); return <article className="record" key={record.id}><div className="record-date"><strong>{record.date}</strong><span>{record.items.map((item) => item.name).join(", ")}</span></div><div className="record-macros"><span>Carbs {round(total.carbs)}g</span><span>Protein {round(total.protein)}g</span><span>Fat {round(total.fat)}g</span></div><strong className="record-kcal">{recordEnergy} <small>kcal</small></strong></article>; })}</div>}</section>}
    {tab === "foods" && <section className="card food-library"><div className="section-head"><div><p className="eyebrow">USDA FOODDATA CENTRAL</p><h2>Food library</h2></div><label className="search"><span>⌕</span><input placeholder="Search food, e.g. chicken" value={search} onChange={(e) => setSearch(e.target.value)} /></label></div><p className="library-note">Values are USDA FoodData Central SR Legacy data per 100 g of edible food. Use the FDC link on each entry to inspect its official record.</p><div className="food-grid">{filteredFoods.map((food) => <article className="food-tile" key={food.id}><div><span>{food.category}</span><h3>{food.name}</h3></div><strong>{energyPer100(food)} <small>kcal</small></strong><div className="tile-macros"><span>Carbs {food.carbs}g</span><span>Protein {food.protein}g</span><span>Fat {food.fat}g</span></div><a className="food-source" href={`https://fdc.nal.usda.gov/fdc-app.html#/food/${food.fdcId}/nutrients`} target="_blank" rel="noreferrer">USDA FDC ID {food.fdcId}</a><button onClick={() => addFood(food)}>Add to meal +</button></article>)}</div></section>}
  </main>;
}
function Macro({ name, value, color }: { name: string; value: number; color: string }) { return <div className="macro"><div><span className={`dot ${color}`} /><span>{name}</span></div><strong>{round(value)}<small>g</small></strong></div>; }
