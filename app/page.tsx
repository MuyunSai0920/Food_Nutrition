"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type Nutrients = { carbs: number; protein: number; fat: number };
type UnitPortion = { label: string; grams: number };
type Food = Nutrients & { id: string; name: string; category: string; aliases: string[]; fdcId: number; kcal: number; portion?: UnitPortion };
type MealItem = Food & { rowId: string; grams: number };
type DayRecord = { id: string; date: string; createdAt: string; items: MealItem[] };
type VisionDetection = { foodName: string; grams: number };

const FOOD_ROWS = `
Fruit|apple|Apple, Raw, With Skin|apple|171688|13.8|0.26|0.17|52
Fruit|banana|Banana, Raw|banana|173944|22.8|1.09|0.33|89
Fruit|orange|Orange, Raw|orange|169097|11.8|0.94|0.12|47
Fruit|grapes|Grapes, Red or Green, Raw|grape,grapes|174683|18.1|0.72|0.16|69
Fruit|strawberry|Strawberries, Raw|strawberry,strawberries|167762|7.68|0.67|0.3|32
Fruit|blueberry|Blueberries, Raw|blueberry,blueberries|171711|14.5|0.74|0.33|57
Fruit|raspberry|Raspberries, Raw|raspberry,raspberries|167755|11.9|1.2|0.65|52
Fruit|blackberry|Blackberries, Raw|blackberry,blackberries|173946|9.61|1.39|0.49|43
Fruit|pineapple|Pineapple, Raw|pineapple|169124|13.1|0.54|0.12|50
Fruit|mango|Mango, Raw|mango|169910|15|0.82|0.38|60
Fruit|papaya|Papaya, Raw|papaya|169926|10.8|0.47|0.26|43
Fruit|watermelon|Watermelon, Raw|watermelon|167765|7.55|0.61|0.15|30
Fruit|cantaloupe|Cantaloupe, Raw|cantaloupe|169092|8.16|0.84|0.19|34
Fruit|peach|Peach, Yellow, Raw|peach,peaches|169928|9.54|0.91|0.25|39
Fruit|pear|Pear, Bartlett, Raw|pear,pears|167776|15|0.39|0.16|63
Fruit|kiwi|Kiwifruit, Green, Raw|kiwi,kiwifruit|168153|14.7|1.14|0.52|61
Fruit|cherry|Cherries, Sweet, Raw|cherry,cherries|171719|16|1.06|0.2|63
Fruit|plum|Plums, Raw|plum,plums|169949|11.4|0.7|0.28|46
Fruit|grapefruit|Grapefruit, Raw|grapefruit|173033|8.08|0.63|0.1|32
Fruit|lemon|Lemon, Raw|lemon,lemons|167746|9.32|1.1|0.3|29
Fruit|avocado|Avocado, Raw, California|avocado|171706|8.64|1.96|15.4|167
Vegetables|broccoli|Broccoli, Raw|broccoli|170379|6.64|2.82|0.37|34
Vegetables|carrot|Carrots, Raw|carrot,carrots|170393|9.58|0.93|0.24|41
Vegetables|spinach|Spinach, Raw|spinach|168462|3.63|2.86|0.39|23
Vegetables|kale|Kale, Raw|kale|168421|4.42|2.92|1.49|35
Vegetables|romaine|Romaine Lettuce, Raw|romaine,lettuce|169247|3.29|1.23|0.3|17
Vegetables|tomato|Tomatoes, Red, Ripe, Raw|tomato,tomatoes|170457|3.89|0.88|0.2|18
Vegetables|cucumber|Cucumber, With Peel, Raw|cucumber|168409|3.63|0.65|0.11|15
Vegetables|red-pepper|Red Bell Pepper, Raw|pepper,red pepper,bell pepper|170108|6.03|0.99|0.3|26
Vegetables|onion|Onions, Raw|onion,onions|170000|9.34|1.1|0.1|40
Vegetables|garlic|Garlic, Raw|garlic|169230|33.1|6.36|0.5|149
Vegetables|cauliflower|Cauliflower, Raw|cauliflower|169986|4.97|1.92|0.28|25
Vegetables|zucchini|Zucchini, Raw|zucchini|169291|3.11|1.21|0.32|17
Vegetables|asparagus|Asparagus, Raw|asparagus|168389|3.88|2.2|0.12|20
Vegetables|mushroom|White Mushrooms, Raw|mushroom,mushrooms|169251|3.26|3.09|0.34|22
Vegetables|green-beans|Green Beans, Raw|green bean,green beans|169961|6.97|1.83|0.22|31
Vegetables|corn|Sweet Yellow Corn, Raw|corn|169998|18.7|3.27|1.35|86
Vegetables|green-peas|Green Peas, Raw|pea,peas,green peas|170419|14.4|5.42|0.4|81
Vegetables|sweet-potato|Sweet Potato, Raw|sweet potato,sweet potatoes|168482|20.1|1.57|0.05|86
Vegetables|potato|Potato, Raw|potato,potatoes|170026|17.5|2.05|0.09|77
Vegetables|cabbage|Cabbage, Raw|cabbage|169975|5.8|1.28|0.1|25
Vegetables|celery|Celery, Raw|celery|169988|2.97|0.69|0.17|14
Vegetables|celtuce|Celtuce, Raw|celtuce,stem lettuce|169990|3.65|0.85|0.3|18
Vegetables|beet|Beets, Raw|beet,beets|169145|9.56|1.61|0.17|43
Vegetables|brussels-sprouts|Brussels Sprouts, Raw|brussels sprouts|170383|8.95|3.38|0.3|43
Vegetables|eggplant|Eggplant, Raw|eggplant|169228|5.88|0.98|0.18|25
Vegetables|pumpkin|Pumpkin, Raw|pumpkin|168448|6.5|1|0.1|26
Vegetables|turnip|Turnips, Raw|turnip,turnips|170465|6.43|0.9|0.1|28
Vegetables|radish|Radishes, Raw|radish,radishes|169276|3.4|0.68|0.1|16
Vegetables|collards|Collards, Raw|collard,collards|170406|5.42|3.02|0.61|32
Vegetables|bok-choy|Bok Choy, Raw|bok choy,pak choi,chinese cabbage|170390|2.18|1.5|0.2|13
Vegetables|napa-cabbage|Napa Cabbage, Raw|napa cabbage,pe-tsai,chinese cabbage|169979|3.23|1.2|0.2|16
Vegetables|shiitake|Shiitake Mushrooms, Raw|shiitake,shiitake mushroom|169242|6.79|2.24|0.49|34
Vegetables|bamboo-shoots|Bamboo Shoots, Raw|bamboo shoot,bamboo shoots|169210|5.2|2.6|0.3|27
Vegetables|wakame|Wakame Seaweed, Raw|wakame,seaweed|170496|9.14|3.03|0.64|45
Grains & Starches|white-rice|White Rice, Cooked|rice,white rice|169757|28.2|2.69|0.28|130
Grains & Starches|brown-rice|Brown Rice, Cooked|brown rice|169704|25.6|2.74|0.97|123
Grains & Starches|oats|Oatmeal, Cooked With Water|oats,oatmeal|173905|12|2.54|1.52|71
Grains & Starches|quinoa|Quinoa, Cooked|quinoa|168917|21.3|4.4|1.92|120
Grains & Starches|pasta|Pasta, Cooked|pasta|168928|30.9|5.8|0.93|158
Grains & Starches|whole-wheat-pasta|Whole-Wheat Pasta, Cooked|whole wheat pasta|168910|30.1|5.99|1.71|149
Grains & Starches|egg-noodles|Egg Noodles, Cooked|egg noodles,noodles|168919|25.2|4.54|2.07|138
Grains & Starches|rice-noodles|Rice Noodles, Cooked|rice noodles|168914|24|1.79|0.2|108
Grains & Starches|mung-bean-noodles|Mung-Bean Cellophane Noodles, Dry|glass noodles,cellophane noodles,mung bean noodles,long rice|174258|86.1|0.16|0.06|351
Grains & Starches|white-bread|White Bread|white bread,bread|174924|49.4|8.85|3.33|266
Grains & Starches|whole-wheat-bread|Whole-Wheat Bread|whole wheat bread,bread|172688|42.7|12.4|3.5|252
Grains & Starches|rye-bread|Rye Bread|rye bread|172684|48.3|8.5|3.3|259
Grains & Starches|bagel|Plain Bagel|bagel|174899|52.4|10.6|1.32|264
Grains & Starches|barley|Pearled Barley, Cooked|barley|170285|28.2|2.26|0.44|123
Grains & Starches|couscous|Couscous, Cooked|couscous|169700|23.2|3.79|0.16|112
Grains & Starches|buckwheat|Buckwheat Groats, Cooked|buckwheat|170686|19.9|3.38|0.62|92
Grains & Starches|corn-tortilla|Corn Tortilla|corn tortilla,tortilla|175036|44.6|5.7|2.85|218
Grains & Starches|baked-sweet-potato|Sweet Potato, Baked|baked sweet potato|168483|20.7|2.01|0.15|90
Grains & Starches|chow-mein-noodles|Chinese Chow Mein Noodles|chow mein,chinese noodles|168905|63.6|10.9|21.2|471
Meat & Poultry|chicken-breast|Chicken Breast, Roasted|chicken,chicken breast|171477|0|31|3.57|165
Meat & Poultry|raw-chicken-breast|Chicken Breast, Raw|raw chicken,chicken breast|171077|0|22.5|2.62|120
Meat & Poultry|chicken-thigh|Chicken Thigh, Roasted|chicken thigh|172388|0|24.8|8.15|179
Meat & Poultry|turkey-breast|Turkey Breast, Roasted|turkey,turkey breast|171492|0|28.7|7.41|189
Meat & Poultry|lean-ground-beef|Lean Ground Beef, Cooked|ground beef,beef|171793|0|25.2|10.7|204
Meat & Poultry|beef-steak|Beef Steak, Grilled|beef steak,steak|168632|0|29.5|8.41|202
Meat & Poultry|raw-beef-steak|Beef Flank Steak, Raw, Lean|raw beef,beef steak|168609|0|21.7|6.29|149
Meat & Poultry|pork-loin|Pork Loin, Broiled|pork loin,pork|168368|0|27.6|4.41|158
Meat & Poultry|pork-belly|Pork Belly, Raw|pork belly|167812|0|9.34|53|518
Meat & Poultry|ground-pork|Ground Pork, Cooked|ground pork,pork|168374|0|27.1|21.4|301
Meat & Poultry|lamb|Lamb, Cooked|lamb|172480|0|24.5|20.9|294
Meat & Poultry|ham|Sliced Ham|ham|173864|3.63|16.6|8.8|164
Meat & Poultry|bacon|Bacon, Cooked|bacon|167914|1.35|35.7|43.3|548
Meat & Poultry|duck|Duck, Roasted|duck|172411|0|23.5|11.2|201
Dairy & Eggs|egg|Egg, Hard-Boiled|egg,eggs|173424|1.12|12.6|10.6|155
Seafood|farm-salmon|Atlantic Salmon, Farmed, Raw|salmon|175167|0|20.4|13.4|208
Seafood|wild-salmon|Atlantic Salmon, Wild, Cooked|wild salmon,salmon|171998|0|25.4|8.13|182
Seafood|tuna|Light Tuna, Canned In Water|tuna|171986|0|25.5|0.82|116
Seafood|cod|Pacific Cod, Cooked|cod|171990|0|18.7|0.5|85
Seafood|raw-shrimp|Shrimp, Raw|raw shrimp,shrimp,prawn|175179|0|20.1|0.51|85
Seafood|shrimp|Shrimp, Cooked|shrimp,prawn|175180|0.2|24|0.28|99
Seafood|crab|Blue Crab, Cooked|crab|174205|0|17.9|0.74|83
Seafood|scallops|Scallops, Steamed|scallop,scallops|167742|5.41|20.5|0.84|111
Seafood|tilapia|Tilapia, Cooked|tilapia|175177|0|26.2|2.65|128
Seafood|sardines|Sardines, Canned In Oil|sardine,sardines|175139|0|24.6|11.4|208
Seafood|trout|Rainbow Trout, Cooked|trout|173718|0|23.8|7.38|168
Seafood|mussels|Blue Mussels, Cooked|mussel,mussels|174217|7.39|23.8|4.48|172
Seafood|oysters|Eastern Oysters, Cooked|oyster,oysters|171980|5.45|11.4|3.42|102
Plant Protein|tofu-firm|Firm Tofu|tofu,firm tofu|172475|2.78|17.3|8.72|144
Plant Protein|tofu-regular|Regular Tofu|tofu,regular tofu|172476|1.87|8.08|4.78|76
Plant Protein|lentils|Lentils, Cooked|lentils,lentil|172421|20.1|9.02|0.38|116
Plant Protein|chickpeas|Chickpeas, Cooked|chickpea,chickpeas,garbanzo|173757|27.4|8.86|2.59|164
Plant Protein|black-beans|Black Beans, Cooked|black bean,black beans|173735|23.7|8.86|0.54|132
Plant Protein|pinto-beans|Pinto Beans, Cooked|pinto bean,pinto beans|175200|26.2|9.01|0.65|143
Plant Protein|kidney-beans|Kidney Beans, Cooked|kidney bean,kidney beans|173740|22.8|8.67|0.5|127
Plant Protein|split-peas|Split Peas, Cooked|split pea,split peas|172429|21.1|8.34|0.39|118
Plant Protein|edamame|Edamame, Cooked|edamame|168411|8.91|11.9|5.2|121
Plant Protein|soybeans|Soybeans, Cooked|soybean,soybeans|174271|8.36|18.2|8.97|172
Plant Protein|tempeh|Tempeh|tempeh|174272|7.64|20.3|10.8|192
Plant Protein|hummus|Hummus, Home Prepared|hummus|172454|20.1|4.86|8.59|177
Dairy & Eggs|whole-milk|Whole Milk, 3.25% Fat|milk,whole milk|171265|4.8|3.15|3.25|61
Dairy & Eggs|reduced-fat-milk|Reduced-Fat Milk, 2%|milk,2% milk,reduced fat milk|171267|4.8|3.3|1.98|50
Dairy & Eggs|skim-milk|Skim Milk|milk,skim milk,nonfat milk|171269|4.96|3.37|0.08|34
Dairy & Eggs|whole-yogurt|Plain Whole-Milk Yogurt|yogurt,whole milk yogurt|171284|4.66|3.47|3.25|61
Dairy & Eggs|greek-yogurt|Plain Nonfat Greek Yogurt|greek yogurt,yogurt|170894|3.6|10.2|0.39|59
Dairy & Eggs|cheddar|Cheddar Cheese|cheddar,cheese|173414|3.37|22.9|33.3|403
Dairy & Eggs|mozzarella|Whole-Milk Mozzarella|mozzarella,cheese|170845|2.4|22.2|22.1|299
Dairy & Eggs|cottage-cheese|Low-Fat Cottage Cheese|cottage cheese|172182|4.76|10.4|2.27|81
Nuts & Seeds|almonds|Almonds, Dry Roasted, Unsalted|almond,almonds|170158|21|21|52.5|598
Nuts & Seeds|walnuts|English Walnuts|walnut,walnuts|170187|13.7|15.2|65.2|654
Nuts & Seeds|cashews|Raw Cashews|cashew,cashews|170162|30.2|18.2|43.8|553
Nuts & Seeds|pistachios|Raw Pistachios|pistachio,pistachios|170184|27.2|20.2|45.3|560
Nuts & Seeds|peanuts|Raw Peanuts|peanut,peanuts|172430|16.1|25.8|49.2|567
Nuts & Seeds|chia-seeds|Chia Seeds|chia,chia seeds|170554|42.1|16.5|30.7|486
Nuts & Seeds|sunflower-seeds|Sunflower Seeds|sunflower seed,sunflower seeds|170154|20.6|17.2|56.8|619
Nuts & Seeds|flaxseeds|Flaxseeds|flaxseed,flaxseeds|169414|28.9|18.3|42.2|534
Nuts & Seeds|pumpkin-seeds|Pumpkin Seed Kernels|pumpkin seed,pumpkin seeds|170556|10.7|30.2|49|559
Nuts & Seeds|sesame-seeds|Sesame Seeds|sesame,sesame seeds|170150|23.4|17.7|49.7|573
Nuts & Seeds|tahini|Tahini|tahini,sesame butter|169410|26.2|17.8|48|570
Fats & Condiments|olive-oil|Olive Oil|olive oil|171413|0|0|100|884
Fats & Condiments|coconut-oil|Coconut Oil|coconut oil|171412|0|0|99.1|892
Fats & Condiments|butter|Salted Butter|butter|173410|0.06|0.85|81.1|717
Fats & Condiments|mayonnaise|Mayonnaise, Regular|mayonnaise,mayo|171009|0.57|0.96|74.8|680
Fats & Condiments|honey|Honey|honey|169640|82.4|0.3|0|304
Fats & Condiments|sugar|Granulated Sugar|sugar|169655|100|0|0|387
Fats & Condiments|maple-syrup|Maple Syrup|maple syrup|169661|67|0.04|0.06|260
Fats & Condiments|sesame-oil|Sesame Oil|sesame oil|171016|0|0|100|884
Fats & Condiments|soy-sauce|Soy Sauce|soy sauce,shoyu|174277|4.93|8.14|0.57|53
Fats & Condiments|miso|Miso|miso|172442|25.4|12.8|6.01|198
`.trim();

const UNIT_PORTIONS: Record<string, UnitPortion> = {
  egg: { label: "egg", grams: 50 }, apple: { label: "medium apple", grams: 182 }, banana: { label: "medium banana", grams: 118 }, orange: { label: "orange", grams: 131 }, pear: { label: "medium pear", grams: 177 }, kiwi: { label: "kiwi", grams: 69 }, cherry: { label: "cherry", grams: 8.2 }, peach: { label: "medium peach", grams: 150 }, carrot: { label: "medium carrot", grams: 61 }, tomato: { label: "medium tomato", grams: 123 }, cucumber: { label: "cucumber", grams: 301 }, potato: { label: "medium potato", grams: 213 }, "sweet-potato": { label: "sweet potato", grams: 130 }, bagel: { label: "bagel", grams: 99 }, "white-bread": { label: "slice", grams: 29 }, "whole-wheat-bread": { label: "slice", grams: 32 }, "whole-milk": { label: "cup", grams: 244 }, "whole-yogurt": { label: "8 oz container", grams: 227 },
};
const FOODS: Food[] = FOOD_ROWS.split("\n").map((row) => {
  const [category, id, name, aliases, fdcId, carbs, protein, fat, kcal] = row.split("|");
  return { category, id, name, aliases: aliases.split(","), fdcId: Number(fdcId), carbs: Number(carbs), protein: Number(protein), fat: Number(fat), kcal: Number(kcal), portion: UNIT_PORTIONS[id] };
});
const FOOD_CATEGORIES = ["All", ...Array.from(new Set(FOODS.map((food) => food.category)))];

const dbName = "shike-nutrition";
const storeName = "daily-records";
const round = (value: number) => Math.round(value * 10) / 10;
const energyPer100 = (food: Nutrients & { kcal?: number }) => food.kcal ?? round(food.carbs * 4 + food.protein * 4 + food.fat * 9);
const itemNutrients = (item: MealItem) => ({ carbs: round((item.carbs * item.grams) / 100), protein: round((item.protein * item.grams) / 100), fat: round((item.fat * item.grams) / 100) });
const itemEnergy = (item: MealItem) => round((energyPer100(item) * item.grams) / 100);
const today = () => new Date().toLocaleDateString("en-CA");

function normalizeText(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function findFoodFromVision(name: string) {
  const needle = normalizeText(name);
  const ranked = FOODS.map((food) => {
    const names = [food.name, ...food.aliases].map(normalizeText);
    const score = Math.max(...names.map((candidate) => candidate === needle ? 100 : candidate.includes(needle) || needle.includes(candidate) ? 70 : 0));
    return { food, score };
  }).filter((candidate) => candidate.score > 0).sort((a, b) => b.score - a.score);
  return ranked[0]?.food;
}
async function imageToBase64(file: File) {
  const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file); });
  const encoded = dataUrl.split(",")[1];
  if (!encoded) throw new Error("The selected image could not be read.");
  return encoded;
}
function parseVisionDetections(content: string): VisionDetection[] {
  const candidate = content.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? content.match(/\{[\s\S]*\}/)?.[0];
  if (!candidate) throw new Error("The local model did not return a readable result.");
  const parsed: unknown = JSON.parse(candidate);
  const entries = Array.isArray(parsed) ? parsed : parsed && typeof parsed === "object" && Array.isArray((parsed as { foods?: unknown }).foods) ? (parsed as { foods: unknown[] }).foods : [];
  return entries.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const value = entry as { foodName?: unknown; grams?: unknown };
    const foodName = typeof value.foodName === "string" ? value.foodName : "";
    const grams = Number(value.grams);
    return foodName && Number.isFinite(grams) && grams > 0 ? [{ foodName, grams }] : [];
  });
}

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
function foodToMeal(food: Food, grams = food.portion?.grams ?? 100): MealItem { return { ...food, grams, rowId: `${food.id}-${crypto.randomUUID()}` }; }

export default function Home() {
  const [tab, setTab] = useState<"scan" | "history" | "foods">("scan");
  const [date, setDate] = useState(today());
  const [items, setItems] = useState<MealItem[]>([]);
  const [records, setRecords] = useState<DayRecord[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [scanMessage, setScanMessage] = useState("Upload a meal photo to start local recognition.");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [isScanning, setIsScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { loadRecords().then(setRecords).catch(() => setScanMessage("Browser storage is unavailable. Please check private-browsing settings.")); }, []);
  const totals = useMemo(() => items.reduce((sum, item) => { const n = itemNutrients(item); return { carbs: sum.carbs + n.carbs, protein: sum.protein + n.protein, fat: sum.fat + n.fat }; }, { carbs: 0, protein: 0, fat: 0 }), [items]);
  const totalEnergy = useMemo(() => round(items.reduce((sum, item) => sum + itemEnergy(item), 0)), [items]);
  const filteredFoods = useMemo(() => FOODS.filter((food) => (category === "All" || food.category === category) && `${food.name}${food.category}${food.aliases.join("")}`.toLowerCase().includes(search.toLowerCase())), [category, search]);

  async function scanFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    if (imageUrl) URL.revokeObjectURL(imageUrl); setImageUrl(URL.createObjectURL(file)); setIsScanning(true); setScanMessage("Analyzing this photo locally with LLaVA…");
    try {
      const image = await imageToBase64(file);
      const availableFoods = FOODS.map((food) => food.name).join("; ");
      const response = await fetch("http://127.0.0.1:11434/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "llava", stream: false, format: "json", messages: [{ role: "user", content: `Analyze this meal photo. Identify each visible food and estimate its edible weight in grams. Use only the closest exact food names from this allowed list: ${availableFoods}. Return only valid JSON in this format: {"foods":[{"foodName":"exact allowed food name","grams":number}]}. Use a realistic positive estimate. If no listed food is visible, return {"foods":[]}.`, images: [image] }] }) });
      if (!response.ok) throw new Error("Local AI could not analyze this photo. Make sure Ollama is open and the LLaVA model is installed, then try again.");
      const result = await response.json() as { message?: { content?: string } };
      const detections = parseVisionDetections(result.message?.content ?? "");
      const merged = new Map<string, { food: Food; grams: number }>();
      for (const detection of detections) { const food = findFoodFromVision(detection.foodName); if (food) { const current = merged.get(food.id); merged.set(food.id, { food, grams: (current?.grams ?? 0) + detection.grams }); } }
      const recognized = [...merged.values()];
      if (!recognized.length) throw new Error("No matching foods were found in the local food library. Add foods manually or try a clearer photo.");
      setItems(recognized.map(({ food, grams }) => foodToMeal(food, round(grams))));
      setScanMessage(`Local AI found ${recognized.map(({ food }) => food.name).join(", ")}. The weights are estimates—please confirm them.`);
    } catch (error) {
      setItems([]); setScanMessage(error instanceof Error ? error.message : "Local image analysis failed. Please try again.");
    } finally { setIsScanning(false); }
  }
  function addFood(food: Food) { setItems((current) => [...current, foodToMeal(food)]); setTab("scan"); }
  function updateItem(rowId: string, patch: Partial<MealItem>) { setItems((current) => current.map((item) => item.rowId === rowId ? { ...item, ...patch } : item)); }
  async function saveToday() { if (!items.length) { setScanMessage("Add at least one food before saving this day."); return; } const record = { id: crypto.randomUUID(), date, createdAt: new Date().toISOString(), items }; await saveRecord(record); setRecords((current) => [record, ...current]); setScanMessage("Saved to this device."); }

  return <main className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">B</span><span>BiteLog</span><small>Local nutrition tracker</small></div><div className="privacy"><span>●</span> Data stays on this device</div></header>
    <section className="hero"><div><p className="eyebrow">SMART FOOD LOG</p><h1>See your meal.<br /><em>Know your nutrition.</em></h1><p>Upload a meal photo, confirm food and portions, and get calories with your three key macros.</p></div><div className="hero-orb"><span>4</span><b>kcal / g<br />energy formula</b></div></section>
    <nav className="tabs" aria-label="App navigation"><button className={tab === "scan" ? "active" : ""} onClick={() => setTab("scan")}>⌁ Scan & log</button><button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}>◷ History</button><button className={tab === "foods" ? "active" : ""} onClick={() => setTab("foods")}>⌕ Food library</button></nav>
    {tab === "scan" && <section className="content-grid">
      <div className="scan-card card"><div className="section-head"><div><p className="eyebrow">STEP 01</p><h2>Scan your meal</h2></div><label className="date-control">Log date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label></div><input ref={inputRef} className="visually-hidden" type="file" accept="image/*" onChange={scanFile} /><button className={`dropzone ${imageUrl ? "has-image" : ""}`} onClick={() => inputRef.current?.click()} aria-label="Upload a food image">{imageUrl ? <img src={imageUrl} alt="Food to identify" /> : <><span className="upload-icon">⌑</span><strong>Upload a meal photo</strong><small>Local AI identifies food and estimates grams</small></>}{isScanning && <span className="scanning">Analyzing locally</span>}</button><p className="scan-note">{scanMessage}</p><div className="quick-add"><span>Quick add</span>{FOODS.slice(0, 5).map((food) => <button key={food.id} onClick={() => addFood(food)}>+ {food.name}</button>)}</div></div>
      <aside className="summary-card card"><p className="eyebrow">TODAY&apos;S TOTAL</p><div className="calorie-total"><strong>{totalEnergy}</strong><span>kcal</span></div><p className="summary-subtitle">{items.length} food {items.length === 1 ? "item" : "items"} logged</p><div className="macro-list"><Macro name="Carbs" value={totals.carbs} color="orange" /><Macro name="Protein" value={totals.protein} color="mint" /><Macro name="Fat" value={totals.fat} color="purple" /></div><button className="primary-button" onClick={saveToday}>Save today&apos;s log <span>→</span></button></aside>
      <section className="items-card card wide"><div className="section-head"><div><p className="eyebrow">STEP 02</p><h2>Confirm food & portions</h2></div><span className="hint">Values are editable</span></div>{items.length === 0 ? <div className="empty-state">Upload an image, or add food from the Food library.</div> : <div className="items-table"><div className="table-label"><span>Food</span><span>Portion</span><span>Carbs</span><span>Protein</span><span>Fat</span><span>Calories</span><span /></div>{items.map((item) => { const n = itemNutrients(item); return <div className="food-row" key={item.rowId}><div><strong>{item.name}</strong><small>{item.category}</small></div><div className="weight-controls"><label><input aria-label={`${item.name} weight`} type="number" min="0" value={item.grams} onChange={(e) => updateItem(item.rowId, { grams: Math.max(0, Number(e.target.value)) })}/><span>g</span></label>{item.portion && <label className="portion-input"><input aria-label={`${item.name} quantity`} type="number" min="0" step="0.5" value={round(item.grams / item.portion.grams)} onChange={(e) => updateItem(item.rowId, { grams: Math.max(0, Number(e.target.value)) * item.portion!.grams })}/><span>{item.portion.label}</span></label>}</div><span>{n.carbs}g</span><span>{n.protein}g</span><span>{n.fat}g</span><strong>{itemEnergy(item)}<small> kcal</small></strong><button className="delete" onClick={() => setItems((current) => current.filter((row) => row.rowId !== item.rowId))} aria-label={`Remove ${item.name}`}>×</button></div>; })}</div>}</section>
    </section>}
    {tab === "history" && <section className="card history-card"><div className="section-head"><div><p className="eyebrow">YOUR TIMELINE</p><h2>Meal history</h2></div><span className="hint">Saved in this browser</span></div>{records.length === 0 ? <div className="empty-state tall">No saved meals yet. Save a meal to see it here.</div> : <div className="record-list">{records.map((record) => { const total = record.items.reduce((sum, item) => { const n = itemNutrients(item); return { carbs: sum.carbs + n.carbs, protein: sum.protein + n.protein, fat: sum.fat + n.fat }; }, { carbs: 0, protein: 0, fat: 0 }); const recordEnergy = round(record.items.reduce((sum, item) => sum + itemEnergy(item), 0)); return <article className="record" key={record.id}><div className="record-date"><strong>{record.date}</strong><span>{record.items.map((item) => item.name).join(", ")}</span></div><div className="record-macros"><span>Carbs {round(total.carbs)}g</span><span>Protein {round(total.protein)}g</span><span>Fat {round(total.fat)}g</span></div><strong className="record-kcal">{recordEnergy} <small>kcal</small></strong></article>; })}</div>}</section>}
    {tab === "foods" && <section className="card food-library"><div className="section-head"><div><p className="eyebrow">USDA FOODDATA CENTRAL</p><h2>Food library</h2></div><label className="search"><span>⌕</span><input placeholder="Search food, e.g. chicken" value={search} onChange={(e) => setSearch(e.target.value)} /></label></div><p className="library-note">{FOODS.length} foods from USDA FoodData Central SR Legacy data. Values are per 100 g of edible food; selected foods also support count-based portions.</p><div className="category-filters" aria-label="Food categories">{FOOD_CATEGORIES.map((item) => <button className={category === item ? "active" : ""} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div><p className="food-count">Showing {filteredFoods.length} food {filteredFoods.length === 1 ? "item" : "items"}. Use the FDC link on each entry to inspect its official USDA record.</p><div className="food-grid">{filteredFoods.map((food) => <article className="food-tile" key={food.id}><div><span>{food.category}</span><h3>{food.name}</h3></div><strong>{energyPer100(food)} <small>kcal</small></strong><div className="tile-macros"><span>Carbs {food.carbs}g</span><span>Protein {food.protein}g</span><span>Fat {food.fat}g</span></div>{food.portion && <small className="portion-note">1 {food.portion.label} = {food.portion.grams} g</small>}<a className="food-source" href={`https://fdc.nal.usda.gov/fdc-app.html#/food/${food.fdcId}/nutrients`} target="_blank" rel="noreferrer">USDA FDC ID {food.fdcId}</a><button onClick={() => addFood(food)}>Add to meal +</button></article>)}</div></section>}
  </main>;
}
function Macro({ name, value, color }: { name: string; value: number; color: string }) { return <div className="macro"><div><span className={`dot ${color}`} /><span>{name}</span></div><strong>{round(value)}<small>g</small></strong></div>; }
