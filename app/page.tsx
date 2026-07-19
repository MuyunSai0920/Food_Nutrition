"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type Nutrients = { carbs: number; protein: number; fat: number };
type Food = Nutrients & { id: string; name: string; category: string; aliases: string[] };
type MealItem = Food & { rowId: string; grams: number };
type DayRecord = { id: string; date: string; createdAt: string; items: MealItem[] };

const FOODS: Food[] = [
  { id: "apple", name: "Apple", category: "Fruit", aliases: ["apple"], carbs: 13.8, protein: 0.3, fat: 0.2 },
  { id: "banana", name: "Banana", category: "Fruit", aliases: ["banana"], carbs: 22, protein: 1.1, fat: 0.3 },
  { id: "rice", name: "Cooked Rice", category: "Grains", aliases: ["rice"], carbs: 25.9, protein: 2.6, fat: 0.3 },
  { id: "chicken", name: "Cooked Chicken Breast", category: "Protein", aliases: ["chicken", "chicken breast"], carbs: 0, protein: 31, fat: 3.6 },
  { id: "egg", name: "Egg", category: "Protein", aliases: ["egg"], carbs: 1.1, protein: 12.6, fat: 10.6 },
  { id: "salmon", name: "Salmon", category: "Seafood", aliases: ["salmon"], carbs: 0, protein: 20.4, fat: 13.4 },
  { id: "broccoli", name: "Broccoli", category: "Vegetables", aliases: ["broccoli"], carbs: 6.6, protein: 2.8, fat: 0.4 },
  { id: "tofu", name: "Firm Tofu", category: "Plant Protein", aliases: ["tofu"], carbs: 4.2, protein: 12.2, fat: 5.7 },
  { id: "avocado", name: "Avocado", category: "Fruit", aliases: ["avocado"], carbs: 8.5, protein: 2, fat: 14.7 },
  { id: "milk", name: "Milk", category: "Dairy", aliases: ["milk"], carbs: 4.8, protein: 3.2, fat: 3.6 },
];

const dbName = "shike-nutrition";
const storeName = "daily-records";
const round = (value: number) => Math.round(value * 10) / 10;
const kcal100 = (food: Nutrients) => round(food.carbs * 4 + food.protein * 4 + food.fat * 9);
const itemNutrients = (item: MealItem) => ({ carbs: round((item.carbs * item.grams) / 100), protein: round((item.protein * item.grams) / 100), fat: round((item.fat * item.grams) / 100) });
const calories = (value: Nutrients) => round(value.carbs * 4 + value.protein * 4 + value.fat * 9);
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
      <aside className="summary-card card"><p className="eyebrow">TODAY&apos;S TOTAL</p><div className="calorie-total"><strong>{calories(totals)}</strong><span>kcal</span></div><p className="summary-subtitle">{items.length} food {items.length === 1 ? "item" : "items"} logged</p><div className="macro-list"><Macro name="Carbs" value={totals.carbs} color="orange" /><Macro name="Protein" value={totals.protein} color="mint" /><Macro name="Fat" value={totals.fat} color="purple" /></div><button className="primary-button" onClick={saveToday}>Save today&apos;s log <span>→</span></button></aside>
      <section className="items-card card wide"><div className="section-head"><div><p className="eyebrow">STEP 02</p><h2>Confirm food & portions</h2></div><span className="hint">Values are editable</span></div>{items.length === 0 ? <div className="empty-state">Upload an image, or add food from the Food library.</div> : <div className="items-table"><div className="table-label"><span>Food</span><span>Weight</span><span>Carbs</span><span>Protein</span><span>Fat</span><span>Calories</span><span /></div>{items.map((item) => { const n = itemNutrients(item); return <div className="food-row" key={item.rowId}><div><strong>{item.name}</strong><small>{item.category}</small></div><label><input aria-label={`${item.name} weight`} type="number" min="0" value={item.grams} onChange={(e) => updateItem(item.rowId, { grams: Math.max(0, Number(e.target.value)) })}/><span>g</span></label><span>{n.carbs}g</span><span>{n.protein}g</span><span>{n.fat}g</span><strong>{calories(n)}<small> kcal</small></strong><button className="delete" onClick={() => setItems((current) => current.filter((row) => row.rowId !== item.rowId))} aria-label={`Remove ${item.name}`}>×</button></div>; })}</div>}</section>
    </section>}
    {tab === "history" && <section className="card history-card"><div className="section-head"><div><p className="eyebrow">YOUR TIMELINE</p><h2>Meal history</h2></div><span className="hint">Saved in this browser</span></div>{records.length === 0 ? <div className="empty-state tall">No saved meals yet. Save a meal to see it here.</div> : <div className="record-list">{records.map((record) => { const total = record.items.reduce((sum, item) => { const n = itemNutrients(item); return { carbs: sum.carbs + n.carbs, protein: sum.protein + n.protein, fat: sum.fat + n.fat }; }, { carbs: 0, protein: 0, fat: 0 }); return <article className="record" key={record.id}><div className="record-date"><strong>{record.date}</strong><span>{record.items.map((item) => item.name).join(", ")}</span></div><div className="record-macros"><span>Carbs {round(total.carbs)}g</span><span>Protein {round(total.protein)}g</span><span>Fat {round(total.fat)}g</span></div><strong className="record-kcal">{calories(total)} <small>kcal</small></strong></article>; })}</div>}</section>}
    {tab === "foods" && <section className="card food-library"><div className="section-head"><div><p className="eyebrow">NUTRITION DATABASE</p><h2>Food library</h2></div><label className="search"><span>⌕</span><input placeholder="Search food, e.g. chicken" value={search} onChange={(e) => setSearch(e.target.value)} /></label></div><p className="library-note">Values are approximate per 100 g of edible food. They vary by brand, cut, and cooking method.</p><div className="food-grid">{filteredFoods.map((food) => <article className="food-tile" key={food.id}><div><span>{food.category}</span><h3>{food.name}</h3></div><strong>{kcal100(food)} <small>kcal</small></strong><div className="tile-macros"><span>Carbs {food.carbs}g</span><span>Protein {food.protein}g</span><span>Fat {food.fat}g</span></div><button onClick={() => addFood(food)}>Add to meal +</button></article>)}</div></section>}
  </main>;
}
function Macro({ name, value, color }: { name: string; value: number; color: string }) { return <div className="macro"><div><span className={`dot ${color}`} /><span>{name}</span></div><strong>{round(value)}<small>g</small></strong></div>; }
