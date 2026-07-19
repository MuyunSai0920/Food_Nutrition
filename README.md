# BiteLog / Local Nutrition Tracker

A self-hostable meal logging web app that stores data in the browser. It does not require an account, database, or API key.

## Features

- Upload a meal photo and add recognized foods; food and portion size remain editable.
- Calculate calories from the USDA energy value for each selected food.
- Browse 143 included foods across nine categories, with carbohydrates, protein, fat, and calories per 100 g.
- Use count-based portions for foods with an official discrete USDA portion, such as `1 egg`, `1 medium apple`, or `1 slice` of bread; grams remain editable for every food.
- Save daily meal records in browser IndexedDB and review them by date.
- Use the responsive interface on desktop or mobile.

## Recognition behavior

The local scanner sends the selected photo only to Ollama running on the same computer. It uses the `llava` vision model to identify foods in the photo, match them to the included food library, and estimate their edible grams. All results remain editable and photos are not sent to a cloud service.

Before using local image recognition, install Ollama and download the model:

```bash
/Applications/Ollama.app/Contents/Resources/ollama serve
/Applications/Ollama.app/Contents/Resources/ollama pull llava
```

The model is approximately 4.7 GB. Keep the Ollama service running while using BiteLog. Weight detection from one photo is an estimate and should always be confirmed.

A single ordinary photo cannot measure food precisely. A production implementation should use reference objects, multiple viewing angles, and a user confirmation step for portion weights.

## Nutrition data

The included food library uses 143 USDA FoodData Central SR Legacy records (April 2018). Each entry stores its FDC ID and per-100 g values for carbohydrate, protein, fat, and energy. Count-based portions use the gram weights from the matching USDA food-portion records. In the app, select **Food library** and use the FDC ID link on any entry to inspect the official USDA record.

Suggested citation: U.S. Department of Agriculture, Agricultural Research Service. FoodData Central. https://fdc.nal.usda.gov/

## Run locally

### One-click startup on macOS

After installing Node.js and Ollama, double-click `Start BiteLog.command`. The launcher opens Ollama if needed, checks that the `llava` model is available, starts BiteLog, and opens `http://localhost:3030`.

### Requirements

- Node.js 22 or later
- pnpm 10 or later (enable it with `corepack enable` if needed)

### Start development mode

```bash
pnpm install
pnpm run dev
```

Open the `http://localhost:xxxx` address printed in the terminal.

### Preview the production build

```bash
pnpm run build
pnpm run start
```

## Deploy to Cloudflare Workers

This project natively supports Cloudflare Workers. Create a Cloudflare account, then run the following in the project directory:

```bash
pnpm exec wrangler login
pnpm run deploy
```

The first deployment authorizes Cloudflare and creates the `shike-local-nutrition` Worker. The terminal prints a public URL when deployment is complete.

Meal records remain in each visitor's browser IndexedDB. Deploying the app does not upload meal photos or records to the server; clearing website data in the browser also clears those local records.

## Publish to GitHub

1. Create an empty GitHub repository, such as `shike-local-nutrition`. Do not initialize it with a README, `.gitignore`, or license.
2. Run the following commands in this directory and replace `<your-repository-url>` with its GitHub HTTPS or SSH address:

```bash
git init
git add .
git commit -m "feat: add local nutrition tracker"
git branch -M main
git remote add origin <your-repository-url>
git push -u origin main
```

The included `.gitignore` excludes dependencies, build output, development logs, and environment files. Never commit `.env` files, Cloudflare tokens, or API keys.

## Validation commands

```bash
pnpm run build
pnpm test
pnpm run lint
```

## Technology

- React 19 and TypeScript
- Vinext and Vite
- Cloudflare Workers (optional deployment target)
- IndexedDB (browser-local persistence)
