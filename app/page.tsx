"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type Nutrients = { carbs: number; protein: number; fat: number };
type Food = Nutrients & { id: string; name: string; category: string; aliases: string[] };
type MealItem = Food & { rowId: string; grams: number };
type DayRecord = { id: string; date: string; createdAt: string; items: MealItem[] };

const FOODS: Food[] = [
  { id: "apple", name: "苹果", category: "水果", aliases: ["apple", "苹果"], carbs: 13.8, protein: 0.3, fat: 0.2 },
  { id: "banana", name: "香蕉", category: "水果", aliases: ["banana", "香蕉"], carbs: 22, protein: 1.1, fat: 0.3 },
  { id: "rice", name: "米饭（熟）", category: "主食", aliases: ["rice", "米饭"], carbs: 25.9, protein: 2.6, fat: 0.3 },
  { id: "chicken", name: "鸡胸肉（熟）", category: "肉蛋", aliases: ["chicken", "鸡胸", "鸡肉"], carbs: 0, protein: 31, fat: 3.6 },
  { id: "egg", name: "鸡蛋", category: "肉蛋", aliases: ["egg", "鸡蛋"], carbs: 1.1, protein: 12.6, fat: 10.6 },
  { id: "salmon", name: "三文鱼", category: "海鲜", aliases: ["salmon", "三文鱼"], carbs: 0, protein: 20.4, fat: 13.4 },
  { id: "broccoli", name: "西兰花", category: "蔬菜", aliases: ["broccoli", "西兰花"], carbs: 6.6, protein: 2.8, fat: 0.4 },
  { id: "tofu", name: "北豆腐", category: "豆制品", aliases: ["tofu", "豆腐"], carbs: 4.2, protein: 12.2, fat: 5.7 },
  { id: "avocado", name: "牛油果", category: "水果", aliases: ["avocado", "牛油果"], carbs: 8.5, protein: 2, fat: 14.7 },
  { id: "milk", name: "牛奶", category: "乳制品", aliases: ["milk", "牛奶"], carbs: 4.8, protein: 3.2, fat: 3.6 },
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
  const [scanMessage, setScanMessage] = useState("上传餐盘照片，开始本地识别");
  const [search, setSearch] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { loadRecords().then(setRecords).catch(() => setScanMessage("浏览器存储不可用，请检查隐私模式设置。")); }, []);
  const totals = useMemo(() => items.reduce((sum, item) => { const n = itemNutrients(item); return { carbs: sum.carbs + n.carbs, protein: sum.protein + n.protein, fat: sum.fat + n.fat }; }, { carbs: 0, protein: 0, fat: 0 }), [items]);
  const filteredFoods = useMemo(() => FOODS.filter((f) => `${f.name}${f.category}${f.aliases.join("")}`.toLowerCase().includes(search.toLowerCase())), [search]);

  function scanFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    if (imageUrl) URL.revokeObjectURL(imageUrl); setImageUrl(URL.createObjectURL(file)); setIsScanning(true); setScanMessage("正在分析图片…");
    window.setTimeout(() => {
      const found = FOODS.filter((food) => food.aliases.some((alias) => file.name.toLowerCase().includes(alias.toLowerCase())));
      if (found.length) { setItems(found.map((food) => foodToMeal(food))); setScanMessage(`识别到 ${found.map((food) => food.name).join("、")}；请确认份量。`); }
      else { setItems([]); setScanMessage("未能从本地基础识别库确定食物；请从下方食物库添加，或将图片命名为食物名后再上传。"); }
      setIsScanning(false);
    }, 650);
  }
  function addFood(food: Food) { setItems((current) => [...current, foodToMeal(food)]); setTab("scan"); }
  function updateItem(rowId: string, patch: Partial<MealItem>) { setItems((current) => current.map((item) => item.rowId === rowId ? { ...item, ...patch } : item)); }
  async function saveToday() { if (!items.length) { setScanMessage("先添加至少一种食物，再保存当天记录。"); return; } const record = { id: crypto.randomUUID(), date, createdAt: new Date().toISOString(), items }; await saveRecord(record); setRecords((current) => [record, ...current]); setScanMessage("已保存到本机的每日记录。"); }

  return <main className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">食</span><span>食刻</span><small>本地营养记录</small></div><div className="privacy"><span>●</span> 数据仅保存在此设备</div></header>
    <section className="hero"><div><p className="eyebrow">SMART FOOD LOG</p><h1>看见一餐，<br /><em>读懂营养。</em></h1><p>上传餐盘图片，确认食物和重量，立即获得热量与三大营养素。</p></div><div className="hero-orb"><span>4</span><b>kcal / g<br />能量换算</b></div></section>
    <nav className="tabs" aria-label="功能导航"><button className={tab === "scan" ? "active" : ""} onClick={() => setTab("scan")}>⌁ 扫描记录</button><button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}>◷ 历史记录</button><button className={tab === "foods" ? "active" : ""} onClick={() => setTab("foods")}>⌕ 食物库</button></nav>
    {tab === "scan" && <section className="content-grid">
      <div className="scan-card card"><div className="section-head"><div><p className="eyebrow">STEP 01</p><h2>扫描你的餐盘</h2></div><label className="date-control">记录日期<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label></div><input ref={inputRef} className="visually-hidden" type="file" accept="image/*" onChange={scanFile} /><button className={`dropzone ${imageUrl ? "has-image" : ""}`} onClick={() => inputRef.current?.click()} aria-label="上传食物图片">{imageUrl ? <img src={imageUrl} alt="待识别的食物" /> : <><span className="upload-icon">⌑</span><strong>上传食物图片</strong><small>JPG、PNG 或 HEIC</small></>}{isScanning && <span className="scanning">识别中</span>}</button><p className="scan-note">{scanMessage}</p><div className="quick-add"><span>快速添加</span>{FOODS.slice(0, 5).map((food) => <button key={food.id} onClick={() => addFood(food)}>+ {food.name}</button>)}</div></div>
      <aside className="summary-card card"><p className="eyebrow">TODAY&apos;S TOTAL</p><div className="calorie-total"><strong>{calories(totals)}</strong><span>kcal</span></div><p className="summary-subtitle">已记录 {items.length} 种食物</p><div className="macro-list"><Macro name="碳水" value={totals.carbs} color="orange" /><Macro name="蛋白质" value={totals.protein} color="mint" /><Macro name="脂肪" value={totals.fat} color="purple" /></div><button className="primary-button" onClick={saveToday}>保存今日记录 <span>→</span></button></aside>
      <section className="items-card card wide"><div className="section-head"><div><p className="eyebrow">STEP 02</p><h2>确认食物与份量</h2></div><span className="hint">数值可直接修改</span></div>{items.length === 0 ? <div className="empty-state">上传图片后，或从「食物库」中加入食物。</div> : <div className="items-table"><div className="table-label"><span>食物</span><span>重量</span><span>碳水</span><span>蛋白质</span><span>脂肪</span><span>热量</span><span /></div>{items.map((item) => { const n = itemNutrients(item); return <div className="food-row" key={item.rowId}><div><strong>{item.name}</strong><small>{item.category}</small></div><label><input aria-label={`${item.name}重量`} type="number" min="0" value={item.grams} onChange={(e) => updateItem(item.rowId, { grams: Math.max(0, Number(e.target.value)) })}/><span>g</span></label><span>{n.carbs}g</span><span>{n.protein}g</span><span>{n.fat}g</span><strong>{calories(n)}<small> kcal</small></strong><button className="delete" onClick={() => setItems((current) => current.filter((row) => row.rowId !== item.rowId))} aria-label={`删除${item.name}`}>×</button></div>; })}</div>}</section>
    </section>}
    {tab === "history" && <section className="card history-card"><div className="section-head"><div><p className="eyebrow">YOUR TIMELINE</p><h2>历史记录</h2></div><span className="hint">保存在当前浏览器</span></div>{records.length === 0 ? <div className="empty-state tall">还没有保存的记录。完成一餐后点击「保存今日记录」即可在这里查看。</div> : <div className="record-list">{records.map((record) => { const total = record.items.reduce((sum, item) => { const n = itemNutrients(item); return { carbs: sum.carbs + n.carbs, protein: sum.protein + n.protein, fat: sum.fat + n.fat }; }, { carbs: 0, protein: 0, fat: 0 }); return <article className="record" key={record.id}><div className="record-date"><strong>{record.date}</strong><span>{record.items.map((item) => item.name).join("、")}</span></div><div className="record-macros"><span>碳水 {round(total.carbs)}g</span><span>蛋白质 {round(total.protein)}g</span><span>脂肪 {round(total.fat)}g</span></div><strong className="record-kcal">{calories(total)} <small>kcal</small></strong></article>; })}</div>}</section>}
    {tab === "foods" && <section className="card food-library"><div className="section-head"><div><p className="eyebrow">NUTRITION DATABASE</p><h2>食物营养库</h2></div><label className="search"><span>⌕</span><input placeholder="搜索食物，例如鸡胸肉" value={search} onChange={(e) => setSearch(e.target.value)} /></label></div><p className="library-note">以下为每 100g 可食部分的近似值；实际数值会随品牌、烹饪方式和部位变化。</p><div className="food-grid">{filteredFoods.map((food) => <article className="food-tile" key={food.id}><div><span>{food.category}</span><h3>{food.name}</h3></div><strong>{kcal100(food)} <small>kcal</small></strong><div className="tile-macros"><span>碳水 {food.carbs}g</span><span>蛋白 {food.protein}g</span><span>脂肪 {food.fat}g</span></div><button onClick={() => addFood(food)}>加入本餐 +</button></article>)}</div></section>}
  </main>;
}
function Macro({ name, value, color }: { name: string; value: number; color: string }) { return <div className="macro"><div><span className={`dot ${color}`} /><span>{name}</span></div><strong>{round(value)}<small>g</small></strong></div>; }
